// scripts/generate-promo-codes.mjs
// Uses Firebase REST API — no serviceAccountKey needed
// Usage: node scripts/generate-promo-codes.mjs [type] [count]
// Example: node scripts/generate-promo-codes.mjs 1month 5

const PROJECT_ID = "kingdom-memory-svc";
const API_KEY = "AIzaSyBuftL6QjdDQC-UYnkE3CTu0etLx_ZwDMI";
const ADMIN_EMAIL = "hyewonh@gmail.com";

// ── Prompt for password securely ──────────────────────────────────────────────
import * as readline from "node:readline";
import * as https from "node:https";

function prompt(question) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans); }));
}

function httpsPost(url, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const options = {
            method: "POST",
            headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) },
        };
        const req = https.request(url, options, res => {
            let raw = "";
            res.on("data", chunk => raw += chunk);
            res.on("end", () => resolve(JSON.parse(raw)));
        });
        req.on("error", reject);
        req.write(data);
        req.end();
    });
}

function generateCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
        if (i === 4) result += "-";
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}

async function signIn(email, password) {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
    const result = await httpsPost(url, { email, password, returnSecureToken: true });
    if (result.error) throw new Error(result.error.message);
    return result.idToken;
}

async function createDocument(idToken, collectionId, docId, fields) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({ fields });
        const path = `/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionId}/${docId}`;
        const options = {
            hostname: "firestore.googleapis.com",
            path,
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`,
                "Content-Length": Buffer.byteLength(body),
            },
        };
        const req = https.request(options, res => {
            let raw = "";
            res.on("data", c => raw += c);
            res.on("end", () => resolve(JSON.parse(raw)));
        });
        req.on("error", reject);
        req.write(body);
        req.end();
    });
}

async function main() {
    const type = process.argv[2] || "1month";
    const count = parseInt(process.argv[3] || "5", 10);
    const note = process.argv[4] || "Manual gift - Feb 2026";

    if (!["1month", "1year", "lifetime"].includes(type)) {
        console.error("❌  type must be: 1month | 1year | lifetime");
        process.exit(1);
    }

    const password = await prompt(`Enter password for ${ADMIN_EMAIL}: `);
    const idToken = await signIn(ADMIN_EMAIL, password);
    console.log("✅  Signed in as admin\n");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 365);

    const codes = [];

    for (let i = 0; i < count; i++) {
        const code = generateCode();
        const result = await createDocument(idToken, "admin_promo_codes", code, {
            type: { stringValue: type },
            used: { booleanValue: false },
            note: { stringValue: note },
            createdBy: { stringValue: "admin-script" },
            createdAt: { timestampValue: new Date().toISOString() },
            expiresAt: { timestampValue: expiresAt.toISOString() },
        });

        if (result.error) {
            console.error(`❌  Failed to create ${code}:`, result.error.message);
        } else {
            codes.push(code);
            console.log(`  ✅  ${code}`);
        }
    }

    console.log(`\n✨ Done! ${codes.length}/${count} codes generated.`);
    console.log("\n📋 Send these codes to users:");
    console.log("─".repeat(30));
    codes.forEach(c => console.log(c));
    console.log("─".repeat(30));
    console.log(`Type: ${type.toUpperCase()} | Valid 1 year`);
}

main().catch(console.error);
