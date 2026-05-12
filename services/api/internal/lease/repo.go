package lease

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// ErrNotFound when lease missing.
var ErrNotFound = errors.New("lease not found")

// Repo persists leases.
type Repo struct {
	coll *mongo.Collection
}

// NewRepo constructs repository.
func NewRepo(db *mongo.Database) *Repo {
	return &Repo{coll: db.Collection("leases")}
}

// List optional filter by unitId.
func (r *Repo) List(ctx context.Context, unitID *primitive.ObjectID) ([]Doc, error) {
	f := bson.M{}
	if unitID != nil {
		f["unitId"] = *unitID
	}
	cur, err := r.coll.Find(ctx, f, options.Find().SetSort(bson.D{{Key: "startDate", Value: -1}}))
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

// Get returns one lease.
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

// CountActiveOtherThan counts active leases for unit excluding a lease id (may be zero).
func (r *Repo) CountActiveOtherThan(ctx context.Context, unitID, excludeLeaseID primitive.ObjectID) (int64, error) {
	f := bson.M{"unitId": unitID, "status": StatusActive}
	if !excludeLeaseID.IsZero() {
		f["_id"] = bson.M{"$ne": excludeLeaseID}
	}
	return r.coll.CountDocuments(ctx, f)
}

// Insert creates a lease document (caller sets timestamps).
func (r *Repo) Insert(ctx context.Context, d *Doc) error {
	_, err := r.coll.InsertOne(ctx, d)
	return err
}

// Replace updates full document fields used in service (simpler than patch for status transitions).
func (r *Repo) Replace(ctx context.Context, d *Doc) error {
	d.UpdatedAt = time.Now().UTC()
	_, err := r.coll.ReplaceOne(ctx, bson.M{"_id": d.ID}, d)
	return err
}

// Delete removes a lease.
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
