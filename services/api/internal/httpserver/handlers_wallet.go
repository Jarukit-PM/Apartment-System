package httpserver

import (
	"net/http"

	"github.com/jarukit/apartment-system/services/api/internal/authn"
	"github.com/jarukit/apartment-system/services/api/internal/httpx"
	"github.com/jarukit/apartment-system/services/api/internal/wallet"
)

func walletDocJSON(d *wallet.WalletDoc) map[string]any {
	return map[string]any{
		"userId":        d.UserID.Hex(),
		"balanceSatang": d.BalanceSatang,
		"currency":      d.Currency,
		"createdAt":     d.CreatedAt.UTC().Format("2006-01-02T15:04:05.000Z"),
		"updatedAt":     d.UpdatedAt.UTC().Format("2006-01-02T15:04:05.000Z"),
	}
}

func ledgerDocJSON(d *wallet.LedgerDoc) map[string]any {
	m := map[string]any{
		"id":           d.ID.Hex(),
		"kind":         d.Kind,
		"amountSatang": d.AmountSatang,
		"createdAt":    d.CreatedAt.UTC().Format("2006-01-02T15:04:05.000Z"),
		"peerUserId":   nil,
	}
	if d.PeerUserID != nil {
		m["peerUserId"] = d.PeerUserID.Hex()
	}
	return m
}

func (s *Server) walletGet(w http.ResponseWriter, r *http.Request) {
	p, ok := authn.PrincipalFrom(r.Context())
	if !ok {
		httpx.WriteError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "not authenticated", nil)
		return
	}
	wdoc, err := s.Wallet.Summary(r.Context(), p.UserID)
	if err != nil {
		handleServiceError(w, r, err)
		return
	}
	led, err := s.Wallet.Ledger(r.Context(), p.UserID, 50)
	if err != nil {
		handleServiceError(w, r, err)
		return
	}
	ls := make([]any, 0, len(led))
	for i := range led {
		ls = append(ls, ledgerDocJSON(&led[i]))
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{
		"data": map[string]any{
			"wallet": walletDocJSON(wdoc),
			"ledger": ls,
		},
	})
}

type walletTopUpBody struct {
	AmountSatang int64 `json:"amountSatang"`
}

func (s *Server) walletTopUp(w http.ResponseWriter, r *http.Request) {
	p, ok := authn.PrincipalFrom(r.Context())
	if !ok {
		httpx.WriteError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "not authenticated", nil)
		return
	}
	var body walletTopUpBody
	if !decodeJSON(w, r, &body) {
		return
	}
	if err := s.Wallet.TopUp(r.Context(), p.UserID, body.AmountSatang); err != nil {
		handleServiceError(w, r, err)
		return
	}
	wdoc, err := s.Wallet.Summary(r.Context(), p.UserID)
	if err != nil {
		handleServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"data": walletDocJSON(wdoc)})
}

type walletTransferBody struct {
	ToUserID     string `json:"toUserId"`
	AmountSatang int64  `json:"amountSatang"`
}

func (s *Server) walletTransfer(w http.ResponseWriter, r *http.Request) {
	p, ok := authn.PrincipalFrom(r.Context())
	if !ok {
		httpx.WriteError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "not authenticated", nil)
		return
	}
	var body walletTransferBody
	if !decodeJSON(w, r, &body) {
		return
	}
	if err := s.Wallet.Transfer(r.Context(), p.UserID, body.ToUserID, body.AmountSatang); err != nil {
		handleServiceError(w, r, err)
		return
	}
	wdoc, err := s.Wallet.Summary(r.Context(), p.UserID)
	if err != nil {
		handleServiceError(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"data": walletDocJSON(wdoc)})
}
