package httpserver

import (
	"net/http"

	"github.com/jarukit/apartment-system/services/api/internal/httpx"
	"github.com/jarukit/apartment-system/services/api/internal/property"
	"github.com/go-chi/chi/v5"
)

type propertyCreateBody struct {
	Name    string            `json:"name"`
	Address *property.Address `json:"address"`
}

type propertyPatchBody struct {
	Name    *string           `json:"name"`
	Address *property.Address `json:"address"`
}

func (s *Server) listProperties(w http.ResponseWriter, r *http.Request) {
	list, err := s.Props.List(r.Context())
	if err != nil {
		handleServiceError(w, r, err)
		return
	}
	out := make([]any, 0, len(list))
	for _, p := range list {
		out = append(out, propertyJSON(&p))
	}
	writeListMeta(w, out)
}

func (s *Server) createProperty(w http.ResponseWriter, r *http.Request) {
	var body propertyCreateBody
	if !decodeJSON(w, r, &body) {
		return
	}
	p, err := s.Props.Create(r.Context(), property.CreateInput{Name: body.Name, Address: body.Address})
	if err != nil {
		handleServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusCreated, map[string]any{"data": propertyJSON(p)})
}

func (s *Server) getProperty(w http.ResponseWriter, r *http.Request) {
	id, ok := parseObjectID(w, r, chi.URLParam(r, "id"))
	if !ok {
		return
	}
	p, err := s.Props.Get(r.Context(), id)
	if err != nil {
		handleServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"data": propertyJSON(p)})
}

func (s *Server) patchProperty(w http.ResponseWriter, r *http.Request) {
	id, ok := parseObjectID(w, r, chi.URLParam(r, "id"))
	if !ok {
		return
	}
	var body propertyPatchBody
	if !decodeJSON(w, r, &body) {
		return
	}
	p, err := s.Props.Update(r.Context(), id, property.UpdateInput{Name: body.Name, Address: body.Address})
	if err != nil {
		handleServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"data": propertyJSON(p)})
}

func (s *Server) deleteProperty(w http.ResponseWriter, r *http.Request) {
	id, ok := parseObjectID(w, r, chi.URLParam(r, "id"))
	if !ok {
		return
	}
	if err := s.Props.Delete(r.Context(), id); err != nil {
		handleServiceError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func propertyJSON(p *property.Doc) map[string]any {
	m := map[string]any{
		"id":        p.ID.Hex(),
		"name":      p.Name,
		"createdAt": p.CreatedAt.UTC().Format("2006-01-02T15:04:05.000Z"),
		"updatedAt": p.UpdatedAt.UTC().Format("2006-01-02T15:04:05.000Z"),
	}
	if p.Address != nil {
		m["address"] = p.Address
	}
	return m
}
