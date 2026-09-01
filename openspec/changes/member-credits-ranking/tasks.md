## 1. 後端席次名單

- [x] 1.1 依 design 決策「席次名單取自 Copilot 席次端點而非既有預算資料」，在 src/server.ts 實作 spec 需求「Backend exposes the assigned Copilot seat roster」：新增 GET /api/copilot-seats，以後端持有的 token 代理 GitHub 的 org Copilot 席次列表，原樣轉發上游狀態碼與 JSON body，不接受任何查詢參數；驗證：啟動 npm run dev 後對該路由發出請求，確認回應含 total_seats 與 seats 陣列且每筆有 assignee.login，並確認回應標頭與 body 均不含 token 字串
- [x] 1.2 實作 spec 需求「Backend exposes the assigned Copilot seat roster」的失敗轉發情境：上游回非 2xx 時原樣轉發該狀態碼與含 message 的 JSON，不以空名單代替；驗證：暫時將 GITHUB_ORG 改為不存在的組織名啟動後請求該路由，確認回傳非 200 且 body 含 message，而非 200 加空陣列

## 2. 前端取數與快取

- [x] 2.1 [P] 依 design 決策「逐人取數只查詢有用量的日期」，在 public/index.html 實作 spec 需求「Per-member usage is fetched only for days with organization-level usage」的日期篩選：由既有 org 逐日資料推導出「有用量日集合」，org 該日回應為空者排除、該日取數失敗者保守納入；驗證：以瀏覽器開發者工具網路面板確認帶 user 參數的請求數等於「席次人數 × 有用量日數」，並以 spec 的 August 2026 範例（4 人 × 4 天 = 16 次而非 124 次）對照
- [x] 2.2 [P] 依 design 決策「排行取數使用獨立快取鍵，不污染成員 modal 快取」，實作 spec 需求「Ranking fetches use a cache namespace separate from the member modal」：排行的成員取數結果存入與既有成員快取不同命名空間的鍵，沿用「抓取日期不同即過期」規則；驗證：先讓排行卡片渲染完成，再點擊同一成員開啟 modal，確認 modal 折線圖仍涵蓋 1 日至今完整區間而非僅排行查詢過的日期

## 3. 排行卡片呈現

- [x] 3.1 依 design 決策「排行卡片的分子分母與未歸戶差額」，實作 spec 需求「Ranking card lists members by monthly credit consumption」：卡片列出全部席次成員、依本月 grossQuantity 加總由高到低排序，顯示四捨五入千分位消耗值；includedCredits 為正整數時另外顯示百分比與比例 bar（沿用既有 bar 著色門檻），為 null 時僅顯示消耗值；消耗為 0 的成員仍列出並排最後；驗證：以 spec 的「four members ranked against a 7600 denominator」範例逐列比對顯示結果（craneyu 413 / 5.4%、yuanfu8899 261 / 3.4%、86Ken 80 / 1.1%、david545 0 / 0.0%）
- [x] 3.2 實作 spec 需求「Unattributed consumption is shown as a separate row」：成員加總小於 org 同期合計時，末列顯示差額並標註為無法歸戶之消耗（附說明文字），使各列加總等於 org 合計；差額四捨五入後為 0 時不顯示該列；驗證：以 spec 的 unattributed remainder 表格三種情境（753.82/753.82 不顯示、753.82/700.00 顯示 54、753.82/753.81 不顯示）對照
- [x] 3.3 依 design 決策「失敗降級在卡片內部完成」，實作 spec 需求「Ranking failures degrade inside the card」：席次名單取得失敗時卡片內顯示錯誤訊息且不影響其他卡片；個別成員單日請求失敗時以 console.warn 記錄、該日視為缺值，並在卡片標題區顯示部分資料失敗提示；驗證：以開發者工具將 /api/copilot-seats 請求攔截為失敗，確認僅該卡片顯示錯誤、Included credits 與每日用量圖表仍正常渲染

## 4. 整體驗收

- [x] 4.1 驗證排行合計與既有 Included credits 卡片分子一致：以 npm run dev 啟動並開啟頁面，確認排行各列（含未歸戶列）消耗加總等於 Included credits 卡片顯示的本月消耗值，兩者不得出現無法解釋的落差
- [x] 4.2 驗證新週期無用量情境：於本月尚無任何用量時開啟頁面，確認卡片列出全部席次成員且值均為 0、不出現錯誤訊息，符合 spec 的「Month with no usage at all」情境
