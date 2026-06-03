## Context

前端 `public/index.html` 目前以單一 `.grid` 平面列出所有 budgets，卡片內容由 `budgetCard(b)` 產生；user scope budget 的 `consumed_amount` 僅以一行文字顯示。後端 `src/server.ts` 已有 `GET /api/usage` 代理 GitHub `usage/summary` 端點，但前端從未呼叫。本次變更純前端：分組列表、user 卡片 progress bar、頂部總覽區，後端與 API 介面不動。

## Goals / Non-Goals

**Goals:**

- budgets 依 `budget_scope` 分組為「成員預算」「組織預算」「其他」三個 section
- user scope 卡片以純 CSS progress bar 呈現 `consumed_amount / budget_amount`
- 頁面頂部總覽區顯示 org 總使用量，並與組織 scope 預算總和並列為總覽 bar

**Non-Goals:**

- 不接 premium_request usage 報表 API、不做時間趨勢圖、不引入圖表庫
- 不改 budget 編輯／儲存（PATCH）流程
- 不改後端任何端點與回應格式

## Decisions

### 分組規則與 section 排序

依 `budget_scope` 將 budgets 分為三組，顯示順序固定：`user` →「成員預算」、`organization` →「組織預算」、其餘 scope（enterprise / repository / cost_center 或未知值）→「其他預算」。空組不渲染 section（含標題）。組內卡片依 `budget_entity_name` 字典序排序，讓成員清單穩定可掃讀。替代方案「以 tab 切換分組」被否決——budgets 數量少（個位數到數十），同頁直列掃讀成本更低。

### user 卡片 progress bar 的純 CSS 實作

在卡片內加一個雙層 div（外層軌道 + 內層填色，寬度為百分比），不引入任何圖表庫。比例 = `consumed_amount / budget_amount`；著色門檻：< 70% 用 `--green`、70%–99% 用黃色（新增 `--yellow: #d29922` 色票）、≥ 100% 用 `--red`。邊界規則：`budget_amount` 為 0 且 `consumed_amount` > 0 視為 100%（紅）；`consumed_amount` 為 0 顯示空軌道；填色寬度上限封頂 100%。bar 旁以文字標示「已用 $X / $Y（Z%）」，百分比四捨五入至整數。organization scope 卡片因 GitHub API 不提供 `consumed_amount`，不顯示 bar。

### 總覽區資料來源與預算對應

總覽區資料來自兩個既有端點的並行呼叫：`GET /api/usage`（總使用量）與 `GET /api/budgets`（預算）。總覽 bar 的分母 = 所有 `budget_scope === 'organization'` 的 `budget_amount` 加總；分子 = usage/summary 解析出的總金額。若 org scope budget 不存在，總覽只顯示總使用量數字、不畫 bar。替代方案「挑單一 AI SKU budget 對應」被否決——SKU 命名（ai_credits 等）屬 public preview 且可能變動，硬編 SKU 名稱易碎。

### usage/summary 回應解析與容錯

GitHub `usage/summary` 為 public preview，回應欄位形狀未在本專案驗證過。前端解析採「候選欄位逐一嘗試」策略：依序嘗試頂層數值欄位（如 totalNetAmount、totalGrossAmount、netAmount、grossAmount），或當回應含 usageItems 陣列時加總每項的 netAmount（退而求其次 grossAmount）。全部失敗時總覽區顯示「無法解析用量資料」的降級訊息，且不影響 budgets 列表渲染——總覽區與列表的載入互相獨立（各自 try/catch）。實作時第一步先以實際 token 呼叫端點確認真實形狀，再以上述策略保底。

## Implementation Contract

- **行為**：開啟頁面後，使用者看到（1）頂部總覽區：org 總使用量金額；若存在 organization scope budgets，另顯示「總用量 / org 預算總和」progress bar；（2）「成員預算」section 列出全部 user scope budgets，每張卡片含已用/預算 bar 與既有編輯欄位；（3）「組織預算」section 列出 organization scope budgets；（4）其餘 scope 落入「其他預算」section。無資料的 section 不出現。
- **介面／資料形狀**：不新增 API。前端依賴既有 `/api/budgets` 回應中每筆 budget 的 `budget_scope`、`budget_entity_name`、`budget_amount`、`consumed_amount`（僅 user scope）欄位，與 `/api/usage` 的 JSON 回應（形狀以容錯解析處理）。
- **失敗模式**：`/api/usage` 失敗或無法解析 → 總覽區顯示降級訊息，列表照常；`/api/budgets` 失敗 → 維持既有整頁錯誤訊息行為。budgets 為空陣列 → 維持既有「目前沒有任何 budget」空狀態。
- **驗收方式**：無測試框架，以手動驗證——`npm run dev` 開 http://localhost:3000，確認分組標題、bar 比例與著色（對照 API 回傳數值）、總覽區金額；另以瀏覽器 DevTools 將 `/api/usage` 模擬為失敗（或暫時改錯端點路徑）驗證降級訊息不影響列表。
- **範圍邊界**：in scope = public/index.html 的 HTML 結構、CSS、內嵌 JS；out of scope = src/server.ts、.env、任何新端點或新套件。

## Risks / Trade-offs

- [usage/summary 回應形狀與預期不符（public preview 變動）] → 候選欄位容錯解析 + 降級訊息，列表不受影響；實作首步先實測真實回應
- [org scope budgets 含多個不同 SKU，金額加總的語意不精確] → 總覽 bar 定位為粗略參考；各 SKU 精確比例由分組列表內的個別卡片承擔
- [consumed_amount 為浮點數，與整數 budget_amount 相除顯示時的小數雜訊] → 百分比四捨五入至整數、金額照 API 原值顯示
