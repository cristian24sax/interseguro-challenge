package auth_test

import (
	"errors"
	"testing"
	"time"

	"interseguro/go-api/internal/auth"

	"github.com/golang-jwt/jwt/v5"
)

const testSecret = "test-jwt-secret"

func signToken(t *testing.T, secret, username string, expiresAt time.Time) string {
	t.Helper()

	claims := auth.Claims{
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(time.Now().Add(-time.Minute)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}
	return signed
}

func TestExtractBearerToken(t *testing.T) {
	t.Parallel()

	tests := []struct {
		header string
		want   string
	}{
		{"Bearer abc.def.ghi", "abc.def.ghi"},
		{"bearer token-value", "token-value"},
		{"", ""},
		{"Basic abc", ""},
		{"Bearer", ""},
		{"Bearer  spaced  ", "spaced"},
	}

	for _, tc := range tests {
		if got := auth.ExtractBearerToken(tc.header); got != tc.want {
			t.Fatalf("ExtractBearerToken(%q) = %q, want %q", tc.header, got, tc.want)
		}
	}
}

func TestValidateToken(t *testing.T) {
	t.Parallel()

	valid := signToken(t, testSecret, "demo", time.Now().Add(time.Hour))
	expired := signToken(t, testSecret, "demo", time.Now().Add(-time.Hour))

	tests := []struct {
		name    string
		token   string
		secret  string
		wantErr error
		wantSub string
	}{
		{"valid token", valid, testSecret, nil, "demo"},
		{"missing token", "", testSecret, auth.ErrMissingToken, ""},
		{"wrong secret", valid, "other-secret", auth.ErrInvalidToken, ""},
		{"expired token", expired, testSecret, auth.ErrExpiredToken, ""},
		{"malformed token", "not.a.jwt", testSecret, auth.ErrInvalidToken, ""},
	}

	for _, tc := range tests {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			claims, err := auth.ValidateToken(tc.secret, tc.token)
			if tc.wantErr != nil {
				if !errors.Is(err, tc.wantErr) {
					t.Fatalf("ValidateToken() err = %v, want %v", err, tc.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("ValidateToken() unexpected err: %v", err)
			}
			if claims.Username != tc.wantSub {
				t.Fatalf("username = %q, want %q", claims.Username, tc.wantSub)
			}
		})
	}
}
