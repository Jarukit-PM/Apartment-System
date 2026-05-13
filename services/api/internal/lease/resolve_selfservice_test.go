package lease

import (
	"testing"
	"time"

	"github.com/jarukit/apartment-system/services/api/internal/rentalperiod"
	"github.com/jarukit/apartment-system/services/api/internal/unit"
)

func TestResolveSelfServiceTerms_period(t *testing.T) {
	u := &unit.Doc{
		ListingRent: nil,
		RentalPeriodOffers: []unit.RentalPeriodOffer{
			{PeriodID: "1m", Amount: 12000, Currency: "THB"},
		},
	}
	st := time.Date(2026, 5, 13, 15, 0, 0, 0, time.UTC)
	start, end, rent, err := resolveSelfServiceTerms(u, SelfServiceLeaseInput{
		PeriodID:  "1m",
		StartDate: st,
	})
	if err != nil {
		t.Fatal(err)
	}
	if !start.Equal(time.Date(2026, 5, 13, 0, 0, 0, 0, time.UTC)) {
		t.Fatalf("start %v", start)
	}
	if end == nil || !end.Equal(time.Date(2026, 6, 12, 0, 0, 0, 0, time.UTC)) {
		t.Fatalf("end %v", end)
	}
	if rent.Amount != 12000 || rent.Currency != "THB" {
		t.Fatalf("rent %+v", rent)
	}
}

func TestResolveSelfServiceTerms_legacyListing(t *testing.T) {
	u := &unit.Doc{
		ListingRent: &unit.ListingRent{Amount: 9000, Currency: "THB"},
	}
	st := time.Date(2026, 5, 13, 0, 0, 0, 0, time.UTC)
	en := time.Date(2026, 5, 20, 0, 0, 0, 0, time.UTC)
	start, end, rent, err := resolveSelfServiceTerms(u, SelfServiceLeaseInput{
		StartDate: st,
		EndDate:   &en,
	})
	if err != nil {
		t.Fatal(err)
	}
	if end == nil || !end.Equal(en) {
		t.Fatalf("end %v", end)
	}
	if rent.Amount != 9000 {
		t.Fatalf("rent %+v", rent)
	}
	_ = start
}

func TestResolveSelfServiceTerms_periodRequired(t *testing.T) {
	u := &unit.Doc{
		RentalPeriodOffers: []unit.RentalPeriodOffer{{PeriodID: "6m", Amount: 1, Currency: "THB"}},
	}
	_, _, _, err := resolveSelfServiceTerms(u, SelfServiceLeaseInput{
		StartDate: time.Now(),
	})
	if err != ErrSelfServicePeriodRequired {
		t.Fatalf("got %v", err)
	}
}

func TestNextBookableAfterInclusiveEnd_integration(t *testing.T) {
	end := time.Date(2026, 5, 15, 0, 0, 0, 0, time.UTC)
	next := rentalperiod.NextBookableStartUTC(end)
	want := time.Date(2026, 5, 16, 0, 0, 0, 0, time.UTC)
	if !next.Equal(want) {
		t.Fatalf("got %v", next)
	}
}
