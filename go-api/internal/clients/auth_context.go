package clients

import "context"

type bearerTokenKey struct{}

func ContextWithBearerToken(ctx context.Context, token string) context.Context {
	return context.WithValue(ctx, bearerTokenKey{}, token)
}

func BearerTokenFromContext(ctx context.Context) string {
	if ctx == nil {
		return ""
	}
	token, _ := ctx.Value(bearerTokenKey{}).(string)
	return token
}
