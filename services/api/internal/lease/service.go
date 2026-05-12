package lease

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/jarukit/apartment-system/services/api/internal/unit"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// UnitPartner reads and updates unit occupancy for lease rules.
type UnitPartner interface {
	Get(ctx context.Context, id primitive.ObjectID) (*unit.Doc, error)
	SetStatus(ctx context.Context, id primitive.ObjectID, status string) error
}

// ResidentCounter validates resident references.
type ResidentCounter interface {
	CountByIDs(ctx context.Context, ids []primitive.ObjectID) (int64, error)
}

// Service applies lease rules (one active lease per unit).
type Service struct {
	repo      *Repo
	units     UnitPartner
	residents ResidentCounter
}

// NewService constructs the lease service.
func NewService(repo *Repo, units UnitPartner, residents ResidentCounter) *Service {
	return &Service{repo: repo, units: units, residents: residents}
}

func normalizeStatus(s string) string {
	switch strings.TrimSpace(s) {
	case StatusDraft, StatusActive, StatusEnded:
		return s
	default:
		return StatusDraft
	}
}

func normalizeRent(r Rent) Rent {
	if strings.TrimSpace(r.Currency) == "" {
		r.Currency = "THB"
	}
	if r.Amount < 0 {
		r.Amount = 0
	}
	return r
}

// ErrConflict when a second active lease would exist.
var ErrConflict = errors.New("unit already has an active lease")

// ErrInvalidResidents when resident ids are missing or unknown.
var ErrInvalidResidents = errors.New("residentIds must reference existing residents")

// ErrUnitMissing when unit does not exist.
var ErrUnitMissing = errors.New("unit not found")

// ErrDeleteActive blocks deleting an active lease.
var ErrDeleteActive = errors.New("cannot delete an active lease; end it first")

// List leases.
func (s *Service) List(ctx context.Context, unitID *primitive.ObjectID) ([]Doc, error) {
	return s.repo.List(ctx, unitID)
}

// Get returns one lease.
func (s *Service) Get(ctx context.Context, id primitive.ObjectID) (*Doc, error) {
	return s.repo.Get(ctx, id)
}

// Create validates and inserts, updating unit status when lease is active.
func (s *Service) Create(ctx context.Context, in CreateInput) (*Doc, error) {
	if len(in.ResidentIDs) == 0 {
		return nil, errors.New("at least one residentId is required")
	}
	n, err := s.residents.CountByIDs(ctx, in.ResidentIDs)
	if err != nil {
		return nil, err
	}
	if int(n) != len(in.ResidentIDs) {
		return nil, ErrInvalidResidents
	}
	if _, err := s.units.Get(ctx, in.UnitID); err != nil {
		if errors.Is(err, unit.ErrNotFound) {
			return nil, ErrUnitMissing
		}
		return nil, err
	}
	st := normalizeStatus(in.Status)
	rent := normalizeRent(in.Rent)
	now := time.Now().UTC()
	d := &Doc{
		ID:          primitive.NewObjectID(),
		UnitID:      in.UnitID,
		ResidentIDs: in.ResidentIDs,
		StartDate:   in.StartDate.UTC(),
		EndDate:     cloneTimePtr(in.EndDate),
		Status:      st,
		Rent:        rent,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	if st == StatusActive {
		other, err := s.repo.CountActiveOtherThan(ctx, in.UnitID, primitive.NilObjectID)
		if err != nil {
			return nil, err
		}
		if other > 0 {
			return nil, ErrConflict
		}
	}
	if err := s.repo.Insert(ctx, d); err != nil {
		return nil, err
	}
	if st == StatusActive {
		if err := s.units.SetStatus(ctx, in.UnitID, unit.StatusOccupied); err != nil {
			_ = s.repo.Delete(ctx, d.ID)
			return nil, err
		}
	}
	return d, nil
}

// Update merges and applies status / occupancy side effects.
func (s *Service) Update(ctx context.Context, id primitive.ObjectID, in UpdateInput) (*Doc, error) {
	cur, err := s.repo.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	prev := *cur
	if in.ResidentIDs != nil {
		if len(*in.ResidentIDs) == 0 {
			return nil, errors.New("at least one residentId is required")
		}
		n, err := s.residents.CountByIDs(ctx, *in.ResidentIDs)
		if err != nil {
			return nil, err
		}
		if int(n) != len(*in.ResidentIDs) {
			return nil, ErrInvalidResidents
		}
		cur.ResidentIDs = *in.ResidentIDs
	}
	if in.StartDate != nil {
		cur.StartDate = in.StartDate.UTC()
	}
	if in.EndDate != nil {
		cur.EndDate = cloneTimePtr(in.EndDate)
	}
	if in.Rent != nil {
		cur.Rent = normalizeRent(*in.Rent)
	}
	newStatus := cur.Status
	if in.Status != nil {
		newStatus = normalizeStatus(*in.Status)
	}

	// Transition: -> active
	if newStatus == StatusActive && prev.Status != StatusActive {
		other, err := s.repo.CountActiveOtherThan(ctx, cur.UnitID, cur.ID)
		if err != nil {
			return nil, err
		}
		if other > 0 {
			return nil, ErrConflict
		}
		cur.Status = newStatus
		if err := s.repo.Replace(ctx, cur); err != nil {
			return nil, err
		}
		if err := s.units.SetStatus(ctx, cur.UnitID, unit.StatusOccupied); err != nil {
			_ = s.repo.Replace(ctx, &prev)
			return nil, err
		}
		return cur, nil
	}

	// Transition: active -> ended (or other non-active)
	if prev.Status == StatusActive && newStatus != StatusActive {
		cur.Status = newStatus
		if err := s.repo.Replace(ctx, cur); err != nil {
			return nil, err
		}
		if err := s.units.SetStatus(ctx, cur.UnitID, unit.StatusVacant); err != nil {
			_ = s.repo.Replace(ctx, &prev)
			return nil, err
		}
		return cur, nil
	}

	cur.Status = newStatus
	if err := s.repo.Replace(ctx, cur); err != nil {
		return nil, err
	}
	return cur, nil
}

func cloneTimePtr(t *time.Time) *time.Time {
	if t == nil {
		return nil
	}
	tt := t.UTC()
	return &tt
}

// Delete removes non-active leases.
func (s *Service) Delete(ctx context.Context, id primitive.ObjectID) error {
	d, err := s.repo.Get(ctx, id)
	if err != nil {
		return err
	}
	if d.Status == StatusActive {
		return ErrDeleteActive
	}
	return s.repo.Delete(ctx, id)
}
