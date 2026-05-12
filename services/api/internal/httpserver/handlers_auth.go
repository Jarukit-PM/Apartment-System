package httpserver

import (
	"encoding/json"
	"net/http"

	"github.com/jarukit/apartment-system/services/api/internal/authservice"
	"github.com/jarukit/apartment-system/services/api/internal/httpx"
)

type registerResidentBody struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	FullName string `json:"fullName"`
	Phone    string `json:"phone"`
}

type loginBody struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type refreshBody struct {
	RefreshToken string `json:"refreshToken"`
}

type logoutBody struct {
	RefreshToken string `json:"refreshToken"`
}

type oauthGoogleBody struct {
	IDToken string `json:"idToken"`
}

func (s *Server) registerResident(w http.ResponseWriter, r *http.Request) {
	var body registerResidentBody
	if !decodeJSON(w, r, &body) {
		return
	}
	tok, err := s.Auth.RegisterResident(r.Context(), body.Email, body.Password, body.FullName, body.Phone)
	if err != nil {
		writeAuthError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusCreated, map[string]any{"data": tok})
}

func (s *Server) login(w http.ResponseWriter, r *http.Request) {
	var body loginBody
	if !decodeJSON(w, r, &body) {
		return
	}
	tok, err := s.Auth.Login(r.Context(), body.Email, body.Password)
	if err != nil {
		writeAuthError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"data": tok})
}

func (s *Server) refresh(w http.ResponseWriter, r *http.Request) {
	var body refreshBody
	if !decodeJSON(w, r, &body) {
		return
	}
	tok, err := s.Auth.Refresh(r.Context(), body.RefreshToken)
	if err != nil {
		writeAuthError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"data": tok})
}

func (s *Server) logout(w http.ResponseWriter, r *http.Request) {
	var body logoutBody
	dec := json.NewDecoder(r.Body)
	_ = dec.Decode(&body)
	_ = s.Auth.Logout(r.Context(), body.RefreshToken)
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) oauthGoogle(w http.ResponseWriter, r *http.Request) {
	var body oauthGoogleBody
	if !decodeJSON(w, r, &body) {
		return
	}
	tok, err := s.Auth.OAuthGoogle(r.Context(), body.IDToken)
	if err != nil {
		writeAuthError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"data": tok})
}

func writeAuthError(w http.ResponseWriter, r *http.Request, err error) {
	switch err {
	case authservice.ErrInvalidCredentials:
		httpx.WriteError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", err.Error(), nil)
	case authservice.ErrInvalidRefresh:
		httpx.WriteError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", err.Error(), nil)
	case authservice.ErrWeakPassword:
		httpx.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", err.Error(), nil)
	case authservice.ErrEmailTaken:
		httpx.WriteError(w, r, http.StatusConflict, "CONFLICT", err.Error(), nil)
	case authservice.ErrOAuth:
		httpx.WriteError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", err.Error(), nil)
	default:
		handleServiceError(w, r, err)
	}
}
