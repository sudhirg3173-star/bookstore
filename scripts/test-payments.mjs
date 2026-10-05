import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/lib/cashfree.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { cashfreeConfig, cashfreeRequest, cashfreeOrderStatus, verifyCashfreeSignature } =
    await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

test("only PAID orders are successful", () => {
    assert.equal(cashfreeOrderStatus("PAID"), "Credit");
    for (const status of ["ACTIVE", "FAILED", "PENDING", "", "Credit"]) {
        assert.equal(cashfreeOrderStatus(status), "Pending");
    }
    assert.equal(cashfreeOrderStatus("EXPIRED"), "Failed");
    assert.equal(cashfreeOrderStatus("TERMINATED"), "Failed");
});

test("webhook signature uses timestamp and exact raw body", () => {
    const body = '{"amount":10.00}';
    const timestamp = "1617695238078";
    const signature = createHmac("sha256", "test-secret").update(timestamp + body).digest("base64");
    assert.equal(verifyCashfreeSignature(body, timestamp, signature, "test-secret"), true);
    assert.equal(verifyCashfreeSignature('{"amount":10}', timestamp, signature, "test-secret"), false);
    assert.equal(verifyCashfreeSignature(body, timestamp, "bad", "test-secret"), false);
    assert.equal(verifyCashfreeSignature(body, "", signature, "test-secret"), false);
});

test("API uses sandbox by default and never caches status", async () => {
    const previousEnv = { ...process.env };
    const previousFetch = globalThis.fetch;
    try {
        delete process.env.CASHFREE_ENV;
        process.env.CASHFREE_CLIENT_ID = "test-id";
        process.env.CASHFREE_CLIENT_SECRET = "test-secret";
        globalThis.fetch = async (url, options) => {
            assert.equal(url, "https://sandbox.cashfree.com/pg/orders/test-order");
            assert.equal(options.cache, "no-store");
            assert.equal(options.headers["x-api-version"], "2025-01-01");
            return Response.json({ order_status: "PAID" });
        };
        assert.equal((await cashfreeRequest("/orders/test-order")).order_status, "PAID");
        process.env.CASHFREE_ENV = "production";
        assert.equal(cashfreeConfig().apiUrl, "https://api.cashfree.com/pg");
        process.env.CASHFREE_ENV = "invalid";
        assert.throws(cashfreeConfig, /sandbox or production/);
        process.env.CASHFREE_ENV = "sandbox";
        globalThis.fetch = async () => new Response("upstream error", { status: 401 });
        await assert.rejects(cashfreeRequest("/orders/test-order"), /HTTP 401/);
        delete process.env.CASHFREE_CLIENT_SECRET;
        assert.throws(cashfreeConfig, /credentials/);
    } finally {
        process.env = previousEnv;
        globalThis.fetch = previousFetch;
    }
});

const require = createRequire(import.meta.url);
const { NextRequest } = require("next/server");

async function loadModule(relativePath, dependencies, runtimeProcess = process) {
    const sourceText = await readFile(new URL(relativePath, import.meta.url), "utf8");
    const { outputText } = ts.transpileModule(sourceText, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    });
    const module = { exports: {} };
    new Function("require", "module", "exports", "process", outputText)(
        (name) => name in dependencies ? dependencies[name] : require(name), module, module.exports, runtimeProcess,
    );
    return module.exports;
}

const shippingRules = await loadModule("../src/lib/shippingRules.ts", {});
const shipglobal = await loadModule("../src/lib/shipglobal.ts", { "@/lib/shippingRules": shippingRules });

