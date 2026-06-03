# org-usage-overview Specification

## Purpose

TBD - created by archiving change 'budget-grouping-and-usage-overview'. Update Purpose after archive.

## Requirements

### Requirement: Page header shows total usage and budget overview

The page SHALL render an overview area, titled 「本期 AI 用量」, above the budget sections that displays the organization's AI usage amount derived from `GET /api/usage`. The AI usage amount SHALL include only AI-related usage items (see the AI-related rule in the parsing requirement). When at least one `organization`-scope budget with `budget_product_sku` equal to `ai_credits` exists, the overview SHALL also render a progress bar comparing the AI usage amount against the sum of those ai_credits budgets' `budget_amount` values, using the same color thresholds as user cards (green below 70%, yellow 70%–99%, red at 100% or above, fill capped at 100%). When no such budget exists, the overview SHALL display the AI usage amount only, without a bar. Organization-scope budgets of any other SKU SHALL NOT contribute to the denominator.

#### Scenario: Overview compares AI usage against ai_credits budget only

- **WHEN** organization-scope budgets exist for ai_credits ($5) and codespaces ($5), and the parsed AI usage is $1
- **THEN** the overview shows $1 and a bar whose denominator is $5 (codespaces excluded)

##### Example: denominator excludes non-AI budgets

- **GIVEN** organization-scope budgets = [ai_credits $5, codespaces $5, actions $5], parsed AI usage = $1
- **WHEN** the overview renders
- **THEN** the bar fill is 20% and colored green, with label text containing $1 and $5

#### Scenario: No ai_credits organization-scope budget

- **WHEN** the parsed AI usage is available but no organization-scope budget with `budget_product_sku` of `ai_credits` exists
- **THEN** the overview shows the AI usage amount without a progress bar


<!-- @trace
source: ai-only-usage-overview
updated: 2026-06-03
code:
  - public/index.html
  - tsconfig.json
  - package.json
  - .github/prompts/spectra-audit.prompt.md
  - .github/skills/spectra-audit/SKILL.md
  - .github/prompts/spectra-commit.prompt.md
  - src/server.ts
  - .github/skills/spectra-apply/SKILL.md
  - .github/skills/spectra-ingest/SKILL.md
  - .github/skills/spectra-debug/SKILL.md
  - .github/skills/spectra-discuss/SKILL.md
  - .env.example
  - .github/skills/spectra-ask/SKILL.md
  - CLAUDE.md
  - .github/prompts/spectra-discuss.prompt.md
  - GEMINI.md
  - .github/skills/spectra-commit/SKILL.md
  - .github/prompts/spectra-drift.prompt.md
  - .github/prompts/spectra-debug.prompt.md
  - .github/skills/spectra-drift/SKILL.md
  - .github/prompts/spectra-apply.prompt.md
  - .github/prompts/spectra-archive.prompt.md
  - .github/prompts/spectra-propose.prompt.md
  - .github/skills/spectra-archive/SKILL.md
  - .github/skills/spectra-propose/SKILL.md
  - README.md
  - .spectra.yaml
  - .github/prompts/spectra-ask.prompt.md
  - .github/prompts/spectra-ingest.prompt.md
-->

---
### Requirement: Usage summary parsing is fault-tolerant

The frontend SHALL compute the AI usage amount exclusively from the `usageItems` array of the `/api/usage` JSON response: an item is AI-related when its `unitType` starts with `ai-` (case-insensitive, e.g. `ai-units`, `ai-credits`), OR when its `sku`, split by underscores, contains a standalone segment `ai` (case-insensitive); either match suffices. The amount is the sum of AI-related items' `netAmount`, falling back to `grossAmount` per item when `netAmount` is not a number. Top-level total fields SHALL NOT be used, because they aggregate all products and cannot be filtered. When `usageItems` is an array but contains no AI-related item with a numeric amount, the AI usage amount SHALL be 0. When the response has no `usageItems` array, the overview SHALL display the degraded message 「無法解析用量資料」.

#### Scenario: AI items filtered by unitType prefix or SKU segment rule

- **WHEN** the response contains usage items of mixed SKUs and unit types
- **THEN** only items whose unitType starts with `ai-` or whose sku contains a standalone `ai` segment are summed

##### Example: parsing and filtering

