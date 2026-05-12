package httpx

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5/middleware"
)

// FieldDetail describes a single validation issue.
type FieldDetail struct {
	Field  string `json:"field"`
	Issue  string `json:"issue"`
}

// WriteError writes the standard API error envelope (docs/api-overview.md).
func WriteError(w http.ResponseWriter, r *http.Request, status int, code, message string, details []FieldDetail) {
	rid := middleware.GetReqID(r.Context())
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"error": map[string]any{
			"code":      code,
			"message":   message,
			"details":   details,
			"requestId": rid,
		},
	})
}

// WriteJSON writes a JSON response with the given status.
func WriteJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
