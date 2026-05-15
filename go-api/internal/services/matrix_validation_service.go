package services

import (
	"errors"

	"interseguro/go-api/internal/validators"
)

// MatrixValidationService validates matrix payloads before QR or downstream calls.
type MatrixValidationService struct{}

// NewMatrixValidationService constructs a MatrixValidationService.
func NewMatrixValidationService() *MatrixValidationService {
	return &MatrixValidationService{}
}

// Validate checks that the matrix is non-empty, rectangular, and contains only finite numbers.
func (s *MatrixValidationService) Validate(matrix [][]float64) error {
	return validators.ValidateMatrix(matrix)
}

// IsMatrixValidationError reports whether err is a matrix validation failure from Validate.
func IsMatrixValidationError(err error) bool {
	return errors.Is(err, validators.ErrEmptyMatrix) ||
		errors.Is(err, validators.ErrNonRectangular) ||
		errors.Is(err, validators.ErrNonNumeric)
}
