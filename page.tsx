"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORY_NAMES, type Category, type Product } from "@/data/categories";

const fmt = new Intl.NumberFormat("en-GH", { style: "currency", currency: process.env.NEXT_PUBLIC_CURRENCY ?? "GHS", maximumFractionDigits: 0 });
const PAGE = 24;
type Sort = "pop" | "new" | "lo" | "hi";
const SUGGESTIONS = ["smartwatch", "sneakers", "led lamp", "sunglasses", "headphones"];
const glass = "border border-gold/25 bg-white/5 backdrop-blur-md";
const field = "w-full rounded-xl border border-gold/25 bg-white/5 px-3 py-2.5 text-sm text-bone placeholder:text-mute focus:border-gold focus:outline-none";

function Photo({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return <img src={src} alt={alt} loading="lazy" className={`h-full w-full object-cover ${className}`} onError={(e) => (e.currentTarget.style.opacity = "0")} />;
}

function Card({ p, onOrder }: { p: Product; onOrder: (p: Product) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: React.PointerEvent) => {
    const el = ref.current; if (!el || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 10}deg) rotateY(${(x - 0.5) * 10}deg) translateZ(6px)`;
    el.style.setProperty("--gx", `${x * 100}%`); el.style.setProperty("--gy", `${y * 100}%`);
  };
  const off = p.retail > p.price ? Math.round((1 - p.price / p.retail) * 100) : 0;
  return (
    <article ref={ref} onPointerMove={move} onPointerLeave={() => ref.current && (ref.current.style.transform = "")}
      className={`group relative overflow-hidden rounded-2xl ${glass} transition-transform duration-150 ease-out hover:shadow-2xl hover:shadow-black/50`}>
      <div className="relative aspect-square bg-deep">
        <Photo src={p.img} alt={p.title} />
        {p.tag && <span className="absolute left-3 top-3 rounded-full bg-gradient-to-br from-gold-light to-gold px-3 py-1 text-[11px] font-extrabold text-ink">{p.tag}</span>}
        {p.stock !== "in" && <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold ${p.stock === "out" ? "bg-zinc-700 text-zinc-200" : "bg-red-500 text-white"}`}>{p.stock === "out" ? "Sold out" : "Low stock"}</span>}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 bg-[radial-gradient(circle_at_var(--gx,50%)_var(--gy,50%),rgba(255,255,255,.22),transparent_55%)]" />
      </div>
      <div className="p-4">
        <p className="text-xs text-mute">{CATEGORY_NAMES[p.cat]}</p>
        <h3 className="mt-1 line-clamp-2 min-h-[2.6em] font-display text-lg leading-snug">{p.title}</h3>
        <div className="my-3 flex items-baseline gap-2">
          <b className="text-lg text-gold-light">{fmt.format(p.price)}</b>
          {off > 0 && <><s className="text-sm text-mute">{fmt.format(p.retail)}</s><span className="text-xs text-mute">−{off}%</span></>}
        </div>
        <button disabled={p.stock === "out"} onClick={() => onOrder(p)}
          className="w-full rounded-full bg-gradient-to-br from-gold-light to-gold py-2.5 text-sm font-bold text-ink transition hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-40">
          {p.stock === "out" ? "Sold out" : "Buy now"}
        </button>
      </div>
    </article>
  );
}

