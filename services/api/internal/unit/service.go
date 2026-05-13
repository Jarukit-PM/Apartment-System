package unit

import (
	"context"
	"errors"
	"strings"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// PropertyChecker verifies a property exists before creating a unit.
type PropertyChecker interface {
	Exists(ctx context.Context, id primitive.ObjectID) (bool, error)
}

// Service unit use cases.
type Service struct {
	repo     *Repo
	db       func() *mongo.Database
	property PropertyChecker
}

// NewService constructs the service.
func NewService(repo *Repo, db func() *mongo.Database, property PropertyChecker) *Service {
	return &Service{repo: repo, db: db, property: property}
}

func normalizeStatus(s string) string {
	switch strings.TrimSpace(s) {
	case StatusOccupied, StatusMaintenance, StatusVacant:
		return s
	default:
		return StatusVacant
	}
}

// List units.
func (s *Service) List(ctx context.Context, propertyID *primitive.ObjectID) ([]Doc, error) {
	return s.repo.List(ctx, propertyID)
}

// ListAvailableForSelfService lists bookable vacant units for the resident catalog.
func (s *Service) ListAvailableForSelfService(ctx context.Context, propertyID *primitive.ObjectID) ([]Doc, error) {
	return s.repo.ListAvailableForSelfService(ctx, propertyID)
}

// Get one unit.
func (s *Service) Get(ctx context.Context, id primitive.ObjectID) (*Doc, error) {
	return s.repo.Get(ctx, id)
}

// Create validates parent property exists and inserts.
func (s *Service) Create(ctx context.Context, in CreateInput) (*Doc, error) {
	in.Label = strings.TrimSpace(in.Label)
	if in.Label == "" {
		return nil, errors.New("label is required")
	}
	ok, err := s.property.Exists(ctx, in.PropertyID)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, errors.New("property not found")
	}
	in.Status = normalizeStatus(in.Status)
	in.ListingRent = normalizeListingRentPtr(in.ListingRent)
	offers, err := NormalizeRentalPeriodOffers(in.RentalPeriodOffers)
	if err != nil {
		return nil, err
	}
	in.RentalPeriodOffers = offers
	return s.repo.Insert(ctx, in)
}

// Update validates.
func (s *Service) Update(ctx context.Context, id primitive.ObjectID, in UpdateInput) (*Doc, error) {
	if in.Label != nil {
		*in.Label = strings.TrimSpace(*in.Label)
		if *in.Label == "" {
			return nil, errors.New("label cannot be empty")
		}
	}
	if in.Status != nil {
		st := normalizeStatus(*in.Status)
		in.Status = &st
	}
	if in.ListingRent != nil {
		nr := normalizeListingRentPtr(in.ListingRent)
		in.ListingRent = nr
	}
	if in.RentalPeriodOffers != nil {
		offers, err := NormalizeRentalPeriodOffers(*in.RentalPeriodOffers)
		if err != nil {
			return nil, err
		}
		in.RentalPeriodOffers = &offers
	}
	return s.repo.Update(ctx, id, in)
}

func normalizeListingRentPtr(lr *ListingRent) *ListingRent {
	if lr == nil {
		return nil
	}
	out := *lr
	if strings.TrimSpace(out.Currency) == "" {
		out.Currency = "THB"
	}
	if out.Amount < 0 {
		out.Amount = 0
	}
	return &out
}

// ErrActiveLease blocks delete when an active lease exists.
var ErrActiveLease = errors.New("unit has an active lease")

// Delete removes unit if no active lease.
func (s *Service) Delete(ctx context.Context, id primitive.ObjectID) error {
	n, err := s.repo.CountActiveLeases(ctx, s.db(), id)
	if err != nil {
		return err
	}
	if n > 0 {
		return ErrActiveLease
	}
	return s.repo.Delete(ctx, id)
}

// SetStatus updates occupancy status (used by lease service).
func (s *Service) SetStatus(ctx context.Context, id primitive.ObjectID, status string) error {
	return s.repo.SetStatus(ctx, id, normalizeStatus(status))
}
