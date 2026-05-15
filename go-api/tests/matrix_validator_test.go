package tests

import (
	"math"
	"testing"

	"interseguro/go-api/internal/validators"
)

func TestValidateMatrix(t *testing.T) {
	t.Parallel()

	cases := []struct {
		name    string
		matrix  [][]float64
		wantErr bool
	}{
		{name: "valid", matrix: [][]float64{{1, 2}, {3, 4}}, wantErr: false},
		{name: "empty_rows", matrix: [][]float64{}, wantErr: true},
		{name: "empty_first_row", matrix: [][]float64{{}}, wantErr: true},
		{name: "non_rectangular", matrix: [][]float64{{1, 2}, {3}}, wantErr: true},
		{name: "nan", matrix: [][]float64{{1, 2}, {3, math.NaN()}}, wantErr: true},
	}

	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			err := validators.ValidateMatrix(tc.matrix)
			if tc.wantErr && err == nil {
				t.Fatalf("expected error")
			}
			if !tc.wantErr && err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
		})
	}
}
