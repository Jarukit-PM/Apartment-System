package db

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const defaultTimeout = 10 * time.Second

// Connect returns a connected Mongo client using the given URI.
func Connect(ctx context.Context, uri string) (*mongo.Client, error) {
	cctx, cancel := context.WithTimeout(ctx, defaultTimeout)
	defer cancel()
	return mongo.Connect(cctx, options.Client().ApplyURI(uri))
}
