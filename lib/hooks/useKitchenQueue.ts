'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchKitchenQueue, type KitchenOrder } from '../api-client';

/**
 * useKitchenQueue — polling hook for kitchen dashboard.
 * Polls GET /api/kitchen/orders every 4 seconds.
 * RULE: Polling, bukan WebSocket (sesuai PRD 4.1).
 * Requires kitchen JWT token from login.
 */
export function useKitchenQueue(token: string | null) {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const POLL_INTERVAL_MS = 4000;

  const fetchQueue = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchKitchenQueue(token);
      setOrders(data.orders);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengambil antrean';
      setError(message);
      // If token expired (401), stop polling
      if (message.includes('Unauthorized') || message.includes('401')) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setOrders([]);
      return;
    }

    setLoading(true);
    fetchQueue().finally(() => setLoading(false));

    intervalRef.current = setInterval(fetchQueue, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [token, fetchQueue]);

  return { orders, loading, error };
}
