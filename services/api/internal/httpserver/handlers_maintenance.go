package httpserver

import (
	"net/http"

	"github.com/jarukit/apartment-system/services/api/internal/httpx"
	"github.com/jarukit/apartment-system/services/api/internal/maintenance"
	"github.com/go-chi/chi/v5"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type maintCreateBody struct {
	UnitID                string  `json:"unitId"`
	RequestedByResidentID *string `json:"requestedByResidentId"`
	Title                 string   `json:"title"`
	Description           string   `json:"description"`
	ImageURLs             []string `json:"imageUrls"`
	Status                string   `json:"status"`
}

type maintPatchBody struct {
	Title                 *string `json:"title"`
	Description           *string `json:"description"`
	Status                *string `json:"status"`
	RequestedByResidentID *string `json:"requestedByResidentId"`
}

func (s *Server) listMaintenance(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("unitId")
	var uid *primitive.ObjectID
	if q != "" {
		id, err := primitive.ObjectIDFromHex(q)
		if err != nil {
			httpx.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "invalid unitId", nil)
			return
		}
		uid = &id
	}
	list, err := s.Maint.List(r.Context(), uid)
	if err != nil {
		handleServiceError(w, r, err)
		return
	}
	out := make([]any, 0, len(list))
	for _, x := range list {
		out = append(out, maintenanceJSON(&x))
	}
	writeListMeta(w, out)
}

func (s *Server) createMaintenance(w http.ResponseWriter, r *http.Request) {
	var body maintCreateBody
	if !decodeJSON(w, r, &body) {
		return
	}
	uid, err := primitive.ObjectIDFromHex(body.UnitID)
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "invalid unitId", nil)
		return
	}
	in := maintenance.CreateInput{
		UnitID:      uid,
		Title:       body.Title,
		Description: body.Description,
		ImageURLs:   body.ImageURLs,
		Status:      body.Status,
	}
	if body.RequestedByResidentID != nil && *body.RequestedByResidentID != "" {
		rid, err := primitive.ObjectIDFromHex(*body.RequestedByResidentID)
		if err != nil {
			httpx.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "invalid requestedByResidentId", nil)
			return
		}
		in.RequestedByResidentID = &rid
	}
	d, err := s.Maint.Create(r.Context(), in)
	if err != nil {
		handleServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusCreated, map[string]any{"data": maintenanceJSON(d)})
}

func (s *Server) getMaintenance(w http.ResponseWriter, r *http.Request) {
	id, ok := parseObjectID(w, r, chi.URLParam(r, "id"))
	if !ok {
		return
	}
	d, err := s.Maint.Get(r.Context(), id)
	if err != nil {
		handleServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"data": maintenanceJSON(d)})
}

func (s *Server) patchMaintenance(w http.ResponseWriter, r *http.Request) {
	id, ok := parseObjectID(w, r, chi.URLParam(r, "id"))
	if !ok {
		return
	}
	var body maintPatchBody
	if !decodeJSON(w, r, &body) {
		return
	}
	in := maintenance.UpdateInput{Title: body.Title, Description: body.Description, Status: body.Status}
	if body.RequestedByResidentID != nil {
		if *body.RequestedByResidentID == "" {
			httpx.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "requestedByResidentId cannot be empty", nil)
			return
		}
		rid, err := primitive.ObjectIDFromHex(*body.RequestedByResidentID)
		if err != nil {
			httpx.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "invalid requestedByResidentId", nil)
			return
		}
		in.RequestedByResidentID = &rid
	}
	d, err := s.Maint.Update(r.Context(), id, in)
	if err != nil {
		handleServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"data": maintenanceJSON(d)})
}

func (s *Server) deleteMaintenance(w http.ResponseWriter, r *http.Request) {
	id, ok := parseObjectID(w, r, chi.URLParam(r, "id"))
	if !ok {
		return
	}
	if err := s.Maint.Delete(r.Context(), id); err != nil {
		handleServiceError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func maintenanceJSON(d *maintenance.Doc) map[string]any {
	m := map[string]any{
		"id":          d.ID.Hex(),
		"unitId":      d.UnitID.Hex(),
		"title":       d.Title,
		"description": d.Description,
		"status":      d.Status,
		"createdAt":   d.CreatedAt.UTC().Format("2006-01-02T15:04:05.000Z"),
		"updatedAt":   d.UpdatedAt.UTC().Format("2006-01-02T15:04:05.000Z"),
	}
	if d.RequestedByResidentID != nil {
		m["requestedByResidentId"] = d.RequestedByResidentID.Hex()
	}
	if len(d.ImageURLs) > 0 {
		m["imageUrls"] = d.ImageURLs
	}
	return m
}
