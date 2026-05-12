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
		sparse bool
	}
	specs := []spec{
		{"properties", bson.D{{Key: "name", Value: 1}}, "properties_name", false, false},
		{"properties", bson.D{{Key: "singleton", Value: 1}}, "properties_singleton", false, true},
		{"units", bson.D{{Key: "propertyId", Value: 1}, {Key: "label", Value: 1}}, "units_property_label", true, false},
		{"units", bson.D{{Key: "propertyId", Value: 1}, {Key: "status", Value: 1}}, "units_property_status", false, false},
		{"residents", bson.D{{Key: "email", Value: 1}}, "residents_email", true, false},
		{"residents", bson.D{{Key: "primaryUnitId", Value: 1}}, "residents_primary_unit", false, false},
		{"leases", bson.D{{Key: "unitId", Value: 1}, {Key: "status", Value: 1}}, "leases_unit_status", false, false},
		{"leases", bson.D{{Key: "residentIds", Value: 1}}, "leases_residents", false, false},
		{"leases", bson.D{{Key: "endDate", Value: 1}}, "leases_end_date", false, false},
		{"maintenance_requests", bson.D{{Key: "unitId", Value: 1}, {Key: "status", Value: 1}}, "maint_unit_status", false, false},
		{"maintenance_requests", bson.D{{Key: "status", Value: 1}, {Key: "createdAt", Value: -1}}, "maint_status_created", false, false},
		{"users", bson.D{{Key: "email", Value: 1}}, "users_email", true, false},
		{"users", bson.D{{Key: "googleSub", Value: 1}}, "users_google_sub", true, true},
		{"refresh_tokens", bson.D{{Key: "tokenHash", Value: 1}}, "refresh_tokens_hash", true, false},
		{"invoices", bson.D{{Key: "leaseId", Value: 1}, {Key: "dueDate", Value: 1}}, "invoices_lease_due", false, false},
		{"invoices", bson.D{{Key: "residentId", Value: 1}, {Key: "status", Value: 1}}, "invoices_resident_status", false, false},
		{"wallets", bson.D{{Key: "userId", Value: 1}}, "wallets_user", true, false},
		{"wallet_ledger", bson.D{{Key: "userId", Value: 1}, {Key: "createdAt", Value: -1}}, "wallet_ledger_user_created", false, false},
	}
	for _, s := range specs {
		opts := options.Index().SetName(s.name)
		if s.unique {
			opts.SetUnique(true)
		}
		if s.sparse {
			opts.SetSparse(true)
		}
		iv := mongo.IndexModel{Keys: s.keys, Options: opts}
		_, err := db.Collection(s.coll).Indexes().CreateOne(ctx, iv)
		if err != nil {
			slog.Warn("index ensure", "collection", s.coll, "name", s.name, "error", err)
		}
	}
}
