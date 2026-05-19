//go:build integration

package integration

import (
	"net/http"
	"testing"
)

func TestHealth(t *testing.T) {
	var body struct {
		Status string `json:"status"`
		Mongo  string `json:"mongo"`
	}
	status := getJSON(t, "/health", &body)
	requireStatus(t, status, http.StatusOK, "health")
	if body.Status != "ok" {
		t.Fatalf("health status %q, want ok", body.Status)
	}
	if body.Mongo != "connected" {
		t.Fatalf("mongo %q, want connected", body.Mongo)
	}
}

func TestSitePublic(t *testing.T) {
	var body struct {
		Data struct {
			BuildingName string `json:"buildingName"`
		} `json:"data"`
	}
	status := getJSON(t, "/v1/site", &body)
	requireStatus(t, status, http.StatusOK, "site")
	if body.Data.BuildingName == "" {
		t.Fatal("site: empty buildingName")
	}
}

func TestAdminLoginAndListProperties(t *testing.T) {
	token := loginAdminToken(t)

	var list struct {
		Data []any `json:"data"`
	}
	status := getJSONAuth(t, "/v1/properties", token, &list)
	requireStatus(t, status, http.StatusOK, "list properties")
}
