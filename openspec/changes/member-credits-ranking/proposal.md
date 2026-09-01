## Why

內含 AI credits 額度自 2026-09-01 促銷期結束後由每席 3000 降回 1900（本 org 4 席，分母 12000 → 7600，縮減 37%），共享池變小，「單一成員把全 org 額度吃光」的風險實質升高。

現有工具看不出這件事：Included credits 卡片只顯示 org 合計，成員別用量要逐一點開 member modal 才看得到，四個人就要點四次、還無法橫向比較。GitHub 的 user-scope budget 也幫不上忙——budget 只計超額後的淨額（8 月實測 594 credits 全額折抵、淨額 $0），要等整池燒完才會觸發警示，等同事後通知。

需要一張「一眼看完全員消耗排名」的卡片，讓池子還沒燒完前就能發現異常集中。

## What Changes

- 新增後端唯讀路由 `/api/copilot-seats`，代理 GitHub `GET /orgs/{org}/copilot/billing/seats`，回傳已指派席次的使用者名單（權威來源，不受該成員是否設有 budget 影響）
- 前端新增「本月成員 credits 消耗排行」卡片：依本月消耗 credits 由高到低排列，每列顯示成員名稱、消耗 credits（四捨五入、千分位）、佔 INCLUDED_CREDITS 的百分比與比例 bar
- 取數採「先篩有用量日、再逐人查」：org 層級某日無用量時，該日全體成員必然為 0，故可先用既有 org 逐日資料篩出有用量的日期，僅對這些日期逐人查詢，大幅降低請求數（以 8 月為例：4 人 × 4 個有用量日 = 16 次，而非 4 人 × 31 天 = 124 次）
- 成員消耗合計小於 org 合計時，補一列「未歸戶」顯示差額，避免排行看起來像全貌卻遺漏部分消耗

## Non-Goals

- 不改動 member-usage-modal 既有行為（點卡片開 modal、per-model 圖表、session 快取一律維持原狀）
- 不改動 Included credits 卡片的分子分母定義
- 不新增任何 npm 相依套件
- 不做跨月歷史比較、不做成員用量的排名趨勢圖
- 不自動調整或建議 GitHub budget 金額——本卡片只呈現，不代為決策

## Capabilities

### New Capabilities

- `member-credits-ranking`: 本月各成員 AI credits 消耗排行卡片，含席次名單取得、逐人取數策略、排序呈現與未歸戶差額處理

### Modified Capabilities

(none)

## Impact

- Affected specs: 新增 `member-credits-ranking`
- Affected code:
  - Modified: src/server.ts（新增 /api/copilot-seats 代理路由）、public/index.html（新增排行卡片與取數邏輯）
  - New: (none)
  - Removed: (none)
- Affected APIs: 新增使用 GitHub `GET /orgs/{org}/copilot/billing/seats`（既有 fine-grained PAT 已實測可存取，無需調整權限）；沿用既有 `/api/premium-usage` 的 user 參數
- Token 安全邊界：不變。新路由與既有路由一致，token 僅存於後端 .env、由後端帶出，前端不接觸
