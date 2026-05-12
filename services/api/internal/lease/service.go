package lease

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/jarukit/apartment-system/services/api/internal/unit"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// UnitPartner reads and updates unit occupancy for lease rules.
type UnitPartner interface {
	Get(ctx context.Context, id primitive.ObjectID) (*unit.Doc, error)
	SetStatus(ctx context.Context, id primitive.ObjectID, status string) error
}

// ResidentPartner validates residents and updates primary unit after self-lease.
type ResidentPartner interface {
	CountByIDs(ctx context.Context, ids []primitive.ObjectID) (int64, error)
	SetPrimaryUnitID(ctx context.Context, residentID, unitID primitive.ObjectID) error
}

// Service applies lease rules (one active lease per unit).
type Service struct {
	repo      *Repo
	units     UnitPartner
	residents ResidentPartner
	db        func() *mongo.Database
}

// NewService constructs the lease service.
func NewService(repo *Repo, units UnitPartner, residents ResidentPartner, db func() *mongo.Database) *Service {
	return &Service{repo: repo, units: units, residents: residents, db: db}
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

// ErrResidentAlreadyLeasing when the resident already holds an active lease.
var ErrResidentAlreadyLeasing = errors.New("resident already has an active lease")

// ErrSelfServiceUnitUnavailable when the unit cannot be self-booked (not vacant, no listing rent, or self-service disabled).
var ErrSelfServiceUnitUnavailable = errors.New("unit is not available for self-service leasing")

// ErrSelfServiceInvalidDates when end is not strictly after start.
var ErrSelfServiceInvalidDates = errors.New("endDate must be after startDate")

// List leases.
func (s *Service) List(ctx context.Context, unitID *primitive.ObjectID) ([]Doc, error) {
	return s.repo.List(ctx, unitID)
}

// ListForResident lists leases involving a resident.
func (s *Service) ListForResident(ctx context.Context, residentID primitive.ObjectID) ([]Doc, error) {
	return s.repo.ListByResident(ctx, residentID)
}

// ActiveUnitIDsForResident returns unit ids from active leases for this resident.
func (s *Service) ActiveUnitIDsForResident(ctx context.Context, residentID primitive.ObjectID) ([]primitive.ObjectID, error) {
	list, err := s.repo.ListByResident(ctx, residentID)
	if err != nil {
		return nil, err
	}
	var ids []primitive.ObjectID
	seen := map[primitive.ObjectID]struct{}{}
	for _, l := range list {
		if l.Status != StatusActive {
			continue
		}
		if _, ok := seen[l.UnitID]; !ok {
			seen[l.UnitID] = struct{}{}
			ids = append(ids, l.UnitID)
		}
	}
	return ids, nil
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

// SelfServiceLeaseInput is resident self-booking (instant active lease).
type SelfServiceLeaseInput struct {
	UnitID    primitive.ObjectID
	StartDate time.Time
	EndDate   *time.Time
}

func (s *Service) residentHasActiveLease(ctx context.Context, residentID primitive.ObjectID) (bool, error) {
	list, err := s.repo.ListByResident(ctx, residentID)
	if err != nil {
		return false, err
	}
	for i := range list {
		if list[i].Status == StatusActive {
			return true, nil
		}
	}
	return false, nil
}

func unitBookableForSelfService(u *unit.Doc) bool {
	if u.Status != unit.StatusVacant {
		return false
	}
	if u.ListingRent == nil || u.ListingRent.Amount <= 0 {
		return false
	}
	if u.SelfServiceEnabled != nil && !*u.SelfServiceEnabled {
		return false
	}
	return true
}

// CreateSelfService creates an active lease for the authenticated resident in one transaction.
func (s *Service) CreateSelfService(ctx context.Context, residentID primitive.ObjectID, in SelfServiceLeaseInput) (*Doc, error) {
	if s.db == nil {
		return nil, errors.New("database not configured")
	}
	if in.EndDate != nil && !in.EndDate.After(in.StartDate) {
		return nil, ErrSelfServiceInvalidDates
	}
	if ok, err := s.residentHasActiveLease(ctx, residentID); err != nil {
		return nil, err
	} else if ok {
		return nil, ErrResidentAlreadyLeasing
	}

	db := s.db()
	sess, err := db.Client().StartSession()
	if err != nil {
		return nil, err
	}
	defer sess.EndSession(ctx)

	var created *Doc
	_, err = sess.WithTransaction(ctx, func(sc mongo.SessionContext) (interface{}, error) {
		if ok, err := s.residentHasActiveLease(sc, residentID); err != nil {
			return nil, err
		} else if ok {
			return nil, ErrResidentAlreadyLeasing
		}
		u, err := s.units.Get(sc, in.UnitID)
		if err != nil {
			if errors.Is(err, unit.ErrNotFound) {
				return nil, ErrUnitMissing
			}
			return nil, err
		}
		if !unitBookableForSelfService(u) {
			return nil, ErrSelfServiceUnitUnavailable
		}
		other, err := s.repo.CountActiveOtherThan(sc, in.UnitID, primitive.NilObjectID)
		if err != nil {
			return nil, err
		}
		if other > 0 {
			return nil, ErrConflict
		}
		rent := normalizeRent(Rent{
			Amount:   u.ListingRent.Amount,
			Currency: u.ListingRent.Currency,
		})
		now := time.Now().UTC()
		d := &Doc{
			ID:          primitive.NewObjectID(),
			UnitID:      in.UnitID,
			ResidentIDs: []primitive.ObjectID{residentID},
			StartDate:   in.StartDate.UTC(),
			EndDate:     cloneTimePtr(in.EndDate),
			Status:      StatusActive,
			Rent:        rent,
			CreatedAt:   now,
			UpdatedAt:   now,
		}
		if err := s.repo.Insert(sc, d); err != nil {
			return nil, err
		}
		if err := s.units.SetStatus(sc, in.UnitID, unit.StatusOccupied); err != nil {
			return nil, err
		}
		if err := s.residents.SetPrimaryUnitID(sc, residentID, in.UnitID); err != nil {
			return nil, err
		}
		created = d
		return d, nil
	})
	if err != nil {
		return nil, err
	}
	return created, nil
}
