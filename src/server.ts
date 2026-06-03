import 'dotenv/config'
import express from 'express'
import path from 'node:path'

const TOKEN = process.env.GITHUB_TOKEN
const ORG = process.env.GITHUB_ORG
const PORT = Number(process.env.PORT ?? 3000)

if (!TOKEN || !ORG) {
  console.error('❌ 請先建立 .env 並設定 GITHUB_TOKEN 與 GITHUB_ORG（參考 .env.example）')
  process.exit(1)
}

const GITHUB_API = 'https://api.github.com'
const ghHeaders = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
}

/** 呼叫 GitHub API 並原樣轉發狀態碼與 JSON */
async function github(res: express.Response, url: string, init?: RequestInit) {
  try {
    const r = await fetch(`${GITHUB_API}${url}`, { ...init, headers: { ...ghHeaders, ...init?.headers } })
    const text = await r.text()
    res.status(r.status).type('application/json').send(text || '{}')
  } catch (err) {
    res.status(502).json({ message: `無法連線 GitHub API：${err}` })
  }
}

const app = express()
app.use(express.json())
app.use(express.static(path.join(import.meta.dirname, '../public')))

// 列出 org 的所有 budgets
app.get('/api/budgets', (_req, res) => {
  void github(res, `/organizations/${ORG}/settings/billing/budgets`)
})

// 取得單一 budget
app.get('/api/budgets/:id', (req, res) => {
  void github(res, `/organizations/${ORG}/settings/billing/budgets/${req.params.id}`)
})

// 更新 budget（budget_amount / prevent_further_usage / budget_alerting）
app.patch('/api/budgets/:id', (req, res) => {
  const { budget_amount, prevent_further_usage, budget_alerting } = req.body ?? {}
  const body: Record<string, unknown> = {}
  if (budget_amount !== undefined) {
    if (!Number.isInteger(budget_amount) || budget_amount < 0) {
      res.status(400).json({ message: 'budget_amount 必須是 ≥ 0 的整數（單位：美元）' })
      return
    }
    body.budget_amount = budget_amount
  }
  if (prevent_further_usage !== undefined) body.prevent_further_usage = Boolean(prevent_further_usage)
  if (budget_alerting !== undefined) body.budget_alerting = budget_alerting
  void github(res, `/organizations/${ORG}/settings/billing/budgets/${req.params.id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
})

// org 用量摘要（儀表板輔助資訊）
app.get('/api/usage', (_req, res) => {
  void github(res, `/organizations/${ORG}/settings/billing/usage/summary`)
})

// org 用量報表（逐筆明細，供每日圖表與 included credits 卡片）
// 僅透傳白名單參數 year / month（正整數，month 1–12）
app.get('/api/usage/report', (req, res) => {
  const params = new URLSearchParams()
  for (const key of ['year', 'month'] as const) {
    const raw = req.query[key]
    if (raw === undefined) continue
    const n = Number(raw)
    if (!Number.isInteger(n) || n < 1 || (key === 'month' && n > 12)) {
      res.status(400).json({ message: key === 'month' ? 'month 必須是 1–12 的整數' : 'year 必須是正整數' })
      return
    }
    params.set(key, String(n))
  }
  const qs = params.size ? `?${params}` : ''
  void github(res, `/organizations/${ORG}/settings/billing/usage${qs}`)
})

// premium request 用量代理（per-model / per-user 明細，供每日圖表與成員 modal）
// 白名單透傳 year / month / day（正整數）與 user（GitHub username 格式，防 query 注入）
const GITHUB_USERNAME_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/
app.get('/api/premium-usage', (req, res) => {
  const params = new URLSearchParams()
  const limits = { year: Number.MAX_SAFE_INTEGER, month: 12, day: 31 }
  for (const key of ['year', 'month', 'day'] as const) {
    const raw = req.query[key]
    if (raw === undefined) continue
    const n = Number(raw)
    if (!Number.isInteger(n) || n < 1 || n > limits[key]) {
      res.status(400).json({ message: `${key} 必須是 1–${key === 'year' ? '∞' : limits[key]} 的整數` })
      return
    }
    params.set(key, String(n))
  }
  const user = req.query.user
  if (user !== undefined) {
    if (typeof user !== 'string' || !GITHUB_USERNAME_RE.test(user)) {
      res.status(400).json({ message: 'user 必須符合 GitHub username 格式（英數與連字號，1–39 字）' })
      return
    }
    params.set('user', user)
  }
  const qs = params.size ? `?${params}` : ''
  void github(res, `/organizations/${ORG}/settings/billing/premium_request/usage${qs}`)
})

// 前端取得 org 名稱與選配的內含 credits 分母用
// INCLUDED_CREDITS 須為正整數，否則視為未設定（null）
const includedCreditsRaw = Number(process.env.INCLUDED_CREDITS)
const INCLUDED_CREDITS =
  Number.isInteger(includedCreditsRaw) && includedCreditsRaw > 0 ? includedCreditsRaw : null

app.get('/api/config', (_req, res) => {
  res.json({ org: ORG, includedCredits: INCLUDED_CREDITS })
})

app.listen(PORT, () => {
  console.log(`✅ AI Budget 管理工具： http://localhost:${PORT} （org: ${ORG}）`)
})
