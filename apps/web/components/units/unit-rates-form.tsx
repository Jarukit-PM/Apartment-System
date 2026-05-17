"use client";

import { SuccessDialog } from "@/components/ui/success-dialog";
import { SubmitButton } from "@/components/ui/submit-button";
import { patchUnit, type ActionState } from "@/lib/actions/portal";
import { useTranslations } from "next-intl";
import { useActionState, useState, type ReactNode } from "react";

const initial: ActionState = { ok: true, message: "" };

type Props = {
  locale: string;
  unitId: string;
  propertyId: string;
  unitLabel: string;
  submitLabel: string;
  children: ReactNode;
};

export function UnitRatesForm({
  locale,
  unitId,
  propertyId,
  unitLabel,
  submitLabel,
  children,
}: Props) {
  const t = useTranslations("UnitsPage");
  const [acknowledgedRevision, setAcknowledgedRevision] = useState<number | null>(null);
  const [state, formAction] = useActionState(patchUnit, initial);

  const revision = state.saveRevision;
  const showSuccess = Boolean(
    state.ok && revision != null && revision !== acknowledgedRevision,
  );

  function dismissSuccess() {
    if (revision != null) setAcknowledgedRevision(revision);
  }

  return (
    <>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="unitId" value={unitId} />
        <input type="hidden" name="propertyId" value={propertyId} />
        <input type="hidden" name="selfServiceUpdate" value="1" />
        <input type="hidden" name="periodOffersUpdate" value="1" />
        {children}
        {!state.ok && state.message ? (
          <p className="text-sm text-red-600" role="alert">
            {state.message}
          </p>
        ) : null}
        <SubmitButton label={submitLabel} />
      </form>

      <SuccessDialog
        open={showSuccess}
        title={t("saveSuccessTitle")}
        description={t("saveSuccessDescription", { label: unitLabel })}
        onClose={dismissSuccess}
        closeAriaLabel={t("saveSuccessClose")}
      />
    </>
  );
}
