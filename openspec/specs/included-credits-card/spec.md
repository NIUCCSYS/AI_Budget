# included-credits-card Specification

## Purpose

TBD - created by archiving change 'daily-usage-chart-and-included-credits'. Update Purpose after archive.

## Requirements

### Requirement: Included credits card shows monthly consumed credits

The page SHALL render an included-credits card showing the credits consumed this month: the sum of `quantity` over AI-related report items (using the same AI-related detection rule as the daily usage chart), rounded to the nearest integer and formatted with thousands separators. When the /api/config response carries a numeric `includedCredits`, the card SHALL show 「X / Y credits」 with a progress bar using the existing color thresholds (green below 70%, yellow 70%–99%, red at 100% or above, fill capped at 100%); when `includedCredits` is null, the card SHALL show the consumed value only, without a bar.

#### Scenario: Consumed credits computed from report quantities

- **WHEN** the monthly report contains AI-related items with quantities
- **THEN** the card shows their rounded, thousands-separated sum

##### Example: real-data reproduction

- **GIVEN** AI-related items with quantity 4789.81194 and 45.2527, and includedCredits = 12000
- **WHEN** the card renders
- **THEN** it shows 4,835 / 12,000 credits with a bar at 40% colored green

#### Scenario: No configured denominator

- **WHEN** includedCredits in /api/config is null
- **THEN** the card shows the consumed credits value without a progress bar


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
### Requirement: Config endpoint exposes the optional included credits denominator

The backend /api/config response SHALL be extended with an `includedCredits` field: the positive-integer value of the INCLUDED_CREDITS environment variable, or null when the variable is unset or not a positive integer. The existing `org` field SHALL remain unchanged.

#### Scenario: Denominator configured

- **WHEN** INCLUDED_CREDITS=12000 is set in the environment
- **THEN** /api/config responds with org and includedCredits 12000

##### Example: env parsing

| INCLUDED_CREDITS | includedCredits in response |
|------------------|------------------------------|
| 12000 | 12000 |
| (unset) | null |
| 0 | null |
| abc | null |


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
### Requirement: Included credits card shows the monthly reset countdown

The card SHALL show when the included credits reset: the number of days from today (local time) until the first day of the next month (local time), rendered as 「N 天後（M月1日）重置」.

#### Scenario: Countdown to next month

- **WHEN** today is 2026-06-03 local time
- **THEN** the card shows 28 天後（7月1日）重置


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
### Requirement: Included credits card degrades independently

The included-credits card SHALL load independently: when the report request fails or its response has no `usageItems` array, the card SHALL show a degraded message while the overview, chart card, and budget sections render unaffected. An empty `usageItems` array SHALL render the card with 0 consumed credits.

#### Scenario: Report failure degrades the card only

- **WHEN** the monthly report request returns a non-OK status
- **THEN** the included-credits card shows a degraded message and all other page areas render normally

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