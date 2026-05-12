package httpserver

import (
	"net/http"
	"strings"

	"github.com/jarukit/apartment-system/services/api/internal/authn"
	"github.com/jarukit/apartment-system/services/api/internal/httpx"
	"github.com/jarukit/apartment-system/services/api/internal/jwtx"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (s *Server) bearerAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := r.Header.Get("Authorization")
		if !strings.HasPrefix(strings.ToLower(h), "bearer ") {
			httpx.WriteError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "missing or invalid authorization", nil)
			return
		}
		raw := strings.TrimSpace(h[len("Bearer "):])
		if raw == "" {
			httpx.WriteError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "missing or invalid authorization", nil)
			return
		}
		claims, err := jwtx.ParseAccess(s.JWTSecret, raw)
		if err != nil {
			httpx.WriteError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "invalid or expired access token", nil)
			return
		}
		uid, err := primitiveFromHex(claims.Subject)
		if err != nil {
			httpx.WriteError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "invalid token subject", nil)
			return
		}
		var rid *primitive.ObjectID
		if claims.ResidentID != "" {
			x, err := primitiveFromHex(claims.ResidentID)
			if err == nil {
				rid = &x
			}
		}
		p := &authn.Principal{
			UserID:     uid,
			Email:      claims.Email,
			Roles:      claims.Roles,
			ResidentID: rid,
		}
		next.ServeHTTP(w, r.WithContext(authn.WithPrincipal(r.Context(), p)))
	})
}

func (s *Server) mustRole(roles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			p, ok := authn.PrincipalFrom(r.Context())
			if !ok {
				httpx.WriteError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "not authenticated", nil)
				return
			}
			for _, role := range roles {
				if authn.HasRole(p, role) {
					next.ServeHTTP(w, r)
					return
				}
			}
			httpx.WriteError(w, r, http.StatusForbidden, "FORBIDDEN", "insufficient role", nil)
		})
	}
}

func primitiveFromHex(hex string) (primitive.ObjectID, error) {
	return primitive.ObjectIDFromHex(strings.TrimSpace(hex))
}
