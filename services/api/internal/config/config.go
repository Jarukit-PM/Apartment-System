package config

import (
	"os"
	"strconv"
	"strings"
	"time"
)

// Config holds process-wide settings loaded from the environment.
type Config struct {
	Port        string
	MongoURI    string
	CORSOrigins []string

	JWTSecret            string
	AccessTokenTTL       time.Duration
	RefreshTokenTTL      time.Duration
	GoogleClientID       string // audience for Google ID token verification
	BootstrapAdminEmail  string
	BootstrapAdminPass   string
	SiteDisplayName      string // single-building default property name
}

// Load reads configuration from environment variables with safe defaults.
func Load() Config {
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
		mongoURI = "mongodb://localhost:27017/apartment_system"
	}
	accessMin := getenvInt("JWT_ACCESS_TTL_MINUTES", 15)
	refreshH := getenvInt("JWT_REFRESH_TTL_HOURS", 24 * 14)
	siteName := strings.TrimSpace(os.Getenv("SITE_DISPLAY_NAME"))
	if siteName == "" {
		siteName = "Main building"
	}
	return Config{
		Port:                port,
		MongoURI:            mongoURI,
		CORSOrigins:         list,
		JWTSecret:           strings.TrimSpace(os.Getenv("JWT_SECRET")),
		AccessTokenTTL:    time.Duration(accessMin) * time.Minute,
		RefreshTokenTTL:   time.Duration(refreshH) * time.Hour,
		GoogleClientID:    strings.TrimSpace(os.Getenv("GOOGLE_CLIENT_ID")),
		BootstrapAdminEmail: strings.TrimSpace(strings.ToLower(os.Getenv("BOOTSTRAP_ADMIN_EMAIL"))),
		BootstrapAdminPass:  os.Getenv("BOOTSTRAP_ADMIN_PASSWORD"),
		SiteDisplayName:     siteName,
	}
}

func getenvInt(key string, def int) int {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return def
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return def
	}
	return n
}
