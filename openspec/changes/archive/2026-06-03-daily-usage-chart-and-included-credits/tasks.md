## 1. 後端

- [x] 1.1 實作 spec 需求「Backend proxies the monthly usage report」：依 design「後端 usage report 代理 route 與參數白名單」，在 src/server.ts 新增 GET /api/usage/report，沿用 github() helper 原樣轉發至 organizations/{ORG}/settings/billing/usage，僅透傳 year / month（選填、正整數、month 1–12），非法值回 400 + { message } 且不打 GitHub；驗證：curl 對 spec「parameter validation」範例表 5 列逐一確認（year=2026&month=6 與無參數回 200 且 body 含 usageItems；month=13、year=abc、month=0 回 400）
- [x] 1.2 實作 spec 需求「Config endpoint exposes the optional included credits denominator」：/api/config 回應擴充 includedCredits（INCLUDED_CREDITS 為正整數時回該值，否則 null，org 欄位不變），並在 .env.example 加 INCLUDED_CREDITS 說明（含「過渡期至 2026-09-01 每席 3000、之後 1900」的提醒）；驗證：對 spec「env parsing」範例表 4 種值逐一以該環境變數啟動 server 後 curl /api/config 確認（unset、12000、0、abc）

## 2. 前端

- [x] 2.1 實作 spec 需求「Page renders a daily usage line chart for the current month」：依 design「Chart.js CDN 引入與深色主題設定」以單一 script 標籤載入 Chart.js v4 UMD，依 design「每日聚合與 report 端點的 AI 項目判定」實作 isAiReportItem（unitType 正規化後以 ai 開頭，或 sku 以底線與空格切分含獨立片段 ai）與每日聚合（UTC timestamp 轉本地日期分組、x 軸當月 1 日至今補 0、序列 A = AI 項目 grossAmount 日加總、序列 B = 全項目 netAmount 日加總），以既有色票設定深色主題、圖例、tooltip、y 軸自 0 起；驗證：以 node 對 spec「two-series aggregation」與「detection rule」範例表逐列斷言，npm run dev 目視確認 6/1 有明顯峰值（≈ $47.9）且配色與頁面一致
- [x] 2.2 實作 spec 需求「Included credits card shows monthly consumed credits」與「Included credits card shows the monthly reset countdown」：依 design「Included credits 卡片的分子分母與重置倒數」，分子 = AI 項目 quantity 加總（四捨五入整數、千分位），/api/config 的 includedCredits 非 null 時顯示 X / Y 與進度 bar（沿用 barHTML 著色門檻），null 時僅顯示消耗值；倒數 =「N 天後（M月1日）重置」（本地時間）；驗證：以 node 斷言 spec「real-data reproduction」範例（4789.81194 + 45.2527 → 顯示 4,835、分母 12000 時 bar 40% 綠）與倒數範例（2026-06-03 → 28 天後（7月1日）重置），npm run dev 對照實際資料目視確認
- [x] 2.3 實作並驗證 spec 需求「Chart card degrades independently」與「Included credits card degrades independently」：圖表與 Included credits 卡片各自獨立 try/catch 載入，report 失敗或無 usageItems 陣列時各自顯示降級訊息，Chart.js CDN 載入失敗時圖表卡片顯示「圖表元件載入失敗」，空 usageItems 時圖表全 0 序列、卡片顯示已耗 0 credits，其餘區塊（總覽、budgets 列表）皆不受影響；驗證：以攔截 fetch 模擬 report 回 500 與回 { foo: "bar" }、以移除 window.Chart 模擬 CDN 失敗，逐一確認降級訊息與其他區塊正常

## 3. 整體驗收

- [x] 3.1 依 design「Implementation Contract」逐項手動驗收：兩個新卡片的顯示內容與失敗模式、/api/usage/report 參數驗證、/api/config 形狀、既有總覽與 budgets 列表行為不變；驗證：npm run dev 完整走過 contract 列舉的情境，並確認改動範圍僅 src/server.ts、public/index.html、.env.example
