/** API wire types aligned with Go /v1 JSON responses. */

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: { field: string; issue: string }[];
    requestId?: string;
  };
};

export type ListWrapper<T> = {
  data: T[];
  meta: { nextCursor: string | null };
};

export type SingleWrapper<T> = { data: T };

export type Property = {
  id: string;
  name: string;
  imageUrl?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type RentalPeriodOfferWire = {
  periodId: string;
  amount: number;
  currency: string;
};

export type Unit = {
  id: string;
  propertyId: string;
  label: string;
  floor?: number;
  bedrooms?: number;
  status: string;
  listingRent?: { amount: number; currency: string };
  rentalPeriodOffers?: RentalPeriodOfferWire[];
  selfServiceEnabled?: boolean;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type AvailableUnit = {
  id: string;
  propertyId: string;
  propertyName?: string;
  propertyImageUrl?: string;
  imageUrl?: string;
  label: string;
  floor?: number;
  bedrooms?: number;
  status: string;
  listingRent?: { amount: number; currency: string };
  rentalPeriodOffers?: RentalPeriodOfferWire[];
  selfServiceEnabled: boolean;
};

export type Resident = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  primaryUnitId?: string;
  createdAt: string;
  updatedAt: string;
};

export type Lease = {
  id: string;
  unitId: string;
  residentIds: string[];
  startDate: string;
  endDate?: string;
  status: string;
  rent: { amount: number; currency: string };
  rentBasis?: string;
  nextRentBillMonth?: string;
  createdAt: string;
  updatedAt: string;
};

export type MaintenanceRequest = {
  id: string;
  unitId: string;
  requestedByResidentId?: string;
  title: string;
  description: string;
  imageUrls?: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type HealthResponse = {
  status: string;
  mongo: string;
};

/** GET /v1/me/summary */
export type MeSummaryData = {
  resident: Resident;
  leases: Lease[];
  primaryUnit?: Unit;
  property?: Property;
  activeLease?: Lease;
};

export type Invoice = {
  id: string;
  leaseId: string;
  residentId: string;
  description: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: string;
  billingMonth?: string;
  createdAt: string;
  updatedAt: string;
};

/** GET /v1/wallet */
export type WalletDocWire = {
  userId: string;
  balanceSatang: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

export type WalletLedgerEntry = {
  id: string;
  kind: string;
  amountSatang: number;
  createdAt: string;
  peerUserId?: string | null;
};

export type WalletBundle = {
  wallet: WalletDocWire;
  ledger: WalletLedgerEntry[];
};
