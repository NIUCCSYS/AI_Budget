# password-login Specification

## Purpose

TBD - created by archiving change 'password-login-protection'. Update Purpose after archive.

## Requirements

### Requirement: Protection is enabled only when APP_PASSWORD is set

Password protection SHALL be active only when the APP_PASSWORD environment variable is a non-empty string. When APP_PASSWORD is unset or empty, every endpoint and the frontend SHALL behave exactly as before this change — no login overlay, no 401 gating. An empty value SHALL be treated as "disabled", never as "empty password accepted".

#### Scenario: Unset keeps current behavior

- **WHEN** the server starts without APP_PASSWORD
- **THEN** all /api/* endpoints respond without requiring a session and the page shows no login overlay

##### Example: enablement matrix

| APP_PASSWORD | Protection |
|--------------|-----------|
| (unset) | disabled |
| (empty string) | disabled |
| s3cret | enabled |


<!-- @trace
source: password-login-protection
updated: 2026-06-04
code:
  - public/index.html
  - .env.example
  - README.md
  - src/server.ts
-->

---
### Requirement: Login endpoint issues a session cookie

POST /api/login SHALL accept JSON { password }, compare it against APP_PASSWORD using a timing-safe comparison (both values hashed to equal length first), and on success respond 204 with a Set-Cookie header for `session` carrying an HMAC-SHA256-signed expiry token (secret generated randomly at process start), with HttpOnly, SameSite=Lax, Path=/, and Max-Age of 7 days. A wrong, missing, or non-string password SHALL respond 401 with a JSON message and count as a failed attempt.

#### Scenario: Correct password logs in

- **WHEN** POST /api/login receives the correct password
- **THEN** the response is 204 with a session Set-Cookie marked HttpOnly and SameSite=Lax

#### Scenario: Wrong password rejected

- **WHEN** POST /api/login receives a wrong password
- **THEN** the response is 401 with a JSON message and no Set-Cookie


<!-- @trace
source: password-login-protection
updated: 2026-06-04
code:
  - public/index.html
  - .env.example
  - README.md
  - src/server.ts
-->

---
### Requirement: Consecutive failures trigger a lockout

After 5 consecutive failed login attempts, POST /api/login SHALL respond 429 with a JSON message for 30 seconds without comparing the password. A successful login or lockout expiry SHALL reset the failure counter.

#### Scenario: Sixth attempt during lockout

- **WHEN** 5 consecutive login attempts have failed and another attempt arrives within 30 seconds
- **THEN** the response is 429 regardless of the submitted password

##### Example: lockout sequence

| Attempt | Password | Response |
|---------|----------|----------|
| 1–5 | wrong | 401 each |
| 6 (within 30s) | correct | 429 (not compared) |
| 7 (after 30s) | correct | 204 |


<!-- @trace
source: password-login-protection
updated: 2026-06-04
code:
  - public/index.html
  - .env.example
  - README.md
  - src/server.ts
-->

---
### Requirement: API requests require a valid session when protection is enabled

When protection is enabled, every /api/* request except POST /api/login SHALL require a valid session cookie (signature verified timing-safe, not expired); otherwise the response SHALL be 401 with a JSON message. Static files SHALL be served without a session so the login overlay can load. POST /api/logout SHALL clear the session cookie (Max-Age=0); subsequent API requests respond 401.

#### Scenario: Unauthenticated API call is rejected

- **WHEN** protection is enabled and GET /api/budgets arrives without a valid session cookie
- **THEN** the response is 401 with a JSON message

#### Scenario: Authenticated call passes through

- **WHEN** the request carries a session cookie issued by /api/login and not expired
- **THEN** the request proceeds to the existing handler unchanged

#### Scenario: Logout invalidates the browser session

- **WHEN** POST /api/logout is called with a valid session and then GET /api/budgets is called again without a cookie
- **THEN** the logout response clears the cookie and the subsequent call responds 401


<!-- @trace
source: password-login-protection
updated: 2026-06-04
code:
  - public/index.html
  - .env.example
  - README.md
  - src/server.ts
-->

---
### Requirement: Frontend shows a login overlay on 401

When any API response is 401, the page SHALL show a full-page login overlay (dark style consistent with the page) containing a password input, a submit button, and an error message area; the overlay SHALL appear at most once regardless of how many parallel requests return 401. Submit (button or Enter) SHALL POST /api/login; on success the page reloads; on 401 the overlay shows 「密碼錯誤」; on 429 it shows 「嘗試次數過多，請稍後再試」.

#### Scenario: Overlay appears once for parallel failures

- **WHEN** the page loads while protected and multiple parallel API calls each return 401
- **THEN** exactly one login overlay is shown

#### Scenario: Successful login reloads

- **WHEN** the user submits the correct password in the overlay
- **THEN** the page reloads and renders all sections normally

<!-- @trace
source: password-login-protection
updated: 2026-06-04
code:
  - public/index.html
  - .env.example
  - README.md
  - src/server.ts
-->