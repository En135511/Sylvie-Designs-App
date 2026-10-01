import { useSQLiteContext } from 'expo-sqlite';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_FLAGS, resolveFlags, type FeatureFlags, type FeatureKey } from './features';

interface FlagsContextValue {
  flags: FeatureFlags;
  setFlag: (key: FeatureKey, on: boolean) => Promise<void>;
}

const FlagsContext = createContext<FlagsContextValue | null>(null);

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS);

  useEffect(() => {
    let cancelled = false;
    db.getAllAsync<{ key: string; value: string }>(
      "SELECT key, value FROM settings WHERE key LIKE 'flag:%'",
    ).then((rows) => {
      if (!cancelled) setFlags(resolveFlags(Object.fromEntries(rows.map((r) => [r.key, r.value]))));
    });
    return () => {
      cancelled = true;
    };
  }, [db]);

  const setFlag = useCallback(
    async (key: FeatureKey, on: boolean) => {
      setFlags((prev) => ({ ...prev, [key]: on }));
      await db.runAsync(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        `flag:${key}`,
        on ? '1' : '0',
      );
    },
    [db],
  );

  const value = useMemo(() => ({ flags, setFlag }), [flags, setFlag]);
  return <FlagsContext.Provider value={value}>{children}</FlagsContext.Provider>;
}

function useFlagsContext(): FlagsContextValue {
  const ctx = useContext(FlagsContext);
  if (!ctx) throw new Error('useFlags must be used inside FeatureFlagsProvider');
  return ctx;
}

export const useFlags = (): FeatureFlags => useFlagsContext().flags;
export const useFlag = (key: FeatureKey): boolean => useFlagsContext().flags[key];
export const useSetFlag = () => useFlagsContext().setFlag;
