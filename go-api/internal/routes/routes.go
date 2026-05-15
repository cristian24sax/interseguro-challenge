package routes

import (
	"interseguro/go-api/internal/handlers"

	"github.com/gofiber/fiber/v2"
)

// Register mounts versioned API routes on the Fiber app.
func Register(app *fiber.App, qr *handlers.QRHandler) {
	api := app.Group("/api/v1")
	api.Post("/qr-factorization", qr.Factorize)
}
