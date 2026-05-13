package httpserver

import (
	"net/http"
	"time"

	"github.com/jarukit/apartment-system/services/api/internal/authn"
	"github.com/jarukit/apartment-system/services/api/internal/httpx"
	"github.com/jarukit/apartment-system/services/api/internal/lease"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (s *Server) meAvailableUnits(w http.ResponseWriter, r *http.Request) {
	p, ok := authn.PrincipalFrom(r.Context())
	if !ok || p.ResidentID == nil {
		httpx.WriteError(w, r, http.StatusForbidden, "FORBIDDEN", "resident profile required", nil)
		return
	}
	var propFilter *primitive.ObjectID
	if !s.DefaultPropertyID.IsZero() {
		propFilter = &s.DefaultPropertyID
	}
	list, err := s.Units.ListAvailableForSelfService(r.Context(), propFilter)
	if err != nil {
		handleServiceError(w, r, err)
		return
	}
	out := make([]any, 0, len(list))
	for i := range list {
		u := &list[i]
		if !u.HasPricedSelfServiceRate() {
			continue
		}
		m := map[string]any{
			"id":                 u.ID.Hex(),
			"propertyId":         u.PropertyID.Hex(),
			"label":              u.Label,
			"status":             u.Status,
			"selfServiceEnabled": u.SelfServiceEnabled == nil || *u.SelfServiceEnabled,
		}
		if u.ListingRent != nil {
			m["listingRent"] = map[string]any{"amount": u.ListingRent.Amount, "currency": u.ListingRent.Currency}
		}
		if len(u.RentalPeriodOffers) > 0 {
			offers := make([]map[string]any, 0, len(u.RentalPeriodOffers))
			for _, o := range u.RentalPeriodOffers {
				offers = append(offers, map[string]any{
					"periodId": o.PeriodID,
					"amount":   o.Amount,
					"currency": o.Currency,
				})
			}
			m["rentalPeriodOffers"] = offers
		}
		if u.Floor != nil {
			m["floor"] = *u.Floor
		}
		if u.Bedrooms != nil {
			m["bedrooms"] = *u.Bedrooms
		}
		if prop, err := s.Props.Get(r.Context(), u.PropertyID); err == nil {
			m["propertyName"] = prop.Name
		}
		out = append(out, m)
	}
	writeListMeta(w, out)
}

type meLeaseCreateBody struct {
	UnitID    string  `json:"unitId"`
	PeriodID  string  `json:"periodId"`
	StartDate string  `json:"startDate"`
	EndDate   *string `json:"endDate"`
}

func (s *Server) meCreateLease(w http.ResponseWriter, r *http.Request) {
	p, ok := authn.PrincipalFrom(r.Context())
	if !ok || p.ResidentID == nil {
		httpx.WriteError(w, r, http.StatusForbidden, "FORBIDDEN", "resident profile required", nil)
		return
	}
	var body meLeaseCreateBody
	if !decodeJSON(w, r, &body) {
		return
	}
	uid, err := primitive.ObjectIDFromHex(body.UnitID)
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "invalid unitId", nil)
		return
	}
	st, err := time.Parse(time.RFC3339, body.StartDate)
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "startDate must be RFC3339", nil)
		return
	}
	var end *time.Time
	if body.EndDate != nil && *body.EndDate != "" {
		t, err := time.Parse(time.RFC3339, *body.EndDate)
		if err != nil {
			httpx.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "endDate must be RFC3339", nil)
			return
		}
		end = &t
	}
	if !s.DefaultPropertyID.IsZero() {
		u, err := s.Units.Get(r.Context(), uid)
		if err != nil {
			handleServiceError(w, r, err)
			return
		}
		if u.PropertyID != s.DefaultPropertyID {
			httpx.WriteError(w, r, http.StatusForbidden, "FORBIDDEN", "unit is not in this building", nil)
			return
		}
	}
	d, err := s.Leases.CreateSelfService(r.Context(), *p.ResidentID, p.UserID, lease.SelfServiceLeaseInput{
		UnitID:    uid,
		PeriodID:  body.PeriodID,
		StartDate: st,
		EndDate:   end,
	})
	if err != nil {
		handleServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusCreated, map[string]any{"data": leaseJSON(d)})
}
