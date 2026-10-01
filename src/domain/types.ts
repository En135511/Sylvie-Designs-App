export type Unit = 'cm' | 'in';

export const ORDER_STATUSES = [
  'new',
  'cutting',
  'sewing',
  'fitting',
  'ready',
  'delivered',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'New',
  cutting: 'Cutting',
  sewing: 'Sewing',
  fitting: 'Fitting',
  ready: 'Ready',
  delivered: 'Delivered',
};

export interface Client {
  id: string;
  name: string;
  phone: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/** Measurement values are always stored in centimetres, keyed by field key. */
export type MeasurementValues = Record<string, number>;

export interface Measurement {
  id: string;
  clientId: string;
  garment: string;
  values: MeasurementValues;
  notes: string;
  /** Local calendar date, YYYY-MM-DD. */
  takenAt: string;
  createdAt: string;
}

export interface Order {
  id: string;
  clientId: string;
  garment: string;
  description: string;
  /** Local calendar date, YYYY-MM-DD. */
  dueDate: string;
  /** Money is stored as integer minor units (e.g. cents) to avoid float errors. */
  priceMinor: number;
  depositMinor: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrderWithClient extends Order {
  clientName: string;
}

export interface Settings {
  unit: Unit;
  currencySymbol: string;
}

export const DEFAULT_SETTINGS: Settings = { unit: 'cm', currencySymbol: '$' };
