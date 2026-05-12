package wallet

import (
	"context"
	"strings"

	"github.com/jarukit/apartment-system/services/api/internal/user"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// UserGetter resolves another user for transfers.
type UserGetter interface {
	GetByID(ctx context.Context, id primitive.ObjectID) (*user.Doc, error)
}

// Service is wallet use cases.
type Service struct {
	repo  *Repo
	users UserGetter
}

// NewService constructs a wallet service.
func NewService(repo *Repo, users UserGetter) *Service {
	return &Service{repo: repo, users: users}
}

// Summary returns wallet state for the caller's user id.
func (s *Service) Summary(ctx context.Context, userID primitive.ObjectID) (*WalletDoc, error) {
	return s.repo.EnsureWallet(ctx, userID)
}

// Ledger lists recent movements.
func (s *Service) Ledger(ctx context.Context, userID primitive.ObjectID, limit int64) ([]LedgerDoc, error) {
	if _, err := s.repo.EnsureWallet(ctx, userID); err != nil {
		return nil, err
	}
	return s.repo.ListLedger(ctx, userID, limit)
}

// TopUp credits the wallet (simulated funding; no external PSP).
func (s *Service) TopUp(ctx context.Context, userID primitive.ObjectID, amountSatang int64) error {
	return s.repo.TopUp(ctx, userID, amountSatang)
}

// Transfer sends satang to another registered user.
func (s *Service) Transfer(ctx context.Context, fromUser primitive.ObjectID, toUserIDHex string, amountSatang int64) error {
	toOID, err := primitive.ObjectIDFromHex(strings.TrimSpace(toUserIDHex))
	if err != nil {
		return ErrRecipientNotFound
	}
	if _, err := s.users.GetByID(ctx, toOID); err != nil {
		if err == user.ErrNotFound {
			return ErrRecipientNotFound
		}
		return err
	}
	if _, err := s.repo.EnsureWallet(ctx, fromUser); err != nil {
		return err
	}
	if _, err := s.repo.EnsureWallet(ctx, toOID); err != nil {
		return err
	}
	return s.repo.Transfer(ctx, fromUser, toOID, amountSatang)
}
