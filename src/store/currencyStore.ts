import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Currency = "INR" | "USD" | "GBP";

export const CURRENCIES: Record<
    Currency,
    { code: Currency; label: string; flag: string; locale: string; rate: number; maxDecimals: number }
> = {
    INR: { code: "INR", label: "INR", flag: "🇮🇳", locale: "en-IN", rate: 1, maxDecimals: 0 },
    USD: { code: "USD", label: "USD", flag: "🇺🇸", locale: "en-US", rate: 0.0119, maxDecimals: 2 },
    GBP: { code: "GBP", label: "GBP", flag: "🇬🇧", locale: "en-GB", rate: 0.0094, maxDecimals: 2 },
};

interface CurrencyStore {
    currency: Currency;
    setCurrency: (c: Currency) => void;
}

export const useCurrencyStore = create<CurrencyStore>()(
    persist(
        (set) => ({
            currency: "INR",
            setCurrency: (currency) => set({ currency }),
        }),
        { name: "bookstore-currency", version: 1 }
    )
);

/**
 * Hook that returns a format function reactive to currency changes.
 * Components using this will re-render whenever the currency changes.
 */
export function useFormatPrice() {
    const currency = useCurrencyStore((s) => s.currency);
    const { code, locale, rate, maxDecimals } = CURRENCIES[currency];
    return (inrPrice: number): string =>
        new Intl.NumberFormat(locale, {
            style: "currency",
            currency: code,
            maximumFractionDigits: maxDecimals,
        }).format(inrPrice * rate);
}
