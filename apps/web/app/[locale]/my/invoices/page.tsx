import { getTranslations, setRequestLocale } from "next-intl/server";
import { Receipt } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge, statusVariant } from "@/components/ui/status-badge";
import { apiGetJsonAuthed } from "@/lib/api/server";
import type { Invoice, ListWrapper } from "@/lib/api/types";

type PageProps = { params: Promise<{ locale: string }> };

export default async function MyInvoicesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("MyPortal");

  const res = await apiGetJsonAuthed<ListWrapper<Invoice>>("/v1/me/invoices");

  if (!res.ok) {
    if (res.status === 403) {
      return (
        <div className="mx-auto max-w-3xl">
          <PageHeader title={t("invoicesTitle")} icon={Receipt} />
          <p className="mt-4 text-sm text-[var(--ap-muted)]">{t("forbiddenHint")}</p>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title={t("invoicesTitle")} icon={Receipt} />
        <p className="ap-alert-error mt-4">{t("loadError")}</p>
      </div>
    );
  }

  const rows = res.data.data;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader title={t("invoicesTitle")} icon={Receipt} />

      {rows.length === 0 ? (
        <EmptyState icon={Receipt} title={t("invoicesEmpty")} />
      ) : (
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr>
                <th>{t("colDescription")}</th>
                <th>{t("colAmount")}</th>
                <th>{t("colDue")}</th>
                <th>{t("colStatus")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.description}</td>
                  <td className="tabular-nums">
                    {inv.amount} {inv.currency}
                  </td>
                  <td className="text-[var(--ap-muted)]">{inv.dueDate.slice(0, 10)}</td>
                  <td>
                    <StatusBadge variant={statusVariant(inv.status)}>{inv.status}</StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
