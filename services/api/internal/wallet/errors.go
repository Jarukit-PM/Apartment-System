package wallet

import "errors"

var (
	// ErrInsufficientFunds when transfer or debit would go negative.
	ErrInsufficientFunds = errors.New("insufficient balance")
	// ErrInvalidAmount when amount is zero or negative or too large.
	ErrInvalidAmount = errors.New("invalid amount")
	// ErrSelfTransfer when from and to are the same user.
	ErrSelfTransfer = errors.New("cannot transfer to yourself")
	// ErrRecipientNotFound when destination user does not exist.
	ErrRecipientNotFound = errors.New("recipient user not found")
)
