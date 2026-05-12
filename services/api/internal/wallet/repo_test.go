package wallet

import (
	"errors"
	"testing"
)

func TestMongoTxnUnsupported(t *testing.T) {
	if !mongoTxnUnsupported(errors.New("Transaction numbers are only allowed on a replica set member or mongos")) {
		t.Fatal("expected true for replica set error")
	}
	if mongoTxnUnsupported(errors.New("something else")) {
		t.Fatal("expected false")
	}
	if mongoTxnUnsupported(nil) {
		t.Fatal("nil")
	}
}