| Response shape | Parsed AI usage | Notes |
|----------------|-----------------|-------|
| { "usageItems": [{ "sku": "copilot_ai_unit", "unitType": "ai-units", "netAmount": 1.2 }, { "sku": "copilot_for_business", "unitType": "user-months", "netAmount": 7.6 }] } | 1.2 | both rules hit; licence excluded |
| { "usageItems": [{ "sku": "ai_credits", "grossAmount": 3 }] } | 3 | sku segment rule, grossAmount fallback |
| { "usageItems": [{ "sku": "spark_premium", "unitType": "ai-credits", "netAmount": 2 }] } | 2 | unitType rule alone (no ai segment in sku) |
| { "usageItems": [{ "sku": "copilot_for_business", "unitType": "user-months", "netAmount": 7.6 }] } | 0 | no AI item |
| { "usageItems": [] } | 0 | empty usage |
| { "totalNetAmount": 25.5 } | (none — degraded message) | top-level totals not used |
| { "foo": "bar" } | (none — degraded message) | unparseable |

#### Scenario: Unparseable response degrades gracefully

- **WHEN** the response has no `usageItems` array
- **THEN** the overview shows 「無法解析用量資料」 and the budget sections still render normally


<!-- @trace
source: ai-only-usage-overview
updated: 2026-06-03
code:
  - public/index.html
  - tsconfig.json
  - package.json
  - .github/prompts/spectra-audit.prompt.md
  - .github/skills/spectra-audit/SKILL.md
  - .github/prompts/spectra-commit.prompt.md
  - src/server.ts
  - .github/skills/spectra-apply/SKILL.md
  - .github/skills/spectra-ingest/SKILL.md
  - .github/skills/spectra-debug/SKILL.md
  - .github/skills/spectra-discuss/SKILL.md
  - .env.example
  - .github/skills/spectra-ask/SKILL.md
  - CLAUDE.md
  - .github/prompts/spectra-discuss.prompt.md
  - GEMINI.md
  - .github/skills/spectra-commit/SKILL.md
  - .github/prompts/spectra-drift.prompt.md
  - .github/prompts/spectra-debug.prompt.md
  - .github/skills/spectra-drift/SKILL.md
  - .github/prompts/spectra-apply.prompt.md
  - .github/prompts/spectra-archive.prompt.md
  - .github/prompts/spectra-propose.prompt.md
  - .github/skills/spectra-archive/SKILL.md
  - .github/skills/spectra-propose/SKILL.md
  - README.md
  - .spectra.yaml
  - .github/prompts/spectra-ask.prompt.md
  - .github/prompts/spectra-ingest.prompt.md
-->

---
### Requirement: Overview failure does not block the budget list

The overview SHALL load independently from the budget list: a failed or non-OK `/api/usage` request SHALL result in a degraded message inside the overview area only, and the budget sections SHALL render unaffected.

#### Scenario: Usage endpoint fails

- **WHEN** `GET /api/usage` returns a non-OK status or the request throws
- **THEN** the overview area shows a degraded error message and the budget sections render normally from `/api/budgets`

<!-- @trace
source: budget-grouping-and-usage-overview
updated: 2026-06-03
code:
  - src/server.ts
  - .github/prompts/spectra-propose.prompt.md
  - .github/skills/spectra-drift/SKILL.md
  - .github/prompts/spectra-apply.prompt.md
  - .github/skills/spectra-discuss/SKILL.md
  - .github/prompts/spectra-debug.prompt.md
  - .github/prompts/spectra-archive.prompt.md
  - GEMINI.md
  - .github/skills/spectra-apply/SKILL.md
  - .github/skills/spectra-debug/SKILL.md
  - .spectra.yaml
  - .github/prompts/spectra-discuss.prompt.md
  - .github/skills/spectra-audit/SKILL.md
  - .env.example
  - .github/prompts/spectra-drift.prompt.md
  - .github/skills/spectra-propose/SKILL.md
  - .github/skills/spectra-ingest/SKILL.md
  - .github/skills/spectra-commit/SKILL.md
  - CLAUDE.md
  - public/index.html
  - .github/prompts/spectra-ingest.prompt.md
  - .github/prompts/spectra-commit.prompt.md
  - .github/skills/spectra-ask/SKILL.md
  - tsconfig.json
  - .github/skills/spectra-archive/SKILL.md
  - .github/prompts/spectra-audit.prompt.md
  - .github/prompts/spectra-ask.prompt.md
  - package.json
  - README.md
-->