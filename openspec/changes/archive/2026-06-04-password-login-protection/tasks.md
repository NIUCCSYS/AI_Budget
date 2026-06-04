## 1. 後端

- [x] 1.1 實作 spec 需求「Protection is enabled only when APP_PASSWORD is set」與「Login endpoint issues a session cookie」：依 design「啟用條件：APP_PASSWORD 為開關，未設定即完全停用」與「session token：HMAC 簽章字串，secret 製程啟動隨機產生」，在 src/server.ts 實作 POST /api/login（SHA-256 等長化後 timingSafeEqual 比較、成功 204 + Set-Cookie session=exp.sig，HttpOnly / SameSite=Lax / Path=/ / Max-Age 604800）與 token 簽發/驗證函式；驗證：token 簽發/驗證純函式以 node 斷言（有效、過期、竄改簽章三案例），curl 確認正確密碼 204 含 Set-Cookie、錯誤密碼 401 無 Set-Cookie、未設 APP_PASSWORD 時 /api/budgets 不需 cookie 即 200（enablement matrix 三列）
- [x] 1.2 實作 spec 需求「Consecutive failures trigger a lockout」：依 design「密碼驗證與爆破鎖定」，全域連續失敗計數達 5 次後 30 秒內一律回 429 + { message } 且不比對密碼，成功登入或期滿歸零；驗證：curl 依 spec「lockout sequence」範例表跑完整序列（5 次錯誤各 401、30 秒內第 6 次正確密碼仍 429、期滿後正確密碼 204）
- [x] 1.3 實作 spec 需求「API requests require a valid session when protection is enabled」：依 design「middleware 保護範圍與 cookie 解析」，session 檢查 middleware 掛在全部 /api 路由前（排除 POST /api/login），手寫 cookie 解析，無效/過期/缺 cookie 回 401 + { message }，靜態檔不擋；POST /api/logout 回 204 並以 Max-Age=0 清除 cookie；驗證：curl 無 cookie 打 /api/budgets 得 401、帶登入取得的 cookie 得 200、GET / 不帶 cookie 得 200（靜態不擋）、logout 後同 cookie 已被瀏覽器清除情境以無 cookie 重打得 401

## 2. 前端

- [x] 2.1 實作 spec 需求「Frontend shows a login overlay on 401」：依 design「前端登入遮罩」，api() helper 偵測 401 時觸發顯示全頁登入遮罩（重用深色覆蓋風格；密碼框 type=password autofocus、登入按鈕、錯誤訊息區、Enter 送出），多個並行 401 僅顯示一次；登入 204 → location.reload()，401 顯示「密碼錯誤」，429 顯示「嘗試次數過多，請稍後再試」；驗證：瀏覽器以 APP_PASSWORD 啟用的 server 實測——開頁出現單一遮罩、錯誤密碼顯示「密碼錯誤」、正確密碼後頁面重載且各區塊正常、重新整理免登入（cookie 仍有效）

## 3. 文件與整體驗收

- [x] 3.1 更新 .env.example（APP_PASSWORD 說明：NAS 部署必設、未設＝不啟用保護）與 README.md Synology 部署段落（aibudget.env 須含 APP_PASSWORD），並依 design「Implementation Contract」逐項驗收：保護開/關兩種模式、登入/登出、鎖定、靜態檔不擋、既有五個功能區塊登入後零回歸；驗證：npm run dev 以未設與已設 APP_PASSWORD 各跑一輪 contract 列舉情境，確認改動僅 src/server.ts、public/index.html、.env.example、README.md
