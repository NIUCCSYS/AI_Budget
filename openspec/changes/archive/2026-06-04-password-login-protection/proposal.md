## Why

（動機與背景）工具已部署到 Synology（內網多人可達），但頁面與 API 完全沒有驗證——任何能連到該 port 的人都能修改 org 預算、查看用量。防火牆規則只能限 IP，無法應付同網段的其他使用者。需要一道最低限度的密碼閘門（單一密碼、無帳號體系），讓 NAS 部署能安全見人。

## What Changes

（方案描述）

- 後端新增登入機制：環境變數 APP_PASSWORD 設定後啟用保護——POST /api/login 驗證密碼（timing-safe 比較），成功發 httpOnly session cookie（HMAC 簽章、7 天效期）；連續失敗 5 次鎖定 30 秒（回 429）
- 全部既有 /api/* 端點加上 session 檢查 middleware：無有效 cookie 回 401 + { message }；/api/login 與靜態檔不在保護範圍（前端需要載入頁面才能顯示登入畫面）
- POST /api/logout 清除 session cookie
- 前端：api() 收到 401 時顯示全頁登入遮罩（密碼輸入框 + 送出），登入成功後重新載入頁面；密碼錯誤與鎖定訊息顯示於遮罩內
- APP_PASSWORD 未設定時行為完全不變（本機開發不用登入），.env.example 註明 NAS 部署必設
- 不新增任何套件：HMAC 與 timing-safe 比較用 node:crypto，cookie 解析手寫（單一 cookie，無需 cookie-parser）

## Non-Goals

（本段為摘要，完整 Non-Goals 見 design.md）不做多帳號／角色；不做 HTTPS（由部署環境的反向代理承擔）；不做密碼修改介面（改 env 重啟即可）；不做「記住我」選項。

## Capabilities

### New Capabilities

- `password-login`: 單一密碼登入保護——login/logout 端點、API session 閘門、前端登入遮罩

### Modified Capabilities

（無——既有 5 個 capability 的需求描述均不變，其行為適用於通過驗證後的 session；未設 APP_PASSWORD 時行為與現狀完全相同）

## Impact

- Affected specs: 新增 `password-login`
- Affected code:
  - New: （無新檔案）
  - Modified: src/server.ts（login/logout 端點、session middleware、cookie 工具）、public/index.html（401 偵測與登入遮罩）、.env.example（APP_PASSWORD 說明）、README.md（部署段落補充必設密碼）
  - Removed: （無）
- 安全邊界：token 安全邊界不變；新增的 APP_PASSWORD 同樣只存於 env 檔（不進版控、不進 image）；session secret 為製程啟動時隨機產生（重啟容器需重新登入，屬可接受行為）
- 相依套件：不新增
