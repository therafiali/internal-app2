import { useEffect, useState } from 'react';

interface UseFetchOptions<T> {
  query: () => Promise<{ data: T | null; error: any }>;
  dependencies?: any[]; // optional dependencies to re-run
  skip?: boolean;       // for conditional execution
}

interface UseFetchResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

/**
 * Generic async hook for Supabase queries or any async function
 */
export function useFetch<T = any>({
  query,
  dependencies = [],
  skip = false,
}: UseFetchOptions<T>): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (skip) return;

    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await query();
        if (isMounted) {
          if (error) {
            setError(error.message ?? 'Unknown error');
            setData(null);
          } else {
            setData(data);
          }
        }
      } catch (err: any) {
        if (isMounted) setError(err.message ?? 'Unexpected error');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, dependencies); // 👈 custom dependencies for refresh

  return { data, error, loading };
}
