package unit

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Status values for units.
const (
	StatusVacant       = "vacant"
	StatusOccupied     = "occupied"
	StatusMaintenance  = "maintenance"
)

// Doc is the MongoDB document for a unit.
type Doc struct {
	ID         primitive.ObjectID `bson:"_id,omitempty"`
	PropertyID primitive.ObjectID `bson:"propertyId"`
	Label      string               `bson:"label"`
	Floor      *int                 `bson:"floor,omitempty"`
	Bedrooms   *int                 `bson:"bedrooms,omitempty"`
	Status     string               `bson:"status"`
	CreatedAt  time.Time            `bson:"createdAt"`
	UpdatedAt  time.Time            `bson:"updatedAt"`
}

// CreateInput for new units.
type CreateInput struct {
	PropertyID primitive.ObjectID
	Label      string
	Floor      *int
	Bedrooms   *int
	Status     string
}

// UpdateInput partial update.
type UpdateInput struct {
	Label    *string
	Floor    *int
	Bedrooms *int
	Status   *string
}
