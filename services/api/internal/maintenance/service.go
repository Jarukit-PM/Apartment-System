package maintenance

import (
	"context"
	"errors"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// UnitChecker validates unit id.
type UnitChecker interface {
	Exists(ctx context.Context, id primitive.ObjectID) (bool, error)
}

// ResidentChecker optional requester validation.
type ResidentChecker interface {
	Exists(ctx context.Context, id primitive.ObjectID) (bool, error)
}

// Service maintenance use cases.
type Service struct {
	repo     *Repo
	units    UnitChecker
	residents ResidentChecker
}

// NewService constructs service.
func NewService(repo *Repo, units UnitChecker, residents ResidentChecker) *Service {
	return &Service{repo: repo, units: units, residents: residents}
}

func normalizeStatus(s string) string {
	switch strings.TrimSpace(s) {
	case StatusOpen, StatusInProgress, StatusClosed:
		return s
	default:
		return StatusOpen
	}
}

// List requests.
func (s *Service) List(ctx context.Context, unitID *primitive.ObjectID) ([]Doc, error) {
	return s.repo.List(ctx, unitID)
}

// Get one.
func (s *Service) Get(ctx context.Context, id primitive.ObjectID) (*Doc, error) {
	return s.repo.Get(ctx, id)
}

// Create validates and inserts.
func (s *Service) Create(ctx context.Context, in CreateInput) (*Doc, error) {
	ok, err := s.units.Exists(ctx, in.UnitID)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, errors.New("unit not found")
	}
	if in.RequestedByResidentID != nil {
		ok, err := s.residents.Exists(ctx, *in.RequestedByResidentID)
		if err != nil {
			return nil, err
		}
		if !ok {
			return nil, errors.New("requestedBy resident not found")
		}
	}
	in.Title = strings.TrimSpace(in.Title)
	if in.Title == "" {
		return nil, errors.New("title is required")
	}
	now := time.Now().UTC()
	d := &Doc{
		ID:                    primitive.NewObjectID(),
		UnitID:                in.UnitID,
		RequestedByResidentID: in.RequestedByResidentID,
		Title:                 in.Title,
		Description:           strings.TrimSpace(in.Description),
		Status:                normalizeStatus(in.Status),
		CreatedAt:             now,
		UpdatedAt:             now,
	}
	if err := s.repo.Insert(ctx, d); err != nil {
		return nil, err
	}
	return d, nil
}

// Update patches fields.
func (s *Service) Update(ctx context.Context, id primitive.ObjectID, in UpdateInput) (*Doc, error) {
	set := bson.M{}
	if in.Title != nil {
		v := strings.TrimSpace(*in.Title)
		if v == "" {
			return nil, errors.New("title cannot be empty")
		}
		set["title"] = v
	}
	if in.Description != nil {
		set["description"] = strings.TrimSpace(*in.Description)
	}
	if in.Status != nil {
		set["status"] = normalizeStatus(*in.Status)
	}
	if in.RequestedByResidentID != nil {
		ok, err := s.residents.Exists(ctx, *in.RequestedByResidentID)
		if err != nil {
			return nil, err
		}
		if !ok {
			return nil, errors.New("requestedBy resident not found")
		}
		set["requestedByResidentId"] = in.RequestedByResidentID
	}
	if len(set) == 0 {
		return s.repo.Get(ctx, id)
	}
	if err := s.repo.Update(ctx, id, set); err != nil {
		return nil, err
	}
	return s.repo.Get(ctx, id)
}

// Delete removes a request.
func (s *Service) Delete(ctx context.Context, id primitive.ObjectID) error {
	return s.repo.Delete(ctx, id)
}

// ListByResident returns maintenance visible to a resident.
func (s *Service) ListByResident(ctx context.Context, unitIDs []primitive.ObjectID, residentID primitive.ObjectID) ([]Doc, error) {
	return s.repo.ListForResident(ctx, unitIDs, residentID)
}

// CreateForResident submits a ticket for a unit the resident holds under an active lease.
func (s *Service) CreateForResident(ctx context.Context, residentID primitive.ObjectID, allowedUnitIDs []primitive.ObjectID, in CreateInput) (*Doc, error) {
	ok := false
	for _, u := range allowedUnitIDs {
		if u == in.UnitID {
			ok = true
			break
		}
	}
	if !ok {
		return nil, errors.New("unit is not linked to an active lease for this resident")
	}
	rid := residentID
	in.RequestedByResidentID = &rid
	return s.Create(ctx, in)
}
