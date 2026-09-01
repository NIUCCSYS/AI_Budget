## ADDED Requirements

### Requirement: Backend exposes the assigned Copilot seat roster

The backend SHALL provide a read-only endpoint that proxies the organization's Copilot seat listing from GitHub and returns the upstream status code and JSON body unchanged. The endpoint SHALL accept no query parameters. The GitHub token SHALL remain server-side: the endpoint SHALL attach it and the browser SHALL NOT receive it.

#### Scenario: Seat roster is returned

- **WHEN** the frontend requests the seat roster endpoint
- **THEN** the response carries the upstream body containing a seat count and a seats array whose entries each expose an assignee login

#### Scenario: Upstream failure is forwarded

- **WHEN** GitHub responds with an error status to the seat listing request
- **THEN** the endpoint forwards that status code and a JSON body containing a message, and does not substitute an empty roster

### Requirement: Ranking card lists members by monthly credit consumption

The frontend SHALL render a card listing every member of the seat roster, ordered by that member's current-month AI credit consumption in descending order. A member's consumption SHALL be the sum of `grossQuantity` across all usage items returned for that member in the current month, displayed rounded to an integer with thousands separators. Members whose consumption is zero SHALL still be listed, ordered last.

When the configured included-credits denominator is a positive integer, each row SHALL additionally show that member's share of the denominator as a percentage together with a proportion bar. When the denominator is absent, rows SHALL show the consumption value only, with no percentage and no bar.

#### Scenario: Members ordered by consumption

- **WHEN** the card renders with consumption values available for every member
- **THEN** members appear in descending order of consumption and each row shows the member name and rounded consumption

##### Example: four members ranked against a 7600 denominator

- **GIVEN** the denominator is 7600 and member sums are craneyu=412.5, yuanfu8899=260.90829, 86Ken=80.4, david545=0
- **WHEN** the card renders
- **THEN** the rows read in order: craneyu 413 (5.4%), yuanfu8899 261 (3.4%), 86Ken 80 (1.1%), david545 0 (0.0%)

#### Scenario: No denominator configured

- **WHEN** the included-credits denominator is absent
- **THEN** each row shows only the member name and rounded consumption, with no percentage and no proportion bar

#### Scenario: Month with no usage at all

- **WHEN** the current month has no usage for any member
- **THEN** every seat holder is listed with a consumption of 0 and no error is shown

### Requirement: Per-member usage is fetched only for days with organization-level usage

The frontend SHALL derive the set of days to query per member from the organization-level daily usage already retrieved for the current month, selecting only those days whose organization-level response contains at least one usage item. Days whose organization-level retrieval failed SHALL be included in the per-member query set, because their emptiness cannot be established. Days whose organization-level response is empty SHALL NOT be queried per member.

#### Scenario: Empty organization days are skipped

- **WHEN** the ranking fetches per-member usage for a month in which only some days carry organization-level items
- **THEN** per-member requests are issued for those days only, and no per-member request is issued for a day whose organization-level response was empty

##### Example: August 2026 day filtering

- **GIVEN** organization-level daily results for August 2026 where days 11, 17, 18 and 26 carry usage items and the remaining 27 days are empty, and the seat roster holds 4 members
- **WHEN** the ranking fetches per-member usage
- **THEN** 16 per-member requests are issued (4 members across 4 days), not 124

#### Scenario: Failed organization day is queried conservatively

- **GIVEN** the organization-level retrieval for one day failed while other days succeeded and were empty
- **WHEN** the ranking fetches per-member usage
- **THEN** that failed day is included in the per-member query set

### Requirement: Unattributed consumption is shown as a separate row

When the sum of all member consumption values is less than the organization-level total for the same month, the card SHALL append a final row showing the difference, labelled as unattributed and accompanied by explanatory text identifying it as consumption that cannot be attributed to a specific member rather than a calculation error. The displayed rows SHALL therefore sum to the organization-level total.

#### Scenario: Difference is surfaced

- **WHEN** member consumption sums to less than the organization-level total
- **THEN** a final unattributed row shows the difference and the rows sum to the organization-level total

##### Example: unattributed remainder

| Organization total | Sum of member values | Unattributed row |
| ------------------ | -------------------- | ---------------- |
| 753.82 | 753.82 | not rendered |
| 753.82 | 700.00 | rendered, showing 54 |
| 753.82 | 753.81 | not rendered (difference rounds to 0) |

#### Scenario: No difference means no extra row

- **WHEN** member consumption sums to the organization-level total
- **THEN** no unattributed row is rendered

### Requirement: Ranking fetches use a cache namespace separate from the member modal

Per-member usage retrieved for the ranking SHALL be cached under keys distinct from the member modal's cache keys, so that a partial-day ranking result SHALL NOT be served to the member modal. Opening a member modal after the ranking has rendered SHALL still produce a chart covering day 1 through today. The ranking cache SHALL follow the existing staleness rule: an entry fetched on a different local date SHALL be refetched.

#### Scenario: Modal is unaffected by ranking cache

- **WHEN** the ranking has rendered and the user then opens that member's modal
- **THEN** the modal chart covers day 1 through today rather than only the days the ranking queried

#### Scenario: Ranking cache expires across dates

- **WHEN** a ranking cache entry was fetched on an earlier local date
- **THEN** the ranking refetches instead of reusing that entry

### Requirement: Ranking failures degrade inside the card

A failure to retrieve the seat roster SHALL replace the card's ranking content with an error message and SHALL NOT affect other cards on the page. A failure of an individual member-day request SHALL be logged as a console warning, SHALL be treated as a missing value rather than zero-with-confidence, and SHALL cause the card to display a partial-data notice so the totals are not read as complete.

#### Scenario: Seat roster unavailable

- **WHEN** the seat roster request fails
- **THEN** the card shows an error message in place of the ranking and the other cards render normally

#### Scenario: Partial member-day failure

- **WHEN** at least one member-day request fails while others succeed
- **THEN** the card renders the ranking together with a partial-data notice and logs a console warning for each failed request
