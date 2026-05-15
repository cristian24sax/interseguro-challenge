package services

import (
	"context"

	"interseguro/go-api/internal/clients"
	"interseguro/go-api/internal/models"
)

// FactorizationService orchestrates validation, QR factorization, and downstream statistics.
type FactorizationService struct {
	matrix *MatrixValidationService
	qr     *QRService
	stats  clients.StatisticsAPI
}

// NewFactorizationService wires domain services and external clients.
func NewFactorizationService(matrix *MatrixValidationService, qr *QRService, stats clients.StatisticsAPI) *FactorizationService {
	return &FactorizationService{matrix: matrix, qr: qr, stats: stats}
}

// Process validates the matrix, computes QR, and merges statistics from Node.
func (s *FactorizationService) Process(ctx context.Context, matrix [][]float64) (*models.QRFactorizationPayload, error) {
	if err := s.matrix.Validate(matrix); err != nil {
		return nil, err
	}

	q, r, err := s.qr.Factorize(matrix)
	if err != nil {
		return nil, err
	}

	stats, err := s.stats.Compute(ctx, q, r)
	if err != nil {
		return nil, err
	}

	return &models.QRFactorizationPayload{
		Q:          q,
		R:          r,
		Statistics: stats,
	}, nil
}
