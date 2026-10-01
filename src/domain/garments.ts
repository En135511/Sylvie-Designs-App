export interface MeasurementField {
  key: string;
  label: string;
}

export const MEASUREMENT_FIELDS: readonly MeasurementField[] = [
  // General
  { key: 'height', label: 'Height' },
  // Upper body
  { key: 'neck', label: 'Neck' },
  { key: 'shoulder', label: 'Shoulder' },
  { key: 'chest', label: 'Chest / Bust' },
  { key: 'underbust', label: 'Underbust' },
  { key: 'bustPoint', label: 'Bust span' },
  { key: 'shoulderToBust', label: 'Shoulder to bust' },
  { key: 'frontChestWidth', label: 'Front chest width' },
  { key: 'backWidth', label: 'Back width' },
  { key: 'armhole', label: 'Armhole' },
  { key: 'waist', label: 'Waist' },
  { key: 'highHip', label: 'High hip' },
  { key: 'hip', label: 'Hip' },
  { key: 'napeToWaist', label: 'Nape to waist' },
  { key: 'backLength', label: 'Back length' },
  { key: 'frontLength', label: 'Front length' },
  { key: 'waistToHip', label: 'Waist to hip' },
  // Arms
  { key: 'sleeve', label: 'Sleeve (full)' },
  { key: 'shortSleeve', label: 'Short sleeve' },
  { key: 'bicep', label: 'Bicep' },
  { key: 'elbow', label: 'Elbow' },
  { key: 'wrist', label: 'Wrist' },
  // Lengths
  { key: 'shirtLength', label: 'Shirt length' },
  { key: 'jacketLength', label: 'Jacket length' },
  { key: 'dressLength', label: 'Dress length' },
  { key: 'skirtLength', label: 'Skirt length' },
  { key: 'waistToFloor', label: 'Waist to floor' },
  // Lower body
  { key: 'rise', label: 'Rise' },
  { key: 'crotchLength', label: 'Crotch length' },
  { key: 'thigh', label: 'Thigh' },
  { key: 'knee', label: 'Knee' },
  { key: 'calf', label: 'Calf' },
  { key: 'ankle', label: 'Ankle / hem' },
  { key: 'inseam', label: 'Inseam' },
  { key: 'outseam', label: 'Trouser length' },
];

/** Custom, tailor-defined measurements are stored under keys of the form "custom:<label>". */
export const CUSTOM_PREFIX = 'custom:';

export const customKey = (label: string): string => `${CUSTOM_PREFIX}${label.trim()}`;

export interface Garment {
  key: string;
  label: string;
  /** Field keys shown by default for this garment. */
  fields: readonly string[];
}

export const GARMENTS: readonly Garment[] = [
  {
    key: 'shirt',
    label: 'Shirt',
    fields: [
      'height',
      'neck',
      'shoulder',
      'chest',
      'waist',
      'hip',
      'armhole',
      'sleeve',
      'shortSleeve',
      'bicep',
      'wrist',
      'backWidth',
      'shirtLength',
      'elbow',
      'frontChestWidth',
    ],
  },
  {
    key: 'trousers',
    label: 'Trousers',
    fields: [
      'waist',
      'highHip',
      'hip',
      'rise',
      'crotchLength',
      'thigh',
      'knee',
      'calf',
      'ankle',
      'inseam',
      'outseam',
    ],
  },
  {
    key: 'dress',
    label: 'Dress',
    fields: [
      'height',
      'shoulder',
      'chest',
      'underbust',
      'bustPoint',
      'shoulderToBust',
      'waist',
      'highHip',
      'hip',
      'armhole',
      'sleeve',
      'napeToWaist',
      'backLength',
      'frontLength',
      'waistToHip',
      'dressLength',
      'waistToFloor',
    ],
  },
  {
    key: 'skirt',
    label: 'Skirt',
    fields: ['waist', 'highHip', 'hip', 'waistToHip', 'skirtLength', 'waistToFloor'],
  },
  {
    key: 'blouse',
    label: 'Blouse / Top',
    fields: [
      'shoulder',
      'chest',
      'underbust',
      'bustPoint',
      'shoulderToBust',
      'waist',
      'hip',
      'armhole',
      'sleeve',
      'shortSleeve',
      'bicep',
      'elbow',
      'frontChestWidth',
      'napeToWaist',
      'frontLength',
      'shirtLength',
    ],
  },
  {
    key: 'suit',
    label: 'Suit / Jacket',
    fields: [
      'height',
      'neck',
      'shoulder',
      'chest',
      'waist',
      'hip',
      'armhole',
      'sleeve',
      'bicep',
      'wrist',
      'backWidth',
      'napeToWaist',
      'jacketLength',
      'rise',
      'thigh',
      'knee',
      'ankle',
      'inseam',
      'outseam',
    ],
  },
  {
    key: 'custom',
    label: 'Other',
    fields: ['height', 'neck', 'shoulder', 'chest', 'waist', 'hip', 'sleeve', 'outseam'],
  },
];

