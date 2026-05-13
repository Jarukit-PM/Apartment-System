package rentalperiod

import (
	"errors"
	"fmt"
	"strings"
	"time"
)

// Canonical period identifiers for admin and API contracts.
const (
	Period7D  = "7d"
	Period15D = "15d"
	Period1M  = "1m"
	Period2M  = "2m"
	Period3M  = "3m"
	Period6M  = "6m"
	Period1Y  = "1y"
	Period2Y  = "2y"
)

// All lists every supported period id (stable ordering for UI seeds).
var All = []string{
	Period7D, Period15D,
	Period1M, Period2M, Period3M, Period6M,
	Period1Y, Period2Y,
}

var known = map[string]struct{}{
	Period7D: {}, Period15D: {},
	Period1M: {}, Period2M: {}, Period3M: {}, Period6M: {},
	Period1Y: {}, Period2Y: {},
}

// ErrUnknown when periodId is not in the catalog.
var ErrUnknown = errors.New("unknown rental period")

// NormalizeID returns lowercased trimmed id or empty if blank.
func NormalizeID(id string) string {
	return strings.ToLower(strings.TrimSpace(id))
}

// IsKnown reports whether id is a supported catalog period.
func IsKnown(id string) bool {
	_, ok := known[NormalizeID(id)]
	return ok
}

// NormalizeCalendarUTC keeps only the UTC calendar date at midnight (wall-clock time ignored).
func NormalizeCalendarUTC(t time.Time) time.Time {
	u := t.UTC()
	return time.Date(u.Year(), u.Month(), u.Day(), 0, 0, 0, 0, time.UTC)
}

// InclusiveEndUTC returns the last occupied calendar day (UTC) for a lease that starts on
// start's UTC calendar date and spans the given rental period. Example: 7d from May 13 → May 19 inclusive.
func InclusiveEndUTC(start time.Time, periodID string) (time.Time, error) {
	id := NormalizeID(periodID)
	if !IsKnown(id) {
		return time.Time{}, fmt.Errorf("%w: %q", ErrUnknown, periodID)
	}
	s := NormalizeCalendarUTC(start)
	switch id {
	case Period7D:
		return s.AddDate(0, 0, 6), nil
	case Period15D:
		return s.AddDate(0, 0, 14), nil
	case Period1M:
		return s.AddDate(0, 1, -1), nil
	case Period2M:
		return s.AddDate(0, 2, -1), nil
	case Period3M:
		return s.AddDate(0, 3, -1), nil
	case Period6M:
		return s.AddDate(0, 6, -1), nil
	case Period1Y:
		return s.AddDate(1, 0, -1), nil
	case Period2Y:
		return s.AddDate(2, 0, -1), nil
	default:
		return time.Time{}, fmt.Errorf("%w: %q", ErrUnknown, periodID)
	}
}

// NextBookableStartUTC is the first calendar day a new lease may begin after an inclusive end date.
// Example: lease ends May 15 inclusive → next start is May 16.
func NextBookableStartUTC(inclusiveEnd time.Time) time.Time {
	e := NormalizeCalendarUTC(inclusiveEnd)
	return e.AddDate(0, 0, 1)
}
