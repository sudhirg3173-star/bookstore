import { notFound } from "next/navigation";
import { getAllStandards, getStandardBySlug } from "@/lib/standards";
import StandardDetailClient from "./StandardDetailClient";
import type { Metadata } from "next";

export const dynamic = "force-static";
export const revalidate = false;

interface Props {
    params: { standardSlug: string };
}

export async function generateStaticParams() {
    return getAllStandards().map((s) => ({ standardSlug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const standard = getStandardBySlug(params.standardSlug);
    if (!standard) return { title: "Standard Not Found" };
    return {
        title: `${standard.name} — Kabdwalbook`,
        description: standard.description,
    };
}

export default function StandardDetailPage({ params }: Props) {
    const standard = getStandardBySlug(params.standardSlug);
    if (!standard) notFound();
    return <StandardDetailClient standard={standard} />;
}