const FIELD_BY_KEY = new Map(MEASUREMENT_FIELDS.map((f) => [f.key, f]));

export function fieldLabel(key: string): string {
  if (key.startsWith(CUSTOM_PREFIX)) return key.slice(CUSTOM_PREFIX.length);
  return FIELD_BY_KEY.get(key)?.label ?? key;
}

export function garmentLabel(key: string): string {
  return GARMENTS.find((g) => g.key === key)?.label ?? key;
}

/** The essential measurements shown when "Advanced measurements" is switched off. */
export const CORE_FIELD_KEYS: ReadonlySet<string> = new Set([
  'neck',
  'shoulder',
  'chest',
  'underbust',
  'waist',
  'hip',
  'sleeve',
  'wrist',
  'shirtLength',
  'dressLength',
  'skirtLength',
  'thigh',
  'ankle',
  'inseam',
  'outseam',
]);

/** Measurements grouped by body area, used by the "Choose measurements" screen. */
export const FIELD_GROUPS: readonly { title: string; keys: readonly string[] }[] = [
  { title: 'General', keys: ['height'] },
  {
    title: 'Upper body',
    keys: [
      'neck',
      'shoulder',
      'chest',
      'underbust',
      'bustPoint',
      'shoulderToBust',
      'frontChestWidth',
      'backWidth',
      'armhole',
      'waist',
      'highHip',
      'hip',
      'napeToWaist',
      'backLength',
      'frontLength',
      'waistToHip',
    ],
  },
  { title: 'Arms', keys: ['sleeve', 'shortSleeve', 'bicep', 'elbow', 'wrist'] },
  {
    title: 'Lengths',
    keys: ['shirtLength', 'jacketLength', 'dressLength', 'skirtLength', 'waistToFloor'],
  },
  {
    title: 'Lower body',
    keys: ['rise', 'crotchLength', 'thigh', 'knee', 'calf', 'ankle', 'inseam', 'outseam'],
  },
];

/** The essential set shown until the tailor chooses her own. */
export const DEFAULT_ENABLED_FIELDS: readonly string[] = [...CORE_FIELD_KEYS];

/**
 * Measurements to show for a garment: the garment's template limited to the ones the tailor has
 * switched on. "Other" shows every switched-on measurement.
 */
export function fieldsForGarment(key: string, enabled: ReadonlySet<string>): MeasurementField[] {
  const garment = GARMENTS.find((g) => g.key === key) ?? GARMENTS[GARMENTS.length - 1]!;
  const keys = garment.key === 'custom' ? MEASUREMENT_FIELDS.map((f) => f.key) : garment.fields;
  return keys.flatMap((k) => {
    const field = FIELD_BY_KEY.get(k);
    return field && enabled.has(k) ? [field] : [];
  });
}
