"use client";

import { UnitImage } from "@/components/entities/entity-image";
import { RentUnitBookingForm } from "@/components/rent/rent-unit-booking-form";
import { EmptyState } from "@/components/ui/empty-state";
import type { AvailableUnit } from "@/lib/api/types";
import {
  DEFAULT_RENT_UNITS_FILTERS,
  buildRentBrowseFacets,
  countActiveRentFilters,
  filterAndSortAvailableUnits,
  unitListingRent,
  type RentUnitsFilters,
} from "@/lib/domain/available-units-browse";
import { Home, Search, SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useMemo, useRef, useState } from "react";

type Props = {
  units: AvailableUnit[];
  locale: string;
};

function unitMetaLine(
  u: AvailableUnit,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  const parts: string[] = [];
  if (u.propertyName) parts.push(u.propertyName);
  if (u.floor != null) parts.push(t("floor", { n: u.floor }));
  if (u.bedrooms != null) parts.push(t("bedrooms", { n: u.bedrooms }));
  return parts.join(" · ");
}

export function RentUnitsBrowse({ units, locale }: Props) {
  const t = useTranslations("MyPortal.rentBook");
  const tf = useTranslations("FormFeedback");
  const bookSuccess = {
    title: tf("bookedTitle"),
    description: tf("bookedDescription"),
    closeLabel: tf("close"),
  };
  const filtersId = useId();
  const bookingRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<RentUnitsFilters>(DEFAULT_RENT_UNITS_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const facets = useMemo(() => buildRentBrowseFacets(units), [units]);
  const filtered = useMemo(() => filterAndSortAvailableUnits(units, filters), [units, filters]);
  const activeFilterCount = countActiveRentFilters(filters);

  const effectiveSelectedId = useMemo(() => {
    if (filtered.length === 0) return null;
    if (selectedId && filtered.some((u) => u.id === selectedId)) return selectedId;
    return filtered[0].id;
  }, [filtered, selectedId]);

  const selected = filtered.find((u) => u.id === effectiveSelectedId) ?? null;

  function patchFilters(patch: Partial<RentUnitsFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  function clearFilters() {
    setFilters(DEFAULT_RENT_UNITS_FILTERS);
  }

  function selectUnit(id: string) {
    setSelectedId(id);
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      bookingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute inset-y-0 left-3.5 my-auto h-4 w-4 text-[var(--ap-muted)]"
            aria-hidden
          />
          <input
            type="search"
            value={filters.query}
            onChange={(e) => patchFilters({ query: e.target.value })}
            placeholder={t("searchPlaceholder")}
            className="ap-input w-full !pl-11"
            aria-label={t("searchLabel")}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="ap-btn ap-btn-secondary inline-flex items-center gap-2 text-sm"
            aria-expanded={filtersOpen}
            aria-controls={filtersId}
            onClick={() => setFiltersOpen((o) => !o)}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            {t("filtersToggle")}
            {activeFilterCount > 0 ? (
              <span className="ap-badge ap-badge-muted text-[0.6875rem]">{activeFilterCount}</span>
            ) : null}
          </button>

          <label className="sr-only" htmlFor="rent-sort">
            {t("sortLabel")}
          </label>
          <select
            id="rent-sort"
            value={filters.sort}
            onChange={(e) => patchFilters({ sort: e.target.value as RentUnitsFilters["sort"] })}
            className="ap-input w-auto min-w-[10rem] text-sm"
          >
            <option value="rentAsc">{t("sortRentAsc")}</option>
            <option value="rentDesc">{t("sortRentDesc")}</option>
            <option value="labelAsc">{t("sortLabelAsc")}</option>
            <option value="floorAsc">{t("sortFloorAsc")}</option>
          </select>

          {activeFilterCount > 0 ? (
            <button type="button" className="ap-btn ap-btn-ghost inline-flex items-center gap-1 text-sm" onClick={clearFilters}>
              <X className="h-3.5 w-3.5" aria-hidden />
              {t("clearFilters")}
            </button>
          ) : null}

          <p className="ml-auto text-sm text-[var(--ap-muted)]" role="status">
            {t("resultsCount", { shown: filtered.length, total: units.length })}
          </p>
        </div>
      </div>

      {filtersOpen ? (
        <section id={filtersId} className="ap-card grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {facets.properties.length > 1 ? (
            <div>
              <label className="ap-label" htmlFor="rent-filter-property">
                {t("filterProperty")}
              </label>
              <select
                id="rent-filter-property"
                value={filters.propertyId}
                onChange={(e) => patchFilters({ propertyId: e.target.value })}
                className="mt-1 w-full ap-input"
              >
                <option value="">{t("filterAny")}</option>
                {facets.properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {facets.bedrooms.length > 0 ? (
            <div>
              <label className="ap-label" htmlFor="rent-filter-bedrooms">
                {t("filterBedrooms")}
              </label>
              <select
                id="rent-filter-bedrooms"
                value={filters.bedrooms}
                onChange={(e) => patchFilters({ bedrooms: e.target.value })}
                className="mt-1 w-full ap-input"
              >
                <option value="">{t("filterAny")}</option>
                {facets.bedrooms.map((n) => (
                  <option key={n} value={String(n)}>
                    {t("bedrooms", { n })}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <label className="ap-label" htmlFor="rent-filter-min">
              {t("filterMinRent")}
            </label>
            <input
              id="rent-filter-min"
              type="number"
              min={0}
              step={100}
              value={filters.minRent}
              onChange={(e) => patchFilters({ minRent: e.target.value })}
              placeholder={t("filterRentPlaceholder")}
              className="mt-1 w-full ap-input"
            />
          </div>

          <div>
            <label className="ap-label" htmlFor="rent-filter-max">
              {t("filterMaxRent")}
            </label>
            <input
              id="rent-filter-max"
              type="number"
              min={0}
              step={100}
              value={filters.maxRent}
              onChange={(e) => patchFilters({ maxRent: e.target.value })}
              placeholder={t("filterRentPlaceholder")}
              className="mt-1 w-full ap-input"
            />
          </div>
        </section>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          icon={Home}
          title={units.length === 0 ? t("empty") : t("noMatches")}
          description={units.length === 0 ? undefined : t("noMatchesHint")}
          action={
            activeFilterCount > 0 ? (
              <button type="button" className="ap-btn ap-btn-secondary text-sm" onClick={clearFilters}>
                {t("clearFilters")}
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:items-start xl:grid-cols-[minmax(0,1fr)_24rem]">
          <ul className="grid gap-3 sm:grid-cols-2" role="listbox" aria-label={t("unitListLabel")}>
            {filtered.map((u) => {
              const rent = unitListingRent(u);
              const isSelected = u.id === effectiveSelectedId;
              return (
                <li key={u.id} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => selectUnit(u.id)}
                    className={`w-full overflow-hidden rounded-xl border text-left transition-shadow ${
                      isSelected
                        ? "border-[var(--ap-accent)] shadow-[var(--ap-shadow-md)] ring-2 ring-[var(--ap-accent)]/25"
                        : "border-[var(--ap-border)] bg-[var(--ap-surface)] hover:border-[var(--ap-border-strong)] hover:shadow-[var(--ap-shadow-sm)]"
                    }`}
                  >
                    <UnitImage
                      label={u.label}
                      imageUrl={u.imageUrl}
                      propertyImageUrl={u.propertyImageUrl}
                      aspect="square"
                      className="rounded-none border-0 border-b border-[var(--ap-border)]"
                    />
                    <div className="space-y-1 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-[var(--foreground)]">
                          {t("unitLabel", { label: u.label })}
                        </span>
                        {rent ? (
                          <span className="shrink-0 text-xs font-medium text-[var(--foreground)]">
                            {t("rentLine", { amount: rent.amount, currency: rent.currency })}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-[var(--ap-muted)]">{unitMetaLine(u, t)}</p>
                      {(u.rentalPeriodOffers?.length ?? 0) > 0 ? (
                        <p className="text-xs text-[var(--ap-gold-deep)]">{t("periodOffersBadge")}</p>
                      ) : null}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          <aside ref={bookingRef} className="lg:sticky lg:top-4">
            {selected ? (
              <article className="ap-card overflow-hidden">
                <UnitImage
                  label={selected.label}
                  imageUrl={selected.imageUrl}
                  propertyImageUrl={selected.propertyImageUrl}
                  className="rounded-none border-0 border-b border-[var(--ap-border)]"
                />
                <div className="space-y-4 p-5">
                  <header>
                    <h2 className="text-lg font-semibold text-[var(--foreground)]">
                      {t("unitLabel", { label: selected.label })}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--ap-muted)]">{unitMetaLine(selected, t)}</p>
                  </header>
                  <RentUnitBookingForm
                    key={selected.id}
                    unit={selected}
                    locale={locale}
                    success={bookSuccess}
                  />
                </div>
              </article>
            ) : (
              <p className="ap-card p-5 text-sm text-[var(--ap-muted)]">{t("selectUnitHint")}</p>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