test("ShipGlobal uses server weights, Basic auth, KG and subtotal fees", async () => {
    const previousEnv = { ...process.env };
    const previousFetch = globalThis.fetch;
    try {
        process.env.SHIPGLOBAL_EMAIL = "merchant@example.com";
        process.env.SHIPGLOBAL_PASSWORD = "test-password";
        process.env.SHIPGLOBAL_WEIGHTS_KG = '{"123":0.5}';
        globalThis.fetch = async (url, options) => {
            assert.equal(url, "https://app.shipglobal.in/apiv1/rates/calculate");
            assert.equal(options.headers.Authorization, `Basic ${Buffer.from("merchant@example.com:test-password").toString("base64")}`);
            assert.equal(options.cache, "no-store");
            assert.deepEqual(JSON.parse(options.body), { package_weight: "1", country_iso_code_2: "GB", postcode: "AB32" });
            return Response.json({
                success: true, currency: "INR", services: [
                    { title: "ShipGlobal Direct", subtotal_fee: 300, price: { logistic_fee: 285 }, transit_time: "7-10 Days" },
                ]
            });
        };
        const quote = await shipglobal.getShippingQuote([{ sku: "123", quantity: 2 }, { sku: "std-example-pdf", quantity: 1 }], "GB", "AB32");
        assert.equal(quote.packageWeightKg, 1);
        assert.equal(quote.services[0].amount, 300);
        await assert.rejects(shipglobal.getShippingQuote([{ sku: "unknown", quantity: 1 }], "GB", "AB32"), /not configured/);
        await assert.rejects(shipglobal.getShippingQuote([{ sku: "123", quantity: 0 }], "GB", "AB32"), /Valid destination/);
        await assert.rejects(shipglobal.getShippingQuote([{ sku: "123", quantity: 1 }], "ZZ", "AB32"), /Valid destination/);
        globalThis.fetch = async () => { throw new Error("Must not call ShipGlobal"); };
        assert.equal((await shipglobal.getShippingQuote([{ sku: "123", quantity: 1 }], "IN", "110001")).services.length, 0);
        assert.equal((await shipglobal.getShippingQuote([{ sku: "std-example-pdf", quantity: 1 }], "GB", "AB32")).services.length, 0);
    } finally {
        process.env = previousEnv;
        globalThis.fetch = previousFetch;
    }
});

test("ShipGlobal numeric default covers all physical SKUs and quantities, excluding PDFs", async () => {
    const previousEnv = { ...process.env };
    const previousFetch = globalThis.fetch;
    try {
        process.env.SHIPGLOBAL_EMAIL = "merchant@example.com";
        process.env.SHIPGLOBAL_PASSWORD = "test-password";
        for (const [configuredWeight, expectedWeight] of [["0.5", 2.5], ["0.3333", 1.667]]) {
            process.env.SHIPGLOBAL_WEIGHTS_KG = configuredWeight;
            globalThis.fetch = async (url, options) => {
                assert.equal(JSON.parse(options.body).package_weight, String(expectedWeight));
                return Response.json({ success: true, currency: "INR", services: [{ title: "ShipGlobal Direct", subtotal_fee: 300 }] });
            };
            const quote = await shipglobal.getShippingQuote([
                { sku: "any-book", quantity: 2 }, { sku: "std-any-standard", quantity: 3 }, { sku: "std-example-pdf", quantity: 5 },
            ], "GB", "SW1A 1AA");
            assert.equal(quote.packageWeightKg, expectedWeight);
        }
        globalThis.fetch = async () => { throw new Error("Must not call ShipGlobal"); };
        assert.equal((await shipglobal.getShippingQuote([{ sku: "any-book", quantity: 1 }], "IN", "110001")).services.length, 0);
        assert.equal((await shipglobal.getShippingQuote([{ sku: "std-example-pdf", quantity: 1 }], "GB", "SW1A 1AA")).services.length, 0);
    } finally {
        process.env = previousEnv;
        globalThis.fetch = previousFetch;
    }
});

test("ShipGlobal rejects invalid default weights without contacting the provider", async () => {
    const previousEnv = { ...process.env };
    const previousFetch = globalThis.fetch;
    try {
        globalThis.fetch = async () => assert.fail("Invalid weights must not contact ShipGlobal");
        for (const weight of ["0", "-0.5", "1e999", "null", "[]", '"0.5"', "invalid"]) {
            process.env.SHIPGLOBAL_WEIGHTS_KG = weight;
            await assert.rejects(shipglobal.getShippingQuote([{ sku: "any-book", quantity: 1 }], "GB", "SW1A 1AA"), (error) => {
                assert.equal(error.status, 503);
                assert.match(error.message, /weights are not configured/);
                return true;
            });
        }
    } finally {
        process.env = previousEnv;
        globalThis.fetch = previousFetch;
    }
});

test("ShipGlobal fails closed on unavailable, malformed or non-INR rates", async () => {
    const previousEnv = { ...process.env };
    const previousFetch = globalThis.fetch;
    try {
        process.env.SHIPGLOBAL_EMAIL = "merchant@example.com";
        process.env.SHIPGLOBAL_PASSWORD = "test-password";
        process.env.SHIPGLOBAL_WEIGHTS_KG = '{"123":0.5}';
        for (const response of [
            new Response("unauthorized", { status: 401 }),
            new Response("not JSON"),
            Response.json({ success: false }),
            Response.json({ success: true, currency: "USD", services: [] }),
            Response.json({ success: true, currency: "INR", services: [] }),
            Response.json({ success: true, currency: "INR", services: [{ title: "Test", subtotal_fee: -1 }] }),
        ]) {
            globalThis.fetch = async () => response;
            await assert.rejects(shipglobal.getShippingQuote([{ sku: "123", quantity: 1 }], "US", "10001"), shipglobal.ShippingError);
        }
        delete process.env.SHIPGLOBAL_PASSWORD;
        await assert.rejects(shipglobal.getShippingQuote([{ sku: "123", quantity: 1 }], "US", "10001"), /temporarily unavailable/);
    } finally {
        process.env = previousEnv;
        globalThis.fetch = previousFetch;
    }
});

