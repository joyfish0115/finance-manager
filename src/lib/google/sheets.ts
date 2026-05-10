/**
 * Google Sheets 讀寫工具。所有對試算表的存取都集中在這。
 *
 * 我們直接用 GOOGLE_CONFIG.sheetId 那份試算表。如果工作表（tab）不存在，
 * readSheetRows 在收到 ensureHeaders 參數時會自動建立 tab + 寫入標題列。
 */

import { GOOGLE_CONFIG } from './config'
import { googleJson } from './client'

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets'

interface ValueRangeResponse {
  values?: string[][]
}

/**
 * 把工作表名稱 + 範圍組成符合 Sheets API 規格的 URL path segment。
 *
 * 含中文或特殊字元的工作表名稱，Sheets API 的 A1 notation 必須用
 * 單引號包起來（例如 '帳戶'!A2:Z9999），否則會回傳 INVALID_ARGUMENT。
 */
function encodeRange(sheetName: string, range: string): string {
  return encodeURIComponent(`'${sheetName}'!${range}`)
}

async function readRangeRaw(sheetName: string): Promise<string[][]> {
  // Sheets API 不接受 A2:Z（無結尾列號），改用 A2:Z9999
  const range = encodeRange(sheetName, 'A2:Z9999')
  const data = await googleJson<ValueRangeResponse>(
    `${SHEETS_API}/${GOOGLE_CONFIG.sheetId}/values/${range}`,
  )
  return data.values ?? []
}

/**
 * 讀取某個工作表的所有資料列（不含標題列）。
 *
 * 如果工作表不存在：
 *   - 有提供 ensureHeaders → 自動建立 tab、寫入標題列、回傳空陣列
 *   - 沒有提供 → 拋出友善錯誤訊息列出實際存在的 tab
 */
export async function readSheetRows(
  sheetName: string,
  ensureHeaders?: readonly string[],
): Promise<string[][]> {
  try {
    return await readRangeRaw(sheetName)
  } catch (err) {
    const msg = String(err)
    // 「Unable to parse range」基本上代表工作表不存在
    if (!msg.includes('Unable to parse range') && !msg.includes('400')) throw err

    const tabs = await listSheetTabs().catch(() => null)
    if (!tabs) throw err

    if (tabs.includes(sheetName)) throw err // tab 存在但其他原因失敗

    // ── Tab 不存在 ────────────────────────────────────────────────────────────
    if (ensureHeaders) {
      // 自動建立 + 寫標題列，回傳空資料
      await createSheetTab(sheetName, ensureHeaders)
      return []
    }

    throw new Error(
      `找不到名為「${sheetName}」的工作表。您試算表實際的工作表：${tabs
        .map((t) => `「${t}」`)
        .join('、')}`,
    )
  }
}

/** 列出試算表中所有工作表的名稱 */
export async function listSheetTabs(): Promise<string[]> {
  const data = await googleJson<{
    sheets: { properties: { title: string } }[]
  }>(`${SHEETS_API}/${GOOGLE_CONFIG.sheetId}?fields=sheets.properties.title`)
  return data.sheets.map((s) => s.properties.title)
}

/** 建立新的工作表（tab）並寫入標題列 */
export async function createSheetTab(
  sheetName: string,
  headers: readonly string[],
): Promise<void> {
  // 1. 用 batchUpdate 加新 tab
  await googleJson(`${SHEETS_API}/${GOOGLE_CONFIG.sheetId}:batchUpdate`, {
    method: 'POST',
    jsonBody: {
      requests: [{ addSheet: { properties: { title: sheetName } } }],
    },
  })

  // 2. 寫入標題列（A1 開始，依 headers 數量決定結束欄位）
  const endCol = String.fromCharCode(64 + headers.length) // 1→'A', 5→'E', ...
  const range = encodeRange(sheetName, `A1:${endCol}1`)
  await googleJson(
    `${SHEETS_API}/${GOOGLE_CONFIG.sheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      jsonBody: { values: [headers] },
    },
  )

  // 3. 清掉 sheetId 快取，下次 deleteSheetRow 時會重新拉
  sheetIdCache.clear()
}

/** 在工作表最底下追加一列 */
export async function appendRow(
  sheetName: string,
  row: (string | number)[],
): Promise<void> {
  const range = encodeRange(sheetName, 'A1:Z9999')
  await googleJson(
    `${SHEETS_API}/${GOOGLE_CONFIG.sheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      jsonBody: { values: [row] },
    },
  )
}

/** 更新指定工作表某 row 的內容（row 從 2 開始，因為 1 是標題列） */
export async function updateRow(
  sheetName: string,
  rowIndex: number,
  row: (string | number)[],
): Promise<void> {
  const range = encodeRange(sheetName, `A${rowIndex}:Z${rowIndex}`)
  await googleJson(
    `${SHEETS_API}/${GOOGLE_CONFIG.sheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      jsonBody: { values: [row] },
    },
  )
}

// ─── 刪除列 ──────────────────────────────────────────────────────────────────

/** 快取 sheetName → sheetId（整數），避免每次刪除都重新查 */
const sheetIdCache = new Map<string, number>()

async function getSheetTabId(sheetName: string): Promise<number> {
  if (sheetIdCache.has(sheetName)) return sheetIdCache.get(sheetName)!

  const data = await googleJson<{
    sheets: { properties: { sheetId: number; title: string } }[]
  }>(`${SHEETS_API}/${GOOGLE_CONFIG.sheetId}?fields=sheets.properties`)

  for (const sheet of data.sheets) {
    sheetIdCache.set(sheet.properties.title, sheet.properties.sheetId)
  }

  const id = sheetIdCache.get(sheetName)
  if (id === undefined) throw new Error(`找不到工作表：${sheetName}`)
  return id
}

/**
 * 刪除工作表中的某一整列（rowIndex 從 2 開始，1 是標題列）。
 * 使用 batchUpdate / deleteDimension，不留空列。
 */
export async function deleteSheetRow(sheetName: string, rowIndex: number): Promise<void> {
  const sheetId = await getSheetTabId(sheetName)
  const zeroBasedIndex = rowIndex - 1 // Sheets API 用 0-indexed

  await googleJson(`${SHEETS_API}/${GOOGLE_CONFIG.sheetId}:batchUpdate`, {
    method: 'POST',
    jsonBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: zeroBasedIndex,
              endIndex: zeroBasedIndex + 1,
            },
          },
        },
      ],
    },
  })
}
