import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { parseEnv } from "node:util";

const require = createRequire(import.meta.url);
require("@next/env").loadEnvConfig(process.cwd(), true);
if (existsSync(".env.payments.local")) Object.assign(process.env, parseEnv(readFileSync(".env.payments.local", "utf8")));
process.env.CASHFREE_ENV = "sandbox";
process.env.PAYMENT_LOCAL_STORE = "true";

async function available(port) {
    return new Promise((resolve, reject) => {
        const server = createServer();
        server.once("error", (error) => error.code === "EADDRINUSE" ? resolve(false) : reject(error));
        server.listen(port, "127.0.0.1", () => server.close(() => resolve(true)));
    });
}

let port = 3001;
while (!await available(port)) port += 1;
if (!process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://")) process.env.NEXT_PUBLIC_APP_URL = `http://localhost:${port}`;
if (!process.env.CASHFREE_CLIENT_ID || !process.env.CASHFREE_CLIENT_SECRET) {
    console.warn("Cashfree sandbox keys are missing. Set them in .env.payments.local before making a test payment.");
}
console.log(`Payment sandbox: http://localhost:${port}/checkout`);
console.log("Test orders are isolated in .local/payments; no production Firestore writes.");
const child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "dev", "--port", String(port)], {
    stdio: "inherit", env: process.env,
});
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 0));