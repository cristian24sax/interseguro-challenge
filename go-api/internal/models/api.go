package models

// QRFactorizationRequest is the body for POST /api/v1/qr-factorization.
type QRFactorizationRequest struct {
	Matrix [][]float64 `json:"matrix"`
}

// QRFactorizationPayload is the success payload under "data".
type QRFactorizationPayload struct {
	Q           [][]float64    `json:"q"`
	R           [][]float64    `json:"r"`
	Statistics  map[string]any `json:"statistics"`
}

// SuccessResponse matches the API standard for successful operations.
type SuccessResponse struct {
	Success bool                   `json:"success"`
	Message string                 `json:"message"`
	Data    QRFactorizationPayload `json:"data"`
}

// ErrorResponse matches the API standard for errors.
type ErrorResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

// StatisticsRequest is the JSON body sent to the Node.js statistics API.
type StatisticsRequest struct {
	Q [][]float64 `json:"q"`
	R [][]float64 `json:"r"`
}
