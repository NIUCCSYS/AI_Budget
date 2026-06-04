# GitHub AI Budget 管理工具

本機小網頁，用官方 [Budgets API](https://docs.github.com/en/rest/billing/budgets)（public preview）查看與修改 GitHub **organization** 的 AI budget（spending limit）。

> ⚠️ 個人帳號（user account）目前**沒有**官方修改 budget 的 API，只有用量查詢；此工具僅適用於 organization。

## 設定

1. 安裝相依套件：

   ```bash
   npm install
   ```

2. 建立 token 檔：

   ```bash
   cp .env.example .env
   ```

   編輯 `.env`，填入：
   - `GITHUB_TOKEN` — Fine-grained PAT（[建立連結](https://github.com/settings/personal-access-tokens/new)）
     - **Resource owner** 選你的 organization
     - **Organization permissions** 勾「Administration: Read and write」
     - 此 API 為 public preview，若回 403 可改試 classic token 的 `admin:org` scope
     - 你必須是該 org 的 **admin 或 billing manager**
   - `GITHUB_ORG` — organization 名稱

   `.env` 已列入 `.gitignore`，不會進版控。

## 啟動

```bash
npm run dev
```

### 用 Docker 執行（替代方式）

```bash
docker compose up -d --build   # build image 並背景啟動
docker compose logs -f          # 看 log
docker compose down             # 停止
```

Docker 讀取的是 `aibudget.env`（內容格式同 `.env.example`，本機可直接 `cp .env aibudget.env`）。
刻意用非 dot 檔名是為了 Synology File Station 也能上傳/編輯。token **不會**被打包進 image
（`.dockerignore` 已排除），改了程式碼後重跑 `docker compose up -d --build` 即可。

### 部署到 Synology（Container Manager，免 SSH）

1. 從 GitHub 下載 ZIP（Code → Download ZIP）並解壓
2. File Station 上傳整個資料夾到如 `docker/aibudget`（ZIP 內不含任何機密）
3. 在電腦上建立 `aibudget.env`（內容照 `.env.example`，**務必包含 APP_PASSWORD**），同樣上傳到該資料夾
4. Container Manager → 專案 → 新增 → 路徑選該資料夾 → 「使用現有的 docker-compose.yml」
5. 開 `http://NAS_IP:3002`，輸入 APP_PASSWORD 登入；建議再到 控制台 → 安全性 → 防火牆 限制此 port 的來源 IP

開啟 http://localhost:3000 ，每張卡片代表一個 budget，可修改：

- **預算金額**（整數美元）
- **超額即停用**（prevent_further_usage）
- **超額警示**（budget_alerting.will_alert）

Token 只存在 `.env`，由本機 server 代理呼叫 GitHub API，前端不會接觸 token。
