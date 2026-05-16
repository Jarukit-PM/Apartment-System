"use client";

import { useRouter } from "@/i18n/navigation";
import { walletTopUp } from "@/lib/actions/wallet";
import type { ActionState } from "@/lib/actions/portal";
import QRCode from "qrcode";
import { useTranslations } from "next-intl";
import { useCallback, useId, useState } from "react";

type Method = "true_money" | "promptpay";

function parseBahtToSatang(raw: string): number | null {
  const s = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!s) return null;
  if (!/^\d+(\.\d{0,2})?$/.test(s)) return null;
  const [a, b = ""] = s.split(".");
  const frac = (b + "00").slice(0, 2);
  const w = Number(a);
  const f = Number(frac);
  if (!Number.isFinite(w) || !Number.isFinite(f)) return null;
  const satang = w * 100 + f;
  if (satang <= 0 || satang > Number.MAX_SAFE_INTEGER) return null;
  return Math.round(satang);
}

const noopPrev: ActionState = { ok: true, message: "" };

export function WalletTopUpClient({ locale }: { locale: string }) {
  const t = useTranslations("MyPortal");
  const router = useRouter();
  const formId = useId();
  const [method, setMethod] = useState<Method | null>(null);
  const [amountBaht, setAmountBaht] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const amountOk = parseBahtToSatang(amountBaht) != null;
  const canGenerate = Boolean(method) && amountOk && !generating;

  const buildPayload = useCallback(() => {
    const m = method ?? "promptpay";
    return JSON.stringify({
      app: "apartment-system",
      channel: m,
      channelLabel: m === "true_money" ? "TrueMoney Wallet" : "PromptPay",
      amountBaht: amountBaht.trim(),
      currency: "THB",
      demo: true,
      note: "MVP simulated payment — not a real PSP request",
    });
  }, [method, amountBaht]);

  async function handleGenerateQr() {
    setErrorMsg(null);
    if (!method || !amountOk) return;
    setGenerating(true);
    try {
      const dataUrl = await QRCode.toDataURL(buildPayload(), {
        width: 256,
        margin: 2,
        color: { dark: "#0f172a", light: "#ffffff" },
      });
      setQrSrc(dataUrl);
      setModalOpen(true);
    } catch {
      setErrorMsg(t("walletQrGenerateError"));
    } finally {
      setGenerating(false);
    }
  }

  async function handleConfirmPayment() {
    setErrorMsg(null);
    setConfirming(true);
    try {
      const fd = new FormData();
      fd.set("locale", locale);
      fd.set("amountBaht", amountBaht.trim());
      const res = await walletTopUp(noopPrev, fd);
      if (!res.ok) {
        setErrorMsg(res.message || t("walletConfirmError"));
        return;
      }
      setModalOpen(false);
      setQrSrc(null);
      router.refresh();
    } finally {
      setConfirming(false);
    }
  }

  function closeModal() {
    if (confirming) return;
    setModalOpen(false);
    setErrorMsg(null);
  }

  return (
    <div className="mt-4 space-y-4">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{t("walletPaymentMethod")}</legend>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600">
            <input
              type="radio"
              name={`${formId}-method`}
              value="true_money"
              checked={method === "true_money"}
              onChange={() => setMethod("true_money")}
              className="text-zinc-900"
            />
            <span>{t("walletMethodTrueMoney")}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600">
            <input
              type="radio"
              name={`${formId}-method`}
              value="promptpay"
              checked={method === "promptpay"}
              onChange={() => setMethod("promptpay")}
              className="text-zinc-900"
            />
            <span>{t("walletMethodPromptPay")}</span>
          </label>
        </div>
      </fieldset>

      <div>
        <label htmlFor={`${formId}-amount`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
          {t("walletAmountLabel")}
        </label>
        <input
          id={`${formId}-amount`}
          type="text"
          inputMode="decimal"
          placeholder="100.00"
          value={amountBaht}
          onChange={(e) => setAmountBaht(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
        />
      </div>

      {errorMsg && !modalOpen ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {errorMsg}
        </p>
      ) : null}

      <button
        type="button"
        disabled={!canGenerate}
        onClick={() => void handleGenerateQr()}
        className="rounded-lg border border-zinc-300 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700"
      >
        {generating ? t("walletGeneratingQr") : t("walletGenerateQr")}
      </button>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${formId}-dialog-title`}
            className="max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
          >
            <h3 id={`${formId}-dialog-title`} className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {t("walletQrModalTitle")}
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t("walletQrModalHint")}</p>
            {qrSrc ? (
              <div className="mt-4 flex justify-center rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700">
                {/* eslint-disable-next-line @next/next/no-img-element -- data URL from qrcode */}
                <img src={qrSrc} alt="" width={256} height={256} className="h-64 w-64" />
              </div>
            ) : null}
            {errorMsg ? (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
                {errorMsg}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={confirming}
                onClick={() => void handleConfirmPayment()}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {confirming ? t("walletConfirming") : t("walletConfirmPayment")}
              </button>
              <button
                type="button"
                disabled={confirming}
                onClick={closeModal}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                {t("walletCloseModal")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
