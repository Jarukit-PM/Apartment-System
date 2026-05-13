package httpserver

import (
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/jarukit/apartment-system/services/api/internal/httpx"
	"github.com/jarukit/apartment-system/services/api/internal/unit"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type unitRentBody struct {
	Amount   float64 `json:"amount"`
	Currency string  `json:"currency"`
}

type rentalPeriodOfferBody struct {
	PeriodID string  `json:"periodId"`
	Amount   float64 `json:"amount"`
	Currency string  `json:"currency"`
}

type unitCreateBody struct {
	PropertyID         string                  `json:"propertyId"`
	Label              string                  `json:"label"`
	Floor              *int                    `json:"floor"`
	Bedrooms           *int                    `json:"bedrooms"`
	Status             string                  `json:"status"`
	ListingRent        *unitRentBody           `json:"listingRent"`
	RentalPeriodOffers []rentalPeriodOfferBody `json:"rentalPeriodOffers"`
	SelfServiceEnabled *bool                   `json:"selfServiceEnabled"`
}

type unitPatchBody struct {
	Label              *string                  `json:"label"`
	Floor              *int                     `json:"floor"`
	Bedrooms           *int                     `json:"bedrooms"`
	Status             *string                  `json:"status"`
	ListingRent        *unitRentBody            `json:"listingRent"`
	RentalPeriodOffers *[]rentalPeriodOfferBody `json:"rentalPeriodOffers"`
	SelfServiceEnabled *bool                    `json:"selfServiceEnabled"`
}

func (s *Server) listUnits(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("propertyId")
	var prop *primitive.ObjectID
	if q != "" {
		id, err := primitive.ObjectIDFromHex(q)
		if err != nil {
			httpx.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "invalid propertyId", nil)
			return
		}
		prop = &id
	}
	list, err := s.Units.List(r.Context(), prop)
	if err != nil {
		handleServiceError(w, r, err)
		return
	}
	out := make([]any, 0, len(list))
	for _, u := range list {
		out = append(out, unitJSON(&u))
	}
	writeListMeta(w, out)
}

func (s *Server) createUnit(w http.ResponseWriter, r *http.Request) {
	var body unitCreateBody
	if !decodeJSON(w, r, &body) {
		return
	}
	pidStr := strings.TrimSpace(body.PropertyID)
	var pid primitive.ObjectID
	var err error
	if pidStr == "" {
		if s.DefaultPropertyID.IsZero() {
			httpx.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "propertyId is required", nil)
			return
		}
		pid = s.DefaultPropertyID
	} else {
		pid, err = primitive.ObjectIDFromHex(pidStr)
		if err != nil {
			httpx.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "invalid propertyId", nil)
			return
		}
	}
	u, err := s.Units.Create(r.Context(), unit.CreateInput{
		PropertyID:         pid,
		Label:              body.Label,
		Floor:              body.Floor,
		Bedrooms:           body.Bedrooms,
		Status:             body.Status,
		ListingRent:        unitRentBodyToListing(body.ListingRent),
		RentalPeriodOffers: rentalOfferBodiesToUnit(body.RentalPeriodOffers),
		SelfServiceEnabled: body.SelfServiceEnabled,
	})
	if err != nil {
		handleServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusCreated, map[string]any{"data": unitJSON(u)})
}

func (s *Server) getUnit(w http.ResponseWriter, r *http.Request) {
	id, ok := parseObjectID(w, r, chi.URLParam(r, "id"))
	if !ok {
		return
	}
	u, err := s.Units.Get(r.Context(), id)
	if err != nil {
		handleServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"data": unitJSON(u)})
}

func (s *Server) patchUnit(w http.ResponseWriter, r *http.Request) {
	id, ok := parseObjectID(w, r, chi.URLParam(r, "id"))
	if !ok {
		return
	}
	var body unitPatchBody
	if !decodeJSON(w, r, &body) {
		return
	}
	in := unit.UpdateInput{
		Label:              body.Label,
		Floor:              body.Floor,
		Bedrooms:           body.Bedrooms,
		Status:             body.Status,
		ListingRent:        unitRentBodyToListing(body.ListingRent),
		SelfServiceEnabled: body.SelfServiceEnabled,
	}
	if body.RentalPeriodOffers != nil {
		uo := rentalOfferBodiesToUnit(*body.RentalPeriodOffers)
		in.RentalPeriodOffers = &uo
	}
	u, err := s.Units.Update(r.Context(), id, in)
	if err != nil {
		handleServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"data": unitJSON(u)})
}

func (s *Server) deleteUnit(w http.ResponseWriter, r *http.Request) {
	id, ok := parseObjectID(w, r, chi.URLParam(r, "id"))
	if !ok {
		return
	}
	if err := s.Units.Delete(r.Context(), id); err != nil {
		handleServiceError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func unitJSON(u *unit.Doc) map[string]any {
	m := map[string]any{
		"id":         u.ID.Hex(),
		"propertyId": u.PropertyID.Hex(),
		"label":      u.Label,
		"status":     u.Status,
		"createdAt":  u.CreatedAt.UTC().Format("2006-01-02T15:04:05.000Z"),
		"updatedAt":  u.UpdatedAt.UTC().Format("2006-01-02T15:04:05.000Z"),
	}
	if u.Floor != nil {
		m["floor"] = *u.Floor
	}
	if u.Bedrooms != nil {
		m["bedrooms"] = *u.Bedrooms
	}
	if u.ListingRent != nil {
		m["listingRent"] = map[string]any{
			"amount":   u.ListingRent.Amount,
			"currency": u.ListingRent.Currency,
		}
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
	if u.SelfServiceEnabled != nil {
		m["selfServiceEnabled"] = *u.SelfServiceEnabled
	}
	return m
}

func unitRentBodyToListing(b *unitRentBody) *unit.ListingRent {
	if b == nil {
		return nil
	}
	return &unit.ListingRent{Amount: b.Amount, Currency: b.Currency}
}

func rentalOfferBodiesToUnit(in []rentalPeriodOfferBody) []unit.RentalPeriodOffer {
	if len(in) == 0 {
		return nil
	}
	out := make([]unit.RentalPeriodOffer, 0, len(in))
	for _, b := range in {
		out = append(out, unit.RentalPeriodOffer{
			PeriodID: b.PeriodID,
			Amount:   b.Amount,
			Currency: b.Currency,
		})
	}
	return out
}
