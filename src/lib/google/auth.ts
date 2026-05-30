/**
 * Google Identity Services (GIS) Token Model — 純前端授權，不需要 Client Secret。
 *
 * 流程：
 *   1. signIn(): 跳出 Google 同意視窗，使用者授權後直接拿到 access_token
 *   2. silentRefresh(): access_token 過期後，靜默向 Google 索取新的（不跳視窗）
 *
 * 沒有 refresh_token、沒有 redirect_uri、沒有 client_secret。
 * 授權範圍與來源由 Google Cloud Console 的「Authorized JavaScript origins」管控。
 */

import { GOOGLE_CONFIG } from './config'

// ───────────────────────────────────────── GIS 型別 ──────────────────────────

interface TokenResponse {
  access_token?: string
  expires_in?: number
  scope?: string
  error?: string
  error_description?: string
}

interface TokenClient {
  callback: (resp: TokenResponse) => void
  requestAccessToken: (opts?: {
    prompt?: '' | 'none' | 'consent' | 'select_account'
  }) => void
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (resp: TokenResponse) => void
          }) => TokenClient
          revoke: (accessToken: string, done?: () => void) => void
        }
      }
    }
  }
}

// ───────────────────────────────────────── Public API ────────────────────────

export interface TokenSet {
  accessToken: string
  /** UNIX timestamp（秒）。提早 60 秒視為過期，避免邊界問題 */
  expiresAt: number
  scope: string
}

/** 第一次登入：彈出 Google 同意視窗（使用者主動點擊，不設超時） */
export async function signIn(): Promise<TokenSet> {
  return requestToken('consent')
}

/**
 * 靜默續期：不顯示視窗，用使用者既有的 Google session 拿新 token。
 *
 * Google 的靜默授權有時不會回呼（被 popup blocker 擋、第三方 cookie 被擋、
 * Google session 過期等），所以這裡加 5 秒超時，避免 App 永遠卡在 loading。
 * 超時或失敗時直接 throw，呼叫端會 fallback 到顯示登入畫面。
 */
export async function silentRefresh(): Promise<TokenSet> {
  return requestToken('', 5000)
}

/** 主動撤銷授權（登出時用）。失敗不影響本地登出 */
export function revokeToken(accessToken: string): void {
  if (!window.google?.accounts?.oauth2) return
  try {
    window.google.accounts.oauth2.revoke(accessToken)
  } catch {
    // 撤銷失敗就算了，反正本地 session 一定會清
  }
}

export function isTokenExpired(tokens: TokenSet, marginSeconds = 60): boolean {
  return nowSeconds() + marginSeconds >= tokens.expiresAt
}

// ───────────────────────────────────────── 內部實作 ──────────────────────────

let tokenClient: TokenClient | null = null

async function getTokenClient(): Promise<TokenClient> {
  if (tokenClient) return tokenClient
  await waitForGis()
  tokenClient = window.google!.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CONFIG.clientId,
    scope: GOOGLE_CONFIG.scopes,
    // 每次 requestAccessToken 前會覆寫，這裡只是初始值
    callback: () => {},
  })
  return tokenClient
}

/** 等待 index.html 載入的 GIS script 就緒 */
async function waitForGis(timeoutMs = 10_000): Promise<void> {
  const start = Date.now()
  while (!window.google?.accounts?.oauth2) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('Google 登入服務載入失敗，請檢查網路連線後重新整理頁面。')
    }
    await new Promise((r) => setTimeout(r, 50))
  }
}

async function requestToken(
  prompt: '' | 'consent',
  timeoutMs?: number,
): Promise<TokenSet> {
  const client = await getTokenClient()
  return new Promise<TokenSet>((resolve, reject) => {
    let settled = false
    const settle = (fn: () => void) => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      fn()
    }

    const timer = timeoutMs
      ? setTimeout(() => {
          settle(() =>
            reject(new Error('Google 授權沒有回應，請手動重新登入')),
          )
        }, timeoutMs)
      : null

    client.callback = (resp) => {
      settle(() => {
        if (resp.error || !resp.access_token) {
          reject(
            new Error(
              resp.error_description || resp.error || '取得 Google 授權失敗',
            ),
          )
          return
        }
        resolve({
          accessToken: resp.access_token,
          expiresAt: nowSeconds() + (resp.expires_in ?? 3600),
          scope: resp.scope ?? GOOGLE_CONFIG.scopes,
        })
      })
    }
    try {
      client.requestAccessToken({ prompt })
    } catch (err) {
      settle(() => reject(err))
    }
  })
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000)
}
