package unit

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Status values for units.
const (
	StatusVacant      = "vacant"
	StatusOccupied    = "occupied"
	StatusMaintenance = "maintenance"
)

// ListingRent is admin-set asking rent for self-service booking (mirrors lease rent shape).
type ListingRent struct {
	Amount   float64 `bson:"amount" json:"amount"`
	Currency string  `bson:"currency" json:"currency"`
}

// RentalPeriodOffer is admin-set price for one catalog period (e.g. 1m, 6m). Periods not listed are not offered on this unit.
type RentalPeriodOffer struct {
	PeriodID string  `bson:"periodId" json:"periodId"`
	Amount   float64 `bson:"amount" json:"amount"`
	Currency string  `bson:"currency" json:"currency"`
}

// Doc is the MongoDB document for a unit.
type Doc struct {
	ID                 primitive.ObjectID  `bson:"_id,omitempty"`
	PropertyID         primitive.ObjectID  `bson:"propertyId"`
	Label              string              `bson:"label"`
	Floor              *int                `bson:"floor,omitempty"`
	Bedrooms           *int                `bson:"bedrooms,omitempty"`
	Status             string              `bson:"status"`
	ListingRent        *ListingRent        `bson:"listingRent,omitempty"`
	RentalPeriodOffers []RentalPeriodOffer `bson:"rentalPeriodOffers,omitempty"`
	SelfServiceEnabled *bool               `bson:"selfServiceEnabled,omitempty"`
	ImageURL           string              `bson:"imageUrl,omitempty"`
	CreatedAt          time.Time           `bson:"createdAt"`
	UpdatedAt          time.Time           `bson:"updatedAt"`
}

// CreateInput for new units.
type CreateInput struct {
	PropertyID         primitive.ObjectID
	Label              string
	Floor              *int
	Bedrooms           *int
	Status             string
	ListingRent        *ListingRent
	RentalPeriodOffers []RentalPeriodOffer
	SelfServiceEnabled *bool
	ImageURL           string
}

// UpdateInput partial update.
type UpdateInput struct {
	Label              *string
	Floor              *int
	Bedrooms           *int
	Status             *string
	ListingRent        *ListingRent
	RentalPeriodOffers *[]RentalPeriodOffer
	SelfServiceEnabled *bool
	ImageURL           *string // nil = unchanged; "" = remove; non-empty = set
}
