package services

import (
	"fmt"

	"interseguro/go-api/internal/utils"

	"gonum.org/v1/gonum/mat"
)

// QRService performs matrix decompositions using Gonum (LAPACK-backed QR / LQ).
// For A with at least as many rows as columns (m >= n), it uses QR: A = Q * R
// with Q orthogonal and R upper trapezoidal.
// For wide matrices (m < n), Gonum's QR is undefined; the service uses LQ instead
// (A = L * Q with L lower trapezoidal and Q orthogonal n×n) and returns those factors
// as (q, r) = (L, Q) so that A = q * r still holds for downstream consumers.
type QRService struct{}

// NewQRService constructs a QRService.
func NewQRService() *QRService {
	return &QRService{}
}

// Factorize returns matrices q and r such that A = q * r (using QR when m >= n, LQ when m < n).
func (s *QRService) Factorize(matrix [][]float64) (q [][]float64, r [][]float64, err error) {
	if len(matrix) == 0 {
		return nil, nil, fmt.Errorf("empty matrix")
	}
	if len(matrix[0]) == 0 {
		return nil, nil, fmt.Errorf("empty first row")
	}

	a := denseFromRows(matrix)
	rows, cols := a.Dims()

	if rows >= cols {
		var qr mat.QR
		qr.Factorize(a)

		var qDense, rDense mat.Dense
		qr.QTo(&qDense)
		qr.RTo(&rDense)

		return utils.DenseToSlice(&qDense), utils.DenseToSlice(&rDense), nil
	}

	var lq mat.LQ
	lq.Factorize(a)

	var lDense, qDense mat.Dense
	lq.LTo(&lDense)
	lq.QTo(&qDense)

	return utils.DenseToSlice(&lDense), utils.DenseToSlice(&qDense), nil
}

func denseFromRows(matrix [][]float64) *mat.Dense {
	rows, cols := len(matrix), len(matrix[0])
	d := mat.NewDense(rows, cols, nil)
	for i := 0; i < rows; i++ {
		for j := 0; j < cols; j++ {
			d.Set(i, j, matrix[i][j])
		}
	}
	return d
}
