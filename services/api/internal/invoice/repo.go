package invoice

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// ErrNotFound when invoice missing.
var ErrNotFound = errors.New("invoice not found")

// Repo persists invoices.
type Repo struct {
	coll *mongo.Database
}

// NewRepo wraps database (collection per call).
func NewRepo(db *mongo.Database) *Repo {
	return &Repo{coll: db}
}

func (r *Repo) collection() *mongo.Collection {
	return r.coll.Collection("invoices")
}

// ListByResident returns invoices for a resident (payer id).
func (r *Repo) ListByResident(ctx context.Context, residentID primitive.ObjectID) ([]Doc, error) {
	cur, err := r.collection().Find(ctx, bson.M{"residentId": residentID}, options.Find().SetSort(bson.D{{Key: "dueDate", Value: -1}}))
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

// Insert creates an invoice.
func (r *Repo) Insert(ctx context.Context, d *Doc) error {
	now := time.Now().UTC()
	if d.ID.IsZero() {
		d.ID = primitive.NewObjectID()
	}
	d.CreatedAt = now
	d.UpdatedAt = now
	_, err := r.collection().InsertOne(ctx, d)
	return err
}

// Get fetches one invoice.
func (r *Repo) Get(ctx context.Context, id primitive.ObjectID) (*Doc, error) {
	var d Doc
	err := r.collection().FindOne(ctx, bson.M{"_id": id}).Decode(&d)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &d, nil
}
