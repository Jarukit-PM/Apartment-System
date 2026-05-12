package invoice

import (
	"context"
	"errors"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Service invoice rules.
type Service struct {
	repo *Repo
}

// NewService constructs service.
func NewService(repo *Repo) *Service {
	return &Service{repo: repo}
}

// ListForResident returns invoices where resident is payer.
func (s *Service) ListForResident(ctx context.Context, residentID primitive.ObjectID) ([]Doc, error) {
	return s.repo.ListByResident(ctx, residentID)
}

// Create validates and inserts (admin use case).
func (s *Service) Create(ctx context.Context, in CreateInput) (*Doc, error) {
	if in.Amount < 0 {
		return nil, errors.New("amount must be non-negative")
	}
	st := strings.TrimSpace(in.Status)
	if st == "" {
		st = StatusOpen
	}
	if st != StatusDraft && st != StatusOpen && st != StatusPaid {
		st = StatusOpen
	}
	cur := strings.TrimSpace(in.Currency)
	if cur == "" {
		cur = "THB"
	}
	d := &Doc{
		LeaseID:     in.LeaseID,
		ResidentID:  in.ResidentID,
		Description: strings.TrimSpace(in.Description),
		Amount:      in.Amount,
		Currency:    cur,
		DueDate:     in.DueDate.UTC(),
		Status:      st,
	}
	if err := s.repo.Insert(ctx, d); err != nil {
		return nil, err
	}
	return d, nil
}

// Get returns one invoice if owned by resident.
func (s *Service) GetForResident(ctx context.Context, invoiceID, residentID primitive.ObjectID) (*Doc, error) {
	d, err := s.repo.Get(ctx, invoiceID)
	if err != nil {
		return nil, err
	}
	if d.ResidentID != residentID {
		return nil, ErrNotFound
	}
	return d, nil
}

// Time helper for handlers.
func ParseDue(s string) (time.Time, error) {
	return time.Parse(time.RFC3339, s)
}
