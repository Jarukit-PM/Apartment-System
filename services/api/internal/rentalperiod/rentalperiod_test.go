package rentalperiod

import (
	"testing"
	"time"
)

func TestInclusiveEndUTC_7d(t *testing.T) {
	start := time.Date(2026, 5, 13, 23, 59, 0, 0, time.UTC)
	end, err := InclusiveEndUTC(start, Period7D)
	if err != nil {
		t.Fatal(err)
	}
	want := time.Date(2026, 5, 19, 0, 0, 0, 0, time.UTC)
	if !end.Equal(want) {
		t.Fatalf("got %v want %v", end, want)
	}
}

func TestInclusiveEndUTC_1m(t *testing.T) {
	start := time.Date(2026, 5, 13, 12, 0, 0, 0, time.UTC)
	end, err := InclusiveEndUTC(start, Period1M)
	if err != nil {
		t.Fatal(err)
	}
	want := time.Date(2026, 6, 12, 0, 0, 0, 0, time.UTC)
	if !end.Equal(want) {
		t.Fatalf("got %v want %v", end, want)
	}
}

func TestNextBookableStartUTC(t *testing.T) {
	end := time.Date(2026, 5, 15, 0, 0, 0, 0, time.UTC)
	next := NextBookableStartUTC(end)
	want := time.Date(2026, 5, 16, 0, 0, 0, 0, time.UTC)
	if !next.Equal(want) {
		t.Fatalf("got %v want %v", next, want)
	}
}

func TestNormalizeCalendarUTC(t *testing.T) {
	in := time.Date(2026, 5, 13, 18, 30, 0, 0, time.FixedZone("ICT", 7*3600))
	got := NormalizeCalendarUTC(in)
	want := time.Date(2026, 5, 13, 0, 0, 0, 0, time.UTC)
	if !got.Equal(want) {
		t.Fatalf("got %v want %v", got, want)
	}
}
