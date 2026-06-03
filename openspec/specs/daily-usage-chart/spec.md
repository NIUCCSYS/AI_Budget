# daily-usage-chart Specification

## Purpose

TBD - created by archiving change 'daily-usage-chart-and-included-credits'. Update Purpose after archive.

## Requirements

### Requirement: Backend proxies the monthly usage report

The backend SHALL expose GET /api/usage/report that forwards to the GitHub organization usage report endpoint (settings/billing/usage), reusing the existing proxy helper and raw-forwarding convention. Only the query parameters `year` and `month` SHALL be forwarded; both are optional, MUST be positive integers when present, and `month` MUST be between 1 and 12. An invalid parameter SHALL return 400 with a JSON `message`. The frontend SHALL NOT contact the GitHub API directly.

#### Scenario: Valid parameters are forwarded

- **WHEN** the frontend requests /api/usage/report?year=2026&month=6
- **THEN** the backend forwards year=2026 and month=6 to the GitHub usage report endpoint and relays the response status and JSON body unchanged

#### Scenario: Invalid parameters are rejected

- **WHEN** the request carries a non-integer or out-of-range parameter
- **THEN** the backend responds 400 with a JSON message and does not call the GitHub API

##### Example: parameter validation

| Request query | Result |
|---------------|--------|
| year=2026&month=6 | forwarded |
| (none) | forwarded without query |
| month=13 | 400 |
| year=abc | 400 |
| month=0 | 400 |


<!-- @trace
source: daily-usage-chart-and-included-credits
updated: 2026-06-03
code:
  - .github/prompts/spectra-propose.prompt.md
  - .github/prompts/spectra-apply.prompt.md
  - .github/prompts/spectra-archive.prompt.md
  - .github/prompts/spectra-audit.prompt.md
  - .github/skills/spectra-ingest/SKILL.md
  - .github/prompts/spectra-commit.prompt.md
  - package.json
  - src/server.ts
  - CLAUDE.md
  - .github/skills/spectra-ask/SKILL.md
  - .github/skills/spectra-drift/SKILL.md
  - README.md
  - public/index.html
  - .github/prompts/spectra-discuss.prompt.md
  - .github/skills/spectra-apply/SKILL.md
  - .github/skills/spectra-discuss/SKILL.md
  - .github/prompts/spectra-ask.prompt.md
  - .github/skills/spectra-archive/SKILL.md
  - .github/prompts/spectra-debug.prompt.md
  - .github/skills/spectra-audit/SKILL.md
  - tsconfig.json
  - GEMINI.md
  - .github/prompts/spectra-drift.prompt.md
  - .github/skills/spectra-debug/SKILL.md
  - .env.example
  - .github/prompts/spectra-ingest.prompt.md
  - .github/skills/spectra-propose/SKILL.md
  - .spectra.yaml
  - .github/skills/spectra-commit/SKILL.md
-->

---
### Requirement: Page renders a daily usage line chart for the current month

The page SHALL render a chart card containing a Chart.js line chart whose x-axis covers day 1 of the current month through today (local dates, days with no data filled with 0), with one series per AI model: each series' daily value is the sum of `grossAmount` in dollars over that model's items for that local day, sourced from per-day parallel requests to /api/premium-usage (day 1 through today, no `user` parameter). Series colors SHALL be assigned from a fixed 8-color palette by the lexicographic order of model names, cycling when more than 8 models appear. The chart SHALL show a legend with model names and hover tooltips, use the page's dark color tokens, and start the y-axis at 0. The billed-amount series from the previous design SHALL NOT be rendered.

#### Scenario: One line per model

- **WHEN** the month's items contain multiple models
- **THEN** each model renders as its own line with its name in the legend

##### Example: per-model aggregation from real data

- **GIVEN** day-1 items: (model="Claude Opus 4.7", grossAmount=44.541398), (model="Claude Opus 4.6", grossAmount=0.7028105), (model="GPT-5.3-Codex", grossAmount=0.6830334), and day-3 items: (model="GPT-5.4", grossAmount=0.452527), with today = day 3
- **WHEN** the chart aggregates
- **THEN** the "Claude Opus 4.7" series is [44.54, 0, 0], the "GPT-5.3-Codex" series is [0.68, 0, 0], and the "GPT-5.4" series is [0, 0, 0.45] (values rounded to 2 decimals)

#### Scenario: Stable color assignment

- **WHEN** models ["GPT-5.4", "Claude Opus 4.7"] appear
- **THEN** "Claude Opus 4.7" receives palette color 0 and "GPT-5.4" receives palette color 1 (lexicographic order), regardless of item order in the responses


<!-- @trace
source: per-model-charts-and-member-usage-modal
updated: 2026-06-03
code:
  - .github/prompts/spectra-propose.prompt.md
  - .github/skills/spectra-ingest/SKILL.md
  - .spectra.yaml
  - .github/prompts/spectra-drift.prompt.md
  - .github/prompts/spectra-ask.prompt.md
  - .github/skills/spectra-propose/SKILL.md
  - .github/prompts/spectra-audit.prompt.md
  - GEMINI.md
  - tsconfig.json
  - .github/skills/spectra-commit/SKILL.md
  - CLAUDE.md
  - src/server.ts
  - .github/prompts/spectra-archive.prompt.md
  - .github/skills/spectra-drift/SKILL.md
  - .github/skills/spectra-audit/SKILL.md
  - .github/skills/spectra-discuss/SKILL.md
  - package.json
  - public/index.html
  - README.md
  - .github/prompts/spectra-debug.prompt.md
  - .github/prompts/spectra-commit.prompt.md
  - .github/skills/spectra-archive/SKILL.md
  - .github/skills/spectra-debug/SKILL.md
  - .github/skills/spectra-apply/SKILL.md
  - .env.example
  - .github/prompts/spectra-discuss.prompt.md
  - .github/skills/spectra-ask/SKILL.md
  - .github/prompts/spectra-apply.prompt.md
  - .github/prompts/spectra-ingest.prompt.md
