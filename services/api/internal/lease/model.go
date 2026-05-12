package lease

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Status values.
const (
	StatusDraft  = "draft"
	StatusActive = "active"
	StatusEnded  = "ended"
)

// Rent is currency-aware rent on a lease.
type Rent struct {
	Amount   float64 `bson:"amount" json:"amount"`
	Currency string  `bson:"currency" json:"currency"`
}

// Doc is a lease document.
type Doc struct {
	ID          primitive.ObjectID   `bson:"_id,omitempty"`
	UnitID      primitive.ObjectID   `bson:"unitId"`
	ResidentIDs []primitive.ObjectID `bson:"residentIds"`
	StartDate   time.Time            `bson:"startDate"`
	EndDate     *time.Time           `bson:"endDate,omitempty"`
	Status      string               `bson:"status"`
	Rent        Rent                 `bson:"rent"`
	CreatedAt   time.Time            `bson:"createdAt"`
	UpdatedAt   time.Time            `bson:"updatedAt"`
}

// CreateInput for new lease.
type CreateInput struct {
	UnitID      primitive.ObjectID
	ResidentIDs []primitive.ObjectID
	StartDate   time.Time
	EndDate     *time.Time
	Status      string
	Rent        Rent
}

// UpdateInput partial update.
type UpdateInput struct {
	ResidentIDs *[]primitive.ObjectID
	StartDate   *time.Time
	EndDate     *time.Time
	Status      *string
	Rent        *Rent
}
