package jwtx

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const issuer = "apartment-system-api"

// Claims embedded in access JWT.
type Claims struct {
	jwt.RegisteredClaims
	Email      string   `json:"email,omitempty"`
	Roles      []string `json:"roles,omitempty"`
	ResidentID string   `json:"rid,omitempty"`
}

// SignAccess creates a short-lived HS256 JWT.
func SignAccess(secret []byte, userID primitive.ObjectID, email string, roles []string, residentID *primitive.ObjectID, ttl time.Duration) (string, error) {
	var rid string
	if residentID != nil {
		rid = residentID.Hex()
	}
	now := time.Now().UTC()
	c := Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.Hex(),
			Issuer:    issuer,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
		},
		Email:      email,
		Roles:      roles,
		ResidentID: rid,
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, c)
	return t.SignedString(secret)
}

// ParseAccess validates and parses an access token.
func ParseAccess(secret []byte, tokenString string) (*Claims, error) {
	t, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(t *jwt.Token) (any, error) {
		if t.Method != jwt.SigningMethodHS256 {
			return nil, errors.New("unexpected signing method")
		}
		return secret, nil
	})
	if err != nil {
		return nil, err
	}
	c, ok := t.Claims.(*Claims)
	if !ok || !t.Valid {
		return nil, errors.New("invalid token")
	}
	return c, nil
}
