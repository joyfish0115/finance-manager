/**
 * 包裝 fetch 加上自動取得 access_token、過期續期、JSON 解析。
 * 所有 Google API 呼叫都應該透過 googleFetch / googleJson。
 */

import { useAuthStore } from '@/stores/useAuthStore'

interface FetchOptions extends RequestInit {
  /** 預期會回 JSON 的話設 true，會自動加 Content-Type 並 stringify */
  jsonBody?: unknown
}

export async function googleFetch(
  url: string,
  { jsonBody, headers, ...rest }: FetchOptions = {},
): Promise<Response> {
  const accessToken = await useAuthStore.getState().getValidAccessToken()

  const finalHeaders = new Headers(headers)
  finalHeaders.set('Authorization', `Bearer ${accessToken}`)
  if (jsonBody !== undefined) {
    finalHeaders.set('Content-Type', 'application/json')
  }

  return fetch(url, {
    ...rest,
    headers: finalHeaders,
    body: jsonBody !== undefined ? JSON.stringify(jsonBody) : rest.body,
  })
}

export async function googleJson<T>(url: string, opts: FetchOptions = {}): Promise<T> {
  const res = await googleFetch(url, opts)
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Google API ${res.status}：${detail.slice(0, 200)}`)
  }
  return res.json() as Promise<T>
}
