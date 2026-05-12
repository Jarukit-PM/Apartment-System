package maintenance

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Request statuses.
const (
	StatusOpen        = "open"
	StatusInProgress  = "in_progress"
	StatusClosed      = "closed"
)

// Doc is a maintenance request.
type Doc struct {
	ID                    primitive.ObjectID  `bson:"_id,omitempty"`
	UnitID                primitive.ObjectID  `bson:"unitId"`
	RequestedByResidentID *primitive.ObjectID `bson:"requestedByResidentId,omitempty"`
	Title                 string              `bson:"title"`
	Description           string              `bson:"description"`
	Status                string              `bson:"status"`
	CreatedAt             time.Time           `bson:"createdAt"`
	UpdatedAt             time.Time           `bson:"updatedAt"`
}

// CreateInput for insert.
type CreateInput struct {
	UnitID                primitive.ObjectID
	RequestedByResidentID *primitive.ObjectID
	Title                 string
	Description           string
	Status                string
}

// UpdateInput partial.
type UpdateInput struct {
	Title                 *string
	Description           *string
	Status                *string
	RequestedByResidentID *primitive.ObjectID
}
