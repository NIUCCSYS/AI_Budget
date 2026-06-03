## Why

（動機與背景）目前 `public/index.html` 將所有 budgets 以單一平面網格列出，user scope 與 organization scope 的卡片混在一起，無法快速看出「哪些是成員個人預算、哪些是組織層級預算」。同時，user scope budget 已附帶 `consumed_amount`（已使用金額），但前端只以一行文字呈現，不易判讀使用比例；org 整體用量摘要端點 `GET /api/usage` 後端已存在卻從未被前端使用，「總使用量 vs 預算」資訊完全看不到。

## What Changes

（方案描述）

- 前端 budgets 列表依 `budget_scope` 分組顯示：「成員預算（user）」與「組織預算（organization）」兩個 section，其餘 scope（enterprise / repository / cost_center）若出現則歸入「其他」section；各 section 有標題，無資料的 section 不顯示
- user scope 的 budget 卡片新增「已用 / 預算」progress bar（純 CSS，依 `consumed_amount / budget_amount` 比例著色，超過門檻變色警示）
- 頁面頂部新增 org 用量總覽區：呼叫既有 `GET /api/usage`（GitHub `usage/summary`），顯示總使用金額，並與 organization scope 的 AI budget 金額並列為總覽 progress bar
- 後端不新增端點；既有 `/api/budgets`、`/api/usage`、`/api/config` 維持原樣

## Non-Goals

- 不接 GitHub premium_request usage 報表 API（per-user 用量直接取自 user scope budget 的 `consumed_amount`，避開該端點僅支援 classic PAT 的相容性風險）
- 不做時間趨勢圖（折線圖）；不引入 Chart.js 或任何前端圖表庫、框架、打包工具
- 不改動 budget 的編輯／儲存行為（PATCH 流程維持原樣）
- 不處理個人帳號（user account）的 budget 修改——GitHub 沒有官方 API，本工具僅適用 organization（既有限制不變）

## Capabilities

### New Capabilities

- `budget-grouped-listing`: budgets 依 scope 分組列表，user scope 卡片顯示已用/預算 progress bar
- `org-usage-overview`: 頁面頂部的 org 總使用量與預算總覽區

### Modified Capabilities

（無——後端 API 行為不變，僅前端呈現變更）

## Impact

- Affected specs: 新增 `budget-grouped-listing`、`org-usage-overview`
- Affected code:
  - New: （無）
  - Modified: public/index.html（分組渲染、progress bar 樣式、總覽區與 /api/usage 串接）
  - Removed: （無）
- 外部 API：僅使用既有已代理的 GitHub Budgets API 與 usage/summary（皆為 public preview，回應欄位若變動需調整前端解析）
- 相依套件：不新增
- Token 安全邊界：不變——前端仍只呼叫本機 /api/*，不接觸 token
