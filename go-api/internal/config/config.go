package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

const (
	defaultPort            = "8080"
	defaultHTTPTimeoutSecs = 30
)

// Config holds runtime configuration loaded from the environment.
type Config struct {
	Port                 string
	NodeAPIURL           string
	NodeStatisticsPath   string
	HTTPClientTimeout    time.Duration
}

// Load reads configuration from environment variables.
func Load() (*Config, error) {
	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}

	nodeURL := os.Getenv("NODE_API_URL")
	statsPath := os.Getenv("NODE_API_STATISTICS_PATH")

	timeout := defaultHTTPTimeoutSecs * time.Second
	if v := os.Getenv("HTTP_CLIENT_TIMEOUT_SECS"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil {
			return nil, fmt.Errorf("HTTP_CLIENT_TIMEOUT_SECS: %w", err)
		}
		if n <= 0 {
			return nil, fmt.Errorf("HTTP_CLIENT_TIMEOUT_SECS must be positive")
		}
		timeout = time.Duration(n) * time.Second
	}

	return &Config{
		Port:               port,
		NodeAPIURL:         nodeURL,
		NodeStatisticsPath: statsPath,
		HTTPClientTimeout:  timeout,
	}, nil
}
