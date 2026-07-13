/**
 * API client for Cak Koting backend (Express at localhost:4000)
 * All customer-facing API calls go through here.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body.message ?? message;
    } catch {
      // ignore parse error
    }
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

export interface ApiMenuOption {
  id: string;
  name: string;
  priceAdjustment: number;
}

export interface ApiMenuOptionGroup {
  id: string;
  name: string;
  required: boolean;
  allowMultiple: boolean;
  displayOrder: number;
  options: ApiMenuOption[];
}

export interface ApiMenuItem {
  id: string;
  name: string;
  price: number;
  desc: string;
  isAvailable: boolean;
  categoryId: string;
  groups: ApiMenuOptionGroup[];
  category?: { name: string };
}

export interface ApiCategory {
  id: string;
  name: string;
  displayOrder: number;
  menus: ApiMenuItem[];
}

export interface ApiMenuResponse {
  categories: ApiCategory[];
}

export function fetchMenu(): Promise<ApiMenuResponse> {
  return apiFetch<ApiMenuResponse>('/api/menu');
}

export function fetchMenuRecommendations(menuId: string): Promise<{ recommendations: ApiMenuItem[] }> {
  return apiFetch<{ recommendations: ApiMenuItem[] }>(
    `/api/menu/${menuId}/recommendations`
  );
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export interface CreateOrderPayload {
  tableNumber: number;
  customerName: string;
  items: {
    menuId: string;
    qty: number;
    options: { groupName: string; optionName: string; priceAdjustment: number }[];
    note: string;
  }[];
}

export interface CreateOrderResponse {
  orderId: string;
  status: string;
  total: number;
  snapToken: string | null;
  snapRedirectUrl: string | null;
}

export function createOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
  return apiFetch<CreateOrderResponse>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface OrderStatusResponse {
  id: string;
  status: 'pending' | 'paid' | 'processing' | 'completed' | 'cancelled';
  total: number;
  customerName: string;
  tableNumber: number;
  items: {
    name: string;
    qty: number;
    priceAtOrder: number;
    note: string;
    options: { groupName: string; optionName: string; priceAdjustment: number }[];
  }[];
  payment: { status: string; paymentType: string | null } | null;
  createdAt: string;
}

export function fetchOrderStatus(orderId: string): Promise<OrderStatusResponse> {
  return apiFetch<OrderStatusResponse>(`/api/orders/${orderId}`);
}

// ─── Kitchen ──────────────────────────────────────────────────────────────────

export interface KitchenOrder {
  id: string;
  status: 'paid' | 'processing';
  customerName: string;
  total: number;
  createdAt: string;
  table: { number: number };
  items: {
    id: string;
    name: string;
    qty: number;
    note: string;
    options: { groupName: string; optionName: string }[];
  }[];
}

export function kitchenLogin(pin: string): Promise<{ token: string }> {
  return apiFetch<{ token: string }>('/api/kitchen/login', {
    method: 'POST',
    body: JSON.stringify({ pin }),
  });
}

export function fetchKitchenQueue(token: string): Promise<{ orders: KitchenOrder[] }> {
  return apiFetch<{ orders: KitchenOrder[] }>('/api/kitchen/orders', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function updateKitchenOrderStatus(
  orderId: string,
  status: 'processing' | 'completed',
  token: string
): Promise<{ order: KitchenOrder }> {
  return apiFetch<{ order: KitchenOrder }>(
    `/api/kitchen/orders/${orderId}/status`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    }
  );
}
