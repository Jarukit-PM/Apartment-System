package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/jarukit/apartment-system/services/api/internal/config"
	"github.com/jarukit/apartment-system/services/api/internal/db"
	"github.com/jarukit/apartment-system/services/api/internal/httpserver"
	"github.com/jarukit/apartment-system/services/api/internal/indexes"
	"github.com/jarukit/apartment-system/services/api/internal/lease"
	"github.com/jarukit/apartment-system/services/api/internal/maintenance"
	"github.com/jarukit/apartment-system/services/api/internal/property"
	"github.com/jarukit/apartment-system/services/api/internal/resident"
	"github.com/jarukit/apartment-system/services/api/internal/unit"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/mongo"
)

type healthResponse struct {
	Status string `json:"status"`
	Mongo  string `json:"mongo"`
}

// loadEnvFromAncestors loads `.env` files from cwd up to the filesystem root.
func loadEnvFromAncestors() {
	wd, err := os.Getwd()
	if err != nil {
		return
	}
	dir := wd
	var paths []string
	for range 16 {
		p := filepath.Join(dir, ".env")
		if st, err := os.Stat(p); err == nil && !st.IsDir() {
			paths = append(paths, p)
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	for _, p := range paths {
		_ = godotenv.Load(p)
	}
}

func main() {
	loadEnvFromAncestors()

	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	cfg := config.Load()
	ctx := context.Background()

	var mongoClient *mongo.Client
	var mongoStatus string
	client, err := db.Connect(ctx, cfg.MongoURI)
	if err != nil {
		slog.Error("mongo connect failed", "error", err)
		mongoStatus = "error"
	} else {
		mongoClient = client
		defer func() {
			_ = mongoClient.Disconnect(context.Background())
		}()
		pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
		defer cancel()
		if err := mongoClient.Ping(pingCtx, nil); err != nil {
			slog.Error("mongo ping failed", "error", err)
			mongoStatus = "disconnected"
		} else {
			mongoStatus = "connected"
			slog.Info("mongodb reachable")
		}
	}

	var database *mongo.Database
	if mongoClient != nil {
		database = mongoClient.Database("apartment_system")
		if mongoStatus == "connected" {
			idxCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
			indexes.Ensure(idxCtx, database)
			cancel()
		}
	}

	dbGetter := func() *mongo.Database { return database }

	var api *httpserver.Server
	if database != nil {
		propRepo := property.NewRepo(database)
		unitRepo := unit.NewRepo(database)
		resRepo := resident.NewRepo(database)
		leaseRepo := lease.NewRepo(database)
		maintRepo := maintenance.NewRepo(database)

		propSvc := property.NewService(propRepo, dbGetter)
		unitSvc := unit.NewService(unitRepo, dbGetter, propRepo)
		resSvc := resident.NewService(resRepo, dbGetter, unitRepo)
		leaseSvc := lease.NewService(leaseRepo, unitSvc, resRepo)
		maintSvc := maintenance.NewService(maintRepo, unitRepo, resRepo)

		api = httpserver.NewServer(propSvc, unitSvc, resSvc, leaseSvc, maintSvc)
	}

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   cfg.CORSOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Get("/health", func(w http.ResponseWriter, req *http.Request) {
		status := "ok"
		mongoField := mongoStatus
		if mongoClient != nil {
			pingCtx, cancel := context.WithTimeout(req.Context(), 2*time.Second)
			defer cancel()
			if err := mongoClient.Ping(pingCtx, nil); err != nil {
				mongoField = "disconnected"
				status = "degraded"
			} else {
				mongoField = "connected"
			}
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(healthResponse{Status: status, Mongo: mongoField})
	})

	if api != nil {
		api.Mount(r)
	}

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		slog.Info("api listening", "addr", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop
	slog.Info("shutting down")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("shutdown error", "error", err)
	}
}
