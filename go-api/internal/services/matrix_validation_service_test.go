package services_test

import (
	"math"
	"testing"

	"interseguro/go-api/internal/services"
)

func TestMatrixValidationService_Validate(t *testing.T) {
	t.Parallel()

	svc := services.NewMatrixValidationService()

	cases := []struct {
		name    string
		matrix  [][]float64
		wantErr bool
	}{
		{name: "ok", matrix: [][]float64{{1, 2}, {3, 4}}, wantErr: false},
		{name: "empty", matrix: [][]float64{}, wantErr: true},
		{name: "jagged", matrix: [][]float64{{1, 2}, {3}}, wantErr: true},
		{name: "nan", matrix: [][]float64{{math.NaN()}}, wantErr: true},
	}

	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			err := svc.Validate(tc.matrix)
			if tc.wantErr && err == nil {
				t.Fatal("expected error")
			}
			if !tc.wantErr && err != nil {
				t.Fatalf("unexpected: %v", err)
			}
			if tc.wantErr && err != nil && !services.IsMatrixValidationError(err) {
				t.Fatalf("expected matrix validation error, got %v", err)
			}
		})
	}
}
