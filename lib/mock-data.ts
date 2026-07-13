import type { Order, KitchenOrder, OrderStatus } from './types';

const STORAGE_KEY = 'cakkoting_orders';

function loadOrders(): Order[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveOrders(orders: Order[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // ignore
  }
}

export function createOrder(order: Order): void {
  const orders = loadOrders();
  orders.push(order);
  saveOrders(orders);
}

export function getOrder(orderId: string): Order | undefined {
  return loadOrders().find((o) => o.id === orderId);
}

export function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): void {
  const orders = loadOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx >= 0) {
    orders[idx].status = status;
    if (status === 'cancelled') {
      orders[idx].paymentStatus = 'cancel';
    } else if (status === 'paid') {
      orders[idx].paymentStatus = 'settlement';
    }
    saveOrders(orders);
  }
}

export function getKitchenOrders(): KitchenOrder[] {
  return loadOrders()
    .filter((o) => o.status === 'paid' || o.status === 'processing')
    .map((o) => ({
      id: o.id,
      tableId: o.tableId,
      customerName: o.customerName,
      items: o.items,
      status: o.status,
      createdAt: o.createdAt,
    }));
}

export function getAllOrders(): Order[] {
  return loadOrders().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getOrdersByDate(date: Date): Order[] {
  const target = date.toDateString();
  return getAllOrders().filter(
    (o) => new Date(o.createdAt).toDateString() === target
  );
}

export function seedDemoOrders(): void {
  const existing = loadOrders();
  if (existing.length > 0) return;

  const now = Date.now();
  const demo: Order[] = [
    {
      id: 'CK-DEMO-0001',
      tableId: '3',
      customerName: 'Pak Budi',
      items: [
        {
          name: 'Bebek Goreng',
          qty: 2,
          options: [
            { groupName: 'Potongan', optionName: 'Paha', priceAdjustment: 0 },
            { groupName: 'Sambal', optionName: 'Terasi', priceAdjustment: 0 },
          ],
          note: 'Sambal dipisah',
          price: 27500,
        },
        {
          name: 'Es Teh Manis',
          qty: 2,
          options: [{ groupName: 'Suhu', optionName: 'Es', priceAdjustment: 0 }],
          note: '',
          price: 7500,
        },
      ],
      total: 70000,
      status: 'paid',
      paymentStatus: 'settlement',
      createdAt: new Date(now - 8 * 60000).toISOString(),
    },
    {
      id: 'CK-DEMO-0002',
      tableId: '3',
      customerName: 'Pak Budi',
      items: [
        {
          name: 'Nasi Putih',
          qty: 1,
          options: [],
          note: '',
          price: 6000,
        },
      ],
      total: 6000,
      status: 'processing',
      paymentStatus: 'settlement',
      createdAt: new Date(now - 5 * 60000).toISOString(),
    },
    {
      id: 'CK-DEMO-0003',
      tableId: '7',
      customerName: '',
      items: [
        {
          name: 'Ayam Bakar',
          qty: 1,
          options: [
            { groupName: 'Potongan', optionName: 'Dada', priceAdjustment: 0 },
            { groupName: 'Sambal', optionName: 'Ijo', priceAdjustment: 0 },
          ],
          note: '',
          price: 27000,
        },
        {
          name: 'Nasi Putih',
          qty: 1,
          options: [],
          note: '',
          price: 6000,
        },
      ],
      total: 33000,
      status: 'paid',
      paymentStatus: 'settlement',
      createdAt: new Date(now - 3 * 60000).toISOString(),
    },
    {
      id: 'CK-DEMO-0004',
      tableId: '5',
      customerName: 'Mbak Sari',
      items: [
        {
          name: 'Gurameh Goreng',
          qty: 1,
          options: [
            { groupName: 'Sambal', optionName: 'Bawang', priceAdjustment: 0 },
          ],
          note: 'Goreng kering',
          price: 55000,
        },
        {
          name: 'Cendol Original',
          qty: 2,
          options: [],
          note: '',
          price: 13000,
        },
      ],
      total: 81000,
      status: 'processing',
      paymentStatus: 'settlement',
      createdAt: new Date(now - 12 * 60000).toISOString(),
    },
    {
      id: 'CK-DEMO-0005',
      tableId: '1',
      customerName: '',
      items: [
        {
          name: 'Sop Iga',
          qty: 1,
          options: [],
          note: '',
          price: 32000,
        },
      ],
      total: 32000,
      status: 'completed',
      paymentStatus: 'settlement',
      createdAt: new Date(now - 25 * 60000).toISOString(),
    },
  ];

  saveOrders(demo);
}
