## Context

頁面已有「本期 AI 用量」總覽（資料源 usage/summary）與 budgets 分組列表。本次新增兩個卡片：每日用量折線圖與 Included credits 消耗，資料源改用 GitHub usage report 端點（settings/billing/usage 帶 year/month），已實測回應形狀：usageItems 各項含 date（ISO 8601 UTC timestamp）、product、sku（如 Copilot AI Credits、Copilot Business，含空格）、quantity、unitType（如 AICredits、UserMonths）、grossAmount、discountAmount、netAmount。關鍵驗證：AICredits 項目的 gross 被 discount 全額折抵（net=0）即「由內含額度吸收」，quantity 加總 = GitHub 官網 Included credits 消耗值（實測 4835.06 ≈ 4,835）。

## Goals / Non-Goals

**Goals:**

- 後端代理 usage report 端點（year/month 透傳），前端不接觸 token
- Chart.js 深色雙序列折線圖：每日 AI credits 消耗（$）與每日計費金額（$）
- Included credits 卡片：消耗值 + 選配分母進度 bar + 下月 1 日重置倒數
- 三個資料區塊（總覽 / 圖表 / Included credits）載入互相獨立

**Non-Goals:**

- 不做 per-model 分線——實測 premium_request/usage 回空陣列、usage report 無 model 欄位，無資料源
- 不做 Additional usage 開關卡片——無對應修改 API，budgets 卡片已承擔管控
- 不寫死 included credits 分母（如 12000）——分母 = 席數 × 每席額度，過渡期（至 2026-09-01）每席 3000、之後降回 1900，寫死必過期
- 不改既有總覽與 budgets 列表行為；不引入打包工具

## Decisions

### 後端 usage report 代理 route 與參數白名單

新增 GET /api/usage/report，沿用 github() helper 原樣轉發至 organizations/{ORG}/settings/billing/usage。僅透傳白名單參數 year 與 month，且須為正整數（month 1–12），非法值回 400 + { message }，符合既有錯誤處理慣例；未帶參數時不附 query（GitHub 預設回當期）。否決「前端直連 GitHub」（洩漏 token）與「後端先聚合再回傳」（違反本專案原樣轉發慣例，且聚合邏輯放前端便於與圖表互動需求一起調整）。

### Chart.js CDN 引入與深色主題設定

以單一 script 標籤自 jsDelivr 載入 Chart.js v4 UMD 版（固定主版本），不進 package.json。深色主題：以既有 CSS 變數色票設定 grid 線（--border）、文字（--muted）、序列色（--accent 與 --green），tooltip 啟用、圖例置頂、y 軸自 0 起並以 $ 格式化。Chart.js 載入失敗（CDN 不可達）時圖表卡片顯示「圖表元件載入失敗」降級訊息，不影響其他區塊。否決手寫 SVG（互動 tooltip + 雙序列 + 時間軸成本過高，且使用者明確要求接近 GitHub 原版質感）。

### 每日聚合與 report 端點的 AI 項目判定

report 端點命名與 summary 端點不同（unitType 為 AICredits 而非 ai-units；sku 為含空格的 Copilot AI Credits 而非底線式 copilot_ai_unit），既有 isAiItem 的規則（unitType 前綴 ai- 或 sku 底線切分）在此判不中——需獨立判定函式 isAiReportItem：unitType 轉小寫並移除連字號/底線/空格後以 ai 開頭，或 sku 以底線與空格切分後含獨立片段 ai（不分大小寫）。每日聚合：將各項 date（UTC timestamp）轉為本地日期字串後分組（遵循全案本地時間慣例），序列 A = 當日 AI 項目 grossAmount 加總（內含額度吸收前的真實用量），序列 B = 當日全部項目 netAmount 加總（實際計費）；x 軸涵蓋當月 1 日至今日（本地），無資料日補 0。

### Included credits 卡片的分子分母與重置倒數

分子 = 當月 AI 項目（isAiReportItem）quantity 加總，顯示千分位、四捨五入至整數。分母 = .env 的 INCLUDED_CREDITS（選配，正整數），由 /api/config 以 includedCredits 欄位回傳（未設定為 null）；有分母畫進度 bar（沿用既有 barHTML 著色門檻），無分母僅顯示「已耗 X credits」。重置倒數 = 下月 1 日（本地時間）減今日的天數，顯示「N 天後（M月1日）重置」。否決自動推算分母（席數 × 每席常數）——常數隨 GitHub 政策變動（過渡期 3000 → 常態 1900），脆弱且無 API 可查證即期值。

## Implementation Contract

- **行為**：開啟頁面後新增兩個卡片——（1）Included credits：顯示「已耗 X credits」（X 為當月 AI 項目 quantity 加總、千分位整數）；若 .env 設了 INCLUDED_CREDITS 則加「X / Y」與進度 bar；附「N 天後（下月1日）重置」。（2）本月每日用量：Chart.js 折線圖，x 軸為當月 1 日至今（本地日期、缺日補 0），兩條序列「AI credits 消耗（$）」與「計費金額（$）」，hover 顯示 tooltip。
- **介面／資料形狀**：新增 GET /api/usage/report?year=YYYY&month=M（皆選填正整數，month 1–12，非法回 400 + { message }），回應原樣轉發 GitHub usageItems JSON。/api/config 回應由 { org } 擴充為 { org, includedCredits }（number 或 null）。
- **失敗模式**：report 請求失敗或回應無 usageItems 陣列 → 圖表卡片與 Included credits 卡片各自顯示降級訊息；Chart.js CDN 載入失敗 → 圖表卡片顯示「圖表元件載入失敗」；以上皆不影響既有總覽與 budgets 列表。usageItems 為空陣列 → 圖表顯示全 0 序列、Included credits 顯示已耗 0 credits。
- **驗收方式**：聚合與判定純函式以 node 對 spec 範例表逐列斷言；頁面以 npm run dev 對照實測資料（當月 AI 消耗 ≈ 4,835 credits、6/1 應有明顯峰值）目視確認，並以攔截 fetch 驗證降級情境。
- **範圍邊界**：in scope = src/server.ts（新 route、config 擴充）、public/index.html（兩卡片、Chart.js 引入）、.env.example（INCLUDED_CREDITS 說明）；out of scope = 既有總覽/列表/PATCH 行為、新增 npm 套件、打包工具。

## Risks / Trade-offs

- [usage report 為 public preview，欄位或 SKU 命名可能再變] → AI 判定用正規化規則而非精確字串比對；解析失敗走降級訊息不擋頁面
- [CDN 不可達時無圖表] → 明確降級訊息；本工具操作本就依賴對外連線（GitHub API），實際增量風險低
- [UTC timestamp 轉本地日期分組，與 GitHub 官網（UTC 分組）可能差一天] → 接受——全案慣例為本地時間，且差異僅出現在跨日邊界的少量項目；卡片總額（月加總）不受分組影響
- [INCLUDED_CREDITS 由人工維護，過渡期結束（2026-09-01）後需手動改] → .env.example 註明 9 月起每席 1900 的提醒文字
