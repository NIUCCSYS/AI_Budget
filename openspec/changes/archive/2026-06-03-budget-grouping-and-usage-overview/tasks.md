## 1. 前置確認

- [x] 1.1 以實際 token 呼叫 GET /api/usage（curl 或瀏覽器）確認 GitHub usage/summary 真實回應形狀，記錄頂層欄位名稱，對照 design「usage/summary 回應解析與容錯」決策中的候選欄位清單是否涵蓋；驗證：在本任務完成時於 tasks 註記或 commit message 附上實測到的欄位名稱
  > 實測結果（2026-06-03，HTTP 200）：頂層欄位 = timePeriod { year, month }、organization、usageItems[]；每項 = product, sku, grossQuantity, discountQuantity, netQuantity, grossAmount, discountAmount, netAmount, pricePerUnit, unitType。無頂層 total 欄位 → design 候選策略以「加總 usageItems 各項 netAmount」命中，涵蓋 ✓

## 2. 分組列表（budget-grouped-listing）

- [x] 2.1 實作 spec 需求「Budgets are listed in sections grouped by scope」：依 design「分組規則與 section 排序」，在 public/index.html 的 load() 將 budgets 依 budget_scope 分為 成員預算（user）/ 組織預算（organization）/ 其他預算（其餘與未知 scope）三個 section，固定順序渲染，空組連標題一併不渲染，組內卡片依 budget_entity_name 字典序排序；驗證：npm run dev 開 http://localhost:3000，對照 /api/budgets 回應確認卡片落在正確 section、排序正確，並以 DevTools 改寫回應模擬「只有 user scope」確認組織 section 隱藏
- [x] 2.2 實作 spec 需求「User-scope cards show a consumed/budget progress bar」：依 design「user 卡片 progress bar 的純 CSS 實作」，在 user scope 卡片加雙層 div bar（新增 --yellow: #d29922 色票），填色寬度 = consumed_amount / budget_amount 封頂 100%，著色 <70% 綠 / 70%–99% 黃 / ≥100% 紅，budget_amount 為 0 且有消費視為 100% 紅，旁附「已用 $X / $Y（Z%）」文字（Z 四捨五入整數），非 user scope 卡片不顯示 bar；驗證：以 DevTools 改寫 /api/budgets 回應套用 spec 範例表 7 組數值（3/10、7/10、9.5/10、10/10、12/10、5/0、0/10），逐一目視確認寬度與顏色
- [x] 2.3 確認 spec 需求「Existing edit behavior is preserved on every card」：分組後每張卡片保留預算輸入框、超額即停用與警示 checkbox、儲存按鈕與原 PATCH 流程；驗證：在成員預算 section 內某卡片修改金額按儲存，DevTools Network 確認送出與改動前相同形狀的 PATCH /api/budgets/:id，且卡片內 status 文字顯示結果

## 3. 總覽區（org-usage-overview）

- [x] 3.1 實作 spec 需求「Page header shows total usage and budget overview」：依 design「總覽區資料來源與預算對應」，於 budgets 列表上方渲染總覽區，顯示 /api/usage 解析出的總使用金額；當存在 organization scope budget 時加總其 budget_amount 作為分母畫總覽 bar（沿用 2.2 的著色門檻與封頂規則），不存在時僅顯示金額不畫 bar；驗證：npm run dev 對照 API 實際數值確認金額與 bar 比例，再以 DevTools 改寫 /api/budgets 移除 organization scope budget 確認 bar 消失、金額仍在
- [x] 3.2 實作 spec 需求「Usage summary parsing is fault-tolerant」：依 design「usage/summary 回應解析與容錯」，依序嘗試 totalNetAmount → totalGrossAmount → netAmount → grossAmount，或加總 usageItems 各項 netAmount（單項退而求其次 grossAmount），全部失敗時總覽區顯示「無法解析用量資料」；驗證：以 DevTools 改寫 /api/usage 回應逐一套用 spec 範例表 5 種形狀，確認解析值與降級訊息符合預期
- [x] 3.3 實作 spec 需求「Overview failure does not block the budget list」：總覽區與 budgets 列表各自獨立 try/catch 載入，/api/usage 失敗或非 OK 時僅總覽區顯示降級錯誤訊息；驗證：以 DevTools 將 /api/usage 請求設為 block（或暫時改前端呼叫路徑為不存在端點），確認總覽區出現錯誤訊息且 budgets 各 section 照常渲染

## 4. 整體驗收

- [x] 4.1 依 design「Implementation Contract」逐項手動驗收：總覽區、三個 section 的有無與順序、user bar、空狀態（budgets 為空陣列時維持既有「目前沒有任何 budget」訊息）、/api/budgets 失敗時維持既有整頁錯誤訊息；驗證：npm run dev 完整走過上述情境並確認 src/server.ts 無任何改動（git diff 或檔案比對為空）
