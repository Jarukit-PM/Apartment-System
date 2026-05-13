package billing

import (
	"context"
	"fmt"

	"github.com/jarukit/apartment-system/services/api/internal/invoice"
	"github.com/jarukit/apartment-system/services/api/internal/lease"
	"go.mongodb.org/mongo-driver/mongo"
)

// Runner creates scheduled rent invoices for active monthly-billed leases.
type Runner struct {
	Leases *lease.Repo
	Inv    *invoice.Repo
}

// NewRunner wires repositories for the billing loop.
func NewRunner(leases *lease.Repo, inv *invoice.Repo) *Runner {
	return &Runner{Leases: leases, Inv: inv}
}

// RunOnce processes all active leases due through the current UTC calendar month.
func (r *Runner) RunOnce(ctx context.Context) (invoicesCreated int, err error) {
	if r == nil || r.Leases == nil || r.Inv == nil {
		return 0, nil
	}
	nowMonth := lease.CurrentYearMonthUTC()
	list, err := r.Leases.ListActiveMonthlyBillingDue(ctx, nowMonth)
	if err != nil {
		return 0, err
	}
	for i := range list {
		l := &list[i]
		const maxIterations = 48
		for iter := 0; iter < maxIterations && l.NextRentBillMonth != "" && l.NextRentBillMonth <= nowMonth; iter++ {
			if !lease.LeaseCoversRentBillMonth(l, l.NextRentBillMonth) {
				next, ierr := lease.AddOneCalendarMonthYYYYMM(l.NextRentBillMonth)
				if ierr != nil {
					return invoicesCreated, ierr
				}
				l.NextRentBillMonth = next
				if err := r.Leases.Replace(ctx, l); err != nil {
					return invoicesCreated, err
				}
				continue
			}
			n, err := r.Inv.CountByLeaseAndBillingMonth(ctx, l.ID, l.NextRentBillMonth)
			if err != nil {
				return invoicesCreated, err
			}
			if n > 0 {
				next, ierr := lease.AddOneCalendarMonthYYYYMM(l.NextRentBillMonth)
				if ierr != nil {
					return invoicesCreated, ierr
				}
				l.NextRentBillMonth = next
				if err := r.Leases.Replace(ctx, l); err != nil {
					return invoicesCreated, err
				}
				continue
			}
			due, ierr := lease.ParseYearMonthUTC(l.NextRentBillMonth)
			if ierr != nil {
				return invoicesCreated, ierr
			}
			desc := fmt.Sprintf("Rent %s", l.NextRentBillMonth)
			if len(l.ResidentIDs) == 0 {
				return invoicesCreated, fmt.Errorf("lease %s has no residents", l.ID.Hex())
			}
			d := &invoice.Doc{
				LeaseID:      l.ID,
				ResidentID:   l.ResidentIDs[0],
				Description:  desc,
				Amount:       l.Rent.Amount,
				Currency:     l.Rent.Currency,
				DueDate:      due,
				BillingMonth: l.NextRentBillMonth,
				Status:       invoice.StatusOpen,
			}
			if err := r.Inv.Insert(ctx, d); err != nil {
				if mongo.IsDuplicateKeyError(err) {
					next, ierr := lease.AddOneCalendarMonthYYYYMM(l.NextRentBillMonth)
					if ierr != nil {
						return invoicesCreated, ierr
					}
					l.NextRentBillMonth = next
					if err := r.Leases.Replace(ctx, l); err != nil {
						return invoicesCreated, err
					}
					continue
				}
				return invoicesCreated, err
			}
			invoicesCreated++
			next, ierr := lease.AddOneCalendarMonthYYYYMM(l.NextRentBillMonth)
			if ierr != nil {
				return invoicesCreated, ierr
			}
			l.NextRentBillMonth = next
			if err := r.Leases.Replace(ctx, l); err != nil {
				return invoicesCreated, err
			}
		}
	}
	return invoicesCreated, nil
}
