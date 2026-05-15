package main

import (
	"log"
	"net/http"
	"os"

	"interseguro/go-api/internal/clients"
	"interseguro/go-api/internal/config"
	"interseguro/go-api/internal/handlers"
	"interseguro/go-api/internal/middleware"
	"interseguro/go-api/internal/routes"
	"interseguro/go-api/internal/services"
    "github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	httpClient := &http.Client{Timeout: cfg.HTTPClientTimeout}
	statsClient := clients.NewNodeStatisticsHTTPClient(cfg.NodeAPIURL, cfg.NodeStatisticsPath, httpClient)

	matrixValidation := services.NewMatrixValidationService()
	qrSvc := services.NewQRService()
	factorSvc := services.NewFactorizationService(matrixValidation, qrSvc, statsClient)
	qrHandler := handlers.NewQRHandler(factorSvc)

	app := fiber.New(fiber.Config{
		AppName:      "interseguro-go-api",
		ErrorHandler: middleware.ErrorHandler(),
	})
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
	}))
	app.Use(recover.New())
	app.Use(middleware.RequestLogger())
	routes.Register(app, cfg.JWTSecret, qrHandler)

	addr := ":" + cfg.Port
	log.Printf("listening on %s", addr)
	if err := app.Listen(addr); err != nil {
		log.Printf("server stopped: %v", err)
		os.Exit(1)
	}
}
