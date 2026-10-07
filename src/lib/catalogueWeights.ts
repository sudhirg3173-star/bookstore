export function isValidWeightInGrams(value: unknown): boolean {
    if (value === undefined || value === "") return true;
    if (typeof value !== "string" && typeof value !== "number") return false;
    return /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value));
}

export function parseWeightInGrams(value: unknown): number | undefined {
    return isValidWeightInGrams(value) && Number(value) > 0 ? Number(value) : undefined;
}