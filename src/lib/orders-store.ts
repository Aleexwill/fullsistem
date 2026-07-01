import fs from 'fs';
import path from 'path';

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    notes: string;
  };
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  paymentMethod: string;
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
}

const DATA_FILE = path.join(process.cwd(), 'data', 'orders.json');

function ensureDataFile(): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
}

function save(orders: Order[]): void {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2), 'utf-8');
}

export function getAllOrders(): Order[] {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

export function getOrderById(id: string): Order | null {
  return getAllOrders().find((o) => o.id === id) || null;
}

export function createOrder(data: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Order {
  const orders = getAllOrders();
  const seq = orders.length + 1;
  const order: Order = {
    ...data,
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 8),
    orderNumber: `SP-${String(seq).padStart(5, '0')}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  orders.push(order);
  save(orders);
  return order;
}

export function updateOrder(id: string, data: Partial<Order>): Order | null {
  const orders = getAllOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  orders[idx] = { ...orders[idx], ...data, id: orders[idx].id, orderNumber: orders[idx].orderNumber, createdAt: orders[idx].createdAt, updatedAt: new Date().toISOString() };
  save(orders);
  return orders[idx];
}

export function deleteOrder(id: string): boolean {
  const orders = getAllOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return false;
  orders.splice(idx, 1);
  save(orders);
  return true;
}

export function getOrderStats() {
  const orders = getAllOrders();
  const byStatus: Record<string, number> = {};
  const byPayment: Record<string, number> = {};
  let totalRevenue = 0;
  let paidRevenue = 0;

  orders.forEach((o) => {
    byStatus[o.status] = (byStatus[o.status] || 0) + 1;
    byPayment[o.paymentStatus] = (byPayment[o.paymentStatus] || 0) + 1;
    totalRevenue += o.total;
    if (o.paymentStatus === 'paid') paidRevenue += o.total;
  });

  return {
    total: orders.length,
    byStatus,
    byPayment,
    totalRevenue,
    paidRevenue,
    recentOrders: orders.slice(-5).reverse(),
  };
}
