export const ASPECT_ORDER = [
  'proximity_to_cafes',
  'access_to_gym',
  'dog_walking_friendly',
  'quiet_at_night',
  'morning_vs_afternoon_sunlight',
  'laundromat_access',
] as const;

export type AspectKey = typeof ASPECT_ORDER[number];

export interface LifestyleFitAspect {
  aspect: AspectKey;
  property_a: string;
  property_b: string;
  winner?: 'A' | 'B' | 'draw';
}
