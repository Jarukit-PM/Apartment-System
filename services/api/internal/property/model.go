package property

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Address is optional structured address on a property.
type Address struct {
	Line1      string `bson:"line1,omitempty" json:"line1,omitempty"`
	Line2      string `bson:"line2,omitempty" json:"line2,omitempty"`
	City       string `bson:"city,omitempty" json:"city,omitempty"`
	Region     string `bson:"region,omitempty" json:"region,omitempty"`
	PostalCode string `bson:"postalCode,omitempty" json:"postalCode,omitempty"`
	Country    string `bson:"country,omitempty" json:"country,omitempty"`
}

// Doc is the MongoDB document shape.
type Doc struct {
	ID        primitive.ObjectID `bson:"_id,omitempty"`
	Name      string             `bson:"name"`
	Address   *Address           `bson:"address,omitempty"`
	ImageURL  string             `bson:"imageUrl,omitempty"`
	CreatedAt time.Time          `bson:"createdAt"`
	UpdatedAt time.Time          `bson:"updatedAt"`
}

// CreateInput is used when inserting a property.
type CreateInput struct {
	Name     string
	Address  *Address
	ImageURL string
}

// UpdateInput is a partial update.
type UpdateInput struct {
	Name     *string
	Address  *Address
	ImageURL *string // nil = unchanged; "" = remove; non-empty = set
}
