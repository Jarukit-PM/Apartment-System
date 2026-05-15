package httpserver

import (
	"errors"
	"net/http"
	"os"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/jarukit/apartment-system/services/api/internal/httpx"
	"github.com/jarukit/apartment-system/services/api/internal/media"
)

func (s *Server) uploadMedia(w http.ResponseWriter, r *http.Request) {
	if s.Media == nil {
		httpx.WriteError(w, r, http.StatusServiceUnavailable, "UNAVAILABLE", "media storage not configured", nil)
		return
	}
	const maxForm = 6 << 20
	if err := r.ParseMultipartForm(maxForm); err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "invalid multipart form", nil)
		return
	}
	file, hdr, err := r.FormFile("file")
	if err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "file field is required", nil)
		return
	}
	defer file.Close()

	ct := hdr.Header.Get("Content-Type")
	if ct == "" {
		ct = "application/octet-stream"
	}
	url, err := s.Media.Save(file, ct, hdr.Size)
	if err != nil {
		switch {
		case errors.Is(err, media.ErrTooLarge):
			httpx.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "image exceeds size limit", nil)
		case errors.Is(err, media.ErrInvalidType):
			httpx.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "use JPEG, PNG, WebP, or GIF", nil)
		default:
			handleServiceError(w, r, err)
		}
		return
	}
	httpx.WriteJSON(w, http.StatusCreated, map[string]any{"data": map[string]any{"url": url}})
}

func (s *Server) serveMedia(w http.ResponseWriter, r *http.Request) {
	if s.Media == nil {
		http.NotFound(w, r)
		return
	}
	name := strings.TrimSpace(chi.URLParam(r, "filename"))
	if err := s.Media.ServeFile(w, r, name); err != nil {
		if errors.Is(err, os.ErrNotExist) {
			http.NotFound(w, r)
			return
		}
		if errors.Is(err, media.ErrInvalidName) {
			http.NotFound(w, r)
			return
		}
		handleServiceError(w, r, err)
	}
}
