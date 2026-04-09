package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type config struct {
	Port         string
	MongoURI     string
	CORSOrigins  []string
}

type healthResponse struct {
	Status string `json:"status"`
	Mongo  string `json:"mongo"`
}

// loadEnvFromAncestors loads `.env` files from cwd up to the filesystem root.
// Deeper files override shallower ones (Overload), matching a monorepo layout
// where `services/api/.env` can override the repository root `.env`.
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
	// Deeper directories first so their `.env` wins; use Load (not Overload) so
	// variables already set in the environment—e.g. Dev Container `remoteEnv`—are not replaced by a root `.env` meant for the host.
	for _, p := range paths {
		_ = godotenv.Load(p)
	}
}

func loadConfig() config {
	origins := os.Getenv("CORS_ORIGINS")
	var list []string
	for _, o := range strings.Split(origins, ",") {
		if t := strings.TrimSpace(o); t != "" {
			list = append(list, t)
		}
	}
	if len(list) == 0 {
		list = []string{"http://localhost:3000"}
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017"
	}
	return config{
		Port:        port,
		MongoURI:    mongoURI,
		CORSOrigins: list,
	}
}

func main() {
	loadEnvFromAncestors()

	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	cfg := loadConfig()
	ctx := context.Background()

	var mongoClient *mongo.Client
	var mongoStatus string
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(cfg.MongoURI))
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
