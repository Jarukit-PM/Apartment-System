package httpserver

import (
	"net/http"
	"time"

	"github.com/jarukit/apartment-system/services/api/internal/httpx"
	"github.com/jarukit/apartment-system/services/api/internal/invoice"
)

type invoiceCreateBody struct {
	LeaseID     string  `json:"leaseId"`
	ResidentID  string  `json:"residentId"`
	Description string  `json:"description"`
	Amount      float64 `json:"amount"`
	Currency    string  `json:"currency"`
	DueDate     string  `json:"dueDate"`
	Status      string  `json:"status"`
}

func (s *Server) createInvoice(w http.ResponseWriter, r *http.Request) {
	var body invoiceCreateBody
	if !decodeJSON(w, r, &body) {
		return
	}
	lid, ok := parseObjectID(w, r, body.LeaseID)
	if !ok {
		return
	}
	rid, ok := parseObjectID(w, r, body.ResidentID)
	if !ok {
		return
	}
	due, err := time.Parse(time.RFC3339, body.DueDate)
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "dueDate must be RFC3339", nil)
		return
	}
	d, err := s.Invoice.Create(r.Context(), invoice.CreateInput{
		LeaseID:     lid,
		ResidentID:  rid,
		Description: body.Description,
		Amount:      body.Amount,
		Currency:    body.Currency,
		DueDate:     due,
		Status:      body.Status,
	})
	if err != nil {
		handleServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusCreated, map[string]any{"data": invoiceJSON(d)})
}
