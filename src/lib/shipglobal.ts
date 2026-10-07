import { ShippingQuote } from "@/types/shipping";
import { isDigitalSku, validCountry, validPostcode } from "@/lib/shippingRules";
import { getBookBySku } from "@/lib/books";
import { getStandardBySlug } from "@/lib/standards";

export class ShippingError extends Error {
    constructor(message: string, public status = 502) {
        super(message);
    }
}

export async function getShippingQuote(
    items: { sku: string; quantity: number }[], countryCode: string, postcode: string,
): Promise<ShippingQuote> {
    if (!validCountry(countryCode) || !validPostcode(postcode, countryCode) || !Array.isArray(items) ||
        items.length === 0 || items.length > 100 || items.some((item) =>
            typeof item?.sku !== "string" || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100)) {
        throw new ShippingError("Valid destination and cart items are required", 400);
    }
    const physicalItems = items.filter((item) => !isDigitalSku(item.sku));
    if (countryCode === "IN" || physicalItems.length === 0) {
        return { currency: "INR", packageWeightKg: 0, services: [] };
    }
    let weights: number | Record<string, unknown> | undefined;
    let packageWeightKg = 0;
    for (const item of physicalItems) {
        const product = item.sku.startsWith("std-")
            ? getStandardBySlug(item.sku.slice(4)) : getBookBySku(item.sku);
        const grams = product?.weightsInGram;
        let weight: unknown;
        if (grams !== undefined && Number.isSafeInteger(grams) && grams > 0) {
            weight = grams / 1000;
        } else {
            if (weights === undefined) {
                try {
                    weights = JSON.parse(process.env.SHIPGLOBAL_WEIGHTS_KG || "{}");
                    if (typeof weights === "number") {
                        if (!Number.isFinite(weights) || weights <= 0) throw new Error();
                    } else if (!weights || Array.isArray(weights) || typeof weights !== "object") {
                        throw new Error();
                    }
                } catch {
                    throw new ShippingError("International shipping weights are not configured", 503);
                }
            }
            weight = typeof weights === "number" ? weights : weights![item.sku];
        }
        if (typeof weight !== "number" || !Number.isFinite(weight) || weight <= 0) {
            throw new ShippingError("International shipping is not configured for one or more items. Please contact the store.", 503);
        }
        packageWeightKg += weight * item.quantity;
    }
    packageWeightKg = Math.ceil(packageWeightKg * 1000) / 1000;
    if (!Number.isFinite(packageWeightKg) || packageWeightKg <= 0) throw new ShippingError("Invalid parcel weight", 503);
    const email = process.env.SHIPGLOBAL_EMAIL;
    const password = process.env.SHIPGLOBAL_PASSWORD;
    if (!email || !password) throw new ShippingError("International shipping is temporarily unavailable", 503);
    let response: Response;
    try {
        response = await fetch("https://app.shipglobal.in/apiv1/rates/calculate", {
            method: "POST", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000),
            headers: {
                Authorization: `Basic ${Buffer.from(`${email}:${password}`).toString("base64")}`,
                "Content-Type": "application/json", Accept: "application/json",
            },
            body: JSON.stringify({ package_weight: String(packageWeightKg), country_iso_code_2: countryCode, postcode }),
        });
    } catch {
        throw new ShippingError("Unable to fetch shipping rates. Please try again.");
    }
    if (!response.ok) throw new ShippingError("Shipping provider is unavailable. Please try again.");
    let data;
    try { data = await response.json(); } catch { throw new ShippingError("Invalid shipping provider response"); }
    if (data?.success !== true || data.currency !== "INR" || !Array.isArray(data.services)) {
        throw new ShippingError("Shipping rates are unavailable for this destination. Check the country and postal code.");
    }
    const services: ShippingQuote["services"] = [];
    for (const service of data.services) {
        const amount = service?.subtotal_fee;
        if (typeof service?.title !== "string" || !service.title.trim() ||
            typeof amount !== "number" || !Number.isFinite(amount) || amount < 0 ||
            services.some((existing) => existing.title === service.title)) {
            throw new ShippingError("Invalid shipping provider response");
        }
        services.push({
            title: service.title, amount: Math.round(amount * 100) / 100,
            transitTime: typeof service.transit_time === "string" ? service.transit_time : "",
            notes: typeof service.notes === "string" ? service.notes : "",
        });
    }
    if (!services.length) throw new ShippingError("No shipping services are available for this destination", 422);
    return { currency: "INR", packageWeightKg, services };
}