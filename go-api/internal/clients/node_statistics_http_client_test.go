package clients_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"interseguro/go-api/internal/clients"
)

func TestNodeStatisticsHTTPClient_Compute(t *testing.T) {
	t.Parallel()

	const wantSum = 42.0
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/v1/statistics" {
			t.Fatalf("path %q", r.URL.Path)
		}
		if r.Method != http.MethodPost {
			t.Fatalf("method %s", r.Method)
		}
		_ = json.NewEncoder(w).Encode(map[string]any{
			"success": true,
			"message": "ok",
			"data":    map[string]any{"sum": wantSum},
		})
	}))
	t.Cleanup(srv.Close)

	c := clients.NewNodeStatisticsHTTPClient(srv.URL, "", srv.Client())
	out, err := c.Compute(context.Background(), [][]float64{{1}}, [][]float64{{2}})
	if err != nil {
		t.Fatal(err)
	}
	if v, ok := out["sum"].(float64); !ok || v != wantSum {
		t.Fatalf("sum: %#v", out["sum"])
	}
}

func TestNodeStatisticsHTTPClient_CustomPath(t *testing.T) {
	t.Parallel()

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/custom/stats" {
			t.Fatalf("path %q", r.URL.Path)
		}
		_ = json.NewEncoder(w).Encode(map[string]any{"success": true, "data": map[string]any{}})
	}))
	t.Cleanup(srv.Close)

	c := clients.NewNodeStatisticsHTTPClient(srv.URL, "/custom/stats", srv.Client())
	_, err := c.Compute(context.Background(), [][]float64{{1}}, [][]float64{{1}})
	if err != nil {
		t.Fatal(err)
	}
}

func TestNodeStatisticsHTTPClient_MissingBaseURL(t *testing.T) {
	t.Parallel()

	c := clients.NewNodeStatisticsHTTPClient("", "", http.DefaultClient)
	_, err := c.Compute(context.Background(), [][]float64{{1}}, [][]float64{{1}})
	if err == nil {
		t.Fatal("expected error")
	}
}
