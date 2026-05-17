import type { AvailableUnit } from "@/lib/api/types";

export type RentUnitsSort = "rentAsc" | "rentDesc" | "labelAsc" | "floorAsc";

export type RentUnitsFilters = {
  query: string;
  propertyId: string;
  bedrooms: string;
  minRent: string;
  maxRent: string;
  sort: RentUnitsSort;
};

export const DEFAULT_RENT_UNITS_FILTERS: RentUnitsFilters = {
  query: "",
  propertyId: "",
  bedrooms: "",
  minRent: "",
  maxRent: "",
  sort: "rentAsc",
};

export function unitListingRent(u: AvailableUnit): { amount: number; currency: string } | null {
  const rent = u.listingRent;
  if (rent != null && rent.amount > 0) return rent;
  return null;
}

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase();
}

function parseOptionalNumber(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function unitMatchesFilters(u: AvailableUnit, filters: RentUnitsFilters): boolean {
  const q = normalizeQuery(filters.query);
  if (q) {
    const hay = [u.label, u.propertyName ?? "", u.propertyId].join(" ").toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (filters.propertyId && u.propertyId !== filters.propertyId) return false;
  if (filters.bedrooms !== "") {
    const want = Number(filters.bedrooms);
    if (!Number.isFinite(want) || u.bedrooms !== want) return false;
  }
  const rent = unitListingRent(u);
  const min = parseOptionalNumber(filters.minRent);
  const max = parseOptionalNumber(filters.maxRent);
  if (min != null || max != null) {
    if (!rent) return false;
    if (min != null && rent.amount < min) return false;
    if (max != null && rent.amount > max) return false;
  }
  return true;
}

function compareUnits(a: AvailableUnit, b: AvailableUnit, sort: RentUnitsSort): number {
  switch (sort) {
    case "rentDesc": {
      const ra = unitListingRent(a)?.amount ?? Number.POSITIVE_INFINITY;
      const rb = unitListingRent(b)?.amount ?? Number.POSITIVE_INFINITY;
      if (ra !== rb) return rb - ra;
      break;
    }
    case "labelAsc":
      return a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: "base" });
    case "floorAsc": {
      const fa = a.floor ?? Number.POSITIVE_INFINITY;
      const fb = b.floor ?? Number.POSITIVE_INFINITY;
      if (fa !== fb) return fa - fb;
      break;
    }
    case "rentAsc":
    default: {
      const ra = unitListingRent(a)?.amount ?? Number.POSITIVE_INFINITY;
      const rb = unitListingRent(b)?.amount ?? Number.POSITIVE_INFINITY;
      if (ra !== rb) return ra - rb;
      break;
    }
  }
  return a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: "base" });
}

export function filterAndSortAvailableUnits(
  units: AvailableUnit[],
  filters: RentUnitsFilters,
): AvailableUnit[] {
  return units.filter((u) => unitMatchesFilters(u, filters)).sort((a, b) => compareUnits(a, b, filters.sort));
}

export function countActiveRentFilters(filters: RentUnitsFilters): number {
  let n = 0;
  if (normalizeQuery(filters.query)) n++;
  if (filters.propertyId) n++;
  if (filters.bedrooms !== "") n++;
  if (parseOptionalNumber(filters.minRent) != null) n++;
  if (parseOptionalNumber(filters.maxRent) != null) n++;
  return n;
}

export type RentBrowseFacets = {
  properties: { id: string; name: string }[];
  bedrooms: number[];
};

export function buildRentBrowseFacets(units: AvailableUnit[]): RentBrowseFacets {
  const propMap = new Map<string, string>();
  const bedroomSet = new Set<number>();
  for (const u of units) {
    propMap.set(u.propertyId, u.propertyName ?? u.propertyId);
    if (u.bedrooms != null) bedroomSet.add(u.bedrooms);
  }
  const properties = [...propMap.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  const bedrooms = [...bedroomSet].sort((a, b) => a - b);
  return { properties, bedrooms };
}
