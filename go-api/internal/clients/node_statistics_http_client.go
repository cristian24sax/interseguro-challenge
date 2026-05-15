package clients

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"

	"interseguro/go-api/internal/models"
)

// Ensure NodeStatisticsHTTPClient implements StatisticsAPI.
var _ StatisticsAPI = (*NodeStatisticsHTTPClient)(nil)

// NodeStatisticsHTTPClient is the HTTP client for the Node.js POST /api/v1/statistics API.
type NodeStatisticsHTTPClient struct {
	baseURL string
	path    string
	client  *http.Client
}

// NewNodeStatisticsHTTPClient returns a client that POSTs JSON to {baseURL}{path}.
// statisticsPath defaults to "/api/v1/statistics" when empty.
func NewNodeStatisticsHTTPClient(baseURL, statisticsPath string, httpClient *http.Client) *NodeStatisticsHTTPClient {
	baseURL = strings.TrimRight(strings.TrimSpace(baseURL), "/")
	path := strings.TrimSpace(statisticsPath)
	if path == "" {
		path = "/api/v1/statistics"
	}
	if !strings.HasPrefix(path, "/") {
		path = "/" + path
	}
	if httpClient == nil {
		httpClient = http.DefaultClient
	}
	return &NodeStatisticsHTTPClient{
		baseURL: baseURL,
		path:    path,
		client:  httpClient,
	}
}

type statisticsEnvelope struct {
	Success bool           `json:"success"`
	Message string         `json:"message"`
	Data    map[string]any `json:"data"`
}

func (c *NodeStatisticsHTTPClient) endpointURL() string {
	return c.baseURL + c.path
}

// Compute posts Q and R to the Node statistics API and returns the "data" object.
func (c *NodeStatisticsHTTPClient) Compute(ctx context.Context, q, r [][]float64) (map[string]any, error) {
	if c.baseURL == "" {
		return nil, fmt.Errorf("NODE_API_URL is not configured")
	}

	body, err := json.Marshal(models.StatisticsRequest{Q: q, R: r})
	if err != nil {
		return nil, err
	}

	url := c.endpointURL()
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	if token := BearerTokenFromContext(ctx); token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("node statistics HTTP request failed: %w", err)
	}
	defer resp.Body.Close()

	log.Printf("node statistics API: POST %s -> %d", url, resp.StatusCode)

	respBody, err := io.ReadAll(io.LimitReader(resp.Body, 8<<20))
	if err != nil {
		return nil, err
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("node statistics API returned status %d: %s", resp.StatusCode, strings.TrimSpace(string(respBody)))
	}

	var env statisticsEnvelope
	if err := json.Unmarshal(respBody, &env); err != nil {
		return nil, fmt.Errorf("invalid node statistics response JSON: %w", err)
	}

	if !env.Success {
		if env.Message == "" {
			return nil, fmt.Errorf("node statistics API reported failure")
		}
		return nil, fmt.Errorf("node statistics API reported failure: %s", env.Message)
	}

	if env.Data == nil {
		return map[string]any{}, nil
	}
	return env.Data, nil
}
