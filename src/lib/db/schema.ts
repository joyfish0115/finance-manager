/**
 * 本地 IndexedDB schema（使用 Dexie）。
 *
 * 設計概念：
 * - 三張表 transactions / accounts / recurring 對應 Google Sheet 的三個工作表
 * - 主鍵用 id（UUID），新增時在本地產生，同步時上傳到 Google Sheet 的 ID 欄
 * - 每筆資料多一個 syncStatus 欄位，標示同步狀態
 * - 刪除採「墓碑」策略：把 syncStatus 標為 'pending-delete' 而不直接刪掉，
 *   等同步成功後才從本地真的刪除
 * - meta 表存單一鍵值：lastSyncedAt（最後成功同步時間）
 */

import Dexie, { type EntityTable } from 'dexie'
import type { Account, Recurring, Transaction } from '@/types'

export type SyncStatus =
  | 'synced'
  | 'pending-create'
  | 'pending-update'
  | 'pending-delete'

export type LocalTransaction = Transaction & { syncStatus: SyncStatus }
export type LocalAccount = Account & { syncStatus: SyncStatus }
export type LocalRecurring = Recurring & { syncStatus: SyncStatus }

export interface MetaRecord {
  key: string
  value: string
}

export const db = new Dexie('finance-manager') as Dexie & {
  transactions: EntityTable<LocalTransaction, 'id'>
  accounts: EntityTable<LocalAccount, 'id'>
  recurring: EntityTable<LocalRecurring, 'id'>
  meta: EntityTable<MetaRecord, 'key'>
}

db.version(1).stores({
  transactions: 'id, date, syncStatus',
  accounts: 'id, syncStatus',
  recurring: 'id, dayOfMonth, syncStatus',
  meta: 'key',
})

// ─── meta helpers ─────────────────────────────────────────────────────────────

export const META_KEYS = {
  lastSyncedAt: 'lastSyncedAt',
} as const

export async function getMeta(key: string): Promise<string | undefined> {
  const rec = await db.meta.get(key)
  return rec?.value
}

export async function setMeta(key: string, value: string): Promise<void> {
  await db.meta.put({ key, value })
}
