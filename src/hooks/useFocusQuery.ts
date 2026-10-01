import { useFocusEffect } from 'expo-router';
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';

interface QueryState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | undefined;
}

/**
 * Runs `query` every time the screen gains focus, so lists are always fresh after
 * the user adds or edits something on another screen.
 */
export function useFocusQuery<T>(
  query: (db: SQLiteDatabase) => Promise<T>,
  deps: readonly unknown[],
): QueryState<T> {
  const db = useSQLiteContext();
  const queryRef = useRef(query);
  useEffect(() => {
    queryRef.current = query;
  });
  // Deps are primitives (ids, search text, counters), so a serialized key is a stable trigger.
  const depsKey = JSON.stringify(deps);
  const [state, setState] = useState<QueryState<T>>({
    data: undefined,
    loading: true,
    error: undefined,
  });

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      queryRef
        .current(db)
        .then((data) => !cancelled && setState({ data, loading: false, error: undefined }))
        .catch((error: unknown) => {
          if (!cancelled) {
            setState({
              data: undefined,
              loading: false,
              error: error instanceof Error ? error : new Error(String(error)),
            });
          }
        });
      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps -- depsKey stands in for `deps`
    }, [db, depsKey]),
  );

  return state;
}
