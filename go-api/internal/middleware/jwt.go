package middleware

import (
	"errors"

	"interseguro/go-api/internal/auth"
	"interseguro/go-api/internal/clients"
	"interseguro/go-api/internal/models"

	"github.com/gofiber/fiber/v2"
)

const (
	localUsername   = "username"
	localBearerToken = "bearerToken"
)

// JWTAuthConfig configures Bearer JWT validation for protected routes.
type JWTAuthConfig struct {
	Secret string
}

// NewJWTAuth returns Fiber middleware that validates HS256 Bearer tokens.
// On success it stores the username in Locals, forwards the token in UserContext
// for downstream HTTP clients, and calls c.Next().
func NewJWTAuth(cfg JWTAuthConfig) fiber.Handler {
	return func(c *fiber.Ctx) error {
		token := auth.ExtractBearerToken(c.Get(fiber.HeaderAuthorization))
		claims, err := auth.ValidateToken(cfg.Secret, token)
		if err != nil {
			return unauthorized(c, err)
		}

		c.Locals(localUsername, claims.Username)
		c.Locals(localBearerToken, token)
		c.SetUserContext(clients.ContextWithBearerToken(c.UserContext(), token))
		return c.Next()
	}
}

// JWTAuth is a convenience wrapper around NewJWTAuth.
func JWTAuth(secret string) fiber.Handler {
	return NewJWTAuth(JWTAuthConfig{Secret: secret})
}

// UsernameFromLocals returns the authenticated username set by JWT middleware.
func UsernameFromLocals(c *fiber.Ctx) (string, bool) {
	username, ok := c.Locals(localUsername).(string)
	return username, ok && username != ""
}

func unauthorized(c *fiber.Ctx, err error) error {
	message := "Unauthorized"
	switch {
	case errors.Is(err, auth.ErrMissingToken):
		message = "Missing access token"
	case errors.Is(err, auth.ErrExpiredToken):
		message = "Access token expired"
	case errors.Is(err, auth.ErrInvalidToken):
		message = "Invalid access token"
	}

	return c.Status(fiber.StatusUnauthorized).JSON(models.ErrorResponse{
		Success: false,
		Message: message,
	})
}
