package wallet

import (
	"context"
	"errors"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const (
	maxSingleTopUpSatang = 10_000_000_00 // 10M THB cap per MVP top-up
)

// Repo persists wallets and ledger rows.
type Repo struct {
	db *mongo.Database
}

// NewRepo constructs a wallet repository.
func NewRepo(db *mongo.Database) *Repo {
	return &Repo{db: db}
}

func (r *Repo) wallets() *mongo.Collection {
	return r.db.Collection("wallets")
}

func (r *Repo) ledger() *mongo.Collection {
	return r.db.Collection("wallet_ledger")
}

// EnsureWallet returns an existing wallet or creates one with zero balance.
func (r *Repo) EnsureWallet(ctx context.Context, userID primitive.ObjectID) (*WalletDoc, error) {
	coll := r.wallets()
	var d WalletDoc
	err := coll.FindOne(ctx, bson.M{"userId": userID}).Decode(&d)
	if err == nil {
		return &d, nil
	}
	if !errors.Is(err, mongo.ErrNoDocuments) {
		return nil, err
	}
	now := time.Now().UTC()
	d = WalletDoc{
		ID:            primitive.NewObjectID(),
		UserID:        userID,
		BalanceSatang: 0,
		Currency:      CurrencyTHB,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
	_, insErr := coll.InsertOne(ctx, d)
	if insErr == nil {
		return &d, nil
	}
	if mongo.IsDuplicateKeyError(insErr) {
		err = coll.FindOne(ctx, bson.M{"userId": userID}).Decode(&d)
		if err == nil {
			return &d, nil
		}
	}
	return nil, insErr
}

// TopUp increments balance and appends a ledger row (not transactional with invoice gateway; demo credit).
func (r *Repo) TopUp(ctx context.Context, userID primitive.ObjectID, amountSatang int64) error {
	if amountSatang <= 0 || amountSatang > maxSingleTopUpSatang {
		return ErrInvalidAmount
	}
	if _, err := r.EnsureWallet(ctx, userID); err != nil {
		return err
	}
	now := time.Now().UTC()
	_, err := r.wallets().UpdateOne(ctx, bson.M{"userId": userID}, bson.M{
		"$inc": bson.M{"balanceSatang": amountSatang},
		"$set": bson.M{"updatedAt": now},
	})
	if err != nil {
		return err
	}
	led := LedgerDoc{
		ID:           primitive.NewObjectID(),
		UserID:       userID,
		Kind:         LedgerTopUp,
		AmountSatang: amountSatang,
		CreatedAt:    now,
	}
	_, err = r.ledger().InsertOne(ctx, led)
	return err
}

func applyLedgerMeta(led *LedgerDoc, meta *LedgerMeta) {
	if meta == nil {
		return
	}
	led.UnitID = meta.UnitID
	led.LeaseID = meta.LeaseID
}

// Debit decrements balance when sufficient; appends one ledger row (kind must be non-empty).
func (r *Repo) Debit(ctx context.Context, userID primitive.ObjectID, amountSatang int64, kind string, meta *LedgerMeta) error {
	if amountSatang <= 0 || amountSatang > maxSingleTopUpSatang {
		return ErrInvalidAmount
	}
	kind = strings.TrimSpace(kind)
	if kind == "" {
		return ErrInvalidAmount
	}
	if _, err := r.EnsureWallet(ctx, userID); err != nil {
		return err
	}
	now := time.Now().UTC()
	res, err := r.wallets().UpdateOne(ctx, bson.M{
		"userId":        userID,
		"balanceSatang": bson.M{"$gte": amountSatang},
	}, bson.M{
		"$inc": bson.M{"balanceSatang": -amountSatang},
		"$set": bson.M{"updatedAt": now},
	})
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		return ErrInsufficientFunds
	}
	led := LedgerDoc{
		ID:           primitive.NewObjectID(),
		UserID:       userID,
		Kind:         kind,
		AmountSatang: amountSatang,
		CreatedAt:    now,
	}
	applyLedgerMeta(&led, meta)
	_, err = r.ledger().InsertOne(ctx, led)
	return err
}

// Credit increments balance and appends a ledger row (used to compensate after a failed booking step on standalone MongoDB).
func (r *Repo) Credit(ctx context.Context, userID primitive.ObjectID, amountSatang int64, kind string, meta *LedgerMeta) error {
	if amountSatang <= 0 || amountSatang > maxSingleTopUpSatang {
		return ErrInvalidAmount
	}
	kind = strings.TrimSpace(kind)
	if kind == "" {
		return ErrInvalidAmount
	}
	if _, err := r.EnsureWallet(ctx, userID); err != nil {
		return err
	}
	now := time.Now().UTC()
	_, err := r.wallets().UpdateOne(ctx, bson.M{"userId": userID}, bson.M{
		"$inc": bson.M{"balanceSatang": amountSatang},
		"$set": bson.M{"updatedAt": now},
	})
	if err != nil {
		return err
	}
	led := LedgerDoc{
		ID:           primitive.NewObjectID(),
		UserID:       userID,
		Kind:         kind,
		AmountSatang: amountSatang,
		CreatedAt:    now,
	}
	applyLedgerMeta(&led, meta)
	_, err = r.ledger().InsertOne(ctx, led)
	return err
}

// ListLedger returns recent ledger rows for a user (newest first).
func (r *Repo) ListLedger(ctx context.Context, userID primitive.ObjectID, limit int64) ([]LedgerDoc, error) {
	if limit <= 0 {
		limit = 50
	}
	if limit > 200 {
		limit = 200
	}
	cur, err := r.ledger().Find(ctx, bson.M{"userId": userID}, options.Find().
		SetSort(bson.D{{Key: "createdAt", Value: -1}}).
		SetLimit(limit))
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	var out []LedgerDoc
	if err := cur.All(ctx, &out); err != nil {
		return nil, err
	}
	return out, nil
}

func mongoTxnUnsupported(err error) bool {
	if err == nil {
		return false
	}
	s := err.Error()
	return strings.Contains(s, "Transaction numbers are only allowed") ||
		strings.Contains(s, "replica set member") ||
		strings.Contains(s, "IllegalOperation")
}

// MongoTxnUnsupported reports whether err is due to multi-document transactions not being available (e.g. standalone mongod).
func MongoTxnUnsupported(err error) bool {
	return mongoTxnUnsupported(err)
}

// Transfer moves satang from fromUser to toUser and writes two ledger rows.
// Uses a multi-document transaction when the deployment supports it (replica set);
// otherwise falls back to ordered updates with compensation if a later step fails.
func (r *Repo) Transfer(ctx context.Context, fromUser, toUser primitive.ObjectID, amountSatang int64) error {
	if amountSatang <= 0 {
		return ErrInvalidAmount
	}
	if fromUser == toUser {
		return ErrSelfTransfer
	}
	err := r.transferWithTxn(ctx, fromUser, toUser, amountSatang)
	if mongoTxnUnsupported(err) {
		return r.transferSequential(ctx, fromUser, toUser, amountSatang)
	}
	return err
}

func (r *Repo) transferWithTxn(ctx context.Context, fromUser, toUser primitive.ObjectID, amountSatang int64) error {
	client := r.db.Client()
	sess, err := client.StartSession()
	if err != nil {
		return err
	}
	defer sess.EndSession(ctx)

	_, err = sess.WithTransaction(ctx, func(sc mongo.SessionContext) (any, error) {
		now := time.Now().UTC()
		res, err := r.wallets().UpdateOne(sc, bson.M{
			"userId":        fromUser,
			"balanceSatang": bson.M{"$gte": amountSatang},
		}, bson.M{
			"$inc": bson.M{"balanceSatang": -amountSatang},
			"$set": bson.M{"updatedAt": now},
		})
		if err != nil {
			return nil, err
		}
		if res.MatchedCount == 0 {
			return nil, ErrInsufficientFunds
		}
		if _, err := r.wallets().UpdateOne(sc, bson.M{"userId": toUser}, bson.M{
			"$inc": bson.M{"balanceSatang": amountSatang},
			"$set": bson.M{"updatedAt": now},
		}); err != nil {
			return nil, err
		}
		toID := toUser
		outLed := LedgerDoc{
			ID:           primitive.NewObjectID(),
			UserID:       fromUser,
			Kind:         LedgerTransferOut,
			AmountSatang: amountSatang,
			PeerUserID:   &toID,
			CreatedAt:    now,
		}
		fromID := fromUser
		inLed := LedgerDoc{
			ID:           primitive.NewObjectID(),
			UserID:       toUser,
			Kind:         LedgerTransferIn,
			AmountSatang: amountSatang,
			PeerUserID:   &fromID,
			CreatedAt:    now,
		}
		if _, err := r.ledger().InsertMany(sc, []any{outLed, inLed}); err != nil {
			return nil, err
		}
		return nil, nil
	})
	return err
}

func (r *Repo) transferSequential(ctx context.Context, fromUser, toUser primitive.ObjectID, amountSatang int64) error {
	now := time.Now().UTC()
	res, err := r.wallets().UpdateOne(ctx, bson.M{
		"userId":        fromUser,
		"balanceSatang": bson.M{"$gte": amountSatang},
	}, bson.M{
		"$inc": bson.M{"balanceSatang": -amountSatang},
		"$set": bson.M{"updatedAt": now},
	})
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		return ErrInsufficientFunds
	}
	if _, err := r.wallets().UpdateOne(ctx, bson.M{"userId": toUser}, bson.M{
		"$inc": bson.M{"balanceSatang": amountSatang},
		"$set": bson.M{"updatedAt": now},
	}); err != nil {
		_, _ = r.wallets().UpdateOne(ctx, bson.M{"userId": fromUser}, bson.M{
			"$inc": bson.M{"balanceSatang": amountSatang},
			"$set": bson.M{"updatedAt": time.Now().UTC()},
		})
		return err
	}
	toID := toUser
	outLed := LedgerDoc{
		ID:           primitive.NewObjectID(),
		UserID:       fromUser,
		Kind:         LedgerTransferOut,
		AmountSatang: amountSatang,
		PeerUserID:   &toID,
		CreatedAt:    now,
	}
	fromID := fromUser
	inLed := LedgerDoc{
		ID:           primitive.NewObjectID(),
		UserID:       toUser,
		Kind:         LedgerTransferIn,
		AmountSatang: amountSatang,
		PeerUserID:   &fromID,
		CreatedAt:    now,
	}
	if _, err := r.ledger().InsertMany(ctx, []any{outLed, inLed}); err != nil {
		_, _ = r.wallets().UpdateOne(ctx, bson.M{"userId": toUser}, bson.M{
			"$inc": bson.M{"balanceSatang": -amountSatang},
			"$set": bson.M{"updatedAt": time.Now().UTC()},
		})
		_, _ = r.wallets().UpdateOne(ctx, bson.M{"userId": fromUser}, bson.M{
			"$inc": bson.M{"balanceSatang": amountSatang},
			"$set": bson.M{"updatedAt": time.Now().UTC()},
		})
		return err
	}
	return nil
}
