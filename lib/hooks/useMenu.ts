'use client';

import { useState, useEffect } from 'react';
import { fetchMenu, type ApiCategory, type ApiMenuItem } from '../api-client';

export type { ApiCategory, ApiMenuItem };

/**
 * useMenu — fetches full menu from backend API.
 * Falls back to loading state while fetching.
 * Data is cached per-session (no re-fetch on navigation).
 */

// Module-level cache so we don't re-fetch if hook remounts
let cachedCategories: ApiCategory[] | null = null;
let isFetching = false;
const listeners: (() => void)[] = [];

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

export function useMenu() {
  const [categories, setCategories] = useState<ApiCategory[]>(
    cachedCategories ?? []
  );
  const [loading, setLoading] = useState(!cachedCategories);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedCategories) {
      setCategories(cachedCategories);
      setLoading(false);
      return;
    }

    if (isFetching) {
      // Another instance is already fetching — subscribe to result
      const onUpdate = () => {
        setCategories(cachedCategories ?? []);
        setLoading(false);
      };
      listeners.push(onUpdate);
      return () => {
        const idx = listeners.indexOf(onUpdate);
        if (idx >= 0) listeners.splice(idx, 1);
      };
    }

    isFetching = true;
    fetchMenu()
      .then((data) => {
        cachedCategories = data.categories;
        setCategories(data.categories);
        setError(null);
        notifyListeners();
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Gagal memuat menu');
      })
      .finally(() => {
        isFetching = false;
        setLoading(false);
      });
  }, []);

  // Helper: get all menu items flat
  const allItems: ApiMenuItem[] = categories.flatMap((c) => c.menus);

  // Helper: get grouped menu (category with items)
  const grouped = categories
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((cat) => ({
      category: { name: cat.name, displayOrder: cat.displayOrder },
      items: cat.menus,
    }));

  return { categories, grouped, allItems, loading, error };
}

// Utility helpers (same API as old lib/menu.ts)
export function getMinPrice(item: ApiMenuItem): number {
  let min = item.price;
  for (const group of item.groups) {
    const adjustments = group.options.map((o) => o.priceAdjustment);
    if (adjustments.length > 0) {
      min += Math.min(...adjustments);
    }
  }
  return min;
}

export function hasVariants(item: ApiMenuItem): boolean {
  return item.groups.length > 0;
}
