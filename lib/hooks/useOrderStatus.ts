'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchOrderStatus, type OrderStatusResponse } from '../api-client';

/**
 * useOrderStatus — polling hook for customer order tracking page.
 * Polls GET /api/orders/:id every 5 seconds.
 * RULE: Stops polling when order is in a terminal state (completed/cancelled).
 */
export function useOrderStatus(orderId: string | null) {
  const [order, setOrder] = useState<OrderStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const TERMINAL_STATUSES = new Set(['completed', 'cancelled']);
  const POLL_INTERVAL_MS = 5000;

  const fetchStatus = useCallback(async () => {
    if (!orderId) return;
    try {
      const data = await fetchOrderStatus(orderId);
      setOrder(data);
      setError(null);

      // Stop polling if terminal status reached
      if (TERMINAL_STATUSES.has(data.status)) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengambil status pesanan');
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;

    setLoading(true);
    fetchStatus().finally(() => setLoading(false));

    intervalRef.current = setInterval(fetchStatus, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [orderId, fetchStatus]);

  return { order, loading, error };
}
