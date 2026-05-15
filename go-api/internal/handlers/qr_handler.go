package handlers

import (
	"interseguro/go-api/internal/models"
	"interseguro/go-api/internal/services"

	"github.com/gofiber/fiber/v2"
)

// QRHandler exposes HTTP handlers for QR workflows.
type QRHandler struct {
	svc *services.FactorizationService
}

// NewQRHandler constructs a QRHandler.
func NewQRHandler(svc *services.FactorizationService) *QRHandler {
	return &QRHandler{svc: svc}
}

// Factorize handles POST /api/v1/qr-factorization.
func (h *QRHandler) Factorize(c *fiber.Ctx) error {
	var req models.QRFactorizationRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{
			Success: false,
			Message: "Invalid JSON body",
		})
	}

	data, err := h.svc.Process(c.UserContext(), req.Matrix)
	if err != nil {
		if services.IsMatrixValidationError(err) {
			return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse{
				Success: false,
				Message: err.Error(),
			})
		}

		// Downstream / misconfiguration
		return c.Status(fiber.StatusBadGateway).JSON(models.ErrorResponse{
			Success: false,
			Message: "Failed to complete operation with downstream service",
		})
	}

	return c.Status(fiber.StatusOK).JSON(models.SuccessResponse{
		Success: true,
		Message: "Operation completed",
		Data:    *data,
	})
}
