## Context

工具已以 Docker 部署至 Synology（內網），Express 後端（src/server.ts）目前無任何驗證：靜態頁與 /api/*（budgets 讀寫、usage、premium-usage、config）對所有能連線者開放。前端為單檔 vanilla JS（public/index.html），所有請求經共用的 api() helper 發出。專案刻意極簡（僅 express + dotenv），新增驗證不得引入套件。

## Goals / Non-Goals

**Goals:**

- APP_PASSWORD 設定後，所有 API 須先登入才能使用；未設定時行為與現狀完全相同
- 單一密碼、無帳號；登入狀態以 httpOnly cookie 維持 7 天
- 防爆破：連續失敗鎖定；密碼比較 timing-safe
- 前端登入遮罩與既有深色風格一致

**Non-Goals:**

- 不做多帳號、角色、權限分級
- 不做 HTTPS / TLS（部署環境的反向代理責任）與 Secure cookie 旗標（NAS 走 http）
- 不做密碼修改 UI（改 env 檔重啟容器即可）、不做忘記密碼流程
- 不持久化 session（重啟後重新登入是可接受的取捨）

## Decisions

### 啟用條件：APP_PASSWORD 為開關，未設定即完全停用

保護僅在 APP_PASSWORD 非空字串時啟用；未設定或空值時所有 middleware 與端點行為跳過、與現狀完全相同（本機 npm run dev 不需登入）。空字串視為未設定而非「空密碼可登入」——這是 audit 防呆：避免 env 檔殘留 APP_PASSWORD= 一行導致按 Enter 就能進。否決「預設強制要密碼」——會破壞既有本機流程且 dev 體驗差，部署文件明確要求 NAS 必設即可。

### session token：HMAC 簽章字串，secret 製程啟動隨機產生

登入成功後發 cookie session=exp.sig，exp 為過期時間（epoch ms，本地時間語意無關，純比大小），sig = HMAC-SHA256(secret, exp) 的 hex。驗證 = 重算 HMAC 比對（timing-safe）且 exp 未過期。secret 以 node:crypto randomBytes(32) 於啟動時產生——重啟容器全部 session 失效需重新登入，單人工具可接受，換得零持久化、零設定。cookie 屬性：HttpOnly、SameSite=Lax、Path=/、Max-Age 7 天。否決 JWT 套件（不新增相依）與「secret 由 APP_PASSWORD 衍生」（密碼一改全部舊 session 仍可預測風險、且洩漏面變大）。

### 密碼驗證與爆破鎖定

POST /api/login 收 JSON { password }。比較方式：兩值各先做 SHA-256 再 crypto.timingSafeEqual（等長化，避免長度洩漏與 timingSafeEqual 對不等長拋錯）。爆破防護：全域（非 per-IP）連續失敗計數器，達 5 次後鎖定 30 秒，期間一律回 429 + { message }（不再比對密碼）；成功登入或鎖定期滿歸零。選全域而非 per-IP：單人內網工具，簡單優先；NAS 前面可能有反代讓 IP 失真。

### middleware 保護範圍與 cookie 解析

app.use 掛在所有 /api 路由之前：APP_PASSWORD 啟用時，除 POST /api/login 外的全部 /api/* 請求須帶有效 session cookie，否則 401 + { message: '請先登入' }。靜態檔（express.static）不擋——index.html 必須能載入才能顯示登入遮罩，且其中無機密。POST /api/logout 需有效 session，行為為回發 Max-Age=0 的同名 cookie。cookie 解析手寫：從 req.headers.cookie 以分號切割找 session=，無 cookie-parser 相依。

### 前端登入遮罩

頁面載入後第一個 API 回 401 時，顯示全頁固定遮罩（重用 modal 的深色覆蓋風格）：標題、密碼輸入框（type=password、autofocus）、登入按鈕、錯誤訊息區。Enter 可送出。登入成功（2xx）→ location.reload() 重跑全部資料載入；401 顯示「密碼錯誤」、429 顯示「嘗試次數過多，請稍後再試」。實作方式：api() helper 偵測 401 時觸發（僅觸發一次）顯示遮罩——既有各區塊的獨立 try/catch 不需逐一修改。

## Implementation Contract

- **行為**：（1）APP_PASSWORD 已設：開頁面 → 各區塊請求收 401 → 全頁登入遮罩出現；輸入正確密碼 → 頁面重載、一切功能如常；輸入錯誤 → 遮罩顯示「密碼錯誤」；連續錯 5 次 → 30 秒內顯示「嘗試次數過多」訊息（429）。已登入後 7 天內重開頁面免登入。（2）APP_PASSWORD 未設或空值：與現狀完全相同、無登入遮罩。（3）POST /api/logout 後再呼叫任何 API 回 401。
- **介面／資料形狀**：POST /api/login body { password: string } → 成功 204 + Set-Cookie session（HttpOnly; SameSite=Lax; Path=/; Max-Age=604800）；失敗 401 + { message }；鎖定 429 + { message }。POST /api/logout → 204 + 清除 cookie。其餘 /api/* 未帶有效 session 時 401 + { message }。靜態檔不受保護。
- **失敗模式**：body 缺 password 或非字串 → 401（視同密碼錯誤，計入失敗次數）；cookie 格式錯誤 / 簽章不符 / 過期 → 401；鎖定期間一律 429 不洩漏密碼正確與否。
- **驗收方式**：token 簽發/驗證與鎖定計數的純函式以 node 斷言；整體流程以 curl 對照 spec 範例表（含 Set-Cookie 標頭檢查與帶 cookie 重打）；前端遮罩以瀏覽器實測（錯誤密碼、正確密碼、reload 後免登入）；APP_PASSWORD 未設時跑既有頁面確認零回歸。
- **範圍邊界**：in scope = src/server.ts、public/index.html、.env.example、README.md 部署段落；out of scope = HTTPS、帳號體系、session 持久化、新套件、docker-compose.yml（env_file 機制原樣可帶 APP_PASSWORD）。

## Risks / Trade-offs

- [內網 http 傳輸，密碼與 cookie 明文可被同網段竊聽] → 已知取捨；文件註明若需對外或跨網段，前面掛 DSM 反向代理 + HTTPS；cookie 不設 Secure 否則 http 下無法運作
- [全域鎖定可被惡意者用來把合法使用者鎖在外面（DoS）] → 單人工具接受此取捨，30 秒短鎖定把影響降到最低
- [重啟容器 session 全失效] → 重新登入即可，屬刻意設計（secret 不持久化）
- [前端遮罩只是 UX，真正的防線在 API 401] → spec 明確規範保護在 middleware；遮罩僅為呈現層
