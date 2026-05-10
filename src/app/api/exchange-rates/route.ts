import { NextResponse } from "next/server";
import https from "node:https";

export const dynamic = "force-dynamic";

// Cache rates in module scope — refreshed at most once per hour per server instance
let cachedRates: Record<string, number> | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/** Fetch JSON over HTTPS, bypassing TLS cert errors (corporate proxy/firewall). */
function fetchJSON(url: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
        https
            .get(url, { rejectUnauthorized: false }, (res) => {
                let raw = "";
                res.on("data", (chunk) => (raw += chunk));
                res.on("end", () => {
                    try { resolve(JSON.parse(raw)); }
                    catch (e) { reject(e); }
                });
            })
            .on("error", reject);
    });
}

/**
 * GET /api/exchange-rates
 * Returns exchange rates where base = INR.
 * e.g. { USD: 0.01196, GBP: 0.00942, INR: 1, EUR: 0.0107, ... }
 * To convert X USD → INR:  X / rates["USD"]
 */
export async function GET() {
    try {
        if (cachedRates && Date.now() - cacheTime < CACHE_TTL_MS) {
            return NextResponse.json({ rates: cachedRates, cached: true });
        }

        const json = await fetchJSON("https://open.er-api.com/v6/latest/INR") as Record<string, unknown>;
        if (json.result !== "success" || !json.rates) {
            throw new Error("Unexpected response from exchange rate API");
        }

        cachedRates = json.rates as Record<string, number>;
        cacheTime = Date.now();

        return NextResponse.json({ rates: cachedRates, cached: false });
    } catch (err) {
        console.error("Exchange rate fetch failed:", err);
        // Fallback hardcoded rates so checkout never breaks
        const fallback: Record<string, number> = {
            INR: 1,
            USD: 0.01196,
            GBP: 0.00942,
            EUR: 0.01073,
        };
        return NextResponse.json({ rates: fallback, cached: false, fallback: true });
    }
}
