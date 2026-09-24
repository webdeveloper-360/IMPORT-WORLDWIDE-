import "server-only";
import type { Category, Product } from "./categories";

/**
 * SERVER-ONLY seed. Supplier URLs live here and in the `iw:suppliers` Redis hash,
 * and are never sent to the browser. `server-only` makes the build fail if a client
 * component ever imports this file.
 *
 * Prices are in your store currency (NEXT_PUBLIC_CURRENCY, default GHS).
 * IMAGES: each category cycles through a small pool of Unsplash photos. Verify the URLs
 * load, and replace or extend the pools. Real per-product photos are set in /admin.
 */
const u = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=80`;

const CATS: Record<Category, { range: [number, number]; photos: string[]; bases: string[] }> = {
  phones: {
    range: [180, 9000],
    photos: ["1511707171634-5f897ff02aa9", "1523275335684-37898b6baf30", "1505740420928-5e560c06d30e", "1546868871-7041f2a55e12"].map(u),
    bases: ["Flagship 5G Smartphone", "AMOLED Smartwatch", "ANC Wireless Headphones", "Kids 4G Tracker Watch", "Ultra 5G Smartphone", "Fitness Smartwatch", "Studio Headphones", "Sport Tracker Watch"],
  },
  apparel: {
    range: [220, 2600],
    photos: ["1551028719-00167b16eac5", "1542291026-7eec264c27ff", "1489987707025-afc232f7ea0f", "1523381210434-271e8be1f52b"].map(u),
    bases: ["Waterproof Down Jacket", "Leather-Trim Sneakers", "Minimalist Athleisure Set", "Designer Unisex Hoodie", "Tech Shell Jacket", "Street Runner Sneakers", "Tailored Knit Set", "Oversized Streetwear Tee"],
  },
  home: {
    range: [150, 3200],
    photos: ["1507473885765-e6ed057f782c", "1518455027359-f3f8164ba6bd", "1524758631624-e2822e304c36", "1513694203232-719a280e022f"].map(u),
    bases: ["App-Synced LED Lamp", "Ergonomic Workspace Desk", "Smart Living Light", "Modern Desk Setup", "Levitating Decor Lamp", "Standing Desk Riser", "Ambient Floor Lamp", "HEPA Air Purifier"],
  },
  beauty: {
    range: [140, 2400],
    photos: ["1556228720-195a672e8a03", "1522335789203-aabd1fc54bc9", "1571781926291-c477ebfd024b", "1596462502278-27bfdc403348"].map(u),
    bases: ["LED Therapy Mask", "Sonic Facial Brush", "Hydrogen Skincare Set", "Glow Serum Kit", "Ice Roller Set", "Cosmetic Organizer", "Scalp Care Kit", "Massage Tool Set"],
  },
  car: {
    range: [120, 1900],
    photos: ["1492144534655-ae79c964c9d7", "1504280390367-361c6d9f38f4", "1533473359331-0135ef1b58bf", "1519681393784-d120267933ba"].map(u),
    bases: ["Portable Tire Inflator", "Tactical Camping Lantern", "HUD Dash Mount", "Solar Trail Charger", "Jump Starter Pack", "Trail Camping Kit", "Dash Cam 4K", "Overland Power Station"],
  },
  acc: {
    range: [100, 2100],
    photos: ["1572635196237-14b3f281503f", "1548036328-c9fa89d128fa", "1553062407-98eeb64c6a62", "1584917865442-de89df76afd3"].map(u),
    bases: ["Minimalist UV Sunglasses", "Genuine Leather Tote", "Travel Backpack", "Crossbody Leather Bag", "Polarized Aviators", "Leather Weekender", "Commuter Backpack", "Structured Shoulder Bag"],
  },
};
const SUFFIX = ["", "Pro", "Max", "Lite", "2026 Edition", "Mini", "Elite", "Plus", "Studio", "Air", "Signature"];
const TAGS = ["Trending", "Best seller", "New 2026", "Staff pick", ""];
const KEYS = Object.keys(CATS) as Category[];

export function buildSeed(count = 500) {
  let s = 2026;
  const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  const products: Product[] = [];
  const suppliers: Record<string, string> = {};
  for (let i = 0; i < count; i++) {
    const cat = KEYS[i % 6], c = CATS[cat], j = Math.floor(i / 6);
    const title = `${c.bases[j % 8]} ${SUFFIX[Math.floor(j / 8) % SUFFIX.length]}`.trim();
    const price = Math.round(c.range[0] + Math.pow(rnd(), 1.8) * (c.range[1] - c.range[0]));
    const id = `p${String(i + 1).padStart(3, "0")}`;
    products.push({
      id, title, cat, price, retail: Math.round(price * (1.3 + rnd() * 0.6)),
      img: c.photos[j % c.photos.length],
      desc: `${title}. A 2026 top seller, sourced from a verified supplier, quality-checked and shipped to your door.`,
      tag: TAGS[Math.floor(rnd() * TAGS.length)],
      stock: rnd() > 0.93 ? "low" : rnd() > 0.985 ? "out" : "in",
      variants: "Standard, Black, Silver", pop: Math.floor(rnd() * 1000), added: i,
    });
    // Sample supplier links. Replace with your real ones in /admin.
    suppliers[id] = `https://www.aliexpress.com/item/${1005006000000000 + Math.floor(rnd() * 999999999)}.html`;
  }
  return { products, suppliers };
}
