package config

import (
	"os"
	"strings"
)

// Config holds process-wide settings loaded from the environment.
type Config struct {
	Port        string
	MongoURI    string
	CORSOrigins []string
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
	return Config{
		Port:        port,
		MongoURI:    mongoURI,
		CORSOrigins: list,
	}
}
