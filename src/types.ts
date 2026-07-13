// Shared TypeScript types for backend
// These mirror the frontend lib/types.ts but are independent

export interface CartItemOption {
  groupName: string;
  optionName: string;
  priceAdjustment: number;
}

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'settlement' | 'expire' | 'cancel' | 'deny' | 'failure';
