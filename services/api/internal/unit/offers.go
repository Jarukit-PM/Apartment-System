package unit

import (
	"fmt"
	"strings"

	"github.com/jarukit/apartment-system/services/api/internal/rentalperiod"
)

// OfferForPeriod returns the priced offer for a catalog period, or nil if this unit does not offer it.
func (d *Doc) OfferForPeriod(periodID string) *RentalPeriodOffer {
	id := rentalperiod.NormalizeID(periodID)
	for i := range d.RentalPeriodOffers {
		if rentalperiod.NormalizeID(d.RentalPeriodOffers[i].PeriodID) == id {
			o := d.RentalPeriodOffers[i]
			return &o
		}
	}
	return nil
}

// HasPricedSelfServiceRate is true when the unit can show in the resident catalog (vacancy checked elsewhere).
func (d *Doc) HasPricedSelfServiceRate() bool {
	if d.ListingRent != nil && d.ListingRent.Amount > 0 {
		return true
	}
	for _, o := range d.RentalPeriodOffers {
		if o.Amount > 0 {
			return true
		}
	}
	return false
}

// NormalizeRentalPeriodOffers validates catalog ids, merges duplicates (last wins), trims currency, drops non-positive amounts.
func NormalizeRentalPeriodOffers(offers []RentalPeriodOffer) ([]RentalPeriodOffer, error) {
	byID := map[string]RentalPeriodOffer{}
	order := []string{}
	for _, raw := range offers {
		id := rentalperiod.NormalizeID(raw.PeriodID)
		if id == "" {
			continue
		}
		if !rentalperiod.IsKnown(id) {
			return nil, fmt.Errorf("unknown periodId %q", raw.PeriodID)
		}
		if raw.Amount <= 0 {
			continue
		}
		cur := raw
		cur.PeriodID = id
		cur.Currency = strings.TrimSpace(cur.Currency)
		if cur.Currency == "" {
			cur.Currency = "THB"
		}
		if _, ok := byID[id]; !ok {
			order = append(order, id)
		}
		byID[id] = cur
	}
	out := make([]RentalPeriodOffer, 0, len(order))
	for _, id := range order {
		out = append(out, byID[id])
	}
	return out, nil
}