function Checkout({ p, onClose }: { p: Product; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [qty, setQty] = useState(1);
  const variants = p.variants.split(",").map((v) => v.trim()).filter(Boolean);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr("");
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    try {
      const res = await fetch("/api/paystack", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: p.id, qty, variant: f.variant, name: f.name, email: f.email, phone: f.phone, notes: f.notes,
          address: { street: f.street, city: f.city, region: f.region, country: f.country, postal: f.postal } }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Payment could not start.");
      window.location.href = j.url; // Paystack hosted checkout
    } catch (x) { setErr((x as Error).message); setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center" onClick={onClose} role="dialog" aria-modal="true" aria-label="Checkout">
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-xl overflow-auto rounded-3xl border border-gold/25 bg-gradient-to-br from-emerald to-deep p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <h2 className="font-display text-3xl">Checkout</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-3xl leading-none text-mute hover:text-bone">&times;</button>
        </div>
        <div className={`my-4 flex items-center gap-4 rounded-2xl p-3 ${glass}`}>
          <div className="h-16 w-16 overflow-hidden rounded-xl bg-deep"><Photo src={p.img} alt="" /></div>
          <div className="flex-1"><b>{p.title}</b><p className="text-sm text-gold-light">{fmt.format(p.price * qty)}</p></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className={`${field} sm:col-span-2`} name="name" required placeholder="Full name" autoComplete="name" />
          <input className={field} name="email" type="email" required placeholder="Email (for your receipt)" autoComplete="email" />
          <input className={field} name="phone" type="tel" required placeholder="Phone / WhatsApp, with country code" autoComplete="tel" />
          <input className={`${field} sm:col-span-2`} name="street" required placeholder="Street address" autoComplete="street-address" />
          <input className={field} name="city" required placeholder="City" autoComplete="address-level2" />
          <input className={field} name="region" placeholder="Region / state" autoComplete="address-level1" />
          <input className={field} name="country" required placeholder="Country" autoComplete="country-name" />
          <input className={field} name="postal" placeholder="Postal code" autoComplete="postal-code" />
          <select className={field} name="variant" aria-label="Variant">{variants.map((v) => <option key={v} className="bg-deep">{v}</option>)}</select>
          <input className={field} type="number" min={1} max={99} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} aria-label="Quantity" />
          <textarea className={`${field} sm:col-span-2`} name="notes" placeholder="Delivery instructions (optional)" rows={2} />
        </div>
        {err && <p role="alert" className="mt-3 text-sm text-red-400">{err}</p>}
        <button disabled={busy} className="mt-5 w-full rounded-full bg-gradient-to-br from-gold-light to-gold py-3 font-bold text-ink disabled:opacity-60">
          {busy ? "Opening Paystack…" : `Pay ${fmt.format(p.price * qty)} with Paystack`}
        </button>
        <p className="mt-2 text-center text-xs text-mute">Secure payment by Paystack. The price is confirmed on our server.</p>
      </form>
    </div>
  );
}

