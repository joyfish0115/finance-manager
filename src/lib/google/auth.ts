/**
 * Google OAuth 2.0 with PKCE — 前端負責 PKCE 流程，
 * client_secret 由 /api/oauth/* 後端（Vercel Edge Function）保管。
 *
 * 流程：
 *   1. signIn(): 產生 code_verifier、導向 Google 授權頁
 *   2. Google 把使用者導回 redirect_uri，URL 帶 ?code=xxx
 *   3. handleAuthCallback(): 把 code 送到 /api/oauth/exchange 換 access/refresh token
 *   4. refreshAccessToken(): access_token 過期前打 /api/oauth/refresh 換新的
 */

import {
  GOOGLE_CONFIG,
  OAUTH_ENDPOINTS,
  getRedirectUri,
} from './config'

const STORAGE_KEYS = {
  verifier: 'fm.oauth.verifier',
  state: 'fm.oauth.state',
} as const

export interface TokenSet {
  accessToken: string
  refreshToken?: string
  /** UNIX timestamp（秒）。提早 60 秒視為過期 */
  expiresAt: number
  scope: string
}

// ───────────────────────────────────────── PKCE 工具 ─────────────────────────

function base64UrlEncode(bytes: Uint8Array): string {
  const binary = String.fromCharCode(...bytes)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function randomString(length: number): string {
  const arr = new Uint8Array(length)
  crypto.getRandomValues(arr)
  return base64UrlEncode(arr)
}

async function sha256(input: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return new Uint8Array(hash)
}

// ───────────────────────────────────────── Public API ────────────────────────

/** 把使用者導去 Google 授權頁。回來時 URL 會帶 ?code=xxx&state=yyy */
export async function signIn(): Promise<void> {
  const verifier = randomString(64)
  const challenge = base64UrlEncode(await sha256(verifier))
  const state = randomString(16)

  // verifier / state 存 sessionStorage（換分頁/重整就清掉，避免重放）
  sessionStorage.setItem(STORAGE_KEYS.verifier, verifier)
  sessionStorage.setItem(STORAGE_KEYS.state, state)

  const params = new URLSearchParams({
    client_id: GOOGLE_CONFIG.clientId,
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: GOOGLE_CONFIG.scopes,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
    // 取得 refresh_token 需要這兩個
    access_type: 'offline',
    prompt: 'consent',
  })

  window.location.assign(`${OAUTH_ENDPOINTS.authorize}?${params}`)
}

/**
 * 在 App 啟動時呼叫。如果 URL 有 ?code=，就交換 token。
 * 處理完會把 query string 從 URL 清掉，回傳取得的 token；
 * 沒有 code 就回傳 null。
 */
export async function handleAuthCallback(): Promise<TokenSet | null> {
  const url = new URL(window.location.href)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  if (error) {
    cleanUrl()
    throw new Error(`Google 授權失敗：${error}`)
  }
  if (!code) return null

  const expectedState = sessionStorage.getItem(STORAGE_KEYS.state)
  const verifier = sessionStorage.getItem(STORAGE_KEYS.verifier)
  sessionStorage.removeItem(STORAGE_KEYS.state)
  sessionStorage.removeItem(STORAGE_KEYS.verifier)

  if (!verifier) {
    cleanUrl()
    throw new Error(
      '找不到登入過程的暫存資料，可能是您換了瀏覽器分頁完成登入。請在同一個分頁重新登入。',
    )
  }
  if (!expectedState || state !== expectedState) {
    cleanUrl()
    throw new Error(
      `授權狀態驗證失敗（state mismatch）。expected=${expectedState ?? '(none)'} actual=${state ?? '(none)'}`,
    )
  }

  const tokens = await exchangeCodeForTokens(code, verifier)
  cleanUrl()
  return tokens
}

async function exchangeCodeForTokens(
  code: string,
  verifier: string,
): Promise<TokenSet> {
  const res = await fetch(OAUTH_ENDPOINTS.exchange, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      code_verifier: verifier,
      redirect_uri: getRedirectUri(),
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`交換 token 失敗（${res.status}）：${detail}`)
  }

  const data = (await res.json()) as {
    access_token: string
    refresh_token?: string
    expires_in: number
    scope: string
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: nowSeconds() + data.expires_in,
    scope: data.scope,
  }
}

/** 用 refresh_token 換新的 access_token */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<TokenSet> {
  const res = await fetch(OAUTH_ENDPOINTS.refresh, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Token 續期失敗（${res.status}）：${detail}`)
  }

  const data = (await res.json()) as {
    access_token: string
    expires_in: number
    scope: string
  }

  return {
    accessToken: data.access_token,
    // refresh 流程通常不會再回傳新的 refresh_token，沿用舊的
    refreshToken,
    expiresAt: nowSeconds() + data.expires_in,
    scope: data.scope,
  }
}

export function isTokenExpired(tokens: TokenSet, marginSeconds = 60): boolean {
  return nowSeconds() + marginSeconds >= tokens.expiresAt
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000)
}

function cleanUrl(): void {
  // 把 ?code=xxx&state=yyy 從網址清掉，避免使用者按重新整理時又跑一次交換。
  // 注意要保留 hash（HashRouter 的路由）。
  const url = new URL(window.location.href)
  url.search = ''
  window.history.replaceState({}, document.title, url.toString())
}
