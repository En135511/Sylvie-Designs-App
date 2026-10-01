export interface MeasurementField {
  key: string;
  label: string;
}

export const MEASUREMENT_FIELDS: readonly MeasurementField[] = [
  { key: 'neck', label: 'Neck' },
  { key: 'shoulder', label: 'Shoulder' },
  { key: 'chest', label: 'Chest / Bust' },
  { key: 'underbust', label: 'Underbust' },
  { key: 'waist', label: 'Waist' },
  { key: 'hip', label: 'Hip' },
  { key: 'sleeve', label: 'Sleeve length' },
  { key: 'bicep', label: 'Bicep' },
  { key: 'wrist', label: 'Wrist' },
  { key: 'backLength', label: 'Back length' },
  { key: 'frontLength', label: 'Front length' },
  { key: 'shirtLength', label: 'Shirt / top length' },
  { key: 'dressLength', label: 'Dress length' },
  { key: 'skirtLength', label: 'Skirt length' },
  { key: 'rise', label: 'Rise' },
  { key: 'thigh', label: 'Thigh' },
  { key: 'knee', label: 'Knee' },
  { key: 'inseam', label: 'Inseam' },
  { key: 'outseam', label: 'Outseam / trouser length' },
  { key: 'ankle', label: 'Ankle / hem' },
];

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
      'neck',
      'shoulder',
      'chest',
      'waist',
      'hip',
      'sleeve',
      'bicep',
      'wrist',
      'shirtLength',
    ],
  },
  {
    key: 'trousers',
    label: 'Trousers',
    fields: ['waist', 'hip', 'rise', 'thigh', 'knee', 'ankle', 'inseam', 'outseam'],
  },
  {
    key: 'dress',
    label: 'Dress',
    fields: [
      'shoulder',
      'chest',
      'underbust',
      'waist',
      'hip',
      'sleeve',
      'backLength',
      'dressLength',
    ],
  },
  {
    key: 'skirt',
    label: 'Skirt',
    fields: ['waist', 'hip', 'skirtLength'],
  },
  {
    key: 'suit',
    label: 'Suit / Jacket',
    fields: [
      'neck',
      'shoulder',
      'chest',
      'waist',
      'hip',
      'sleeve',
      'bicep',
      'backLength',
      'shirtLength',
      'outseam',
      'inseam',
    ],
  },
  {
    key: 'custom',
    label: 'Other',
    fields: ['neck', 'shoulder', 'chest', 'waist', 'hip', 'sleeve', 'outseam'],
  },
];

const FIELD_BY_KEY = new Map(MEASUREMENT_FIELDS.map((f) => [f.key, f]));

export function fieldLabel(key: string): string {
  return FIELD_BY_KEY.get(key)?.label ?? key;
}

export function garmentLabel(key: string): string {
  return GARMENTS.find((g) => g.key === key)?.label ?? key;
}

export function fieldsForGarment(key: string): MeasurementField[] {
  const garment = GARMENTS.find((g) => g.key === key) ?? GARMENTS[GARMENTS.length - 1]!;
  return garment.fields.flatMap((k) => {
    const field = FIELD_BY_KEY.get(k);
    return field ? [field] : [];
  });
}
