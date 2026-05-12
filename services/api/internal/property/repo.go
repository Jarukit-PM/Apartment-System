package property

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// ErrNotFound is returned when a property does not exist.
var ErrNotFound = errors.New("property not found")

// Repo persists properties.
type Repo struct {
	coll *mongo.Collection
}

// NewRepo constructs a property repository.
func NewRepo(db *mongo.Database) *Repo {
	return &Repo{coll: db.Collection("properties")}
}

// List returns all properties sorted by name (MVP — small lists).
func (r *Repo) List(ctx context.Context) ([]Doc, error) {
	cur, err := r.coll.Find(ctx, bson.M{}, options.Find().SetSort(bson.D{{Key: "name", Value: 1}}))
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

// Get returns a property by id.
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

// Insert creates a property.
func (r *Repo) Insert(ctx context.Context, in CreateInput) (*Doc, error) {
	now := time.Now().UTC()
	d := Doc{
		ID:        primitive.NewObjectID(),
		Name:      in.Name,
		Address:   in.Address,
		CreatedAt: now,
		UpdatedAt: now,
	}
	if _, err := r.coll.InsertOne(ctx, d); err != nil {
		return nil, err
	}
	return &d, nil
}

// Update patches a property.
func (r *Repo) Update(ctx context.Context, id primitive.ObjectID, in UpdateInput) (*Doc, error) {
	set := bson.M{"updatedAt": time.Now().UTC()}
	if in.Name != nil {
		set["name"] = *in.Name
	}
	if in.Address != nil {
		set["address"] = in.Address
	}
	res, err := r.coll.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": set})
	if err != nil {
		return nil, err
	}
	if res.MatchedCount == 0 {
		return nil, ErrNotFound
	}
	return r.Get(ctx, id)
}

// Delete removes a property document.
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

// CountUnits returns how many units reference this property (any client session).
func (r *Repo) CountUnits(ctx context.Context, db *mongo.Database, propertyID primitive.ObjectID) (int64, error) {
	return db.Collection("units").CountDocuments(ctx, bson.M{"propertyId": propertyID})
}

// Exists reports whether a property document exists.
func (r *Repo) Exists(ctx context.Context, id primitive.ObjectID) (bool, error) {
	n, err := r.coll.CountDocuments(ctx, bson.M{"_id": id})
	return n > 0, err
}