async function paymentHarness() {
    const directory = await mkdtemp(path.join(tmpdir(), "bookstore-payments-"));
    const runtimeProcess = {
        env: { NODE_ENV: "development", PAYMENT_LOCAL_STORE: "true", CASHFREE_ENV: "sandbox", NEXT_PUBLIC_APP_URL: "http://localhost:3001" },
        cwd: () => directory,
    };
    const orders = new Map();
    const cashfree = {
        cashfreeConfig: () => ({ mode: "sandbox", clientSecret: "test-secret" }),
        cashfreeOrderStatus, verifyCashfreeSignature,
        cashfreeRequest: async (route, body) => {
            if (body) {
                assert.equal(body.order_currency, "INR");
                assert.equal(body.order_meta.return_url, `http://localhost:3001/payment/success?order_id=${body.order_id}`);
                orders.set(body.order_id, { ...body, order_status: "ACTIVE", payment_session_id: "test-session" });
                return orders.get(body.order_id);
            }
            const orderId = route.split("/")[2];
            if (route.endsWith("/payments")) return [{ cf_payment_id: 12345, payment_status: "SUCCESS" }];
            return orders.get(orderId);
        },
    };
    const firebase = {
        getFirebaseAdmin: () => ({
            auth: {
                verifyIdToken: async (token) => {
                    if (token !== "valid-token") throw new Error("Invalid token");
                    return { uid: "verified-user" };
                },
            }
        })
    };
    const store = await loadModule("../src/lib/paymentOrders.ts", {
        "@/lib/firebaseAdmin": firebase, "@/lib/cashfree": cashfree,
    }, runtimeProcess);
    const book = { sku: "123", title: "Test Book", authors: "Author", price: 100, currency: "INR", imageUrl: "", visible: true, availability: "In Stock" };
    const standard = { slug: "test-standard", name: "Test Standard", publisher: "Publisher", price: 2, pdfPrice: 1, currency: "USD", discount: 10, year: 2026, description: "", imageUrl: "" };
    const standardUtils = await loadModule("../src/lib/standardUtils.ts", {
        "@/lib/utils": { getBookRating: () => 4, getReviewCount: () => 10 },
    });
    const shippingState = { amount: 300, unavailable: false, calls: [] };
    const shipping = {
        ShippingError: shipglobal.ShippingError,
        getShippingQuote: async (items, countryCode, postcode) => {
            shippingState.calls.push({ items, countryCode, postcode });
            if (shippingState.unavailable) throw new shipglobal.ShippingError("Shipping provider is unavailable");
            return {
                currency: "INR", packageWeightKg: 0.5, services: [
                    { title: "ShipGlobal Direct", amount: shippingState.amount, transitTime: "7-10 Days", notes: "" },
                ]
            };
        },
    };
    const dependencies = {
        "@/lib/cashfree": cashfree, "@/lib/paymentOrders": store, "@/lib/firebaseAdmin": firebase,
        "@/lib/shipglobal": shipping, "@/lib/shippingRules": shippingRules,
        "@/lib/books": { getBookBySku: (sku) => sku === "123" ? book : sku === "discounted" ? { ...book, sku, discount: 10 } : undefined },
        "@/lib/standards": { getStandardBySlug: (slug) => slug === standard.slug ? standard : undefined },
        "@/lib/standardUtils": standardUtils,
        "@/app/api/exchange-rates/route": { GET: async () => Response.json({ rates: { INR: 1, USD: 0.01 } }) },
    };
    const create = await loadModule("../src/app/api/payment/create-request/route.ts", dependencies, runtimeProcess);
    const verify = await loadModule("../src/app/api/payment/verify/route.ts", dependencies, runtimeProcess);
    const webhook = await loadModule("../src/app/api/payment/webhook/route.ts", dependencies, runtimeProcess);
    const body = {
        amount: 100, buyerName: "Test Buyer", email: "buyer@example.com", phone: "9999999999",
        billing: { address: "Test street", state: "Delhi", pincode: "110001" },
        items: [{ book: { sku: "123", price: 1 }, quantity: 1 }],
    };
    return {
        orders, store, runtimeProcess, shippingState,
        create: (changes = {}, authorization) => create.POST(new NextRequest("http://localhost:3001/api/payment/create-request", {
            method: "POST", headers: { "Content-Type": "application/json", ...(authorization ? { authorization } : {}) },
            body: JSON.stringify({ ...body, ...changes }),
        })),
        verify: (orderId) => verify.GET(new NextRequest(`http://localhost:3001/api/payment/verify?order_id=${orderId}`)),
        webhook: (orderId, signed = true, type = "PAYMENT_SUCCESS_WEBHOOK") => {
            const rawBody = JSON.stringify({ type, data: { order: { order_id: orderId } } });
            const timestamp = "1617695238078";
            const signature = createHmac("sha256", "test-secret").update(timestamp + rawBody).digest("base64");
            return webhook.POST(new NextRequest("http://localhost:3001/api/payment/webhook", {
                method: "POST", body: rawBody, headers: {
                    "x-webhook-timestamp": timestamp, "x-webhook-signature": signed ? signature : "bad",
                },
            }));
        },
        cleanup: () => rm(directory, { recursive: true, force: true }),
    };
}

