import { notFound, redirect } from "next/navigation";
import { getBookBySku } from "@/lib/books";
import { getBookUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
    params: { slug: string };
}

export async function generateMetadata({ params }: Props) {
    const book = getBookBySku(params.slug);
    if (!book) return { title: "Book Not Found — Kabdwalbook" };
    return {
        title: `${book.title} — Kabdwalbook`,
        description: book.description.slice(0, 160),
    };
}

export default function ProductPage({ params }: Props) {
    const book = getBookBySku(params.slug);
    if (!book) notFound();

    redirect(getBookUrl(book));
}
