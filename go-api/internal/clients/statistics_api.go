package clients

import "context"

// StatisticsAPI calls the Node.js statistics service with QR factors.
type StatisticsAPI interface {
	Compute(ctx context.Context, q, r [][]float64) (map[string]any, error)
}
