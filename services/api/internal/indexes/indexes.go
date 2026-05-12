package indexes

import (
	"context"
	"log/slog"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Ensure creates required indexes per docs/data-model.md (idempotent).
func Ensure(ctx context.Context, db *mongo.Database) {
	type spec struct {
		coll   string
		keys   bson.D
		name   string
		unique bool
	}
	specs := []spec{
		{"properties", bson.D{{Key: "name", Value: 1}}, "properties_name", false},
		{"units", bson.D{{Key: "propertyId", Value: 1}, {Key: "label", Value: 1}}, "units_property_label", true},
		{"units", bson.D{{Key: "propertyId", Value: 1}, {Key: "status", Value: 1}}, "units_property_status", false},
		{"residents", bson.D{{Key: "email", Value: 1}}, "residents_email", true},
		{"residents", bson.D{{Key: "primaryUnitId", Value: 1}}, "residents_primary_unit", false},
		{"leases", bson.D{{Key: "unitId", Value: 1}, {Key: "status", Value: 1}}, "leases_unit_status", false},
		{"leases", bson.D{{Key: "residentIds", Value: 1}}, "leases_residents", false},
		{"leases", bson.D{{Key: "endDate", Value: 1}}, "leases_end_date", false},
		{"maintenance_requests", bson.D{{Key: "unitId", Value: 1}, {Key: "status", Value: 1}}, "maint_unit_status", false},
		{"maintenance_requests", bson.D{{Key: "status", Value: 1}, {Key: "createdAt", Value: -1}}, "maint_status_created", false},
	}
	for _, s := range specs {
		opts := options.Index().SetName(s.name)
		if s.unique {
			opts.SetUnique(true)
		}
		iv := mongo.IndexModel{Keys: s.keys, Options: opts}
		_, err := db.Collection(s.coll).Indexes().CreateOne(ctx, iv)
		if err != nil {
			slog.Warn("index ensure", "collection", s.coll, "name", s.name, "error", err)
		}
	}
}
