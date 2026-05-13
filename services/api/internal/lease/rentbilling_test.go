package lease

import (
	"testing"
	"time"
)

func TestFirstAutomatedRentInvoiceMonthUTC(t *testing.T) {
	st := time.Date(2026, 5, 13, 12, 0, 0, 0, time.UTC)
	if got := firstAutomatedRentInvoiceMonthUTC(st); got != "2026-06" {
		t.Fatalf("got %q", got)
	}
	st2 := time.Date(2026, 12, 1, 0, 0, 0, 0, time.UTC)
	if got := firstAutomatedRentInvoiceMonthUTC(st2); got != "2027-01" {
		t.Fatalf("got %q", got)
	}
}

func TestLeaseCoversRentBillMonth(t *testing.T) {
	start := time.Date(2026, 5, 1, 0, 0, 0, 0, time.UTC)
	end := time.Date(2026, 7, 31, 0, 0, 0, 0, time.UTC)
	l := &Doc{StartDate: start, EndDate: &end}
	if !LeaseCoversRentBillMonth(l, "2026-06") {
		t.Fatal("expected June covered")
	}
	if LeaseCoversRentBillMonth(l, "2026-08") {
		t.Fatal("August should not be covered")
	}
}
