package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jarukit/apartment-system/services/api/internal/authservice"
	"github.com/jarukit/apartment-system/services/api/internal/config"
	"github.com/jarukit/apartment-system/services/api/internal/db"
	"github.com/jarukit/apartment-system/services/api/internal/httpserver"
	"github.com/jarukit/apartment-system/services/api/internal/indexes"
	"github.com/jarukit/apartment-system/services/api/internal/invoice"
	"github.com/jarukit/apartment-system/services/api/internal/lease"
	"github.com/jarukit/apartment-system/services/api/internal/maintenance"
	"github.com/jarukit/apartment-system/services/api/internal/property"
	"github.com/jarukit/apartment-system/services/api/internal/refreshtoken"
	"github.com/jarukit/apartment-system/services/api/internal/resident"
	"github.com/jarukit/apartment-system/services/api/internal/siteboot"
	"github.com/jarukit/apartment-system/services/api/internal/unit"
	"github.com/jarukit/apartment-system/services/api/internal/user"
<<<<<<< Updated upstream
=======
	"github.com/jarukit/apartment-system/services/api/internal/wallet"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
>>>>>>> Stashed changes
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

// insecureLocalDevJWT is only applied by ensureLocalDevJWTSecret when Mongo is clearly local and APP_ENV is not production.
const insecureLocalDevJWT = "apartment-system-local-dev-only-jwt-not-for-production-minimum-length-48"

func inProductionEnv() bool {
	for _, k := range []string{"APP_ENV", "ENVIRONMENT"} {
		if strings.EqualFold(strings.TrimSpace(os.Getenv(k)), "production") {
			return true
		}
	}
	return false
}

func mongoURILooksLocalDev(uri string) bool {
	uri = strings.TrimSpace(uri)
	if uri == "" {
		return true
	}
	u, err := url.Parse(uri)
	if err != nil {
		return strings.Contains(uri, "localhost") ||
			strings.Contains(uri, "127.0.0.1") ||
			strings.Contains(uri, "mongo:")
	}
	host := strings.ToLower(u.Hostname())
	return host == "localhost" || host == "127.0.0.1" || host == "mongo"
}

// ensureLocalDevJWTSecret sets a dev-only JWT when the secret is missing but Mongo is local.
// Cursor/VS Code sometimes do not inject devcontainer remoteEnv into every terminal, which leaves JWT_SECRET empty.
func ensureLocalDevJWTSecret() {
	if len(strings.TrimSpace(os.Getenv("JWT_SECRET"))) >= 16 {
		return
	}
	if inProductionEnv() {
		return
	}
	uri := strings.TrimSpace(os.Getenv("MONGODB_URI"))
	if uri == "" {
		uri = "mongodb://localhost:27017/apartment_system"
	}
	if !mongoURILooksLocalDev(uri) {
		return
	}
	_ = os.Setenv("JWT_SECRET", insecureLocalDevJWT)
	slog.Warn("JWT_SECRET was unset or too short; using a fixed local-development default. Set JWT_SECRET in the repo root .env for shared hosts or production.")
}

func main() {
	loadEnvFromAncestors()

	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)
	ensureLocalDevJWTSecret()

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
<<<<<<< Updated upstream
=======
		if len(cfg.JWTSecret) < 16 {
			slog.Error("JWT_SECRET must be at least 16 characters when MongoDB is enabled; set a longer value in the repo root .env or use Dev Container remoteEnv / .devcontainer/docker-compose.yml (see .env.example)", "len", len(cfg.JWTSecret))
			os.Exit(1)
		}

>>>>>>> Stashed changes
		sbCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
		propID, err := siteboot.EnsureDefaultProperty(sbCtx, database, cfg.SiteDisplayName)
		cancel()
		if err != nil {
			slog.Error("default property bootstrap failed", "error", err)
			os.Exit(1)
		}
		slog.Info("single-building property ready", "propertyId", propID.Hex())

		propRepo := property.NewRepo(database)
		unitRepo := unit.NewRepo(database)
		resRepo := resident.NewRepo(database)
		leaseRepo := lease.NewRepo(database)
		maintRepo := maintenance.NewRepo(database)
		userRepo := user.NewRepo(database)
		rtRepo := refreshtoken.NewRepo(database)
		invRepo := invoice.NewRepo(database)
		walletRepo := wallet.NewRepo(database)

		propSvc := property.NewService(propRepo, dbGetter)
		unitSvc := unit.NewService(unitRepo, dbGetter, propRepo)
		resSvc := resident.NewService(resRepo, dbGetter, unitRepo)
		leaseSvc := lease.NewService(leaseRepo, unitSvc, resSvc, dbGetter)
		maintSvc := maintenance.NewService(maintRepo, unitRepo, resRepo)
		invSvc := invoice.NewService(invRepo)
		walletSvc := wallet.NewService(walletRepo, userRepo)

		authCfg := authservice.AuthConfig{
			JWTSecret:  []byte(cfg.JWTSecret),
			AccessTTL:  cfg.AccessTokenTTL,
			RefreshTTL: cfg.RefreshTokenTTL,
			GoogleAud:  cfg.GoogleClientID,
		}
		authSvc := authservice.NewService(authCfg, userRepo, rtRepo, resSvc)
		bootCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
		if err := authSvc.EnsureBootstrapAdmin(bootCtx, cfg.BootstrapAdminEmail, cfg.BootstrapAdminPass); err != nil {
			slog.Error("bootstrap admin failed", "error", err)
			os.Exit(1)
		}
		cancel()

		api = httpserver.NewServer(
			propSvc, unitSvc, resSvc, leaseSvc, maintSvc,
			authSvc, []byte(cfg.JWTSecret), propID, cfg.SiteDisplayName, invSvc, walletSvc,
		)
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

	// Browsers often open / and /favicon.ico; the API is JSON-only under /v1.
	r.Get("/", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{
			"service": "apartment-system-api",
			"health":  "/health",
			"site":    "/v1/site",
			"hint":    "This is the Go REST API. Use GET /health. The Next.js UI is usually at http://localhost:3000 (not this port).",
		})
	})
	r.Get("/favicon.ico", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})

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
