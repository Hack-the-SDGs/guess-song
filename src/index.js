const GROUPS = 6;
const TOKEN_TTL = 12 * 60 * 60; // seconds
const MAX_SCORE = 999; // UI 的 score box 只有兩位數

const enc = new TextEncoder();

// ponytail: node test.mjs 解析不了 cloudflare:workers,補一個同形狀的 base class
let DurableObject = class {
    constructor(ctx, env) {
        this.ctx = ctx;
        this.env = env;
    }
};
try {
    ({ DurableObject } = await import("cloudflare:workers"));
} catch {}

const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), {
        status,
        headers: { "content-type": "application/json; charset=utf-8" },
    });

const ok = (extra) => json({ status: 1, msg: "success", ...extra });
const fail = (msg, status = 400) => json({ status: 0, msg }, status);

const emptyScores = () =>
    Object.fromEntries(Array.from({ length: GROUPS }, (_, i) => [String(i + 1), 0]));

const b64u = (buf) =>
    btoa(String.fromCharCode(...new Uint8Array(buf)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

const unb64u = (s) =>
    Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

const hmacKey = (secret) =>
    crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
        "sign",
        "verify",
    ]);

// ponytail: 無狀態簽章 token，不存 KV。代價是 logout 無法主動撤銷，
// 想撤銷就換掉 AUTH_SECRET（所有 token 立即失效）。
async function issueToken(secret) {
    const exp = String(Math.floor(Date.now() / 1000) + TOKEN_TTL);
    const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(exp));
    return `${exp}.${b64u(sig)}`;
}

async function verifyToken(secret, token) {
    if (typeof token !== "string") return false;
    const [exp, sig] = token.split(".");
    if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
    try {
        return await crypto.subtle.verify(
            "HMAC",
            await hmacKey(secret),
            unb64u(sig),
            enc.encode(exp),
        );
    } catch {
        return false;
    }
}

const isGroup = (v) => Number.isInteger(v) && v >= 1 && v <= GROUPS;

// 單一 DO 序列化所有寫入：每個動作只改自己那組，多管理員同時操作不會互蓋。
// （舊版 KV read-modify-write 會把整包舊分數壓回去，造成別組分數突然倒退。）
export class Scores extends DurableObject {
    async read() {
        let scores = await this.ctx.storage.get("scores");
        if (!scores) {
            // ponytail: 一次性從舊 KV 資料 seed，部署當下分數不歸零；之後 KV 可整個拆掉
            scores = (await this.env.KV.get("scores", "json")) ?? emptyScores();
            await this.ctx.storage.put("scores", scores);
        }
        return scores;
    }

    async add(group, delta) {
        const scores = await this.read();
        await this.ctx.storage.put("scores", {
            ...scores,
            [group]: Math.min(MAX_SCORE, (scores[group] ?? 0) + delta),
        });
    }

    async set(group, score) {
        const scores = await this.read();
        await this.ctx.storage.put("scores", { ...scores, [group]: score });
    }
}

const scoresStub = (env) => env.SCORES.getByName("main");

async function requireAuth(env, body) {
    return verifyToken(env.AUTH_SECRET, body?.token);
}

async function handleLogin(env, request) {
    const form = await request.formData();
    if (form.get("username") !== env.USERNAME || form.get("password") !== env.PASSWORD) {
        return fail("帳號或密碼錯誤", 401);
    }
    return ok({ token: await issueToken(env.AUTH_SECRET) });
}

async function handleAddScore(env, body) {
    if (!(await requireAuth(env, body))) return fail("please login", 401);
    if (!isGroup(body.group)) return fail("unaccept group value");

    const delta = [body.year, body.name, body.sing, body.dance].filter((v) => v === true).length;
    await scoresStub(env).add(body.group, delta);
    return ok();
}

async function handleSetScore(env, body) {
    if (!(await requireAuth(env, body))) return fail("please login", 401);
    if (!isGroup(body.group)) return fail("unaccept group value");
    if (!Number.isInteger(body.score) || body.score < 0 || body.score > MAX_SCORE) {
        return fail("unaccept score value");
    }

    await scoresStub(env).set(body.group, body.score);
    return ok();
}

export default {
    async fetch(request, env) {
        const { pathname } = new URL(request.url);

        if (pathname === "/api/GetScore" && request.method === "GET") {
            return json(await scoresStub(env).read());
        }

        if (request.method !== "POST") return fail("not found", 404);

        if (pathname === "/api/login") return handleLogin(env, request);

        let body;
        try {
            body = await request.json();
        } catch {
            return fail("json decode error");
        }

        if (pathname === "/api/AddScore") return handleAddScore(env, body);
        if (pathname === "/api/SetScore") return handleSetScore(env, body);

        return fail("not found", 404);
    },
};
