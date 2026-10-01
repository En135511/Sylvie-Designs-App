import { useFocusQuery } from './useFocusQuery';
import { getSettings } from '../db/repositories/settings';
import { DEFAULT_SETTINGS, type Settings } from '../domain/types';

export function useSettings(): Settings {
  const { data } = useFocusQuery(getSettings, []);
  return data ?? DEFAULT_SETTINGS;
}
