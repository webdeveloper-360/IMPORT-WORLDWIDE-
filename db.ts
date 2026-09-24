import "server-only";
import { Redis } from "@upstash/redis";
import { buildSeed } from "@/data/products";
import type { Product } from "@/data/categories";

// Reads UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (or the KV_REST_API_* names Vercel sets).
const redis = Redis.fromEnv();
const day = () => new Date().toISOString().slice(0, 10);

export interface Order {
  id: string; product: string; productId: string; variant: string; qty: number; total: number; currency: string;
  name: string; email: string; phone: string; notes: string;
  address: { street: string; city: string; region: string; country: string; postal: string };
  createdAt: string; paidAt?: string; channel?: string;
}

/* ---- products (public fields) and suppliers (private, separate hash) ---- */
export async function allProducts(): Promise<Product[]> {
  let map = await redis.hgetall<Record<string, Product>>("iw:products");
  if (!map) {
    const seed = buildSeed();
    map = Object.fromEntries(seed.products.map((p) => [p.id, p]));
    await redis.hset("iw:products", map);
    await redis.hset("iw:suppliers", seed.suppliers);
  }
  return Object.values(map);
}
export const getProduct = (id: string) => redis.hget<Product>("iw:products", id);
export async function suppliers() { return (await redis.hgetall<Record<string, string>>("iw:suppliers")) ?? {}; }
export async function saveProduct(p: Product, supplier: string) {
  await redis.hset("iw:products", { [p.id]: p });
  if (supplier) await redis.hset("iw:suppliers", { [p.id]: supplier });
  else await redis.hdel("iw:suppliers", p.id);
}
export async function removeProduct(id: string) { await redis.hdel("iw:products", id); await redis.hdel("iw:suppliers", id); }

/* ---- analytics ---- */
export async function trackVisit() { await Promise.all([redis.incr("iw:visits"), redis.incr(`iw:visits:${day()}`)]); }
export async function trackSearch(q: string) { await redis.zincrby("iw:searches", 1, q); }
export async function getStats() {
  const [visits, today, raw] = await Promise.all([
    redis.get<number>("iw:visits"), redis.get<number>(`iw:visits:${day()}`),
    redis.zrange<(string | number)[]>("iw:searches", 0, 24, { rev: true, withScores: true }),
  ]);
  const top: { q: string; n: number }[] = [];
  for (let i = 0; i < raw.length; i += 2) top.push({ q: String(raw[i]), n: Number(raw[i + 1]) });
  return { visits: visits ?? 0, today: today ?? 0, top };
}

/* ---- orders ---- */
export const putPending = (ref: string, o: Order) => redis.set(`iw:pending:${ref}`, o, { ex: 60 * 60 * 24 * 3 });
export const getPending = (ref: string) => redis.get<Order>(`iw:pending:${ref}`);
export const getOrder = (ref: string) => redis.hget<Order>("iw:orders", ref);
export async function markPaid(o: Order) { return redis.hsetnx("iw:orders", o.id, o); } // idempotent
export async function getOrders(): Promise<Order[]> {
  const m = await redis.hgetall<Record<string, Order>>("iw:orders");
  return Object.values(m ?? {}).sort((a, b) => (b.paidAt ?? "").localeCompare(a.paidAt ?? ""));
}
