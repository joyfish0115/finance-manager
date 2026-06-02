/**
 * Vercel Edge Function：用 authorization code + PKCE verifier 換 access/refresh token。
 *
 * 這支函式持有 GOOGLE_CLIENT_SECRET（從 Vercel 環境變數讀），
 * 前端永遠看不到 secret，因此可以安全地放在 public repo。
 *
 * 前端呼叫方式（POST，JSON）：
 *   { code, code_verifier, redirect_uri }
 *
 * 回傳：Google 原本的 token JSON（access_token, refresh_token, expires_in, scope, ...）
 */

export const config = {
  runtime: 'edge',
}

const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return jsonError(405, 'Method not allowed')
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return jsonError(400, 'Invalid JSON body')
  }

  const code = body?.code as string | undefined
  const codeVerifier = body?.code_verifier as string | undefined
  const redirectUri = body?.redirect_uri as string | undefined

  if (!code || !codeVerifier || !redirectUri) {
    return jsonError(400, 'Missing one of: code, code_verifier, redirect_uri')
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return jsonError(
      500,
      'Server misconfigured: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing',
    )
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    code_verifier: codeVerifier,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  })

  const googleRes = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  })

  const text = await googleRes.text()
  return new Response(text, {
    status: googleRes.status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
