## Why

（動機與背景）org 的「本月每日用量」目前只有 AI 總量與計費金額兩條線，看不出各 AI model 的消耗分布；成員卡片只有預算與超額數字，完全看不到個人的每日使用狀態。已用實際 token 驗證：GitHub premium_request usage 端點帶 year/month/day 參數可回 per-model 明細（6/1 實測 Claude Opus 4.7 = 4454.14 credits，與 GitHub 官網圖表的 44.54 美元完全吻合），且帶 user 參數可取得單一成員的 per-model 用量——資料面完全支撐「org 大圖改 GitHub 原版 per-model 風格 + 點成員卡片看個人每日圖」。

## What Changes

（方案描述）

- 後端新增 premium_request usage 代理端點：白名單透傳 user / year / month / day，user 須符合 GitHub username 格式，數值參數驗證沿用既有慣例
- org「本月每日用量」圖表改版：資料源從 usage report 換成 premium_request 逐日並行查詢（當月 1 日～今日），每個 model 一條折線（GitHub 原版風格），移除「計費金額」線；既有「AI credits 消耗總量」概念由各 model 線取代
- 點擊成員卡片（非互動元件區域）開啟 modal：顯示該成員當月 per-model 每日折線圖與 credits 合計，同端點帶 user 參數逐日查詢；點擊卡片內的輸入框、checkbox、儲存按鈕不觸發 modal，既有編輯行為不變
- 逐日查詢結果於 session 內記憶體快取（org 與各成員各一份），重開 modal 不重抓
- Included credits 卡片維持現有 usage report 資料源，不受影響

## Non-Goals

（本段為摘要，完整 Non-Goals 見 design.md）不做跨月歷史查詢；不做成員間比較圖；不改 budgets 編輯流程與 Included credits 卡片。

## Capabilities

### New Capabilities

- `member-usage-modal`: 點擊成員卡片開啟該成員的當月 per-model 每日用量 modal

### Modified Capabilities

- `daily-usage-chart`: org 每日圖表改為 per-model 多線（資料源換為 premium_request 逐日查詢、移除計費金額線），並新增 premium_request 代理端點需求

## Impact

- Affected specs: 修改 `daily-usage-chart`、新增 `member-usage-modal`
- Affected code:
  - New: （無新檔案）
  - Modified: src/server.ts（premium_request 代理 route）、public/index.html（org 圖表改版、成員 modal、逐日 fan-out 與快取）
  - Removed: （無）
- 外部 API：premium_request usage 端點屬 public preview；已實測兩個行為特性——月層級（不帶 day）回空陣列、必須逐日查詢，以及 fine-grained PAT 可用（HTTP 200）
- 效能：月底單次載入約 31 個並行請求（org 圖）＋開 modal 時每成員約 31 個，REST rate limit 5,000/小時下餘裕充足；快取避免重複查詢
- 相依套件：不新增（Chart.js 已於前一 change 引入）；token 安全邊界不變
