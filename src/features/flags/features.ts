/**
 * Registry of switchable features. Clients and basic measurements are always on; everything
 * here can be turned on or off from the hidden "Feature switches" screen.
 */
export const FEATURES = [
  {
    key: 'orders',
    label: 'Orders',
    description: 'Track garments being made: due dates and progress (cutting, sewing, ready…).',
    defaultOn: false,
  },
  {
    key: 'payments',
    label: 'Payments',
    description: 'Price, deposit and balance due on orders.',
    defaultOn: false,
  },
  {
    key: 'schools',
    label: 'Schools & classes',
    description:
      'Group students into schools and classes, measure whole classes quickly, export class sheets.',
    defaultOn: false,
  },
  {
    key: 'today',
    label: 'Today dashboard',
    description: 'A tab showing overdue and upcoming orders and money still to collect.',
    defaultOn: false,
  },
  {
    key: 'contact',
    label: 'Call & WhatsApp',
    description: 'One-tap call and WhatsApp buttons, and the "your order is ready" message.',
    defaultOn: false,
  },
  {
    key: 'measurementPicker',
    label: 'Choose measurements',
    description:
      'Settings gets a list with a switch for each of about 35 measurements, so she picks which ones appear.',
    defaultOn: false,
  },
  {
    key: 'customMeasurements',
    label: 'Custom measurements',
    description: 'Let her add her own named measurements.',
    defaultOn: false,
  },
  {
    key: 'unitToggle',
    label: 'Centimetres / inches',
    description: 'Setting to switch the measurement unit.',
    defaultOn: false,
  },
  {
    key: 'backup',
    label: 'Backup & restore',
    description: 'Export and restore all data. Recommended to keep on.',
    defaultOn: true,
  },
] as const;

export type FeatureKey = (typeof FEATURES)[number]['key'];
export type FeatureFlags = Record<FeatureKey, boolean>;

export const DEFAULT_FLAGS = Object.fromEntries(
  FEATURES.map((f) => [f.key, f.defaultOn]),
) as FeatureFlags;

/** Merges stored "0"/"1" values over the defaults, ignoring unknown keys. */
export function resolveFlags(stored: Record<string, string>): FeatureFlags {
  const flags = { ...DEFAULT_FLAGS };
  for (const { key } of FEATURES) {
    const value = stored[`flag:${key}`];
    if (value === '1') flags[key] = true;
    if (value === '0') flags[key] = false;
  }
  return flags;
}
