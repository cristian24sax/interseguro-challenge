package validators

import (
	"errors"
	"fmt"
	"math"
)

var (
	// ErrEmptyMatrix is returned when the matrix has no rows.
	ErrEmptyMatrix = errors.New("matrix must not be empty")
	// ErrNonRectangular is returned when row lengths differ.
	ErrNonRectangular = errors.New("matrix must be rectangular")
	// ErrNonNumeric is returned when a value is not a finite number.
	ErrNonNumeric = errors.New("matrix must contain only finite numbers")
)

// ValidateMatrix checks non-empty, rectangular, and numeric constraints.
func ValidateMatrix(m [][]float64) error {
	if len(m) == 0 {
		return ErrEmptyMatrix
	}

	cols := len(m[0])
	if cols == 0 {
		return fmt.Errorf("%w: first row is empty", ErrNonRectangular)
	}

	for i, row := range m {
		if len(row) != cols {
			return fmt.Errorf("%w: row %d has length %d, expected %d", ErrNonRectangular, i, len(row), cols)
		}
		for j, v := range row {
			if math.IsNaN(v) || math.IsInf(v, 0) {
				return fmt.Errorf("%w at (%d,%d)", ErrNonNumeric, i, j)
			}
		}
	}

	return nil
}
