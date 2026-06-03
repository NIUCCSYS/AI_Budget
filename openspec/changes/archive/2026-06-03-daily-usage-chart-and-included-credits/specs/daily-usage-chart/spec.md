## ADDED Requirements

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

### Requirement: Page renders a daily usage line chart for the current month

The page SHALL render a chart card containing a Chart.js line chart whose x-axis covers day 1 of the current month through today (local dates, days with no data filled with 0), with two series: (a) daily AI credits consumption in dollars — the sum of `grossAmount` over AI-related report items per local day — and (b) daily billed amount in dollars — the sum of `netAmount` over all report items per local day. An item is AI-related when its `unitType`, lowercased with hyphens, underscores, and spaces removed, starts with `ai`, OR when its `sku`, split by underscores and spaces, contains a standalone segment `ai` (case-insensitive). The chart SHALL use the page's dark color tokens, show a legend and hover tooltips, and start the y-axis at 0.

#### Scenario: Items are aggregated per local day

- **WHEN** the report returns items with UTC timestamps
- **THEN** each item is grouped by its local date and the two series are summed per day

##### Example: two-series aggregation

- **GIVEN** items: (date=2026-06-01T02:00:21Z, sku="Copilot AI Credits", unitType="AICredits", grossAmount=47.90, netAmount=0), (date=2026-06-01T02:07:40Z, sku="Copilot Business", unitType="UserMonths", grossAmount=2.53, netAmount=2.53), (date=2026-06-03T05:54:59Z, sku="Copilot AI Credits", unitType="AICredits", grossAmount=0.45, netAmount=0)
- **WHEN** the chart aggregates in UTC+8
- **THEN** series A (AI credits $) is 47.90 on 6/1, 0 on 6/2, 0.45 on 6/3, and series B (billed $) is 2.53 on 6/1, 0 on 6/2, 0 on 6/3

#### Scenario: AI-related detection matches report naming

- **WHEN** items carry report-style naming such as unitType "AICredits" or sku "Copilot AI Credits"
- **THEN** they are detected as AI-related

##### Example: detection rule

| sku | unitType | AI-related |
|-----|----------|------------|
| Copilot AI Credits | AICredits | yes |
| copilot_ai_unit | ai-units | yes |
| Copilot Business | UserMonths | no |
| spark_premium | ai-credits | yes |

### Requirement: Chart card degrades independently

The chart card SHALL load independently from the budget list and the existing overview. When the report request fails, returns non-OK, or the response has no `usageItems` array, the chart card SHALL show a degraded message; when the Chart.js library fails to load from the CDN, the chart card SHALL show 「圖表元件載入失敗」. In all degraded cases the other page areas SHALL render unaffected. An empty `usageItems` array SHALL render the chart with all-zero series.

#### Scenario: Report failure does not block the page

- **WHEN** /api/usage/report returns a non-OK status
- **THEN** only the chart card shows a degraded message and the overview, included-credits card, and budget sections render normally

#### Scenario: CDN failure degrades the chart only

- **WHEN** the Chart.js script fails to load
- **THEN** the chart card shows 「圖表元件載入失敗」 and the rest of the page renders normally
