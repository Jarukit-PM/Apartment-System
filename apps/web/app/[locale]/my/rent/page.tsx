import { getTranslations, setRequestLocale } from "next-intl/server";
import { ActionForm } from "@/components/action-form";
import { selfLeaseAction } from "@/lib/resident-lease-actions";
import { apiGetJsonAuthed } from "@/lib/server-api";
import type { AvailableUnit, ListWrapper } from "@/lib/types";

type PageProps = { params: Promise<{ locale: string }> };

export default async function MyRentPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("MyPortal.rentBook");

  const res = await apiGetJsonAuthed<ListWrapper<AvailableUnit>>("/v1/me/available-units");

  if (!res.ok) {
    const detail = res.error?.message?.trim();
    const hint404 =
      res.status === 404
        ? t("loadError404Hint")
        : res.status === 403
          ? t("loadError403Hint")
          : null;
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{t("title")}</h1>
        <p className="text-sm text-red-600 dark:text-red-400">{t("loadError")}</p>
        {detail ? (
          <p className="text-sm text-zinc-700 dark:text-zinc-300" role="status">
            {detail} ({res.status})
          </p>
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400" role="status">
            {t("loadErrorStatus", { status: res.status })}
          </p>
        )}
        {hint404 ? <p className="text-sm text-zinc-600 dark:text-zinc-400">{hint404}</p> : null}
      </div>
    );
  }

  const units = res.data.data;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{t("title")}</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t("subtitle")}</p>
      </header>

      {units.length === 0 ? (
        <p className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          {t("empty")}
        </p>
      ) : (
        <ul className="space-y-6">
          {units.map((u) => (
            <li
              key={u.id}
              className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                  {t("unitLabel", { label: u.label })}
                </h2>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {t("rentLine", {
                    amount: u.listingRent.amount,
                    currency: u.listingRent.currency,
                  })}
                </p>
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {u.propertyName ?? u.propertyId}
                {u.floor != null ? ` · ${t("floor", { n: u.floor })}` : null}
                {u.bedrooms != null ? ` · ${t("bedrooms", { n: u.bedrooms })}` : null}
              </p>
              <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                <ActionForm action={selfLeaseAction} locale={locale} submitLabel={t("bookSubmit")}>
                  <input type="hidden" name="unitId" value={u.id} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label
                        htmlFor={`start-${u.id}`}
                        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                      >
                        {t("startLabel")}
                      </label>
                      <input
                        id={`start-${u.id}`}
                        name="startDate"
                        type="datetime-local"
                        required
                        className="mt-1 w-full max-w-md rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label
                        htmlFor={`end-${u.id}`}
                        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                      >
                        {t("endLabel")}
                      </label>
                      <input
                        id={`end-${u.id}`}
                        name="endDate"
                        type="datetime-local"
                        className="mt-1 w-full max-w-md rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                      />
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t("endHint")}</p>
                    </div>
                  </div>
                </ActionForm>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
