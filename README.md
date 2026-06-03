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

開啟 http://localhost:3000 ，每張卡片代表一個 budget，可修改：

- **預算金額**（整數美元）
- **超額即停用**（prevent_further_usage）
- **超額警示**（budget_alerting.will_alert）

Token 只存在 `.env`，由本機 server 代理呼叫 GitHub API，前端不會接觸 token。
