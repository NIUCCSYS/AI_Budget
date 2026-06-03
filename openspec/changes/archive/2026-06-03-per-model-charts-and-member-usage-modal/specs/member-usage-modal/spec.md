## ADDED Requirements

### Requirement: Clicking a member card opens the member usage modal

Clicking a `user`-scope budget card outside its interactive controls SHALL open a modal overlay titled with the member's name. Clicks on the card's input fields, checkboxes, save button, or their labels SHALL NOT open the modal, and the existing edit-and-save flow SHALL remain unchanged. Member cards SHALL show a pointer cursor as the click affordance. The modal SHALL close via a close (✕) button, a click on the backdrop, or the Escape key.

#### Scenario: Card click opens the modal

- **WHEN** the user clicks the blank area of a member card
- **THEN** a modal opens titled with that member's budget_entity_name

#### Scenario: Interactive controls do not open the modal

- **WHEN** the user clicks the budget amount input, a checkbox, or the save button inside a member card
- **THEN** the modal does not open and the control behaves exactly as before

#### Scenario: Three ways to close

- **WHEN** the user clicks ✕, clicks the backdrop, or presses Escape while the modal is open
- **THEN** the modal closes

### Requirement: Modal shows the member's per-model daily usage

The modal SHALL display a per-model daily line chart for the member's current-month usage — built from per-day parallel requests to /api/premium-usage with the `user` parameter (day 1 through today) and aggregated with the same per-model rules, palette, and x-axis as the org daily usage chart — together with a monthly total line 「本月合計 X credits」 where X is the sum of `grossQuantity` over all of the member's items, rounded and thousands-separated.

#### Scenario: Member chart and total

- **WHEN** the modal opens for a member with usage data
- **THEN** it renders one line per model used by that member and the monthly credits total

##### Example: real-data member modal

- **GIVEN** member yuanfu8899's day-1 items: (model="GPT-5.3-Codex", grossQuantity=68.30334, grossAmount=0.6830334), (model="GPT-5.4", grossQuantity=8.65145, grossAmount=0.0865145), today = day 3
- **WHEN** the modal opens
- **THEN** the "GPT-5.3-Codex" series is [0.68, 0, 0], the "GPT-5.4" series is [0.09, 0, 0], and the total reads 本月合計 77 credits

#### Scenario: Member with no usage

- **WHEN** the modal opens for a member whose month has no usage items
- **THEN** it shows 本月合計 0 credits and an empty-usage hint instead of chart lines

### Requirement: Member usage is cached per session

Fetched member usage SHALL be cached in memory keyed by member name with the fetch date: reopening the same member's modal in the same session and on the same local date SHALL NOT issue new /api/premium-usage requests; a cache entry from a previous local date SHALL be refetched.

#### Scenario: Reopen without refetch

- **WHEN** the user opens, closes, and reopens the same member's modal on the same day
- **THEN** the second open issues zero new /api/premium-usage requests

### Requirement: Modal load failure degrades inside the modal

When ALL per-day requests for a member fail, the modal SHALL stay open and show an error message inside its body; when SOME days fail, those days SHALL render as 0 with a console warning. The page behind the modal SHALL remain unaffected in all cases.

#### Scenario: All-days failure shows in-modal error

- **WHEN** every per-day request for the member fails
- **THEN** the modal body shows an error message, the modal stays open and closable, and the page behind renders normally
