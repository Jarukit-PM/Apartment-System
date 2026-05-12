package user

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// RoleAdmin is the building administrator role.
const RoleAdmin = "admin"

// RoleResident is the tenant / occupant role.
const RoleResident = "resident"

// RoleStaff is reserved for future staff workflows.
const RoleStaff = "staff"

// Doc is a user account (login identity).
type Doc struct {
	ID           primitive.ObjectID  `bson:"_id,omitempty"`
	Email        string              `bson:"email"`
	PasswordHash string              `bson:"passwordHash,omitempty"`
	GoogleSub    string              `bson:"googleSub,omitempty"`
	Roles        []string            `bson:"roles"`
	ResidentID   *primitive.ObjectID `bson:"residentId,omitempty"`
	CreatedAt    time.Time           `bson:"createdAt"`
	UpdatedAt    time.Time           `bson:"updatedAt"`
}
