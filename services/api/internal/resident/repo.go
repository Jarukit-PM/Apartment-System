package resident

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// ErrNotFound when missing.
var ErrNotFound = errors.New("resident not found")

// Repo persists residents.
type Repo struct {
	coll *mongo.Collection
}

// NewRepo constructs repository.
func NewRepo(db *mongo.Database) *Repo {
	return &Repo{coll: db.Collection("residents")}
}

// List all residents sorted by name.
func (r *Repo) List(ctx context.Context) ([]Doc, error) {
	cur, err := r.coll.Find(ctx, bson.M{}, options.Find().SetSort(bson.D{{Key: "fullName", Value: 1}}))
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	var out []Doc
	if err := cur.All(ctx, &out); err != nil {
		return nil, err
	}
	return out, nil
}

// Get one.
func (r *Repo) Get(ctx context.Context, id primitive.ObjectID) (*Doc, error) {
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

// GetByEmail finds a resident by normalized email.
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

// Insert creates resident.
func (r *Repo) Insert(ctx context.Context, in Doc) (*Doc, error) {
	if _, err := r.coll.InsertOne(ctx, in); err != nil {
		return nil, err
	}
	return &in, nil
}

// Update patches.
func (r *Repo) Update(ctx context.Context, id primitive.ObjectID, set bson.M) (*Doc, error) {
	set["updatedAt"] = time.Now().UTC()
	res, err := r.coll.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": set})
	if err != nil {
		return nil, err
	}
	if res.MatchedCount == 0 {
		return nil, ErrNotFound
	}
	return r.Get(ctx, id)
}

// Delete removes resident.
func (r *Repo) Delete(ctx context.Context, id primitive.ObjectID) error {
	res, err := r.coll.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil {
		return err
	}
	if res.DeletedCount == 0 {
		return ErrNotFound
	}
	return nil
}

// InActiveLease reports whether the resident appears on any active lease.
func (r *Repo) InActiveLease(ctx context.Context, db *mongo.Database, residentID primitive.ObjectID) (bool, error) {
	n, err := db.Collection("leases").CountDocuments(ctx, bson.M{
		"status":      "active",
		"residentIds": residentID,
	})
	return n > 0, err
}

// CountByIDs returns how many of the given IDs exist (for lease validation).
func (r *Repo) CountByIDs(ctx context.Context, ids []primitive.ObjectID) (int64, error) {
	if len(ids) == 0 {
		return 0, nil
	}
	return r.coll.CountDocuments(ctx, bson.M{"_id": bson.M{"$in": ids}})
}

// Exists reports whether a resident exists.
func (r *Repo) Exists(ctx context.Context, id primitive.ObjectID) (bool, error) {
	n, err := r.coll.CountDocuments(ctx, bson.M{"_id": id})
	return n > 0, err
}
