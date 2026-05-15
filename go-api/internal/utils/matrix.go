package utils

import "gonum.org/v1/gonum/mat"

// DenseToSlice converts a *mat.Dense to a row-major [][]float64.
func DenseToSlice(d *mat.Dense) [][]float64 {
	if d == nil {
		return nil
	}
	r, c := d.Dims()
	out := make([][]float64, r)
	for i := 0; i < r; i++ {
		row := make([]float64, c)
		for j := 0; j < c; j++ {
			row[j] = d.At(i, j)
		}
		out[i] = row
	}
	return out
}
