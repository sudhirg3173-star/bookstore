/** Currency symbol map (extend as needed). */
const CURRENCY_SYMBOLS: Record<string, string> = {
    INR: "₹",
    USD: "$",
    GBP: "£",
    EUR: "€",
};

/**
 * Format a numeric price with the correct currency symbol derived from the CSV.
 * @param price    - Numeric price value
 * @param currency - ISO 4217 code stored in the CSV (e.g. "INR", "USD")
 */
export function formatPrice(price: number, currency: string = "INR"): string {
    const code = currency.toUpperCase();
    const symbol = CURRENCY_SYMBOLS[code] ?? code;
    if (code === "INR") {
        return `${symbol} ${price.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
    }
    return `${symbol} ${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
