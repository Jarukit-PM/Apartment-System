"use client";

import { SuccessDialog } from "@/components/ui/success-dialog";
import { SubmitButton } from "@/components/ui/submit-button";
import { Link } from "@/i18n/navigation";
import { createUnit, type ActionState } from "@/lib/actions/portal";
import { useTranslations } from "next-intl";
import { useActionState, useState, type ReactNode } from "react";

const initial: ActionState = { ok: true, message: "" };

type Props = {
  locale: string;
  children: ReactNode;
};

export function CreateUnitForm({ locale, children }: Props) {
  const t = useTranslations("UnitsPage");
  const [formKey, setFormKey] = useState(0);
  const [acknowledgedId, setAcknowledgedId] = useState<string | null>(null);
  const [state, formAction] = useActionState(createUnit, initial);

  const created = state.createdUnit;
  const showSuccess = Boolean(created && created.id !== acknowledgedId);

  function dismissSuccess() {
    if (created) setAcknowledgedId(created.id);
  }

  function handleAddAnother() {
    dismissSuccess();
    setFormKey((k) => k + 1);
  }

  return (
  <>
    <form key={formKey} action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      {children}
      {!state.ok && state.message ? (
        <p className="text-sm text-red-600" role="alert">
          {state.message}
        </p>
      ) : null}
      <SubmitButton label={t("addUnitSubmit")} />
    </form>

    <SuccessDialog
      open={showSuccess}
      title={t("createSuccessTitle")}
      description={
        created
          ? t("createSuccessDescription", { label: created.label })
          : undefined
      }
      onClose={dismissSuccess}
      closeAriaLabel={t("createSuccessClose")}
    >
      {created ? (
        <>
          <Link
            href={`/units/${created.id}`}
            className="ap-btn ap-btn-primary inline-flex min-h-11 w-full justify-center text-sm"
            onClick={dismissSuccess}
          >
            {t("createSuccessViewUnit")}
          </Link>
          <button
            type="button"
            className="ap-btn ap-btn-secondary inline-flex min-h-11 w-full justify-center text-sm"
            onClick={handleAddAnother}
          >
            {t("createSuccessAddAnother")}
          </button>
          <Link
            href="/units"
            className="ap-btn ap-btn-ghost inline-flex min-h-11 w-full justify-center text-sm"
            onClick={dismissSuccess}
          >
            {t("createSuccessBackToList")}
          </Link>
        </>
      ) : null}
    </SuccessDialog>
  </>
  );
}
