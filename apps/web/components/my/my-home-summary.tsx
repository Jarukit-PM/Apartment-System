import { UnitImage } from "@/components/entities/entity-image";
import type { Lease, Property, Unit } from "@/lib/api/types";
import { formatBillingMonth, formatLocaleDate } from "@/lib/domain/format-date";

type Labels = {
  homeLine: string;
  homeUnknown: string;
  leaseStatus: string;
  noActiveLease: string;
  summaryRentLink: string;
  leaseEnds: string;
  leaseOpenEnded: string;
  nextBilling: string;
  nextBillingUnknown: string;
};

type Props = {
  locale: string;
  homeLine: string;
  unit?: Unit;
  property?: Property;
  activeLease?: Lease;
  labels: Labels;
};

export function MyHomeSummary({ locale, homeLine, unit, property, activeLease, labels }: Props) {
  const unitLabel = unit?.label;
  const showImage = Boolean(unitLabel);

  if (!homeLine && !activeLease) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-[var(--foreground)]">{labels.homeUnknown}</p>
        <p className="ap-alert ap-alert-warning">{labels.noActiveLease}</p>
        <p className="text-sm text-[var(--ap-gold-deep)]">{labels.summaryRentLink}</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      {showImage ? (
        <UnitImage
          label={unitLabel!}
          imageUrl={unit?.imageUrl}
          propertyImageUrl={property?.imageUrl}
          className="w-24 shrink-0 sm:w-28"
          aspect="square"
        />
      ) : null}
      <div className="min-w-0 flex-1 space-y-3">
        <p className="text-sm font-medium text-[var(--foreground)]">{homeLine || labels.homeUnknown}</p>

        {activeLease ? (
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="ap-label !mb-0.5">{labels.leaseEnds}</dt>
              <dd className="font-medium text-[var(--foreground)]">
                {activeLease.endDate
                  ? formatLocaleDate(activeLease.endDate, locale)
                  : labels.leaseOpenEnded}
              </dd>
            </div>
            <div>
              <dt className="ap-label !mb-0.5">{labels.nextBilling}</dt>
              <dd className="font-medium text-[var(--foreground)]">
                {activeLease.nextRentBillMonth
                  ? formatBillingMonth(activeLease.nextRentBillMonth, locale)
                  : labels.nextBillingUnknown}
              </dd>
            </div>
            <div>
              <dt className="sr-only">Status</dt>
              <dd className="text-[var(--ap-muted)]">{labels.leaseStatus}</dd>
            </div>
          </dl>
        ) : (
          <div className="space-y-2">
            <p className="ap-alert ap-alert-warning">{labels.noActiveLease}</p>
            <p className="text-sm text-[var(--ap-gold-deep)]">{labels.summaryRentLink}</p>
          </div>
        )}
      </div>
    </div>
  );
}
