## Why

（動機與背景）頁面目前只有「本期 AI 用量」單一數字與 budgets 卡片，看不出用量的時間分布——哪天爆量、趨勢如何皆不可見。GitHub 官網的 Copilot usage 頁有每日分線圖與 Included credits 卡片（內含額度消耗進度），但需要登入網站逐頁點；本工具應在同一頁呈現。已用實際 token 驗證資料可得：GitHub usage report 端點（settings/billing/usage 帶 year/month 參數）回逐筆含 timestamp 的明細（HTTP 200，fine-grained PAT 可用），且「Included credits 消耗值」可由 AICredits 項目的 quantity 加總重現（實測 4789.81 + 45.25 = 4835.06 ≈ GitHub 顯示的 4,835）。

## What Changes

（方案描述）

- 後端新增 usage report 代理端點：透傳 year / month 整數參數至 GitHub settings/billing/usage，沿用既有 github() helper 與原樣轉發慣例
- 前端新增「本月每日用量」折線圖卡片：以 Chart.js（CDN 單檔引入）繪製深色雙序列折線——每日 AI credits 消耗（美元值，AICredits 項目 grossAmount 加總）與每日計費金額（全部項目 netAmount 加總），含 hover tooltip 與圖例
- 前端新增 Included credits 卡片：分子 = 當月 AICredits 項目 quantity 加總；分母 = .env 選配 INCLUDED_CREDITS（經 /api/config 回傳），有分母時畫進度 bar、無分母時僅顯示消耗值；附「N 天後（下月 1 日）重置」倒數（本地時間計算）
- /api/config 回應擴充 includedCredits 欄位（未設定時為 null）
- 圖表與卡片載入獨立於 budgets 列表與既有總覽（各自 try/catch），失敗僅該卡片降級

## Non-Goals

（本段為摘要，完整 Non-Goals 與否決方案見 design.md）不做 per-model 分線（實測 premium_request 端點回空陣列、usage report 無 model 欄位）；不做 Additional usage 開關卡片；不寫死 included credits 分母。

## Capabilities

### New Capabilities

- `daily-usage-chart`: 本月每日用量雙序列折線圖（AI credits 消耗與計費金額）
- `included-credits-card`: 內含 AI credits 消耗卡片（消耗值、選配分母進度 bar、重置倒數）

### Modified Capabilities

（無——budget-grouped-listing 與 org-usage-overview 的既有需求皆不變）

## Impact

- Affected specs: 新增 `daily-usage-chart`、`included-credits-card`
- Affected code:
  - New: （無新檔案）
  - Modified: src/server.ts（新增 report 代理 route、/api/config 擴充 includedCredits）、public/index.html（Chart.js CDN 引入、圖表卡片、Included credits 卡片）、.env.example（INCLUDED_CREDITS 說明）
  - Removed: （無）
- 外部相依：新增 Chart.js v4 經 CDN script 標籤引入（不進 package.json、不引入打包）——必要性：互動 tooltip、多序列、時間軸的手寫 SVG 成本遠高於引入成本，且需求明確要求接近 GitHub 原版質感；本工具本就需連網（GitHub API），CDN 可用性不構成新限制
- 外部 API：GitHub usage report 端點屬 public preview，回應欄位（date / sku / unitType / quantity / grossAmount / netAmount）若變動需調整前端解析；token 權限已實測足夠
- Token 安全邊界：不變——前端僅呼叫本機 /api/*
