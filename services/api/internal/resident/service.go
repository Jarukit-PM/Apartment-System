package resident

import (
	"context"
	"errors"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// UnitChecker optional primary unit validation.
type UnitChecker interface {
	Exists(ctx context.Context, id primitive.ObjectID) (bool, error)
}

// Service resident use cases.
type Service struct {
	repo *Repo
	db   func() *mongo.Database
	unit UnitChecker
}

// NewService constructs service.
func NewService(repo *Repo, db func() *mongo.Database, unit UnitChecker) *Service {
	return &Service{repo: repo, db: db, unit: unit}
}

// List residents.
func (s *Service) List(ctx context.Context) ([]Doc, error) {
	return s.repo.List(ctx)
}

// Get one.
func (s *Service) Get(ctx context.Context, id primitive.ObjectID) (*Doc, error) {
	return s.repo.Get(ctx, id)
}

// Create validates and inserts.
func (s *Service) Create(ctx context.Context, in CreateInput) (*Doc, error) {
	in.FullName = strings.TrimSpace(in.FullName)
	in.Email = strings.TrimSpace(strings.ToLower(in.Email))
	in.Phone = strings.TrimSpace(in.Phone)
	if in.FullName == "" {
		return nil, errors.New("fullName is required")
	}
	if in.Email == "" {
		return nil, errors.New("email is required")
	}
	if in.PrimaryUnitID != nil {
		ok, err := s.unit.Exists(ctx, *in.PrimaryUnitID)
		if err != nil {
			return nil, err
		}
		if !ok {
			return nil, errors.New("primary unit not found")
		}
	}
	now := time.Now().UTC()
	d := Doc{
		ID:            primitive.NewObjectID(),
		FullName:      in.FullName,
		Email:         in.Email,
		Phone:         in.Phone,
		PrimaryUnitID: in.PrimaryUnitID,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
	return s.repo.Insert(ctx, d)
}

// Update validates and patches.
func (s *Service) Update(ctx context.Context, id primitive.ObjectID, in UpdateInput) (*Doc, error) {
	set := bson.M{}
	if in.FullName != nil {
		v := strings.TrimSpace(*in.FullName)
		if v == "" {
			return nil, errors.New("fullName cannot be empty")
		}
		set["fullName"] = v
	}
	if in.Email != nil {
		v := strings.TrimSpace(strings.ToLower(*in.Email))
		if v == "" {
			return nil, errors.New("email cannot be empty")
		}
		set["email"] = v
	}
	if in.Phone != nil {
		set["phone"] = strings.TrimSpace(*in.Phone)
	}
	if in.PrimaryUnitID != nil {
		ok, err := s.unit.Exists(ctx, *in.PrimaryUnitID)
		if err != nil {
			return nil, err
		}
		if !ok {
			return nil, errors.New("primary unit not found")
		}
		set["primaryUnitId"] = in.PrimaryUnitID
	}
	if len(set) == 0 {
		return s.repo.Get(ctx, id)
	}
	return s.repo.Update(ctx, id, set)
}

// ErrActiveLease when delete blocked.
var ErrActiveLease = errors.New("resident is on an active lease")

// Delete if not on active lease.
func (s *Service) Delete(ctx context.Context, id primitive.ObjectID) error {
	on, err := s.repo.InActiveLease(ctx, s.db(), id)
	if err != nil {
		return err
	}
	if on {
		return ErrActiveLease
	}
	return s.repo.Delete(ctx, id)
}
