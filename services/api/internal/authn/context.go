package authn

import (
	"context"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Principal is the authenticated caller attached to request context.
type Principal struct {
	UserID     primitive.ObjectID
	Email      string
	Roles      []string
	ResidentID *primitive.ObjectID
}

type ctxKey struct{}

// principalKey is the context key for Principal.
var principalKey ctxKey

// WithPrincipal returns a child context carrying p.
func WithPrincipal(ctx context.Context, p *Principal) context.Context {
	return context.WithValue(ctx, principalKey, p)
}

// PrincipalFrom returns the principal if present.
func PrincipalFrom(ctx context.Context) (*Principal, bool) {
	v := ctx.Value(principalKey)
	if v == nil {
		return nil, false
	}
	p, ok := v.(*Principal)
	return p, ok && p != nil
}

// HasRole reports whether the principal has the given role.
func HasRole(p *Principal, role string) bool {
	if p == nil {
		return false
	}
	for _, r := range p.Roles {
		if r == role {
			return true
		}
	}
	return false
}
