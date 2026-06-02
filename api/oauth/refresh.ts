/**
 * Vercel Edge Function：用 refresh_token 換新的 access_token。
 *
 * 前端呼叫方式（POST，JSON）：
 *   { refresh_token }
 *
 * 回傳：Google 原本的 token JSON（access_token, expires_in, scope）
 *       通常不會回傳新的 refresh_token，沿用原本的。
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

  const refreshToken = body?.refresh_token as string | undefined
  if (!refreshToken) {
    return jsonError(400, 'Missing refresh_token')
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
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
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
