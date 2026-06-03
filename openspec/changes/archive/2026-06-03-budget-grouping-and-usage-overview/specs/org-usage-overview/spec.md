## ADDED Requirements

### Requirement: Page header shows total usage and budget overview

The page SHALL render an overview area above the budget sections that displays the organization's total usage amount fetched from `GET /api/usage`. When at least one `organization`-scope budget exists, the overview SHALL also render a progress bar comparing total usage against the sum of all organization-scope `budget_amount` values, using the same color thresholds as user cards (green below 70%, yellow 70%–99%, red at 100% or above, fill capped at 100%). When no organization-scope budget exists, the overview SHALL display the total usage amount only, without a bar.

#### Scenario: Overview with organization budgets present

- **WHEN** `/api/usage` returns a parseable total and two organization-scope budgets of $60 and $40 exist
- **THEN** the overview shows the total usage amount and a bar whose denominator is $100

##### Example: overview ratio

- **GIVEN** parsed total usage = $25, organization-scope budgets = [$60, $40]
- **WHEN** the overview renders
- **THEN** the bar fill is 25% and colored green, with label text containing $25 and $100

#### Scenario: No organization-scope budget

- **WHEN** `/api/usage` returns a parseable total but no organization-scope budget exists
- **THEN** the overview shows the total usage amount without a progress bar

### Requirement: Usage summary parsing is fault-tolerant

The frontend SHALL extract the total usage amount from the `/api/usage` JSON response by trying candidate numeric fields in order (`totalNetAmount`, `totalGrossAmount`, `netAmount`, `grossAmount`), and, when the response contains a `usageItems` array, by summing each item's `netAmount` (falling back to `grossAmount` per item). When no candidate yields a number, the overview SHALL display the degraded message 「無法解析用量資料」.

#### Scenario: Total extracted from usageItems

- **WHEN** the response has no top-level total field but contains `usageItems` with numeric `netAmount` values
- **THEN** the overview total equals the sum of the items' `netAmount` values

##### Example: parsing candidates

| Response shape | Parsed total |
|----------------|--------------|
| { "totalNetAmount": 25.5 } | 25.5 |
| { "totalGrossAmount": 30 } | 30 |
| { "usageItems": [{ "netAmount": 10 }, { "netAmount": 5.5 }] } | 15.5 |
| { "usageItems": [{ "grossAmount": 8 }] } | 8 |
| { "foo": "bar" } | (none — degraded message) |

#### Scenario: Unparseable response degrades gracefully

- **WHEN** the response contains none of the candidate fields and no usable `usageItems`
- **THEN** the overview shows 「無法解析用量資料」 and the budget sections still render normally

### Requirement: Overview failure does not block the budget list

The overview SHALL load independently from the budget list: a failed or non-OK `/api/usage` request SHALL result in a degraded message inside the overview area only, and the budget sections SHALL render unaffected.

#### Scenario: Usage endpoint fails

- **WHEN** `GET /api/usage` returns a non-OK status or the request throws
- **THEN** the overview area shows a degraded error message and the budget sections render normally from `/api/budgets`
