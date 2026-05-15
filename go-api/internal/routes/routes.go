package routes

import (
	"interseguro/go-api/internal/handlers"
	"interseguro/go-api/internal/middleware"

	"github.com/gofiber/fiber/v2"
)

// Register mounts versioned API routes on the Fiber app.
func Register(app *fiber.App, jwtSecret string, qr *handlers.QRHandler) {
	app.Get("/health", health)

	protected := middleware.NewJWTAuth(middleware.JWTAuthConfig{Secret: jwtSecret})
	api := app.Group("/api/v1", protected)
	api.Post("/qr-factorization", qr.Factorize)
}

func health(c *fiber.Ctx) error {
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "ok",
	})
}
