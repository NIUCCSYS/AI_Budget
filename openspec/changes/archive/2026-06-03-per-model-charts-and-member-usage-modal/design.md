## Context

頁面已有 Chart.js（CDN）的 org 每日雙序列折線圖（資料源 /api/usage/report）、Included credits 卡片與成員預算分組列表。實測 GitHub premium_request usage 端點（organizations/{org}/settings/billing/premium_request/usage）：帶 year+month+day 回當日 per-model 明細（欄位 model / sku / unitType / pricePerUnit / grossQuantity / grossAmount / discountQuantity / discountAmount / netQuantity / netAmount），再帶 user 參數可過濾單一成員；**月層級（不帶 day）回空陣列**——這是實測確認的端點怪癖，逐日查詢是唯一可行路徑。6/1 實測 org 層級 5 筆（Claude Opus 4.7 = 4454.14 credits / $44.54，與 GitHub UI 一致），user=yuanfu8899 當日 2 筆（GPT-5.3-Codex 68.30、GPT-5.4 8.65）。

## Goals / Non-Goals

**Goals:**

- 後端 premium_request 代理 route（user / year / month / day 白名單）
- org 每日圖改為 per-model 多線（GitHub 原版風格）
- 點成員卡片開 modal 看個人 per-model 每日圖與合計
- 逐日 fan-out 並行查詢 + session 記憶體快取

**Non-Goals:**

- 不做跨月歷史查詢（僅當月）；不做成員間比較圖
- 不改 budgets 編輯流程、Included credits 卡片（維持 usage report 資料源）、總覽卡
- 不引入新套件；不做後端快取（本機單人工具，記憶體快取在前端即可）

## Decisions

### premium_request 代理 route 與 user 參數驗證

新增 GET /api/premium-usage，沿用 github() helper 轉發至 organizations/{ORG}/settings/billing/premium_request/usage。白名單參數：year / month / day（正整數，month 1–12、day 1–31，驗證邏輯沿用既有 /api/usage/report 慣例）與 user（選填字串，須符合 GitHub username 格式：僅英數與連字號、不得以連字號開頭結尾、長度 1–39，正則 ^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$），非法值回 400 + { message }。user 驗證是必要的注入防線——該值會進入轉發 URL 的 query string。

### 逐日 fan-out 查詢與 session 快取

月層級回空（實測怪癖），故查當月資料 = 並行發出 day=1..今日 的 N 個請求後合併。前端以 Promise.all 對 /api/premium-usage 逐日請求，單日失敗以空陣列代替並於 console.warn 記錄（部分缺日不擋整圖）；全部失敗才顯示降級訊息。結果以 Map 快取（key：user 名稱或 org 代表值，value：{ 抓取日, items }），同 session 內重開 modal 或重繪不重抓；跨日（抓取日 ≠ 今日）視為過期重抓。否決後端聚合與後端快取——本機單人工具，前端快取已足，且保持後端原樣轉發慣例。

### org 圖表 per-model 改版與序列配色

org「本月每日用量」資料源從 /api/usage/report 改為上述逐日 fan-out（不帶 user），按 model 欄位分組，每個 model 一條折線（值 = 當日該 model grossAmount 加總，美元），x 軸維持當月 1 日至今日補 0。移除「計費金額」線——premium_request 端點僅含 AI credits 項目，計費資訊由總覽卡承擔。配色：固定調色盤陣列（以既有色票起頭：--accent、--green、--yellow、--red，再補 4 個深色系和諧色，共 8 色循環），依 model 名稱字典序指派確保重繪穩定。model 數超過 8 時循環重用色彩。/api/usage/report route 保留——Included credits 卡片仍用它。

### 成員 modal 的開啟互動與內容

成員卡片（user scope）整卡可點開 modal，但 input / button / label 等互動元件的點擊不觸發（以 event.target.closest 判斷排除），確保既有編輯行為不變；卡片加 cursor: pointer 與 hover 提示。modal：深色卡片風格覆蓋層，標題為成員名，內容 = 該成員當月 per-model 每日折線圖（重用 org 圖的聚合與繪圖邏輯）+ 當月 credits 合計（grossQuantity 加總、千分位整數）；關閉方式：右上 ✕、點擊背景遮罩、Esc 鍵。開啟時若快取未命中顯示「載入中…」再渲染。否決 inline accordion——卡片內已有表單元件，展開會擠壓編輯區。

## Implementation Contract

- **行為**：（1）org「本月每日用量」圖變為每個 model 一條折線（如 Claude Opus 4.7、GPT-5.4 各自一條，圖例顯示 model 名），無計費金額線；（2）點擊成員卡片非互動區域跳出 modal，顯示「{成員名} 本月每日用量」per-model 折線圖與「本月合計 X credits」，✕ / 背景 / Esc 可關閉；點擊卡片內輸入框、checkbox、儲存按鈕維持原編輯行為、不開 modal；（3）同 session 重開同成員 modal 不發新請求（DevTools Network 可驗證）。
- **介面／資料形狀**：新增 GET /api/premium-usage?user&year&month&day（user 選填、GitHub username 格式；數值參數正整數，month 1–12、day 1–31；非法回 400 + { message }），回應原樣轉發 GitHub premium_request usage JSON（usageItems 各項含 model / grossQuantity / grossAmount）。
- **失敗模式**：org 圖逐日請求全部失敗 → 圖表卡片顯示降級訊息；部分失敗 → 缺日以 0 呈現並 console.warn；modal 載入全部失敗 → modal 內顯示錯誤訊息（不關閉）；以上皆不影響其他區塊。usageItems 全空 → org 圖顯示無序列的空圖或「本月尚無 AI 用量」提示、modal 顯示合計 0 credits。
- **驗收方式**：聚合 / 判定 / 配色指派純函式以 node 對 spec 範例表逐列斷言；npm run dev 對照實測資料（org 圖 6/1 應有 Opus 4.7 ≈ $44.54 峰值；yuanfu8899 modal 6/1 應有 GPT-5.3-Codex ≈ $0.68）；以 DevTools Network 驗證快取（重開 modal 零新請求）與互動排除（點輸入框不開 modal）。
- **範圍邊界**：in scope = src/server.ts（新 route）、public/index.html（org 圖改版、modal、fan-out、快取、卡片點擊）；out of scope = /api/usage/report 與 Included credits 卡片、總覽卡、budgets 編輯流程、.env。

## Risks / Trade-offs

- [premium_request 端點屬 public preview，月層級回空的怪癖未來可能修復或行為再變] → 逐日 fan-out 邏輯獨立成函式，若月層級恢復只需改一處；單日失敗不擋整圖
- [月底一次載入 31 個並行請求，再開 3 個成員 modal 共 ~124 請求] → REST rate limit 5,000/h 餘裕大；快取確保同 session 不重複
- [model 名稱集合未知且會隨 GitHub 上新模型成長] → 按 model 字典序指派調色盤、8 色循環，不硬編 model 清單
- [整卡可點與卡片內表單的事件衝突] → closest 判斷排除互動元件；驗收明確包含「點輸入框不開 modal」
