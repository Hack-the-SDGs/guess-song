# 誰是猜歌王

Cloudflare Workers + KV 的計分板。前端靜態檔（`public/`）由 Workers Static Assets 直接送，
`/api/*` 交給 Worker（`src/index.js`）。

## 需要的設定

### 1. KV namespace

已經建好並寫進 `wrangler.jsonc` 了。要重建的話：

```shell
npx wrangler kv namespace create song-kv
```

把印出來的 `id` 填進 `wrangler.jsonc` 的 `kv_namespaces[0].id`（`binding` 保持 `KV`，程式碼用的是這個名字）。

分數存在單一 key `scores`，不用先建，第一次讀不到就當作全 0。

### 2. 環境變數（三個都是 secret，不要寫進 wrangler.jsonc）

| 名稱 | 用途 |
|---|---|
| `USERNAME` | 後台帳號 |
| `PASSWORD` | 後台密碼 |
| `AUTH_SECRET` | 簽 token 用的密鑰，隨機字串（`openssl rand -base64 32`）。換掉它 = 立刻登出所有人 |

正式環境：

```shell
npx wrangler secret put USERNAME
npx wrangler secret put PASSWORD
npx wrangler secret put AUTH_SECRET
```

本機開發：`cp .dev.vars.example .dev.vars` 後填值（`.dev.vars` 已 gitignore）。

## 開發 / 部署

```shell
node test.mjs            # 煙霧測試
npx wrangler dev         # 本機 http://localhost:8787
npx wrangler deploy
```

## 頁面

| 路徑 | 說明 |
|---|---|
| `/` | 觀眾看的計分板，每 3 秒更新 |
| `/login` | 後台登入 |
| `/dashboard` | 加分 / 改分 |

## API

| 路徑 | Method | Body | 說明 |
|---|---|---|---|
| `/api/GetScore` | GET | — | 回 `{"1":0,...,"6":0}` |
| `/api/login` | POST | form: `username`, `password` | 回 `{status, msg, token}`，token 12 小時到期 |
| `/api/AddScore` | POST | json: `token`, `group`, `year`, `name`, `sing`, `dance` | 每個 `true` 加 1 分 |
| `/api/SetScore` | POST | json: `token`, `group`, `score` | 直接指定分數 |

`group` 是 1–6 的整數，`score` 是 0–99 的整數。認證失敗回 401，參數錯回 400。

登出是純前端行為（清掉 localStorage），沒有 `/api/logout`——token 是無狀態簽章，
要強制撤銷就換 `AUTH_SECRET`。
