package httpserver

import (
	"net/http"

	"github.com/jarukit/apartment-system/services/api/internal/httpx"
	"github.com/jarukit/apartment-system/services/api/internal/resident"
	"github.com/go-chi/chi/v5"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type residentCreateBody struct {
	FullName      string  `json:"fullName"`
	Email         string  `json:"email"`
	Phone         string  `json:"phone"`
	PrimaryUnitID *string `json:"primaryUnitId"`
}

type residentPatchBody struct {
	FullName      *string `json:"fullName"`
	Email         *string `json:"email"`
	Phone         *string `json:"phone"`
	PrimaryUnitID *string `json:"primaryUnitId"`
}

func (s *Server) listResidents(w http.ResponseWriter, r *http.Request) {
	list, err := s.Res.List(r.Context())
	if err != nil {
		handleServiceError(w, r, err)
		return
	}
	out := make([]any, 0, len(list))
	for _, x := range list {
		out = append(out, residentJSON(&x))
	}
	writeListMeta(w, out)
}

func (s *Server) createResident(w http.ResponseWriter, r *http.Request) {
	var body residentCreateBody
	if !decodeJSON(w, r, &body) {
		return
	}
	in := resident.CreateInput{FullName: body.FullName, Email: body.Email, Phone: body.Phone}
	if body.PrimaryUnitID != nil && *body.PrimaryUnitID != "" {
		id, err := primitive.ObjectIDFromHex(*body.PrimaryUnitID)
		if err != nil {
			httpx.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "invalid primaryUnitId", nil)
			return
		}
		in.PrimaryUnitID = &id
	}
	d, err := s.Res.Create(r.Context(), in)
	if err != nil {
		handleServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusCreated, map[string]any{"data": residentJSON(d)})
}

func (s *Server) getResident(w http.ResponseWriter, r *http.Request) {
	id, ok := parseObjectID(w, r, chi.URLParam(r, "id"))
	if !ok {
		return
	}
	d, err := s.Res.Get(r.Context(), id)
	if err != nil {
		handleServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"data": residentJSON(d)})
}

func (s *Server) patchResident(w http.ResponseWriter, r *http.Request) {
	id, ok := parseObjectID(w, r, chi.URLParam(r, "id"))
	if !ok {
		return
	}
	var body residentPatchBody
	if !decodeJSON(w, r, &body) {
		return
	}
	in := resident.UpdateInput{FullName: body.FullName, Email: body.Email, Phone: body.Phone}
	if body.PrimaryUnitID != nil {
		if *body.PrimaryUnitID == "" {
			httpx.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "primaryUnitId cannot be empty string", nil)
			return
		}
		uid, err := primitive.ObjectIDFromHex(*body.PrimaryUnitID)
		if err != nil {
			httpx.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "invalid primaryUnitId", nil)
			return
		}
		in.PrimaryUnitID = &uid
	}
	d, err := s.Res.Update(r.Context(), id, in)
	if err != nil {
		handleServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"data": residentJSON(d)})
}

func (s *Server) deleteResident(w http.ResponseWriter, r *http.Request) {
	id, ok := parseObjectID(w, r, chi.URLParam(r, "id"))
	if !ok {
		return
	}
	if err := s.Res.Delete(r.Context(), id); err != nil {
		handleServiceError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func residentJSON(d *resident.Doc) map[string]any {
	m := map[string]any{
		"id":        d.ID.Hex(),
		"fullName":  d.FullName,
		"email":     d.Email,
		"createdAt": d.CreatedAt.UTC().Format("2006-01-02T15:04:05.000Z"),
		"updatedAt": d.UpdatedAt.UTC().Format("2006-01-02T15:04:05.000Z"),
	}
	if d.Phone != "" {
		m["phone"] = d.Phone
	}
	if d.PrimaryUnitID != nil {
		m["primaryUnitId"] = d.PrimaryUnitID.Hex()
	}
	return m
}
