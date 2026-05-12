package maintenance

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
var ErrNotFound = errors.New("maintenance request not found")

// Repo persists maintenance requests.
type Repo struct {
	coll *mongo.Collection
}

// NewRepo constructs repository.
func NewRepo(db *mongo.Database) *Repo {
	return &Repo{coll: db.Collection("maintenance_requests")}
}

// List optional unit filter.
func (r *Repo) List(ctx context.Context, unitID *primitive.ObjectID) ([]Doc, error) {
	f := bson.M{}
	if unitID != nil {
		f["unitId"] = *unitID
	}
	cur, err := r.coll.Find(ctx, f, options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}}))
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

// ListForResident returns tickets filed by the resident or tied to their units.
func (r *Repo) ListForResident(ctx context.Context, unitIDs []primitive.ObjectID, residentID primitive.ObjectID) ([]Doc, error) {
	or := []bson.M{{"requestedByResidentId": residentID}}
	if len(unitIDs) > 0 {
		or = append(or, bson.M{"unitId": bson.M{"$in": unitIDs}})
	}
	cur, err := r.coll.Find(ctx, bson.M{"$or": or}, options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}}))
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

// Insert creates a row.
func (r *Repo) Insert(ctx context.Context, d *Doc) error {
	_, err := r.coll.InsertOne(ctx, d)
	return err
}

// Update patches.
func (r *Repo) Update(ctx context.Context, id primitive.ObjectID, set bson.M) error {
	set["updatedAt"] = time.Now().UTC()
	res, err := r.coll.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": set})
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		return ErrNotFound
	}
	return nil
}

// Delete removes.
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
