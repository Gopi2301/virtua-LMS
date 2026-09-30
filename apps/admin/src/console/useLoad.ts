import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/** Query keys describe the request; stale responses never replace newer data. */
export function useLoad<T>(loader: () => Promise<T>, dependencies: (string | number | boolean)[]) {
  const key = JSON.stringify(dependencies);
  const loaderRef = useRef(loader);
  useLayoutEffect(() => { loaderRef.current = loader; });
  const [state, setState] = useState<{ key: string; revision: number; data: T | null; error: string | null }>({ key, revision: -1, data: null, error: null });
  const [revision, setRevision] = useState(0);
  const loading = state.key !== key || state.revision !== revision;
  useEffect(() => {
    let active = true;
    loaderRef.current().then(data => {
      if (active) setState({ key, revision, data, error: null });
    }).catch(err => {
      if (active) setState({ key, revision, data: null, error: err instanceof Error ? err.message : 'Unable to load data' });
    });
    return () => { active = false; };
  }, [key, revision]);
  return { data: loading ? null : state.data, error: loading ? null : state.error, loading, reload: () => setRevision(r => r + 1) };
}
