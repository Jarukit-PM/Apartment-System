package siteboot

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// EnsureDefaultProperty inserts a singleton building document when the portfolio is empty.
func EnsureDefaultProperty(ctx context.Context, db *mongo.Database, displayName string) (primitive.ObjectID, error) {
	coll := db.Collection("properties")
	var existing struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	err := coll.FindOne(ctx, bson.M{"singleton": true}).Decode(&existing)
	if err == nil {
		return existing.ID, nil
	}
	n, err := coll.CountDocuments(ctx, bson.M{})
	if err != nil {
		return primitive.NilObjectID, err
	}
	if n > 0 {
		// Already have properties but none flagged singleton — use first by name.
		cur, err := coll.Find(ctx, bson.M{}, options.Find().SetSort(bson.D{{Key: "name", Value: 1}}).SetLimit(1))
		if err != nil {
			return primitive.NilObjectID, err
		}
		defer cur.Close(ctx)
		if cur.Next(ctx) {
			var d struct {
				ID primitive.ObjectID `bson:"_id"`
			}
			if err := cur.Decode(&d); err != nil {
				return primitive.NilObjectID, err
			}
			return d.ID, nil
		}
	}
	if displayName == "" {
		displayName = "Main building"
	}
	now := time.Now().UTC()
	id := primitive.NewObjectID()
	_, err = coll.InsertOne(ctx, bson.M{
		"_id":        id,
		"name":       displayName,
		"singleton":  true,
		"createdAt":  now,
		"updatedAt":  now,
	})
	if err != nil {
		return primitive.NilObjectID, err
	}
	return id, nil
}
