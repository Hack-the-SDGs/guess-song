// ponytail: 一個檔案的煙霧測試，跑 `node test.mjs`。沒有測試框架。
import assert from "node:assert/strict";
import worker from "./src/index.js";

const kv = new Map();
const env = {
    USERNAME: "admin",
    PASSWORD: "pw",
    AUTH_SECRET: "secret",
    KV: {
        get: async (k, type) => {
            const v = kv.get(k) ?? null;
            return v && type === "json" ? JSON.parse(v) : v;
        },
        put: async (k, v) => kv.set(k, v),
    },
};

const call = (path, init) => worker.fetch(new Request("https://x" + path, init), env);

const post = (path, body) =>
    call(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

const login = (username, password) => {
    const form = new FormData();
    form.append("username", username);
    form.append("password", password);
    return call("/api/login", { method: "POST", body: form });
};

const scores = async () => (await call("/api/GetScore")).json();

// 未初始化時回傳全 0
assert.deepEqual(await scores(), { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 });

// 密碼錯誤 -> 401
assert.equal((await login("admin", "wrong")).status, 401);

const { token } = await (await login("admin", "pw")).json();
assert.ok(token, "登入成功應該拿到 token");

// 沒有 token / 假 token 都要被擋
assert.equal((await post("/api/AddScore", { group: 1, year: true })).status, 401);
assert.equal((await post("/api/AddScore", { token: "1893456000.aaaa", group: 1, year: true })).status, 401);

// 加分：三個都勾 = +3
assert.equal((await post("/api/AddScore", { token, group: 3, year: true, name: true, SD: true })).status, 200);
assert.equal((await scores())["3"], 3);

// 只勾一個 = +1，且累加
await post("/api/AddScore", { token, group: 3, name: true });
assert.equal((await scores())["3"], 4);

// 組別越界要擋（原本 Flask 版允許 group=0，會寫出 NaN）
for (const group of [0, 7, "3", 1.5]) {
    assert.equal((await post("/api/AddScore", { token, group, year: true })).status, 400, `group=${group}`);
}

// 直接設定分數
assert.equal((await post("/api/SetScore", { token, group: 3, score: 10 })).status, 200);
assert.equal((await scores())["3"], 10);

// 分數越界要擋
for (const score of [-1, 100, "10", null]) {
    assert.equal((await post("/api/SetScore", { token, group: 3, score })).status, 400, `score=${score}`);
}

// SetScore 也要驗 token（原本 Flask 版沒驗）
assert.equal((await post("/api/SetScore", { group: 3, score: 99 })).status, 401);

// 壞掉的 JSON
assert.equal((await call("/api/AddScore", { method: "POST", body: "{" })).status, 400);

console.log("ok");
