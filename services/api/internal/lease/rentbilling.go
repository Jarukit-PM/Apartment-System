package lease

import (
	"errors"
	"math"
	"time"
)

// RentBasisMonthly means lease.rent.amount is monthly rent (period catalog amounts are monthly).
const RentBasisMonthly = "monthly"

var errRentAmountOutOfRange = errors.New("rent amount out of supported range")

func rentAmountToSatang(r Rent) (int64, error) {
	if r.Amount <= 0 || r.Amount > 1e11 {
		return 0, errRentAmountOutOfRange
	}
	s := int64(math.Round(r.Amount * 100))
	if s <= 0 {
		return 0, errRentAmountOutOfRange
	}
	return s, nil
}

// firstAutomatedRentInvoiceMonthUTC returns the YYYY-MM of the first month that should get a
// scheduled rent invoice after the lease start (the calendar month containing start is covered by the wallet gate).
func firstAutomatedRentInvoiceMonthUTC(start time.Time) string {
	t := start.UTC()
	y, m, _ := t.Date()
	next := time.Date(y, m+1, 1, 0, 0, 0, 0, time.UTC)
	return next.Format("2006-01")
}

// CurrentYearMonthUTC returns today's calendar month in UTC as YYYY-MM.
func CurrentYearMonthUTC() string {
	return time.Now().UTC().Format("2006-01")
}

// ParseYearMonthUTC parses YYYY-MM in UTC (first instant of that month).
func ParseYearMonthUTC(ym string) (time.Time, error) {
	return time.ParseInLocation("2006-01", ym, time.UTC)
}

func endOfCalendarMonthUTC(firstOfMonth time.Time) time.Time {
	return firstOfMonth.AddDate(0, 1, 0).Add(-time.Nanosecond)
}

// LeaseCoversRentBillMonth reports whether a lease should accrue a scheduled rent invoice for calendar month ym (YYYY-MM).
func LeaseCoversRentBillMonth(l *Doc, ym string) bool {
	first, err := ParseYearMonthUTC(ym)
	if err != nil {
		return false
	}
	endM := endOfCalendarMonthUTC(first)
	if l.StartDate.UTC().After(endM) {
		return false
	}
	if l.EndDate != nil && l.EndDate.UTC().Before(first) {
		return false
	}
	return true
}

// AddOneCalendarMonthYYYYMM returns the next YYYY-MM string.
func AddOneCalendarMonthYYYYMM(ym string) (string, error) {
	t, err := ParseYearMonthUTC(ym)
	if err != nil {
		return "", err
	}
	return t.AddDate(0, 1, 0).Format("2006-01"), nil
}
