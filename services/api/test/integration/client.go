//go:build integration

package integration

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"testing"
	"time"
)

func apiBaseURL() string {
	if u := os.Getenv("API_BASE_URL"); u != "" {
		return u
	}
	return "http://localhost:8080"
}

func bootstrapCreds() (email, password string) {
	email = os.Getenv("BOOTSTRAP_ADMIN_EMAIL")
	password = os.Getenv("BOOTSTRAP_ADMIN_PASSWORD")
	if email == "" {
		email = "ci-admin@example.invalid"
	}
	if password == "" {
		password = "ci-test-password-long-enough"
	}
	return email, password
}

func newClient() *http.Client {
	return &http.Client{Timeout: 30 * time.Second}
}

func getJSON(t *testing.T, path string, dest any) int {
	t.Helper()
	req, err := http.NewRequest(http.MethodGet, apiBaseURL()+path, nil)
	if err != nil {
		t.Fatal(err)
	}
	res, err := newClient().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	body, err := io.ReadAll(res.Body)
	if err != nil {
		t.Fatal(err)
	}
	if dest != nil && len(body) > 0 {
		if err := json.Unmarshal(body, dest); err != nil {
			t.Fatalf("decode %s: %v body=%s", path, err, body)
		}
	}
	return res.StatusCode
}

func getJSONAuth(t *testing.T, path, token string, dest any) int {
	t.Helper()
	req, err := http.NewRequest(http.MethodGet, apiBaseURL()+path, nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	res, err := newClient().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	body, err := io.ReadAll(res.Body)
	if err != nil {
		t.Fatal(err)
	}
	if dest != nil && len(body) > 0 {
		if err := json.Unmarshal(body, dest); err != nil {
			t.Fatalf("decode %s: %v body=%s", path, err, body)
		}
	}
	return res.StatusCode
}

func postJSON(t *testing.T, path string, payload any, dest any) int {
	t.Helper()
	b, err := json.Marshal(payload)
	if err != nil {
		t.Fatal(err)
	}
	req, err := http.NewRequest(http.MethodPost, apiBaseURL()+path, bytes.NewReader(b))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")
	res, err := newClient().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	body, err := io.ReadAll(res.Body)
	if err != nil {
		t.Fatal(err)
	}
	if dest != nil && len(body) > 0 {
		if err := json.Unmarshal(body, dest); err != nil {
			t.Fatalf("decode %s: %v body=%s", path, err, body)
		}
	}
	return res.StatusCode
}

func requireStatus(t *testing.T, got, want int, label string) {
	t.Helper()
	if got != want {
		t.Fatalf("%s: status %d, want %d", label, got, want)
	}
}

func loginAdminToken(t *testing.T) string {
	t.Helper()
	email, password := bootstrapCreds()
	var resp struct {
		Data struct {
			AccessToken string `json:"accessToken"`
		} `json:"data"`
	}
	status := postJSON(t, "/v1/auth/login", map[string]string{
		"email":    email,
		"password": password,
	}, &resp)
	requireStatus(t, status, http.StatusOK, "login")
	if resp.Data.AccessToken == "" {
		t.Fatal("login: empty accessToken")
	}
	return resp.Data.AccessToken
}
