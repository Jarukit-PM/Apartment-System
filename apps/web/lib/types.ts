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

export type Unit = {
  id: string;
  propertyId: string;
  label: string;
  floor?: number;
  bedrooms?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
};

export type MaintenanceRequest = {
  id: string;
  unitId: string;
  requestedByResidentId?: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type HealthResponse = {
  status: string;
  mongo: string;
};
