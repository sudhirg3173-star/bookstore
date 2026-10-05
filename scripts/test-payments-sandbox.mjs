import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [paidOrderId, unpaidOrderId, validationMode] = process.argv.slice(2);
assert.match(paidOrderId || "", /^kb_[a-f0-9]{32}$/, "Supply a completed sandbox order ID as the first argument");
assert.match(unpaidOrderId || "", /^kb_[a-f0-9]{32}$/, "Supply an unpaid sandbox order ID as the second argument");
assert.ok(validationMode === undefined || validationMode === "--shipping", "Optional third argument must be --shipping");
const origin = process.env.PAYMENT_SANDBOX_URL || "http://localhost:3001";

async function request(route, options) {
    return fetch(new URL(route, origin), { ...options, signal: AbortSignal.timeout(20000) });
}

async function verify(orderId, expectedStatus) {
    const response = await request(`/api/payment/verify?order_id=${orderId}`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const data = await response.json();
    assert.equal(data.orderId, orderId);
    assert.equal(data.status, expectedStatus);
}

async function verifyShipping(orderId, expectedStatus) {
    const order = JSON.parse(await readFile(new URL(`../.local/payments/${orderId}.json`, import.meta.url), "utf8"));
    assert.equal(order.status, expectedStatus);
    assert.equal(Boolean(order.paymentId), expectedStatus === "Credit");
    assert.ok(order.shipping, "International order must retain its verified shipping quote");
    assert.equal(order.shipping.currency, "INR");
    assert.equal(order.shipping.countryCode, order.billing.countryCode);
    assert.notEqual(order.shipping.countryCode, "IN");
    assert.equal(order.shipping.postcode, order.billing.pincode);
    assert.ok(order.shipping.title);
    assert.ok(Number.isFinite(order.shipping.packageWeightKg) && order.shipping.packageWeightKg > 0);
    assert.ok(Number.isFinite(order.shipping.amount) && order.shipping.amount >= 0);
    assert.ok(order.items.length > 0);
    assert.ok(order.items.every((item) => item.currency === "INR"), "This local shipping assertion requires an INR catalogue fixture");
    const subtotal = order.items.reduce((total, item) => total + item.price * (1 - (item.discount || 0) / 100) * item.quantity, 0);
    assert.equal(order.amount, Math.round((subtotal + order.shipping.amount) * 100) / 100);
}

await verify(paidOrderId, "Credit");
await verify(unpaidOrderId, "Pending");

const invalidWebhook = await request("/api/payment/webhook", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "x-webhook-timestamp": "0",
        "x-webhook-signature": "invalid",
    },
    body: JSON.stringify({ type: "PAYMENT_SUCCESS_WEBHOOK", data: { order: { order_id: unpaidOrderId } } }),
});
assert.equal(invalidWebhook.status, 403);
assert.equal((await request("/api/payment/verify?status=Credit")).status, 400);
assert.equal((await request("/api/payment/save-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentRequestId: unpaidOrderId, status: "Credit" }),
})).status, 410);

await verify(paidOrderId, "Credit");
await verify(unpaidOrderId, "Pending");
if (validationMode === "--shipping") {
    await verifyShipping(paidOrderId, "Credit");
    await verifyShipping(unpaidOrderId, "Pending");
    console.log("PASS: Paid and unpaid sandbox orders retain matching shipping totals, service, weight and destination in local storage.");
}
console.log("PASS: Cashfree sandbox confirms paid/unpaid orders, rejects forged status/webhooks, and preserves stored payment states.");