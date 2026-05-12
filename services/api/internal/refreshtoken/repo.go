package refreshtoken

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// Repo stores hashed refresh tokens.
type Repo struct {
	coll *mongo.Collection
}

// NewRepo constructs repository.
func NewRepo(db *mongo.Database) *Repo {
	return &Repo{coll: db.Collection("refresh_tokens")}
}

// Hash returns hex-encoded SHA-256 of the raw token.
func Hash(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}

// Insert stores a refresh token hash until expiry.
func (r *Repo) Insert(ctx context.Context, userID primitive.ObjectID, tokenHash string, expiresAt time.Time) error {
	d := bson.M{
		"_id":        primitive.NewObjectID(),
		"userId":     userID,
		"tokenHash":  tokenHash,
		"expiresAt":  expiresAt,
		"createdAt":  time.Now().UTC(),
	}
	_, err := r.coll.InsertOne(ctx, d)
	return err
}

// DeleteByHash removes a token row (used after refresh or logout).
func (r *Repo) DeleteByHash(ctx context.Context, tokenHash string) error {
	_, err := r.coll.DeleteMany(ctx, bson.M{"tokenHash": tokenHash})
	return err
}

// FindUserByValidToken returns userId if token hash exists and not expired.
func (r *Repo) FindUserByValidToken(ctx context.Context, tokenHash string) (primitive.ObjectID, error) {
	var row struct {
		UserID    primitive.ObjectID `bson:"userId"`
		ExpiresAt time.Time          `bson:"expiresAt"`
	}
	err := r.coll.FindOne(ctx, bson.M{"tokenHash": tokenHash}).Decode(&row)
	if err != nil {
		return primitive.NilObjectID, err
	}
	if time.Now().UTC().After(row.ExpiresAt) {
		_ = r.DeleteByHash(ctx, tokenHash)
		return primitive.NilObjectID, mongo.ErrNoDocuments
	}
	return row.UserID, nil
}

// DeleteAllForUser invalidates refresh sessions for a user (logout all devices).
func (r *Repo) DeleteAllForUser(ctx context.Context, userID primitive.ObjectID) error {
	_, err := r.coll.DeleteMany(ctx, bson.M{"userId": userID})
	return err
}
