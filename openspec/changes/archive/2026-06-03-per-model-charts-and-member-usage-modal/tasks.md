## 1. 後端

- [x] 1.1 實作 spec 需求「Backend proxies the premium request usage endpoint」：依 design「premium_request 代理 route 與 user 參數驗證」，在 src/server.ts 新增 GET /api/premium-usage，白名單透傳 year / month / day（正整數，month 1–12、day 1–31）與 user（GitHub username 正則：英數與連字號、不得以連字號開頭結尾、1–39 字），非法值回 400 + { message } 且不打 GitHub；驗證：curl 對 spec「parameter validation」範例表 5 列逐一確認（含 user=yuanfu8899 回 200 帶 usageItems、user=-bad 與 user=a/b 回 400、day=32 回 400）

## 2. 前端

- [x] 2.1 實作 spec 需求「Page renders a daily usage line chart for the current month」（per-model 版）：依 design「逐日 fan-out 查詢與 session 快取」實作當月 1 日～今日的並行逐日查詢與合併（單日失敗以空陣列代替並 console.warn），依 design「org 圖表 per-model 改版與序列配色」將 org 圖資料源換為 /api/premium-usage、按 model 分組為多條折線（值 = 當日該 model grossAmount 加總）、8 色調色盤按 model 字典序指派、移除計費金額線、圖例顯示 model 名；驗證：以 node 對 spec「per-model aggregation from real data」與「Stable color assignment」範例逐列斷言，npm run dev 目視確認 6/1 有 Claude Opus 4.7 ≈ $44.54 峰值且每個 model 一條線
- [x] 2.2 實作 spec 需求「Clicking a member card opens the member usage modal」「Modal shows the member's per-model daily usage」「Member usage is cached per session」：依 design「成員 modal 的開啟互動與內容」，user scope 卡片整卡可點（closest 排除 input / button / label，卡片加 cursor: pointer），modal 標題為成員名、內容為該成員 per-model 每日折線（重用 2.1 的聚合與繪圖邏輯、帶 user 參數）與「本月合計 X credits」（grossQuantity 加總、千分位整數），✕ / 背景 / Esc 三種關閉，查詢結果以成員名 + 抓取日為 key 快取於記憶體；驗證：以 node 斷言 spec「real-data member modal」範例（GPT-5.3-Codex [0.68,0,0]、GPT-5.4 [0.09,0,0]、合計 77 credits），npm run dev 點 yuanfu8899 卡片空白處開 modal 對照數據、點輸入框與儲存按鈕確認不開 modal 且編輯照常、DevTools Network 確認同日重開 modal 零新請求
- [x] 2.3 實作並驗證 spec 需求「Chart card degrades independently」與「Modal load failure degrades inside the modal」：org 圖全日失敗顯示降級訊息、部分失敗缺日補 0 並 console.warn、Chart.js 載入失敗顯示「圖表元件載入失敗」、全成功但無項目顯示「本月尚無 AI 用量」；modal 全日失敗時留在開啟狀態並於內容區顯示錯誤、可正常關閉；以上皆不影響其他區塊；驗證：以攔截 fetch 模擬全失敗 / 單日失敗 / 空項目三情境與移除 window.Chart，逐一確認訊息與其他區塊（總覽、Included credits、budgets 列表）正常

## 3. 整體驗收

- [x] 3.1 依 design「Implementation Contract」逐項手動驗收：org per-model 圖（無計費線）、成員 modal 的開啟/排除/關閉/合計/快取、/api/premium-usage 參數驗證、Included credits 卡片與總覽卡不受影響；驗證：npm run dev 完整走過 contract 列舉情境，並確認改動範圍僅 src/server.ts 與 public/index.html
