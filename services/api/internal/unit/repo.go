package unit

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// ErrNotFound when unit missing.
var ErrNotFound = errors.New("unit not found")

// Repo persists units.
type Repo struct {
	coll *mongo.Collection
}

// NewRepo constructs a unit repository.
func NewRepo(db *mongo.Database) *Repo {
	return &Repo{coll: db.Collection("units")}
}

// List by optional property filter.
func (r *Repo) List(ctx context.Context, propertyID *primitive.ObjectID) ([]Doc, error) {
	filter := bson.M{}
	if propertyID != nil {
		filter["propertyId"] = *propertyID
	}
	cur, err := r.coll.Find(ctx, filter, options.Find().SetSort(bson.D{{Key: "label", Value: 1}}))
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

// ListAvailableForSelfService returns vacant units with listing rent and self-service allowed.
func (r *Repo) ListAvailableForSelfService(ctx context.Context, propertyID *primitive.ObjectID) ([]Doc, error) {
	filter := bson.M{
		"status": StatusVacant,
		"listingRent.amount": bson.M{"$gt": 0},
		"$or": []bson.M{
			{"selfServiceEnabled": true},
			{"selfServiceEnabled": bson.M{"$exists": false}},
		},
	}
	if propertyID != nil {
		filter["propertyId"] = *propertyID
	}
	cur, err := r.coll.Find(ctx, filter, options.Find().SetSort(bson.D{{Key: "label", Value: 1}}))
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

// Get returns one unit.
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

// Insert creates a unit.
func (r *Repo) Insert(ctx context.Context, in CreateInput) (*Doc, error) {
	now := time.Now().UTC()
	st := in.Status
	if st == "" {
		st = StatusVacant
	}
	d := Doc{
		ID:                   primitive.NewObjectID(),
		PropertyID:           in.PropertyID,
		Label:                in.Label,
		Floor:                in.Floor,
		Bedrooms:             in.Bedrooms,
		Status:               st,
		ListingRent:          in.ListingRent,
		SelfServiceEnabled:   in.SelfServiceEnabled,
		CreatedAt:            now,
		UpdatedAt:            now,
	}
	if _, err := r.coll.InsertOne(ctx, d); err != nil {
		return nil, err
	}
	return &d, nil
}

// Update patches fields.
func (r *Repo) Update(ctx context.Context, id primitive.ObjectID, in UpdateInput) (*Doc, error) {
	set := bson.M{"updatedAt": time.Now().UTC()}
	if in.Label != nil {
		set["label"] = *in.Label
	}
	if in.Floor != nil {
		set["floor"] = *in.Floor
	}
	if in.Bedrooms != nil {
		set["bedrooms"] = *in.Bedrooms
	}
	if in.Status != nil {
		set["status"] = *in.Status
	}
	if in.ListingRent != nil {
		set["listingRent"] = in.ListingRent
	}
	if in.SelfServiceEnabled != nil {
		set["selfServiceEnabled"] = *in.SelfServiceEnabled
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

// SetStatus updates only status (used from lease flows).
func (r *Repo) SetStatus(ctx context.Context, id primitive.ObjectID, status string) error {
	res, err := r.coll.UpdateOne(ctx, bson.M{"_id": id}, bson.M{
		"$set": bson.M{"status": status, "updatedAt": time.Now().UTC()},
	})
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		return ErrNotFound
	}
	return nil
}

// Exists reports whether a unit exists.
func (r *Repo) Exists(ctx context.Context, id primitive.ObjectID) (bool, error) {
	n, err := r.coll.CountDocuments(ctx, bson.M{"_id": id})
	return n > 0, err
}

// Delete removes a unit.
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

// CountActiveLeases returns active leases for a unit.
func (r *Repo) CountActiveLeases(ctx context.Context, db *mongo.Database, unitID primitive.ObjectID) (int64, error) {
	return db.Collection("leases").CountDocuments(ctx, bson.M{"unitId": unitID, "status": "active"})
}
