package resident

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Doc is a resident document.
type Doc struct {
	ID            primitive.ObjectID  `bson:"_id,omitempty"`
	FullName      string              `bson:"fullName"`
	Email         string              `bson:"email"`
	Phone         string              `bson:"phone,omitempty"`
	PrimaryUnitID *primitive.ObjectID `bson:"primaryUnitId,omitempty"`
	CreatedAt     time.Time           `bson:"createdAt"`
	UpdatedAt     time.Time           `bson:"updatedAt"`
}

// CreateInput for insert.
type CreateInput struct {
	FullName      string
	Email         string
	Phone         string
	PrimaryUnitID *primitive.ObjectID
}

// UpdateInput partial.
type UpdateInput struct {
	FullName      *string
	Email         *string
	Phone         *string
	PrimaryUnitID *primitive.ObjectID
}

// SelfProfileInput is what a resident may change on their own profile.
type SelfProfileInput struct {
	FullName *string
	Phone    *string
}
