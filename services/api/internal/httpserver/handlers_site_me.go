package httpserver

import (
	"net/http"

	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/jarukit/apartment-system/services/api/internal/authn"
	"github.com/jarukit/apartment-system/services/api/internal/httpx"
	"github.com/jarukit/apartment-system/services/api/internal/invoice"
	"github.com/jarukit/apartment-system/services/api/internal/lease"
	"github.com/jarukit/apartment-system/services/api/internal/maintenance"
	"github.com/jarukit/apartment-system/services/api/internal/resident"
)

func (s *Server) getSite(w http.ResponseWriter, r *http.Request) {
	data := map[string]any{
		"mode":              "single",
		"buildingName":      s.SiteName,
		"defaultPropertyId": nil,
	}
	if !s.DefaultPropertyID.IsZero() {
		data["defaultPropertyId"] = s.DefaultPropertyID.Hex()
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"data": data})
}

func (s *Server) meSummary(w http.ResponseWriter, r *http.Request) {
	p, ok := authn.PrincipalFrom(r.Context())
	if !ok || p.ResidentID == nil {
		httpx.WriteError(w, r, http.StatusForbidden, "FORBIDDEN", "resident profile required", nil)
		return
	}
	res, err := s.Res.Get(r.Context(), *p.ResidentID)
	if err != nil {
		handleServiceError(w, r, err)
		return
	}
	leases, err := s.Leases.ListForResident(r.Context(), *p.ResidentID)
	if err != nil {
		handleServiceError(w, r, err)
		return
	}
	var active *lease.Doc
	for i := range leases {
		if leases[i].Status == lease.StatusActive {
			active = &leases[i]
			break
		}
	}
	ls := make([]any, 0, len(leases))
	unitSeen := make(map[primitive.ObjectID]struct{})
	leaseUnits := make([]any, 0)
	for i := range leases {
		ls = append(ls, leaseJSON(&leases[i]))
		if _, ok := unitSeen[leases[i].UnitID]; ok {
			continue
		}
		unitSeen[leases[i].UnitID] = struct{}{}
		u, err := s.Units.Get(r.Context(), leases[i].UnitID)
		if err != nil {
			continue
		}
		row := map[string]any{
			"unitId": u.ID.Hex(),
			"label":  u.Label,
		}
		if prop, err := s.Props.Get(r.Context(), u.PropertyID); err == nil {
			row["propertyName"] = prop.Name
		}
		leaseUnits = append(leaseUnits, row)
	}
	out := map[string]any{
		"resident":   residentJSON(res),
		"leases":     ls,
		"leaseUnits": leaseUnits,
	}
	if res.PrimaryUnitID != nil {
		u, err := s.Units.Get(r.Context(), *res.PrimaryUnitID)
		if err == nil {
			out["primaryUnit"] = unitJSON(u)
			prop, err := s.Props.Get(r.Context(), u.PropertyID)
			if err == nil {
				out["property"] = propertyJSON(prop)
			}
		}
	}
	if active != nil {
		out["activeLease"] = leaseJSON(active)
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"data": out})
}

type meProfilePatchBody struct {
	FullName *string `json:"fullName"`
	Phone    *string `json:"phone"`
}

func (s *Server) mePatchProfile(w http.ResponseWriter, r *http.Request) {
	p, ok := authn.PrincipalFrom(r.Context())
	if !ok || p.ResidentID == nil {
		httpx.WriteError(w, r, http.StatusForbidden, "FORBIDDEN", "resident profile required", nil)
		return
	}
	var body meProfilePatchBody
	if !decodeJSON(w, r, &body) {
		return
	}
	if body.FullName == nil && body.Phone == nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "at least one of fullName or phone is required", nil)
		return
	}
	d, err := s.Res.UpdateSelfProfile(r.Context(), *p.ResidentID, resident.SelfProfileInput{
		FullName: body.FullName,
		Phone:    body.Phone,
	})
	if err != nil {
		handleServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"data": residentJSON(d)})
}

func (s *Server) meInvoices(w http.ResponseWriter, r *http.Request) {
	p, ok := authn.PrincipalFrom(r.Context())
	if !ok || p.ResidentID == nil {
		httpx.WriteError(w, r, http.StatusForbidden, "FORBIDDEN", "resident profile required", nil)
		return
	}
	list, err := s.Invoice.ListForResident(r.Context(), *p.ResidentID)
	if err != nil {
		handleServiceError(w, r, err)
		return
	}
	out := make([]any, 0, len(list))
	for i := range list {
		out = append(out, invoiceJSON(&list[i]))
	}
	writeListMeta(w, out)
}

func (s *Server) meMaintenanceList(w http.ResponseWriter, r *http.Request) {
	p, ok := authn.PrincipalFrom(r.Context())
	if !ok || p.ResidentID == nil {
		httpx.WriteError(w, r, http.StatusForbidden, "FORBIDDEN", "resident profile required", nil)
		return
	}
	units, err := s.Leases.ActiveUnitIDsForResident(r.Context(), *p.ResidentID)
	if err != nil {
		handleServiceError(w, r, err)
		return
	}
	list, err := s.Maint.ListByResident(r.Context(), units, *p.ResidentID)
	if err != nil {
		handleServiceError(w, r, err)
		return
	}
	out := make([]any, 0, len(list))
	for i := range list {
		out = append(out, maintenanceJSON(&list[i]))
	}
	writeListMeta(w, out)
}

type meMaintCreateBody struct {
	UnitID      string   `json:"unitId"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	ImageURLs   []string `json:"imageUrls"`
}

func (s *Server) meMaintenanceCreate(w http.ResponseWriter, r *http.Request) {
	p, ok := authn.PrincipalFrom(r.Context())
	if !ok || p.ResidentID == nil {
		httpx.WriteError(w, r, http.StatusForbidden, "FORBIDDEN", "resident profile required", nil)
		return
	}
	var body meMaintCreateBody
	if !decodeJSON(w, r, &body) {
		return
	}
	uid, ok := parseObjectID(w, r, body.UnitID)
	if !ok {
		return
	}
	units, err := s.Leases.ActiveUnitIDsForResident(r.Context(), *p.ResidentID)
	if err != nil {
		handleServiceError(w, r, err)
		return
	}
	in := maintenance.CreateInput{
		UnitID:      uid,
		Title:       body.Title,
		Description: body.Description,
		ImageURLs:   body.ImageURLs,
		Status:      maintenance.StatusOpen,
	}
	d, err := s.Maint.CreateForResident(r.Context(), *p.ResidentID, units, in)
	if err != nil {
		handleServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusCreated, map[string]any{"data": maintenanceJSON(d)})
}

func invoiceJSON(d *invoice.Doc) map[string]any {
	m := map[string]any{
		"id":          d.ID.Hex(),
		"leaseId":     d.LeaseID.Hex(),
		"residentId":  d.ResidentID.Hex(),
		"description": d.Description,
		"amount":      d.Amount,
		"currency":    d.Currency,
		"status":      d.Status,
		"dueDate":     d.DueDate.UTC().Format("2006-01-02T15:04:05.000Z"),
		"createdAt":   d.CreatedAt.UTC().Format("2006-01-02T15:04:05.000Z"),
		"updatedAt":   d.UpdatedAt.UTC().Format("2006-01-02T15:04:05.000Z"),
	}
	return m
}
