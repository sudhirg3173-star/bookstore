import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { initializeApp, deleteApp } from "firebase/app";
import {
    getFirestore, connectFirestoreEmulator, doc, collection, getDoc, getDocs,
    setDoc, updateDoc, deleteDoc, query, where, terminate,
} from "firebase/firestore";
import admin from "firebase-admin";

const projectId = "demo-bookstore-rules";
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
assert.ok(emulatorHost && /^127\.0\.0\.1:\d+$/.test(emulatorHost), "Run only through the local Firestore emulator");
const [host, port] = emulatorHost.split(":");
const adminApp = admin.initializeApp({ projectId }, "rules-test-admin");
const serverDb = adminApp.firestore();
const clients = [];

function client(uid) {
    const app = initializeApp({ projectId, apiKey: "emulator-only", appId: "emulator-only" }, `rules-test-${clients.length}`);
    const db = getFirestore(app);
    connectFirestoreEmulator(db, host, Number(port), uid ? { mockUserToken: { sub: uid, email: `${uid}@example.com` } } : undefined);
    clients.push({ app, db });
    return db;
}

function profile(uid, role = "buyer") {
    return { id: uid, name: "Test Buyer", email: `${uid}@example.com`, role, createdAt: new Date().toISOString() };
}

async function denied(operation) {
    await assert.rejects(operation, (error) => error.code === "permission-denied");
}

before(async () => {
    await serverDb.doc("orders/alice-paid").set({ userId: "alice", status: "Credit", amount: 1451 });
    await serverDb.doc("orders/bob-paid").set({ userId: "bob", status: "Credit", amount: 100 });
    await serverDb.doc("orders/guest-paid").set({ userId: null, status: "Credit", amount: 100 });
});

after(async () => {
    for (const { app, db } of clients) {
        await terminate(db);
        await deleteApp(app);
    }
    await adminApp.delete();
});

test("profiles allow signup and own edits but deny identity and privilege changes", async () => {
    const db = client("alice");
    await setDoc(doc(db, "users", "alice"), profile("alice"));
    assert.equal((await getDoc(doc(db, "users", "alice"))).data().role, "buyer");
    await updateDoc(doc(db, "users", "alice"), { name: "Updated Name", bio: "Updated biography" });
    await serverDb.doc("users/alice").update({ disabled: false });
    await updateDoc(doc(db, "users", "alice"), { name: "Still Editable" });
    for (const update of [
        { role: "seller" }, { role: "admin" }, { id: "bob" }, { email: "bob@example.com" },
        { createdAt: "changed" }, { isAdmin: true }, { disabled: true }, { name: 123 },
    ]) {
        await denied(updateDoc(doc(db, "users", "alice"), update));
    }
    await denied(setDoc(doc(db, "users", "bob"), profile("bob")));
    await denied(deleteDoc(doc(db, "users", "alice")));
    await denied(getDocs(collection(db, "users")));
    for (const role of ["seller", "author"]) {
        const roleDb = client(role);
        await setDoc(doc(roleDb, "users", role), profile(role, role));
    }
    const attacker = client("attacker");
    await denied(setDoc(doc(attacker, "users", "attacker"), profile("attacker", "admin")));
    await denied(setDoc(doc(attacker, "users", "attacker"), { ...profile("attacker"), isAdmin: true }));
    await denied(getDoc(doc(attacker, "users", "alice")));
});

test("wishlists are private, owner-writable and bounded", async () => {
    const db = client("wishlist-owner");
    const reference = doc(db, "wishlists", "wishlist-owner");
    await setDoc(reference, { skus: ["9789373324883", "std-spcav-1-2026"] });
    assert.equal((await getDoc(reference)).data().skus.length, 2);
    await setDoc(reference, { skus: [] });
    await denied(setDoc(reference, { skus: "invalid" }));
    await denied(setDoc(reference, { skus: Array(501).fill("123") }));
    await denied(setDoc(reference, { skus: [], userId: "another-user" }));
    const otherDb = client("wishlist-other");
    await denied(getDoc(doc(otherDb, "wishlists", "wishlist-owner")));
    await denied(setDoc(doc(otherDb, "wishlists", "wishlist-owner"), { skus: [] }));
    await denied(deleteDoc(doc(otherDb, "wishlists", "wishlist-owner")));
    await deleteDoc(reference);
});

test("orders support owner-filtered history but deny client payment writes and guest reads", async () => {
    const db = client("alice");
    assert.equal((await getDoc(doc(db, "orders", "alice-paid"))).data().status, "Credit");
    const history = await getDocs(query(collection(db, "orders"), where("userId", "==", "alice")));
    assert.equal(history.size, 1);
    await denied(getDocs(collection(db, "orders")));
    await denied(getDoc(doc(db, "orders", "bob-paid")));
    await denied(getDoc(doc(db, "orders", "guest-paid")));
    await denied(setDoc(doc(db, "orders", "fake-paid"), { userId: "alice", status: "Credit" }));
    await denied(updateDoc(doc(db, "orders", "alice-paid"), { status: "Credit", amount: 1 }));
    await denied(deleteDoc(doc(db, "orders", "alice-paid")));
    await serverDb.doc("orders/alice-paid").update({ deliveryStatus: "Completed" });
    assert.equal((await getDoc(doc(db, "orders", "alice-paid"))).data().deliveryStatus, "Completed");
    await denied(setDoc(doc(db, "unknown", "example"), { value: "blocked" }));
    const guest = client();
    await denied(getDoc(doc(guest, "orders", "alice-paid")));
    await denied(getDoc(doc(guest, "users", "alice")));
    await denied(setDoc(doc(guest, "wishlists", "alice"), { skus: [] }));
});