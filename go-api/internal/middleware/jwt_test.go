package middleware_test

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"interseguro/go-api/internal/auth"
	"interseguro/go-api/internal/middleware"
	"interseguro/go-api/internal/models"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

const testSecret = "middleware-test-secret"

func signToken(t *testing.T, username string, expiresAt time.Time) string {
	t.Helper()

	claims := auth.Claims{
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiresAt),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(testSecret))
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}
	return signed
}

func newProtectedApp() *fiber.App {
	app := fiber.New()
	app.Use(middleware.NewJWTAuth(middleware.JWTAuthConfig{Secret: testSecret}))
	app.Get("/protected", func(c *fiber.Ctx) error {
		username, ok := middleware.UsernameFromLocals(c)
		if !ok {
			return c.SendStatus(fiber.StatusInternalServerError)
		}
		return c.JSON(fiber.Map{"username": username})
	})
	return app
}

func TestJWTAuth_RejectsMissingToken(t *testing.T) {
	app := newProtectedApp()

	resp, err := app.Test(httptest.NewRequest(http.MethodGet, "/protected", nil))
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}
	defer resp.Body.Close()

	assertStatus(t, resp, http.StatusUnauthorized)
	assertErrorMessage(t, resp, "Missing access token")
}

func TestJWTAuth_RejectsExpiredToken(t *testing.T) {
	app := newProtectedApp()
	token := signToken(t, "demo", time.Now().Add(-time.Hour))

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set(fiber.HeaderAuthorization, "Bearer "+token)

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}
	defer resp.Body.Close()

	assertStatus(t, resp, http.StatusUnauthorized)
	assertErrorMessage(t, resp, "Access token expired")
}

func TestJWTAuth_AllowsValidToken(t *testing.T) {
	app := newProtectedApp()
	token := signToken(t, "demo", time.Now().Add(time.Hour))

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set(fiber.HeaderAuthorization, "Bearer "+token)

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}
	defer resp.Body.Close()

	assertStatus(t, resp, http.StatusOK)

	var body map[string]string
	decodeJSON(t, resp.Body, &body)
	if body["username"] != "demo" {
		t.Fatalf("username = %q, want demo", body["username"])
	}
}

func assertStatus(t *testing.T, resp *http.Response, want int) {
	t.Helper()
	if resp.StatusCode != want {
		t.Fatalf("status = %d, want %d", resp.StatusCode, want)
	}
}

func assertErrorMessage(t *testing.T, resp *http.Response, want string) {
	t.Helper()
	var body models.ErrorResponse
	decodeJSON(t, resp.Body, &body)
	if body.Message != want {
		t.Fatalf("message = %q, want %q", body.Message, want)
	}
	if body.Success {
		t.Fatal("expected success=false")
	}
}

func decodeJSON(t *testing.T, r io.Reader, dest any) {
	t.Helper()
	if err := json.NewDecoder(r).Decode(dest); err != nil {
		t.Fatalf("decode json: %v", err)
	}
}
