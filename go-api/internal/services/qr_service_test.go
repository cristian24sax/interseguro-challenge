package services

import (
	"math"
	"testing"

	"gonum.org/v1/gonum/mat"
)

func denseFromSlice(s [][]float64) *mat.Dense {
	return denseFromRows(s)
}

func TestQRService_Factorize_ReconstructsA(t *testing.T) {
	t.Parallel()

	svc := NewQRService()
	cases := []struct {
		name string
		a    [][]float64
	}{
		{name: "square_2x2", a: [][]float64{{1, 2}, {3, 4}}},
		{name: "tall_3x2", a: [][]float64{{1, 2}, {3, 4}, {5, 6}}},
		{name: "wide_2x3", a: [][]float64{{1, 2, 3}, {4, 5, 6}}},
		{name: "single_row", a: [][]float64{{1, 2, 3}}},
		{name: "single_col", a: [][]float64{{1}, {2}, {3}}},
	}

	const tol = 1e-9

	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			a := denseFromRows(tc.a)
			qSl, rSl, err := svc.Factorize(tc.a)
			if err != nil {
				t.Fatal(err)
			}

			q := denseFromSlice(qSl)
			r := denseFromSlice(rSl)

			var prod mat.Dense
			prod.Mul(q, r)

			if !mat.EqualApprox(&prod, a, tol) {
				qr, qc := q.Dims()
				rr, rc := r.Dims()
				ar, ac := a.Dims()
				t.Fatalf("q*r not ≈ A\nq: %dx%d r: %dx%d A: %dx%d", qr, qc, rr, rc, ar, ac)
			}
		})
	}
}

func TestQRService_Factorize_QOrthogonalQR(t *testing.T) {
	t.Parallel()

	svc := NewQRService()
	a := [][]float64{{1, 2}, {3, 4}, {5, 6}}
	qSl, _, err := svc.Factorize(a)
	if err != nil {
		t.Fatal(err)
	}
	q := denseFromSlice(qSl)
	m, k := q.Dims()
	if m != k {
		t.Fatalf("expected square Q from QR, got %dx%d", m, k)
	}

	var qtq mat.Dense
	qtq.Mul(q.T(), q)

	want := mat.NewDense(m, m, nil)
	for i := 0; i < m; i++ {
		want.Set(i, i, 1)
	}

	if !mat.EqualApprox(&qtq, want, 1e-9) {
		t.Fatalf("Q^T Q not identity: got %+v", mat.Formatted(&qtq))
	}
}

func TestQRService_Factorize_RUpperWhenQR(t *testing.T) {
	t.Parallel()

	svc := NewQRService()
	// m > n so Gonum QR applies; R must be upper trapezoidal.
	a := [][]float64{{1, 2}, {3, 4}, {5, 6}}
	_, rSl, err := svc.Factorize(a)
	if err != nil {
		t.Fatal(err)
	}
	rows, cols := len(rSl), len(rSl[0])
	for i := 1; i < rows; i++ {
		for j := 0; j < cols && j < i; j++ {
			if math.Abs(rSl[i][j]) > 1e-9 {
				t.Fatalf("R not upper triangular: R[%d][%d]=%g", i, j, rSl[i][j])
			}
		}
	}
}

func TestQRService_Factorize_WideSecondFactorOrthogonal(t *testing.T) {
	t.Parallel()

	svc := NewQRService()
	wideA := [][]float64{{1, 2, 3}, {4, 5, 6}}
	_, rWide, err := svc.Factorize(wideA)
	if err != nil {
		t.Fatal(err)
	}
	rM := denseFromSlice(rWide)
	rows, cols := rM.Dims()
	if rows != 3 || cols != 3 {
		t.Fatalf("expected 3x3 factor from LQ QTo, got %dx%d", rows, cols)
	}

	var rTr mat.Dense
	rTr.Mul(rM.T(), rM)
	want := mat.NewDense(3, 3, nil)
	for i := 0; i < 3; i++ {
		want.Set(i, i, 1)
	}
	if !mat.EqualApprox(&rTr, want, 1e-9) {
		t.Fatalf("wide-case r (LQ Q) not orthogonal: %+v", mat.Formatted(&rTr))
	}
}

func TestQRService_Factorize_EmptyRejected(t *testing.T) {
	t.Parallel()

	svc := NewQRService()
	_, _, err := svc.Factorize([][]float64{})
	if err == nil {
		t.Fatal("expected error for empty matrix")
	}
}
