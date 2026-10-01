import type { SQLiteDatabase } from 'expo-sqlite';
import {
  ORDER_STATUSES,
  type Order,
  type OrderStatus,
  type OrderWithClient,
} from '../../domain/types';
import { newId, nowISO } from '../../utils/id';

interface OrderRow {
  id: string;
  client_id: string;
  garment: string;
  description: string;
  due_date: string;
  price_minor: number;
  deposit_minor: number;
  status: string;
  created_at: string;
  updated_at: string;
  client_name?: string;
}

const asStatus = (s: string): OrderStatus =>
  (ORDER_STATUSES as readonly string[]).includes(s) ? (s as OrderStatus) : 'new';

const toOrder = (r: OrderRow): Order => ({
  id: r.id,
  clientId: r.client_id,
  garment: r.garment,
  description: r.description,
  dueDate: r.due_date,
  priceMinor: r.price_minor,
  depositMinor: r.deposit_minor,
  status: asStatus(r.status),
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const toOrderWithClient = (r: OrderRow): OrderWithClient => ({
  ...toOrder(r),
  clientName: r.client_name ?? '',
});

export type OrderInput = Pick<
  Order,
  'clientId' | 'garment' | 'description' | 'dueDate' | 'priceMinor' | 'depositMinor' | 'status'
>;

const WITH_CLIENT = `
  SELECT o.*, c.name AS client_name
  FROM orders o JOIN clients c ON c.id = o.client_id`;

export async function listOrdersForClient(db: SQLiteDatabase, clientId: string): Promise<Order[]> {
  const rows = await db.getAllAsync<OrderRow>(
    'SELECT * FROM orders WHERE client_id = ? ORDER BY due_date DESC',
    clientId,
  );
  return rows.map(toOrder);
}

/** Orders that are not yet delivered, soonest due first. */
export async function listActiveOrders(db: SQLiteDatabase): Promise<OrderWithClient[]> {
  const rows = await db.getAllAsync<OrderRow>(
    `${WITH_CLIENT} WHERE o.status != 'delivered' ORDER BY o.due_date ASC, o.created_at ASC`,
  );
  return rows.map(toOrderWithClient);
}

export async function listAllOrders(db: SQLiteDatabase): Promise<OrderWithClient[]> {
  const rows = await db.getAllAsync<OrderRow>(`${WITH_CLIENT} ORDER BY o.due_date DESC`);
  return rows.map(toOrderWithClient);
}

export async function getOrder(db: SQLiteDatabase, id: string): Promise<OrderWithClient | null> {
  const row = await db.getFirstAsync<OrderRow>(`${WITH_CLIENT} WHERE o.id = ?`, id);
  return row ? toOrderWithClient(row) : null;
}

export async function createOrder(db: SQLiteDatabase, input: OrderInput): Promise<string> {
  const id = newId();
  const now = nowISO();
  await db.runAsync(
    `INSERT INTO orders
       (id, client_id, garment, description, due_date, price_minor, deposit_minor, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.clientId,
    input.garment,
    input.description.trim(),
    input.dueDate,
    input.priceMinor,
    input.depositMinor,
    input.status,
    now,
    now,
  );
  return id;
}

export async function updateOrder(
  db: SQLiteDatabase,
  id: string,
  input: Omit<OrderInput, 'clientId'>,
): Promise<void> {
  await db.runAsync(
    `UPDATE orders SET garment = ?, description = ?, due_date = ?, price_minor = ?,
       deposit_minor = ?, status = ?, updated_at = ? WHERE id = ?`,
    input.garment,
    input.description.trim(),
    input.dueDate,
    input.priceMinor,
    input.depositMinor,
    input.status,
    nowISO(),
    id,
  );
}

export async function setOrderStatus(
  db: SQLiteDatabase,
  id: string,
  status: OrderStatus,
): Promise<void> {
  await db.runAsync(
    'UPDATE orders SET status = ?, updated_at = ? WHERE id = ?',
    status,
    nowISO(),
    id,
  );
}

export async function deleteOrder(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM orders WHERE id = ?', id);
}
