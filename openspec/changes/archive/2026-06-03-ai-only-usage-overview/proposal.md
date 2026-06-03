## Summary

（方案描述）總覽區從「全產品總用量 vs 全部 organization scope 預算加總」改為 AI 專屬：分子只計 AI 相關 SKU 的用量，分母只取 budget_product_sku 為 ai_credits 的 organization scope budget。

## Motivation

（動機與背景）實測資料顯示現行總覽的 $7.6 全數來自 copilot_for_business（Copilot Business 授權費），而 AI credits 實際用量（copilot_ai_unit）為 $0——本工具定位是 AI Budget 管理，現行「全產品加總」會讓使用者把授權費誤讀成 AI 用量，且分母混入 codespaces / actions / git_lfs / packages 等非 AI 預算（5 × $5 = $25），比例失真。

## Proposed Solution

- 分子（AI 用量）：只從 usageItems 計算——AI 相關判定採雙保險規則：unitType 以 ai- 開頭（如 ai-units、ai-credits，即「以 AI credits 計價」的直接語意），或 sku 以底線切分含獨立片段 ai（如 copilot_ai_unit、coding_agent_ai_credit、ai_credits），兩者任一命中即計入；加總其 netAmount（單項缺 netAmount 時退用 grossAmount）；不再使用頂層 total 候選欄位（totalNetAmount 等），因其為全產品總額、無法過濾
- 分母（AI 預算）：只加總 budget_product_sku 為 ai_credits 的 organization scope budgets；不存在時僅顯示 AI 用量金額、不畫 bar
- 總覽標題由「本期總使用量」改為「本期 AI 用量」，無對照預算時的提示文字同步更新
- 容錯與獨立載入行為維持：回應無 usageItems 陣列時顯示「無法解析用量資料」；/api/usage 失敗僅降級總覽、不影響列表

## Non-Goals

- 不改 budgets 分組列表與 user 卡片 bar（budget-grouped-listing capability 不動）
- 不改後端任何端點；不接 premium_request usage 報表 API
- 不提供「全產品 / AI 專屬」切換開關——直接取代，工具定位即 AI budget
- 不硬編完整 SKU 清單（如僅認 copilot_ai_unit）——用 unitType 前綴 + sku 片段的雙保險規則容納未來新 AI SKU（如 Spark、Coding Agent 等以 AI credits 計費的產品）

## Alternatives Considered

- 沿用全產品加總並只改標題：數字語意仍誤導，否決
- 以 product 欄位（Copilot）過濾：copilot_for_business 授權費同屬 Copilot product，無法排除，否決
- 硬編 SKU 白名單：GitHub Budgets API 為 public preview，SKU 清單會隨產品擴充，維護成本高，否決

## Impact

- Affected specs: 修改 `org-usage-overview`（分子/分母計算規則、標題、解析候選欄位變更）
- Affected code:
  - Modified: public/index.html（parseUsageTotal 改為 AI 過濾加總、loadOverview 分母改取 ai_credits budget、標題與提示文字）
  - New: （無）
  - Removed: （無）
- 相依套件：不新增；token 安全邊界不變
