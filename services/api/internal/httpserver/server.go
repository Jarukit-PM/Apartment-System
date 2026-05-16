package httpserver

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/jarukit/apartment-system/services/api/internal/authservice"
	"github.com/jarukit/apartment-system/services/api/internal/httpx"
	"github.com/jarukit/apartment-system/services/api/internal/invoice"
	"github.com/jarukit/apartment-system/services/api/internal/lease"
	"github.com/jarukit/apartment-system/services/api/internal/maintenance"
	"github.com/jarukit/apartment-system/services/api/internal/media"
	"github.com/jarukit/apartment-system/services/api/internal/property"
	"github.com/jarukit/apartment-system/services/api/internal/resident"
	"github.com/jarukit/apartment-system/services/api/internal/unit"
	"github.com/jarukit/apartment-system/services/api/internal/user"
	"github.com/jarukit/apartment-system/services/api/internal/wallet"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// Server exposes /v1 REST handlers.
type Server struct {
	Props             *property.Service
	Units             *unit.Service
	Res               *resident.Service
	Leases            *lease.Service
	Maint             *maintenance.Service
	Auth              *authservice.Service
	JWTSecret         []byte
	DefaultPropertyID primitive.ObjectID
	SiteName          string
	Invoice           *invoice.Service
	Wallet            *wallet.Service
	Media             *media.Store
}

// NewServer constructs a Server with domain and auth dependencies.
func NewServer(
	p *property.Service,
	u *unit.Service,
	res *resident.Service,
	l *lease.Service,
	m *maintenance.Service,
	auth *authservice.Service,
	jwtSecret []byte,
	defaultPropertyID primitive.ObjectID,
	siteName string,
	inv *invoice.Service,
	w *wallet.Service,
	mediaStore *media.Store,
) *Server {
	return &Server{
		Props:             p,
		Units:             u,
		Res:               res,
		Leases:            l,
		Maint:             m,
		Auth:              auth,
		JWTSecret:         jwtSecret,
		DefaultPropertyID: defaultPropertyID,
		SiteName:          siteName,
		Invoice:           inv,
		Wallet:            w,
		Media:             mediaStore,
	}
}

// Mount registers versioned routes on r (caller mounts at / or prefixes).
func (s *Server) Mount(r chi.Router) {
	if s.Media != nil {
		r.Get("/media/{filename}", s.serveMedia)
	}

	r.Get("/v1/site", s.getSite)

	r.Route("/v1/auth", func(r chi.Router) {
		r.Post("/register-resident", s.registerResident)
		r.Post("/login", s.login)
		r.Post("/refresh", s.refresh)
		r.Post("/logout", s.logout)
		r.Post("/oauth/google", s.oauthGoogle)
	})

	r.Route("/v1", func(r chi.Router) {
		r.Use(s.bearerAuth)

		r.Get("/wallet", s.walletGet)
		r.Post("/wallet/top-ups", s.walletTopUp)
		r.Post("/wallet/transfers", s.walletTransfer)

		r.Route("/me", func(r chi.Router) {
			r.Use(s.mustRole(user.RoleResident))
			r.Get("/summary", s.meSummary)
			r.Patch("/profile", s.mePatchProfile)
			r.Get("/available-units", s.meAvailableUnits)
			r.Post("/leases", s.meCreateLease)
			r.Get("/invoices", s.meInvoices)
			r.Get("/maintenance-requests", s.meMaintenanceList)
			r.Post("/maintenance-requests", s.meMaintenanceCreate)
		})

		r.Group(func(r chi.Router) {
			r.Use(s.mustRole(user.RoleAdmin))
			r.Post("/invoices", s.createInvoice)

			r.Get("/properties", s.listProperties)
			r.Post("/properties", s.createProperty)
			r.Get("/properties/{id}", s.getProperty)
			r.Patch("/properties/{id}", s.patchProperty)
			r.Delete("/properties/{id}", s.deleteProperty)

			r.Post("/media", s.uploadMedia)

			r.Get("/units", s.listUnits)
			r.Post("/units", s.createUnit)
			r.Get("/units/{id}", s.getUnit)
			r.Patch("/units/{id}", s.patchUnit)
			r.Delete("/units/{id}", s.deleteUnit)

			r.Get("/residents", s.listResidents)
			r.Post("/residents", s.createResident)
			r.Get("/residents/{id}", s.getResident)
			r.Patch("/residents/{id}", s.patchResident)
			r.Delete("/residents/{id}", s.deleteResident)

			r.Get("/leases", s.listLeases)
			r.Post("/leases", s.createLease)
			r.Get("/leases/{id}", s.getLease)
			r.Patch("/leases/{id}", s.patchLease)
			r.Delete("/leases/{id}", s.deleteLease)

			r.Get("/maintenance-requests", s.listMaintenance)
			r.Post("/maintenance-requests", s.createMaintenance)
			r.Get("/maintenance-requests/{id}", s.getMaintenance)
			r.Patch("/maintenance-requests/{id}", s.patchMaintenance)
			r.Delete("/maintenance-requests/{id}", s.deleteMaintenance)
		})
	})
}

