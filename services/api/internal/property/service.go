package property

import (
	"context"
	"errors"
	"strings"

	"github.com/jarukit/apartment-system/services/api/internal/media"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// Service contains property use cases.
type Service struct {
	repo *Repo
	db   func() *mongo.Database
}

// NewService wires a property service.
func NewService(repo *Repo, db func() *mongo.Database) *Service {
	return &Service{repo: repo, db: db}
}

// List returns properties.
func (s *Service) List(ctx context.Context) ([]Doc, error) {
	return s.repo.List(ctx)
}

// Get returns one property.
func (s *Service) Get(ctx context.Context, id primitive.ObjectID) (*Doc, error) {
	return s.repo.Get(ctx, id)
}

// Create validates and inserts.
func (s *Service) Create(ctx context.Context, in CreateInput) (*Doc, error) {
	in.Name = strings.TrimSpace(in.Name)
	if in.Name == "" {
		return nil, errors.New("name is required")
	}
	in.ImageURL = strings.TrimSpace(in.ImageURL)
	if in.ImageURL != "" {
		if err := media.ValidatePublicPath(in.ImageURL); err != nil {
			return nil, err
		}
	}
	return s.repo.Insert(ctx, in)
}

// Update validates and patches.
func (s *Service) Update(ctx context.Context, id primitive.ObjectID, in UpdateInput) (*Doc, error) {
	if in.Name != nil {
		*in.Name = strings.TrimSpace(*in.Name)
		if *in.Name == "" {
			return nil, errors.New("name cannot be empty")
		}
	}
	if in.ImageURL != nil {
		trimmed := strings.TrimSpace(*in.ImageURL)
		in.ImageURL = &trimmed
		if *in.ImageURL != "" {
			if err := media.ValidatePublicPath(*in.ImageURL); err != nil {
				return nil, err
			}
		}
	}
	return s.repo.Update(ctx, id, in)
}

// ErrHasUnits is returned when delete is blocked by child units.
var ErrHasUnits = errors.New("property has units; delete units first")

// Delete removes a property if no units reference it.
func (s *Service) Delete(ctx context.Context, id primitive.ObjectID) error {
	n, err := s.repo.CountUnits(ctx, s.db(), id)
	if err != nil {
		return err
	}
	if n > 0 {
		return ErrHasUnits
	}
	return s.repo.Delete(ctx, id)
}
