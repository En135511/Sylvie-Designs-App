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
import {
  DEFAULT_FLAGS,
  resolveAdvanced,
  resolveFlags,
  type AdvancedState,
  type FeatureFlags,
  type FeatureKey,
} from './features';

interface FlagsContextValue {
  flags: FeatureFlags;
  advanced: AdvancedState;
  setFlag: (key: FeatureKey, on: boolean) => Promise<void>;
  unlockAdvanced: () => Promise<void>;
  setAdvancedOpen: (open: boolean) => Promise<void>;
}

const FlagsContext = createContext<FlagsContextValue | null>(null);

const UPSERT =
  'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value';

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS);
  const [advanced, setAdvanced] = useState<AdvancedState>({ unlocked: false, open: false });

  useEffect(() => {
    let cancelled = false;
    db.getAllAsync<{ key: string; value: string }>(
      "SELECT key, value FROM settings WHERE key LIKE 'flag:%'",
    ).then((rows) => {
      if (cancelled) return;
      const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
      setFlags(resolveFlags(stored));
      setAdvanced(resolveAdvanced(stored));
    });
    return () => {
      cancelled = true;
    };
  }, [db]);

  const setFlag = useCallback(
    async (key: FeatureKey, on: boolean) => {
      setFlags((prev) => ({ ...prev, [key]: on }));
      await db.runAsync(UPSERT, `flag:${key}`, on ? '1' : '0');
    },
    [db],
  );

  const unlockAdvanced = useCallback(async () => {
    setAdvanced((prev) => ({ ...prev, unlocked: true }));
    await db.runAsync(UPSERT, 'flag:advancedUnlocked', '1');
  }, [db]);

  const setAdvancedOpen = useCallback(
    async (open: boolean) => {
      setAdvanced((prev) => ({ ...prev, open }));
      await db.runAsync(UPSERT, 'flag:advancedOpen', open ? '1' : '0');
    },
    [db],
  );

  const value = useMemo(
    () => ({ flags, advanced, setFlag, unlockAdvanced, setAdvancedOpen }),
    [flags, advanced, setFlag, unlockAdvanced, setAdvancedOpen],
  );
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
export const useAdvanced = () => {
  const { advanced, unlockAdvanced, setAdvancedOpen } = useFlagsContext();
  return { ...advanced, unlockAdvanced, setAdvancedOpen };
};
