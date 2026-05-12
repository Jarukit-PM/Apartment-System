package user

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// ErrNotFound when user missing.
var ErrNotFound = errors.New("user not found")

// Repo persists users.
type Repo struct {
	coll *mongo.Collection
}

// NewRepo constructs a user repository.
func NewRepo(db *mongo.Database) *Repo {
	return &Repo{coll: db.Collection("users")}
}

// GetByEmail returns a user by normalized email.
func (r *Repo) GetByEmail(ctx context.Context, email string) (*Doc, error) {
	var d Doc
	err := r.coll.FindOne(ctx, bson.M{"email": email}).Decode(&d)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &d, nil
}

// GetByID returns a user by id.
func (r *Repo) GetByID(ctx context.Context, id primitive.ObjectID) (*Doc, error) {
	var d Doc
	err := r.coll.FindOne(ctx, bson.M{"_id": id}).Decode(&d)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &d, nil
}

// GetByGoogleSub finds a user linked to Google subject.
func (r *Repo) GetByGoogleSub(ctx context.Context, sub string) (*Doc, error) {
	var d Doc
	err := r.coll.FindOne(ctx, bson.M{"googleSub": sub}).Decode(&d)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &d, nil
}

// Insert creates a user.
func (r *Repo) Insert(ctx context.Context, d *Doc) error {
	now := time.Now().UTC()
	if d.ID.IsZero() {
		d.ID = primitive.NewObjectID()
	}
	d.CreatedAt = now
	d.UpdatedAt = now
	_, err := r.coll.InsertOne(ctx, d)
	return err
}

// SetGoogleSub links Google identity (used on first OAuth login).
func (r *Repo) SetGoogleSub(ctx context.Context, id primitive.ObjectID, sub string) error {
	_, err := r.coll.UpdateOne(ctx, bson.M{"_id": id}, bson.M{
		"$set": bson.M{"googleSub": sub, "updatedAt": time.Now().UTC()},
	})
	return err
}
