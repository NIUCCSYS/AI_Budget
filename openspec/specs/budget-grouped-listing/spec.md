# budget-grouped-listing Specification

## Purpose

TBD - created by archiving change 'budget-grouping-and-usage-overview'. Update Purpose after archive.

## Requirements

### Requirement: Budgets are listed in sections grouped by scope

The page SHALL group budgets by `budget_scope` into three sections rendered in fixed order: "成員預算" (`user`), "組織預算" (`organization`), and "其他預算" (any other scope, including unknown values). A section with no budgets SHALL NOT be rendered, including its heading. Within each section, cards SHALL be sorted by `budget_entity_name` in lexicographic order.

#### Scenario: Budgets of mixed scopes are grouped

- **WHEN** the budgets response contains both `user`-scope and `organization`-scope budgets
- **THEN** the page renders a "成員預算" section containing only the user-scope cards, followed by a "組織預算" section containing only the organization-scope cards

#### Scenario: Empty group is hidden

- **WHEN** the budgets response contains no budget with `budget_scope` of `organization`
- **THEN** the "組織預算" section and its heading are not rendered

#### Scenario: Unknown scope falls into the catch-all section

- **WHEN** a budget has `budget_scope` of `repository`, `enterprise`, `cost_center`, or any unrecognized value
- **THEN** its card is rendered inside the "其他預算" section

##### Example: grouping and ordering

- **GIVEN** budgets: (scope=user, entity=bob), (scope=organization, entity=acme), (scope=user, entity=alice), (scope=repository, entity=repo1)
- **WHEN** the page renders
- **THEN** sections appear in order 成員預算[alice, bob], 組織預算[acme], 其他預算[repo1]


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

---
### Requirement: User-scope cards show a consumed/budget progress bar

Each `user`-scope budget card SHALL display a pure-CSS progress bar whose fill width equals `consumed_amount / budget_amount`, capped at 100%, together with a text label "已用 $X / $Y（Z%）" where Z is the percentage rounded to the nearest integer. The bar fill color SHALL be green below 70%, yellow from 70% to 99%, and red at 100% or above. When `budget_amount` is 0 and `consumed_amount` is greater than 0, the ratio SHALL be treated as 100%. Cards of any non-user scope SHALL NOT display the bar.

#### Scenario: Bar reflects consumption ratio and color threshold

- **WHEN** a user-scope budget has `consumed_amount` and `budget_amount` values
- **THEN** the bar fill width and color follow the defined ratio and thresholds

##### Example: threshold boundaries

| consumed_amount | budget_amount | Fill width | Color | Notes |
|-----------------|---------------|-----------|-------|-------|
| 3 | 10 | 30% | green | below 70% |
| 7 | 10 | 70% | yellow | at threshold |
| 9.5 | 10 | 95% | yellow | rounds to 95% |
| 10 | 10 | 100% | red | exactly consumed |
| 12 | 10 | 100% | red | overage capped at 100% |
| 5 | 0 | 100% | red | zero budget with usage |
| 0 | 10 | 0% | (empty track) | nothing consumed |

#### Scenario: Organization-scope card has no bar

- **WHEN** an organization-scope budget card is rendered
- **THEN** no progress bar is displayed on that card


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

---
### Requirement: Existing edit behavior is preserved on every card

Every budget card SHALL retain the existing editable fields (budget amount input, prevent-further-usage checkbox, alert checkbox) and the save button with its existing PATCH flow, regardless of which section the card is rendered in.

#### Scenario: Saving from a grouped card

- **WHEN** the user edits the budget amount on a card inside the "成員預算" section and clicks 儲存
- **THEN** the same PATCH request as before is sent and the inline status message shows the result

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