export interface MenuOption {
  name: string;
  priceAdjustment: number;
}

export interface MenuOptionGroup {
  name: string;
  required: boolean;
  allowMultiple: boolean;
  options: MenuOption[];
}

export interface MenuItem {
  id: string;
  category: string;
  name: string;
  price: number;
  desc: string;
  isAvailable: boolean;
  groups: MenuOptionGroup[];
  image?: string;
}

export interface Category {
  name: string;
  displayOrder: number;
}

export interface RestaurantInfo {
  name: string;
  address: string;
  instagram: string;
  whatsapp: string[];
}

export interface MenuData {
  restaurant: RestaurantInfo;
  categories: Category[];
  menu: MenuItem[];
}

export interface CartItemOption {
  groupName: string;
  optionName: string;
  priceAdjustment: number;
}

export interface CartItem {
  id: string;
  menuId: string;
  name: string;
  basePrice: number;
  qty: number;
  options: CartItemOption[];
  note: string;
  image?: string;
}

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'settlement' | 'expire' | 'cancel';

export interface OrderItem {
  name: string;
  qty: number;
  options: CartItemOption[];
  note: string;
  price: number;
}

export interface Order {
  id: string;
  tableId: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
}

export interface KitchenOrder {
  id: string;
  tableId: string;
  customerName: string;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
}
