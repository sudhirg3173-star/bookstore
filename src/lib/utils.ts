import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Book } from "@/types/book";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(price);
}

export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
}

function seededRandom(seed: number): number {
    const x = Math.sin(seed + 1) * 10000;
    return x - Math.floor(x);
}

export function getBookRating(sku: string): number {
    const seed = parseInt(sku.slice(-6), 10) || 42;
    return Math.round((3.5 + seededRandom(seed) * 1.5) * 10) / 10;
}

export function getReviewCount(sku: string): number {
    const seed = parseInt(sku.slice(-4), 10) || 24;
    return Math.floor(seededRandom(seed * 7) * 150) + 5;
}

export function getDiscount(sku: string): number | undefined {
    const seed = parseInt(sku.slice(-3), 10) || 10;
    const val = seededRandom(seed * 3);
    if (val > 0.55) return Math.floor(val * 25) + 5;
    return undefined;
}

export function truncate(text: string, length: number): string {
    if (text.length <= length) return text;
    return text.slice(0, length).trim() + "…";
}

export function getBookUrl(book: Pick<Book, "title" | "authors" | "sku">): string {
    const titleSlug = slugify(book.title);
    const authorSlug = book.authors
        .split(/[,;&]/)
        .map((a) => slugify(a.trim()))
        .filter(Boolean)
        .join("_");
    return `/${titleSlug}/${authorSlug || "unknown"}/${book.sku}`;
}
