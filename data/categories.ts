// Client-safe types and labels. Never put supplier data in this file.
export type Category = "phones" | "apparel" | "home" | "beauty" | "car" | "acc";
export type Stock = "in" | "low" | "out";

export interface Product {
  id: string; title: string; cat: Category; price: number; retail: number; img: string;
  desc: string; tag: string; stock: Stock; variants: string; pop: number; added: number;
}

export const CATEGORY_NAMES: Record<Category, string> = {
  phones: "Phones & Smart Devices",
  apparel: "Apparel & Streetwear",
  home: "Smart Home & Workspace",
  beauty: "Beauty & Wellness",
  car: "Car & Outdoor Gear",
  acc: "Trending Accessories",
};
