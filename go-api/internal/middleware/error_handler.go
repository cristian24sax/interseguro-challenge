package middleware

import (
	"errors"
	"log"
	"runtime/debug"

	"interseguro/go-api/internal/models"

	"github.com/gofiber/fiber/v2"
)

// ErrorHandler returns a Fiber ErrorHandler that responds with the standard JSON error shape.
func ErrorHandler() fiber.ErrorHandler {
	return func(c *fiber.Ctx, err error) error {
		code := fiber.StatusInternalServerError
		var fe *fiber.Error
		if errors.As(err, &fe) {
			code = fe.Code
		}

		if code == fiber.StatusInternalServerError {
			log.Printf("internal error: %v\n%s", err, string(debug.Stack()))
		}

		msg := "Internal server error"
		if fe != nil && fe.Message != "" {
			msg = fe.Message
		} else if err != nil && code != fiber.StatusInternalServerError {
			msg = err.Error()
		}

		return c.Status(code).JSON(models.ErrorResponse{
			Success: false,
			Message: msg,
		})
	}
}