test("international shipping survives Cashfree verification and webhook retries", async () => {
    const harness = await paymentHarness();
    const international = {
        amount: 400, phone: "+447911123456", shippingService: "ShipGlobal Direct",
        billing: { address: "Test street, London", state: "London", pincode: "AB32", countryCode: "GB" },
    };
    try {
        assert.equal((await harness.create({ ...international, shippingService: undefined })).status, 400);
        assert.equal((await harness.create({ ...international, shippingService: "fake" })).status, 409);
        assert.equal((await harness.create({ ...international, amount: 100 })).status, 409);
        assert.equal(harness.orders.size, 0);
        const response = await harness.create(international);
        assert.equal(response.status, 200);
        const { orderId } = await response.json();
        const order = await harness.store.getPaymentOrder(orderId);
        assert.equal(order.amount, 400);
        assert.equal(order.shipping.amount, 300);
        assert.equal(order.shipping.title, "ShipGlobal Direct");
        assert.equal(order.billing.countryCode, "GB");
        assert.equal(harness.orders.get(orderId).order_amount, 400);
        assert.equal((await (await harness.verify(orderId)).json()).status, "Pending");
        assert.equal((await harness.webhook(orderId, false)).status, 403);
        assert.equal((await harness.store.getPaymentOrder(orderId)).status, "Pending");
        harness.orders.get(orderId).order_status = "PAID";
        assert.equal((await (await harness.verify(orderId)).json()).status, "Credit");
        assert.equal((await harness.webhook(orderId)).status, 200);
        assert.equal((await harness.webhook(orderId)).status, 200);
        const paid = await harness.store.getPaymentOrder(orderId);
        assert.equal(paid.status, "Credit");
        assert.equal(paid.paymentId, "12345");
        assert.equal(paid.amount, 400);
        assert.deepEqual(paid.shipping, order.shipping);
        assert.deepEqual(paid.billing, order.billing);
        harness.orders.get(orderId).order_status = "ACTIVE";
        assert.equal((await harness.webhook(orderId, true, "PAYMENT_FAILED_WEBHOOK")).status, 200);
        assert.equal((await harness.store.getPaymentOrder(orderId)).status, "Credit");
        harness.shippingState.amount = 350;
        assert.equal((await harness.create(international)).status, 409);
        harness.shippingState.unavailable = true;
        assert.equal((await harness.create(international)).status, 502);
        assert.equal(harness.orders.size, 1);
    } finally { await harness.cleanup(); }
});

test("domestic and international PDF-only orders do not request physical shipping", async () => {
    const harness = await paymentHarness();
    try {
        assert.equal((await harness.create()).status, 200);
        assert.equal((await harness.create({
            amount: 90, phone: "+447911123456",
            billing: { address: "London", state: "London", pincode: "AB32", countryCode: "GB" },
            items: [{ book: { sku: "std-test-standard-pdf" }, quantity: 1 }],
        })).status, 200);
        assert.equal(harness.shippingState.calls.length, 0);
    } finally { await harness.cleanup(); }
});

