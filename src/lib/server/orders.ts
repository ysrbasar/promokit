import "server-only";
import { randomBytes } from "node:crypto";
import { readdir } from "node:fs/promises";
import path from "node:path";
import type { Order } from "../payment/orderState";
import { RUNTIME_DIR, readJson, writeJson } from "./jsonStore";

/** Kartla ödenen siparişler: data/runtime/orders/<id>.json (git'e girmez) */
const ORDERS_DIR = path.join(RUNTIME_DIR, "orders");
const ID_RE = /^PK\d{8}-[A-Z0-9]{6}$/;

export const newOrderId = () => {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const r = Array.from(randomBytes(6), (b) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32]).join("");
  return `PK${d}-${r}`;
};

const file = (id: string) => {
  if (!ID_RE.test(id)) throw new Error("Geçersiz sipariş numarası");
  return path.join(ORDERS_DIR, `${id}.json`);
};

export async function getOrder(id: string): Promise<Order | null> {
  if (!ID_RE.test(id)) return null;
  return readJson<Order>(file(id));
}

export async function saveOrder(o: Order) {
  await writeJson(file(o.id), { ...o, updatedAt: new Date().toISOString() });
}

export async function listOrders(): Promise<Order[]> {
  let names: string[] = [];
  try {
    names = (await readdir(ORDERS_DIR)).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
  const all = await Promise.all(names.map((n) => readJson<Order>(path.join(ORDERS_DIR, n))));
  return all.filter((o): o is Order => !!o).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export { ORDER_STATUS_LABEL, applyPaymentStatus, type Order, type OrderStatus } from "../payment/orderState";