export default function Storefront() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | "all">("all");
  const [sort, setSort] = useState<Sort>("pop");
  const [shown, setShown] = useState(PAGE);
  const [order, setOrder] = useState<Product | null>(null);
  const [paid, setPaid] = useState<{ id: string; product: string; total: number } | "failed" | null>(null);
  const [menu, setMenu] = useState(false);
  const logged = useRef("");

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setProducts).catch(() => setProducts([]));
    if (!sessionStorage.getItem("iw_visit")) { sessionStorage.setItem("iw_visit", "1"); fetch("/api/track", { method: "POST", body: JSON.stringify({ type: "visit" }) }); }
    const ref = new URLSearchParams(location.search).get("reference");
    if (ref) {
      fetch(`/api/paystack?reference=${encodeURIComponent(ref)}`).then(async (r) => setPaid(r.ok ? await r.json() : "failed")).catch(() => setPaid("failed"));
      history.replaceState(null, "", "/");
    }
  }, []);

  // Log a search once the buyer pauses typing.
  useEffect(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2 || term === logged.current) return;
    const t = setTimeout(() => { logged.current = term; fetch("/api/track", { method: "POST", body: JSON.stringify({ type: "search", q: term }) }); }, 1000);
    return () => clearTimeout(t);
  }, [q]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    const l = (products ?? []).filter((p) => (cat === "all" || p.cat === cat) && (!term || `${p.title} ${p.desc} ${CATEGORY_NAMES[p.cat]}`.toLowerCase().includes(term)));
    const by: Record<Sort, (a: Product, b: Product) => number> = { pop: (a, b) => b.pop - a.pop, new: (a, b) => b.added - a.added, lo: (a, b) => a.price - b.price, hi: (a, b) => b.price - a.price };
    return l.sort(by[sort]);
  }, [products, q, cat, sort]);
  useEffect(() => setShown(PAGE), [q, cat, sort]);
  const top3 = useMemo(() => [...(products ?? [])].sort((a, b) => b.pop - a.pop).slice(0, 3), [products]);

  const onSearch = (v: string) => { if (!q && v) document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }); setQ(v); };

  return (
    <main>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-gold/20 bg-ink/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <a href="#top" className="leading-none"><b className="font-display text-2xl italic">Import Worldwide</b><small className="mt-1 block text-[10px] tracking-[.16em] text-gold-light">GLOBAL SOURCING</small></a>
          <nav className="hidden gap-8 text-sm text-bone/80 md:flex"><a href="#shop" className="hover:text-bone">Shop</a><a href="#how" className="hover:text-bone">How it works</a></nav>
          <button className="md:hidden text-2xl" aria-label="Menu" aria-expanded={menu} onClick={() => setMenu(!menu)}>&#9776;</button>
        </div>
        {menu && <div className="flex flex-col gap-3 border-t border-gold/20 px-5 py-4 md:hidden" onClick={() => setMenu(false)}><a href="#shop">Shop</a><a href="#how">How it works</a></div>}
      </header>

      <section id="top" className="relative flex min-h-[88vh] items-center overflow-hidden bg-[radial-gradient(ellipse_at_75%_10%,rgba(201,162,79,.22),transparent_55%),linear-gradient(160deg,#0f3d2e,#0b1f18_62%,#06120e)] pt-24">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-5 pb-16 lg:grid-cols-[1.15fr_.85fr]">
          <div>
            <h1 className="max-w-[14ch] font-display text-5xl leading-[1.02] sm:text-7xl">Global sourcing, delivered to your door.</h1>
            <p className="mt-5 max-w-[46ch] text-lg text-bone/80">Search the 2026 catalog of phones, wearables, streetwear, smart home and more. Pay securely, and we ship worldwide.</p>
            <label className="mt-8 block">
              <span className="sr-only">Search products</span>
              <div className={`flex items-center gap-3 rounded-2xl ${glass} px-5 shadow-2xl shadow-black/40 focus-within:border-gold`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold-light"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                <input value={q} onChange={(e) => onSearch(e.target.value)} type="search" placeholder="Search smartwatches, jackets, lamps…" className="h-16 w-full bg-transparent text-lg text-bone placeholder:text-mute focus:outline-none" />
              </div>
            </label>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              {SUGGESTIONS.map((s) => <button key={s} onClick={() => onSearch(s)} className={`rounded-full px-4 py-1.5 ${glass} text-bone/80 hover:text-bone`}>{s}</button>)}
            </div>
          </div>
          <div className="relative mx-auto hidden h-[440px] w-full max-w-md lg:block" style={{ perspective: 1200 }} aria-hidden>
            {top3.map((p, i) => (
              <div key={p.id} className="absolute w-[62%] overflow-hidden rounded-3xl border border-gold/30 shadow-2xl shadow-black/60"
                style={{ aspectRatio: "3/4", left: ["0%", "18%", "38%"][i], top: ["36px", "0px", "64px"][i], transform: `translateZ(${20 + i * 50}px) rotate(${[-6, 2, 8][i]}deg)` }}>
                <Photo src={p.img} alt="" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {paid && (
        <div className={`mx-auto mt-6 max-w-3xl rounded-2xl p-5 text-center ${glass}`} role="status">
          {paid === "failed" ? <p>We could not confirm your payment yet. If you were charged, email us your Paystack receipt.</p>
            : <><p className="font-display text-2xl text-gold-light">Payment received</p><p className="text-sm text-bone/80">Order {paid.id}: {paid.product}, {fmt.format(paid.total)}. We will contact you with delivery details.</p></>}
        </div>
      )}

      <section id="shop" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-20">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div><h2 className="font-display text-4xl">The 2026 catalog</h2><p className="text-mute">{products ? `${list.length} of ${products.length} products` : "Loading…"}</p></div>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort" className={`${field} w-auto`}>
            <option value="pop" className="bg-deep">Most popular</option><option value="new" className="bg-deep">Newest</option>
            <option value="lo" className="bg-deep">Price: low to high</option><option value="hi" className="bg-deep">Price: high to low</option>
          </select>
        </div>
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Categories">
          {(["all", ...Object.keys(CATEGORY_NAMES)] as (Category | "all")[]).map((k) => (
            <button key={k} aria-pressed={cat === k} onClick={() => setCat(k)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${cat === k ? "bg-gold font-bold text-ink" : `${glass} text-bone/80`}`}>{k === "all" ? "All" : CATEGORY_NAMES[k]}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
          {list.slice(0, shown).map((p) => <Card key={p.id} p={p} onOrder={setOrder} />)}
        </div>
        {products && !list.length && <p className="py-20 text-center text-mute">No products match “{q}”. Try another word or pick All.</p>}
        {list.length > shown && <div className="mt-10 text-center"><button onClick={() => setShown(shown + PAGE)} className={`rounded-full px-8 py-3 font-semibold ${glass}`}>Show more</button></div>}
      </section>

      <section id="how" className="border-t border-gold/20 bg-deep px-5 py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-8 font-display text-4xl">How it works</h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {[["Choose", "Pick an item, variant and quantity."], ["Pay securely", "Enter your delivery details and pay with Paystack."], ["We deliver", "We source the item from our verified supplier and ship it to you."]].map(([t, d], i) => (
              <li key={t} className={`rounded-2xl p-6 ${glass}`}><h3 className="font-display text-2xl">{i + 1}. {t}</h3><p className="mt-2 text-mute">{d}</p></li>
            ))}
          </ol>
        </div>
      </section>
      <footer className="border-t border-gold/20 px-5 py-10 text-center text-sm text-mute">&copy; {new Date().getFullYear()} Import Worldwide. Global sourcing, delivered to your door.</footer>
      {order && <Checkout p={order} onClose={() => setOrder(null)} />}
    </main>
  );
}