test("quote route validates requests and never exposes provider credentials", async () => {
    const route = await loadModule("../src/app/api/shipping/quote/route.ts", { "@/lib/shipglobal": shipglobal });
    const request = (body) => new NextRequest("http://localhost/api/shipping/quote", { method: "POST", body: JSON.stringify(body) });
    assert.equal((await route.POST(request(null))).status, 400);
    assert.equal((await route.POST(request({ items: [], countryCode: "GB", postcode: "AB32" }))).status, 400);
    const response = await route.POST(request({ items: [{ sku: "123", quantity: 1 }], countryCode: "IN", postcode: "110001" }));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), { currency: "INR", packageWeightKg: 0, services: [] });
});

test("create -> persist -> verify: only paid orders confirm, with payment ID", async () => {
    const harness = await paymentHarness();
    try {
        const response = await harness.create({}, "Bearer valid-token");
        assert.equal(response.status, 200);
        const { orderId, paymentSessionId, mode } = await response.json();
        assert.equal(mode, "sandbox");
        assert.equal(paymentSessionId, "test-session");
        const pending = await harness.store.getPaymentOrder(orderId);
        assert.equal(pending.status, "Pending");
        assert.equal(pending.userId, "verified-user");
        assert.equal(pending.items[0].price, 100);
        assert.equal((await (await harness.verify(orderId)).json()).status, "Pending");
        harness.orders.get(orderId).order_status = "PAID";
        assert.equal((await (await harness.verify(orderId)).json()).status, "Credit");
        assert.equal((await harness.store.getPaymentOrder(orderId)).paymentId, "12345");
        harness.orders.get(orderId).order_status = "ACTIVE";
        assert.equal((await (await harness.verify(orderId)).json()).status, "Credit");
        harness.orders.get(orderId).order_amount = 1;
        assert.equal((await harness.verify(orderId)).status, 502);
        assert.equal((await harness.store.getPaymentOrder(orderId)).status, "Credit");
    } finally {
        await harness.cleanup();
    }
});

test("reject invalid auth, tampered total, invalid cart and fabricated return IDs", async () => {
    const harness = await paymentHarness();
    try {
        assert.equal((await harness.create({}, "Bearer invalid-token")).status, 401);
        assert.equal((await harness.create({ amount: 1 })).status, 409);
        assert.equal((await harness.create({ items: [{ book: { sku: "123" }, quantity: -1 }] })).status, 400);
        assert.equal((await harness.create({ items: [{ book: { sku: "unknown" }, quantity: 1 }] })).status, 400);
        assert.equal((await harness.create({ phone: "invalid" })).status, 400);
        assert.equal((await harness.verify("../../outside")).status, 400);
        assert.equal((await harness.verify(`kb_${"0".repeat(32)}`)).status, 404);
        assert.equal(harness.orders.size, 0);
    } finally {
        await harness.cleanup();
    }
});

test("signed webhooks confirm without browser return; retries cannot downgrade paid orders", async () => {
    const harness = await paymentHarness();
    try {
        const { orderId } = await (await harness.create()).json();
        assert.equal((await harness.webhook(orderId, false)).status, 403);
        assert.equal((await harness.store.getPaymentOrder(orderId)).status, "Pending");
        harness.orders.get(orderId).order_status = "PAID";
        assert.equal((await harness.webhook(orderId)).status, 200);
        assert.equal((await harness.webhook(orderId)).status, 200);
        assert.equal((await harness.store.getPaymentOrder(orderId)).status, "Credit");
        harness.orders.get(orderId).order_status = "ACTIVE";
        assert.equal((await harness.webhook(orderId, true, "PAYMENT_FAILED_WEBHOOK")).status, 200);
        assert.equal((await harness.store.getPaymentOrder(orderId)).status, "Credit");
        harness.runtimeProcess.env.CASHFREE_ENV = "production";
        await assert.rejects(harness.store.getPaymentOrder(orderId), /only allowed in development/);
    } finally {
        await harness.cleanup();
    }
});

test("catalogue pricing preserves discounts and USD paperback/PDF standard conversion", async () => {
    const harness = await paymentHarness();
    try {
        const items = ["discounted", "std-test-standard", "std-test-standard-pdf"].map(sku => ({ book: { sku, price: 1, currency: "INR" }, quantity: 1 }));
        const response = await harness.create({ amount: 360, items });
        assert.equal(response.status, 200);
        const { orderId } = await response.json();
        const order = await harness.store.getPaymentOrder(orderId);
        assert.equal(order.amount, 360);
        assert.equal(order.items[1].price, 2);
        assert.equal(order.items[1].currency, "USD");
        assert.equal(order.items[2].price, 1);
        assert.match(order.items[2].title, /PDF Edition/);
        harness.orders.get(orderId).order_status = "PAID";
        assert.equal((await (await harness.verify(orderId)).json()).status, "Credit");
    } finally {
        await harness.cleanup();
    }
});