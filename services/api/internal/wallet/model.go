package wallet

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Default currency for resident wallets (minor units = satang).
const CurrencyTHB = "THB"

// Ledger kinds (per-user perspective).
const (
	LedgerTopUp           = "top_up"
	LedgerTransferOut     = "transfer_out"
	LedgerTransferIn      = "transfer_in"
	LedgerLeaseFirstMonth        = "lease_first_month"
	LedgerLeaseBookingReversal   = "lease_booking_reversal" // credits wallet after a failed non-txn booking step
)

// WalletDoc is one wallet per user account.
type WalletDoc struct {
	ID             primitive.ObjectID `bson:"_id,omitempty"`
	UserID         primitive.ObjectID `bson:"userId"`
	BalanceSatang  int64              `bson:"balanceSatang"`
	Currency       string             `bson:"currency"`
	CreatedAt      time.Time          `bson:"createdAt"`
	UpdatedAt      time.Time          `bson:"updatedAt"`
}

// LedgerDoc is an append-only movement on a user wallet.
type LedgerDoc struct {
	ID           primitive.ObjectID  `bson:"_id,omitempty"`
	UserID       primitive.ObjectID  `bson:"userId"`
	Kind         string              `bson:"kind"`
	AmountSatang int64               `bson:"amountSatang"` // magnitude (>0); direction from kind
	PeerUserID   *primitive.ObjectID `bson:"peerUserId,omitempty"`
	CreatedAt    time.Time           `bson:"createdAt"`
}
