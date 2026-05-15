package httpserver

import (
	"net/http"
	"strings"
	"time"

	"github.com/jarukit/apartment-system/services/api/internal/httpx"
	"github.com/jarukit/apartment-system/services/api/internal/lease"
	"github.com/go-chi/chi/v5"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type leaseCreateBody struct {
	UnitID      string   `json:"unitId"`
	ResidentIDs []string `json:"residentIds"`
	StartDate   string   `json:"startDate"`
	EndDate     *string  `json:"endDate"`
	Status      string   `json:"status"`
	Rent        lease.Rent `json:"rent"`
}

type leasePatchBody struct {
	ResidentIDs *[]string `json:"residentIds"`
	StartDate   *string   `json:"startDate"`
	EndDate     *string   `json:"endDate"`
	Status      *string   `json:"status"`
	Rent        *lease.Rent `json:"rent"`
}

func (s *Server) listLeases(w http.ResponseWriter, r *http.Request) {
	unitQ := r.URL.Query().Get("unitId")
	residentQ := r.URL.Query().Get("residentId")
	if unitQ != "" && residentQ != "" {
		httpx.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "use unitId or residentId, not both", nil)
		return
	}
	var list []lease.Doc
	var err error
	if residentQ != "" {
		rid, parseErr := primitive.ObjectIDFromHex(residentQ)
		if parseErr != nil {
			httpx.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "invalid residentId", nil)
			return
		}
		list, err = s.Leases.ListForResident(r.Context(), rid)
	} else {
		var uid *primitive.ObjectID
		if unitQ != "" {
			id, parseErr := primitive.ObjectIDFromHex(unitQ)
			if parseErr != nil {
				httpx.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "invalid unitId", nil)
				return
			}
			uid = &id
		}
		list, err = s.Leases.List(r.Context(), uid)
	}
	if err != nil {
		handleServiceError(w, r, err)
		return
	}
	out := make([]any, 0, len(list))
	for _, x := range list {
		out = append(out, leaseJSON(&x))
	}
	writeListMeta(w, out)
}

func (s *Server) createLease(w http.ResponseWriter, r *http.Request) {
	var body leaseCreateBody
	if !decodeJSON(w, r, &body) {
		return
	}
	uid, err := primitive.ObjectIDFromHex(body.UnitID)
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "invalid unitId", nil)
		return
	}
	rids := make([]primitive.ObjectID, 0, len(body.ResidentIDs))
	for _, h := range body.ResidentIDs {
		id, err := primitive.ObjectIDFromHex(h)
		if err != nil {
			httpx.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "invalid residentId", nil)
			return
		}
		rids = append(rids, id)
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
	d, err := s.Leases.Create(r.Context(), lease.CreateInput{
		UnitID:      uid,
		ResidentIDs: rids,
		StartDate:   st,
		EndDate:     end,
		Status:      body.Status,
		Rent:        body.Rent,
	})
	if err != nil {
		handleServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusCreated, map[string]any{"data": leaseJSON(d)})
}

func (s *Server) getLease(w http.ResponseWriter, r *http.Request) {
	id, ok := parseObjectID(w, r, chi.URLParam(r, "id"))
	if !ok {
		return
	}
	d, err := s.Leases.Get(r.Context(), id)
	if err != nil {
		handleServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"data": leaseJSON(d)})
}

func (s *Server) patchLease(w http.ResponseWriter, r *http.Request) {
	id, ok := parseObjectID(w, r, chi.URLParam(r, "id"))
	if !ok {
		return
	}
	var body leasePatchBody
	if !decodeJSON(w, r, &body) {
		return
	}
	in := lease.UpdateInput{Status: body.Status, Rent: body.Rent}
	if body.ResidentIDs != nil {
		rids := make([]primitive.ObjectID, 0, len(*body.ResidentIDs))
		for _, h := range *body.ResidentIDs {
			rid, err := primitive.ObjectIDFromHex(h)
			if err != nil {
				httpx.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "invalid residentId", nil)
				return
			}
			rids = append(rids, rid)
		}
		in.ResidentIDs = &rids
	}
	if body.StartDate != nil {
		t, err := time.Parse(time.RFC3339, *body.StartDate)
		if err != nil {
			httpx.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "startDate must be RFC3339", nil)
			return
		}
		in.StartDate = &t
	}
	if body.EndDate != nil && *body.EndDate != "" {
		t, err := time.Parse(time.RFC3339, *body.EndDate)
		if err != nil {
			httpx.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "endDate must be RFC3339", nil)
			return
		}
		in.EndDate = &t
	}
	d, err := s.Leases.Update(r.Context(), id, in)
	if err != nil {
		handleServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"data": leaseJSON(d)})
}

func (s *Server) deleteLease(w http.ResponseWriter, r *http.Request) {
	id, ok := parseObjectID(w, r, chi.URLParam(r, "id"))
	if !ok {
		return
	}
	if err := s.Leases.Delete(r.Context(), id); err != nil {
		handleServiceError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func leaseJSON(d *lease.Doc) map[string]any {
	ids := make([]string, 0, len(d.ResidentIDs))
	for _, x := range d.ResidentIDs {
		ids = append(ids, x.Hex())
	}
	m := map[string]any{
		"id":          d.ID.Hex(),
		"unitId":      d.UnitID.Hex(),
		"residentIds": ids,
		"startDate":   d.StartDate.UTC().Format(time.RFC3339Nano),
		"status":      d.Status,
		"rent":        d.Rent,
		"createdAt":   d.CreatedAt.UTC().Format("2006-01-02T15:04:05.000Z"),
		"updatedAt":   d.UpdatedAt.UTC().Format("2006-01-02T15:04:05.000Z"),
	}
	if strings.TrimSpace(d.RentBasis) != "" {
		m["rentBasis"] = d.RentBasis
	}
	if strings.TrimSpace(d.NextRentBillMonth) != "" {
		m["nextRentBillMonth"] = d.NextRentBillMonth
	}
	if d.EndDate != nil {
		m["endDate"] = d.EndDate.UTC().Format(time.RFC3339Nano)
	}
	return m
}
