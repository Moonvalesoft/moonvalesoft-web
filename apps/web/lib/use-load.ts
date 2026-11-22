'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import { commonError } from './messages';

/** Sayfa verisini yükler; ortak hata metinlerini ve 401 yönlendirmesini uygular. */
export function useLoad<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api<T>(path));
    } catch (e) {
      setError(commonError(e));
    } finally {
      setLoading(false);
    }
  }, [path]);
  useEffect(() => {
    load();
  }, [load]);
  return { data, setData, error, loading, reload: load };
}
