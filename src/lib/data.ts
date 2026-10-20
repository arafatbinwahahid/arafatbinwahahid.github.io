// Every piece of site content lives in src/data/*.json.
// This file only loads that JSON and adds small helpers.
import site from '../data/settings/site.json';
import navigation from '../data/settings/navigation.json';
import contact from '../data/settings/contact.json';
import social from '../data/settings/social.json';
import services from '../data/collections/services.json';
import products from '../data/collections/products.json';

export { site, navigation, contact, social, services, products };

export type Post = {
  slug: string;
  title: string;
  date: string;
  author: string;
  category: string;
  tags: string[];
  excerpt: string;
  image?: { src: string; alt: string };
  draft?: boolean;
  content: Block[];
};

export type Block =
  | { type: 'p' | 'h2' | 'h3' | 'quote'; text: string }
  | { type: 'list'; items: string[]; ordered?: boolean }
  | { type: 'image'; src: string; alt: string; caption?: string };

// One JSON file per blog post in src/data/collections/blog/
const postFiles = import.meta.glob<{ default: Post }>('../data/collections/blog/*.json', { eager: true });

export const posts: Post[] = Object.values(postFiles)
  .map((m) => m.default)
  .filter((p) => !p.draft)
  .sort((a, b) => b.date.localeCompare(a.date));

export const featuredServices = services.filter((s) => s.featured);
export const featuredProducts = products.filter((p) => p.featured);

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(site.locale.replace('_', '-'), { year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatPrice(amount: number | null | undefined) {
  if (amount == null) return '';
  return new Intl.NumberFormat(site.locale.replace('_', '-'), { style: 'currency', currency: site.currency, maximumFractionDigits: 2 }).format(amount);
}

export function whatsappLink(text?: string) {
  const base = `https://wa.me/${contact.whatsapp}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function isExternal(href: string) {
  return /^(https?:)?\/\//.test(href);
}