-->

---
### Requirement: Chart card degrades independently

The chart card SHALL load independently from the budget list and the existing overview. When ALL per-day requests fail, the chart card SHALL show a degraded message; when SOME days fail, those days SHALL render as 0 and a warning SHALL be logged to the console; when the Chart.js library fails to load from the CDN, the chart card SHALL show 「圖表元件載入失敗」. In all degraded cases the other page areas SHALL render unaffected. When all days succeed but contain no items, the chart card SHALL show 「本月尚無 AI 用量」.

#### Scenario: All days fail

- **WHEN** every per-day request to /api/premium-usage fails
- **THEN** only the chart card shows a degraded message and the overview, included-credits card, and budget sections render normally

#### Scenario: Partial day failure

- **WHEN** one of the per-day requests fails and the others succeed
- **THEN** the failed day renders as 0 on every series, a console warning is logged, and the chart still renders

#### Scenario: CDN failure degrades the chart only

- **WHEN** the Chart.js script fails to load
- **THEN** the chart card shows 「圖表元件載入失敗」 and the rest of the page renders normally


<!-- @trace
source: per-model-charts-and-member-usage-modal
updated: 2026-06-03
code:
  - .github/prompts/spectra-propose.prompt.md
  - .github/skills/spectra-ingest/SKILL.md
  - .spectra.yaml
  - .github/prompts/spectra-drift.prompt.md
  - .github/prompts/spectra-ask.prompt.md
  - .github/skills/spectra-propose/SKILL.md
  - .github/prompts/spectra-audit.prompt.md
  - GEMINI.md
  - tsconfig.json
  - .github/skills/spectra-commit/SKILL.md
  - CLAUDE.md
  - src/server.ts
  - .github/prompts/spectra-archive.prompt.md
  - .github/skills/spectra-drift/SKILL.md
  - .github/skills/spectra-audit/SKILL.md
  - .github/skills/spectra-discuss/SKILL.md
  - package.json
  - public/index.html
  - README.md
  - .github/prompts/spectra-debug.prompt.md
  - .github/prompts/spectra-commit.prompt.md
  - .github/skills/spectra-archive/SKILL.md
  - .github/skills/spectra-debug/SKILL.md
  - .github/skills/spectra-apply/SKILL.md
  - .env.example
  - .github/prompts/spectra-discuss.prompt.md
  - .github/skills/spectra-ask/SKILL.md
  - .github/prompts/spectra-apply.prompt.md
  - .github/prompts/spectra-ingest.prompt.md
-->

---
### Requirement: Backend proxies the premium request usage endpoint

The backend SHALL expose GET /api/premium-usage that forwards to the GitHub organization premium request usage endpoint, reusing the existing proxy helper and raw-forwarding convention. Whitelisted query parameters: `year`, `month`, `day` (positive integers; `month` 1–12, `day` 1–31) and `user` (optional string matching the GitHub username format: alphanumerics and hyphens, no leading/trailing hyphen, 1–39 characters). An invalid parameter SHALL return 400 with a JSON `message` without calling the GitHub API. The frontend SHALL NOT contact the GitHub API directly.

#### Scenario: Valid parameters are forwarded

- **WHEN** the frontend requests /api/premium-usage?year=2026&month=6&day=1&user=yuanfu8899
- **THEN** the backend forwards all four parameters to the GitHub premium request usage endpoint and relays the response unchanged

#### Scenario: Invalid user parameter is rejected

- **WHEN** the `user` parameter violates the GitHub username format
- **THEN** the backend responds 400 with a JSON message and does not call the GitHub API

##### Example: parameter validation

| Request query | Result |
|---------------|--------|
| year=2026&month=6&day=1 | forwarded |
| year=2026&month=6&day=1&user=yuanfu8899 | forwarded |
| day=32 | 400 |
| user=-bad | 400 |
| user=a/b | 400 |

<!-- @trace
source: per-model-charts-and-member-usage-modal
updated: 2026-06-03
code:
  - .github/prompts/spectra-propose.prompt.md
  - .github/skills/spectra-ingest/SKILL.md
  - .spectra.yaml
  - .github/prompts/spectra-drift.prompt.md
  - .github/prompts/spectra-ask.prompt.md
  - .github/skills/spectra-propose/SKILL.md
  - .github/prompts/spectra-audit.prompt.md
  - GEMINI.md
  - tsconfig.json
  - .github/skills/spectra-commit/SKILL.md
  - CLAUDE.md
  - src/server.ts
  - .github/prompts/spectra-archive.prompt.md
  - .github/skills/spectra-drift/SKILL.md
  - .github/skills/spectra-audit/SKILL.md
  - .github/skills/spectra-discuss/SKILL.md
  - package.json
  - public/index.html
  - README.md
  - .github/prompts/spectra-debug.prompt.md
  - .github/prompts/spectra-commit.prompt.md
  - .github/skills/spectra-archive/SKILL.md
  - .github/skills/spectra-debug/SKILL.md
  - .github/skills/spectra-apply/SKILL.md
  - .env.example
  - .github/prompts/spectra-discuss.prompt.md
  - .github/skills/spectra-ask/SKILL.md
  - .github/prompts/spectra-apply.prompt.md
  - .github/prompts/spectra-ingest.prompt.md
-->