func parseObjectID(w http.ResponseWriter, r *http.Request, hex string) (primitive.ObjectID, bool) {
	id, err := primitive.ObjectIDFromHex(strings.TrimSpace(hex))
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "invalid id", nil)
		return primitive.NilObjectID, false
	}
	return id, true
}

func writeListMeta(w http.ResponseWriter, data any) {
	httpx.WriteJSON(w, http.StatusOK, map[string]any{
		"data": data,
		"meta": map[string]any{"nextCursor": nil},
	})
}

func handleServiceError(w http.ResponseWriter, r *http.Request, err error) {
	if err == nil {
		return
	}
	status, code, msg := classifyError(err)
	if status >= http.StatusInternalServerError {
		slog.Error("handler error", "error", err)
		msg = "unexpected server error"
	}
	httpx.WriteError(w, r, status, code, msg, nil)
}

func classifyError(err error) (status int, code string, message string) {
	if mongo.IsDuplicateKeyError(err) {
		return http.StatusConflict, "CONFLICT", "duplicate key"
	}
	switch {
	case errors.Is(err, property.ErrNotFound),
		errors.Is(err, unit.ErrNotFound),
		errors.Is(err, resident.ErrNotFound),
		errors.Is(err, lease.ErrNotFound),
		errors.Is(err, maintenance.ErrNotFound),
		errors.Is(err, invoice.ErrNotFound):
		return http.StatusNotFound, "NOT_FOUND", err.Error()
	case errors.Is(err, property.ErrHasUnits),
		errors.Is(err, unit.ErrActiveLease),
		errors.Is(err, resident.ErrActiveLease),
		errors.Is(err, lease.ErrConflict),
		errors.Is(err, lease.ErrDeleteActive):
		return http.StatusConflict, "CONFLICT", err.Error()
	case errors.Is(err, lease.ErrInvalidResidents),
		errors.Is(err, lease.ErrUnitMissing),
		errors.Is(err, lease.ErrSelfServiceInvalidDates),
		errors.Is(err, lease.ErrSelfServiceUnknownPeriod),
		errors.Is(err, lease.ErrSelfServicePeriodNotOffered),
		errors.Is(err, lease.ErrSelfServicePeriodRequired):
		return http.StatusBadRequest, "VALIDATION_ERROR", err.Error()
	case errors.Is(err, lease.ErrInsufficientWalletForFirstRent):
		return http.StatusPaymentRequired, "PAYMENT_REQUIRED", err.Error()
	case errors.Is(err, lease.ErrInvalidRentAmount):
		return http.StatusBadRequest, "VALIDATION_ERROR", err.Error()
	case errors.Is(err, lease.ErrResidentAlreadyLeasing),
		errors.Is(err, lease.ErrSelfServiceUnitUnavailable):
		return http.StatusConflict, "CONFLICT", err.Error()
	case errors.Is(err, wallet.ErrInsufficientFunds):
		return http.StatusConflict, "CONFLICT", err.Error()
	case errors.Is(err, wallet.ErrRecipientNotFound):
		return http.StatusNotFound, "NOT_FOUND", err.Error()
	case errors.Is(err, wallet.ErrSelfTransfer),
		errors.Is(err, wallet.ErrInvalidAmount):
		return http.StatusBadRequest, "VALIDATION_ERROR", err.Error()
	default:
		return http.StatusBadRequest, "VALIDATION_ERROR", err.Error()
	}
}

func decodeJSON(w http.ResponseWriter, r *http.Request, dst any) bool {
	const maxBytes = 1 << 20 // 1 MiB
	raw, err := io.ReadAll(io.LimitReader(r.Body, maxBytes+1))
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "could not read request body: "+err.Error(), nil)
		return false
	}
	if len(raw) > maxBytes {
		httpx.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "request body too large", nil)
		return false
	}
	raw = bytes.TrimSpace(raw)
	if len(raw) == 0 {
		httpx.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "empty request body", nil)
		return false
	}

	dec := json.NewDecoder(bytes.NewReader(raw))
	dec.DisallowUnknownFields()
	if err := dec.Decode(dst); err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "invalid JSON: "+err.Error(), nil)
		return false
	}
	if off := dec.InputOffset(); off < int64(len(raw)) {
		if len(bytes.TrimSpace(raw[int(off):])) > 0 {
			httpx.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "trailing data after JSON value", nil)
			return false
		}
	}
	return true
}
