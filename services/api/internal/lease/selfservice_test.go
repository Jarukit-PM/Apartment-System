package lease

import (
	"testing"

	"github.com/jarukit/apartment-system/services/api/internal/unit"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestUnitBookableForSelfService(t *testing.T) {
	tTrue := true
	tFalse := false
	uid := primitive.NewObjectID()
	base := unit.Doc{
		ID:         uid,
		PropertyID: primitive.NewObjectID(),
		Label:      "101",
		Status:     unit.StatusVacant,
		ListingRent: &unit.ListingRent{
			Amount:   10000,
			Currency: "THB",
		},
	}
	t.Run("vacant_with_rent", func(t *testing.T) {
		if !unitBookableForSelfService(&base) {
			t.Fatal("expected bookable")
		}
	})
	t.Run("occupied", func(t *testing.T) {
		u := base
		u.Status = unit.StatusOccupied
		if unitBookableForSelfService(&u) {
			t.Fatal("expected not bookable")
		}
	})
	t.Run("no_listing_no_offers", func(t *testing.T) {
		u := base
		u.ListingRent = nil
		if unitBookableForSelfService(&u) {
			t.Fatal("expected not bookable")
		}
	})
	t.Run("period_offers_only", func(t *testing.T) {
		u := base
		u.ListingRent = nil
		u.RentalPeriodOffers = []unit.RentalPeriodOffer{{PeriodID: "1m", Amount: 5000, Currency: "THB"}}
		if !unitBookableForSelfService(&u) {
			t.Fatal("expected bookable")
		}
	})
	t.Run("zero_amount", func(t *testing.T) {
		u := base
		u.ListingRent = &unit.ListingRent{Amount: 0, Currency: "THB"}
		if unitBookableForSelfService(&u) {
			t.Fatal("expected not bookable")
		}
	})
	t.Run("self_service_disabled", func(t *testing.T) {
		u := base
		u.SelfServiceEnabled = &tFalse
		if unitBookableForSelfService(&u) {
			t.Fatal("expected not bookable")
		}
	})
	t.Run("self_service_explicit_true", func(t *testing.T) {
		u := base
		u.SelfServiceEnabled = &tTrue
		if !unitBookableForSelfService(&u) {
			t.Fatal("expected bookable")
		}
	})
}
