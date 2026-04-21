import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getBookBySku, getRelatedBooks } from "@/lib/books";
import ProductDetailClient from "./ProductDetailClient";
import { getBookUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
    params: { slug: string };
}

export async function generateMetadata({ params }: Props) {
    const book = getBookBySku(params.slug);
    if (!book) return { title: "Book Not Found — Kabadwalbook" };
    return {
        title: `${book.title} — Kabadwalbook`,
        description: book.description.slice(0, 160),
    };
}

export default function ProductPage({ params }: Props) {
    const book = getBookBySku(params.slug);
    if (!book) notFound();

    redirect(getBookUrl(book));
}
