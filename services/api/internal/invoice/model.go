package invoice

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Status values for invoices.
const (
	StatusDraft = "draft"
	StatusOpen  = "open"
	StatusPaid  = "paid"
)

// Doc is a simple billing document (MVP slice).
type Doc struct {
	ID          primitive.ObjectID `bson:"_id,omitempty"`
	LeaseID     primitive.ObjectID `bson:"leaseId"`
	ResidentID  primitive.ObjectID `bson:"residentId"` // payer / primary resident
	Description string             `bson:"description"`
	Amount      float64            `bson:"amount"`
	Currency    string             `bson:"currency"`
	DueDate     time.Time          `bson:"dueDate"`
	Status      string             `bson:"status"`
	CreatedAt   time.Time          `bson:"createdAt"`
	UpdatedAt   time.Time          `bson:"updatedAt"`
}

// CreateInput for admin-created invoices.
type CreateInput struct {
	LeaseID     primitive.ObjectID
	ResidentID  primitive.ObjectID
	Description string
	Amount      float64
	Currency    string
	DueDate     time.Time
	Status      string
}
