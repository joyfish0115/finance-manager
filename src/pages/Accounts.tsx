import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Plus, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { SubTabs } from '@/components/SubTabs'
import { Button } from '@/components/ui/Button'
import { AccountCard } from '@/components/accounts/AccountCard'
import { AccountFormModal } from '@/components/accounts/AccountFormModal'
import { EditBalanceModal } from '@/components/accounts/EditBalanceModal'
import { RecurringItem } from '@/components/recurring/RecurringItem'
import { RecurringFormModal } from '@/components/recurring/RecurringFormModal'
import { useAccounts, useDeleteAccount } from '@/hooks/useAccounts'
import { useRecurring, useDeleteRecurring } from '@/hooks/useRecurring'
import { formatCurrency, formatCurrencyMaybeHidden } from '@/lib/format'
import { usePrivacyStore } from '@/stores/usePrivacyStore'
import type { AccountWithRow } from '@/lib/google/accountsApi'
import type { RecurringWithRow } from '@/lib/google/recurringApi'

const TABS = [
  { to: '/accounts', label: '帳戶餘額', end: true },
  { to: '/recurring', label: '固定金流' },
]

export function Accounts() {
  const { pathname } = useLocation()
  const isRecurring = pathname === '/recurring'

  return (
    <>
      <PageHeader
        title={isRecurring ? '固定金流' : '帳戶'}
        subtitle={
          isRecurring
            ? '定期定額、訂閱、保險等固定收支'
            : '活存、定存、證券戶、基金帳戶'
        }
      />

      <SubTabs tabs={TABS} />

      <div className="px-5 md:px-8 py-6">
        {isRecurring ? <RecurringView /> : <AccountsView />}
      </div>
    </>
  )
}

// ─── 帳戶餘額 View ─────────────────────────────────────────────────────────────

function AccountsView() {
  const { data: accounts, isLoading, error } = useAccounts()
  const deleteMut = useDeleteAccount()
  const hidden = usePrivacyStore((s) => s.hidden)
  const togglePrivacy = usePrivacyStore((s) => s.toggle)

  const [addOpen, setAddOpen] = useState(false)
  const [editAccount, setEditAccount] = useState<AccountWithRow | null>(null)
  const [balanceAccount, setBalanceAccount] = useState<AccountWithRow | null>(null)

  const total = accounts?.reduce((sum, a) => sum + a.balance, 0) ?? 0

  // ── 載入中 ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-6 text-ink-mid">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">載入帳戶資料…</span>
      </div>
    )
  }

  // ── 載入失敗 ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex gap-2.5 rounded-xl border border-negative/40 bg-negative/10 p-4">
        <AlertCircle size={18} className="text-negative shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-medium text-ink-high">載入失敗</div>
          <div className="text-xs text-ink-mid mt-1 break-words">{String(error)}</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-2xl mx-auto">
        {/* 總資產卡片 */}
        {accounts && accounts.length > 0 && (
          <div className="mb-5 rounded-xl border border-brand-500/30 bg-surface-1 p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs uppercase tracking-wider text-ink-low">總資產</div>
              <button
                type="button"
                onClick={togglePrivacy}
                aria-label={hidden ? '顯示金額' : '隱藏金額'}
                title={hidden ? '顯示金額' : '隱藏金額'}
                className="p-1 -m-1 rounded text-ink-low hover:text-ink-high transition-colors"
              >
                {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="mt-1.5 font-mono text-2xl text-brand-300 tabular-nums">
              {formatCurrencyMaybeHidden(total, hidden)}
            </div>
            <div className="mt-1 text-xs text-ink-low">{accounts.length} 個帳戶</div>
          </div>
        )}

        {/* 帳戶列表（單欄，方便對照銀行→餘額） */}
        <div className="space-y-2.5">
          {accounts?.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onEditBalance={() => setBalanceAccount(account)}
              onEdit={() => setEditAccount(account)}
              onDelete={() => deleteMut.mutate(account._row)}
              isDeleting={deleteMut.isPending}
            />
          ))}
        </div>

        {/* 空狀態 */}
        {accounts?.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center text-ink-mid">
            <p className="text-sm mb-5">尚未新增任何帳戶</p>
            <Button onClick={() => setAddOpen(true)}>
              <Plus size={16} />
              新增第一個帳戶
            </Button>
          </div>
        )}

        {/* 新增按鈕（有帳戶時才顯示） */}
        {accounts && accounts.length > 0 && (
          <div className="mt-4">
            <Button
              variant="ghost"
              className="w-full border border-dashed border-surface-border hover:border-brand-500/40"
              onClick={() => setAddOpen(true)}
            >
              <Plus size={16} />
              新增帳戶
            </Button>
          </div>
        )}
      </div>

      {/* ─── Modals ─── */}
      {addOpen && <AccountFormModal onClose={() => setAddOpen(false)} />}

      {editAccount && (
        <AccountFormModal
          account={editAccount}
          onClose={() => setEditAccount(null)}
        />
      )}

      {balanceAccount && (
        <EditBalanceModal
          account={balanceAccount}
          onClose={() => setBalanceAccount(null)}
        />
      )}
    </>
  )
}

// ─── 固定金流 View ─────────────────────────────────────────────────────────────

function RecurringView() {
  const { data: recurring, isLoading, error } = useRecurring()
  const { data: accounts } = useAccounts()
  const deleteMut = useDeleteRecurring()

  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState<RecurringWithRow | null>(null)

  // 分組：固定支出 vs 投資
  const fixedExpenses = recurring?.filter((r) => r.kind === '固定支出') ?? []
  const investments = recurring?.filter((r) => r.kind === '投資') ?? []

  const totalFixed = fixedExpenses.reduce((s, r) => s + r.amount, 0)
  const totalInvest = investments.reduce((s, r) => s + r.amount, 0)

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-6 text-ink-mid">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">載入固定金流…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex gap-2.5 rounded-xl border border-negative/40 bg-negative/10 p-4">
        <AlertCircle size={18} className="text-negative shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-medium text-ink-high">載入失敗</div>
          <div className="text-xs text-ink-mid mt-1 break-words">{String(error)}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* 摘要：固定支出 vs 投資 */}
      {recurring && recurring.length > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-amber-400/30 bg-surface-1 p-4">
            <div className="text-xs uppercase tracking-wider text-ink-low">固定支出</div>
            <div className="mt-1 font-mono text-xl text-amber-400 tabular-nums">
              {formatCurrency(totalFixed)}
            </div>
            <div className="mt-0.5 text-xs text-ink-low">{fixedExpenses.length} 項 / 月</div>
          </div>
          <div className="rounded-xl border border-brand-500/30 bg-surface-1 p-4">
            <div className="text-xs uppercase tracking-wider text-ink-low">每月投資</div>
            <div className="mt-1 font-mono text-xl text-brand-300 tabular-nums">
              {formatCurrency(totalInvest)}
            </div>
            <div className="mt-0.5 text-xs text-ink-low">{investments.length} 項 / 月</div>
          </div>
        </div>
      )}

      {/* 固定支出區塊 */}
      {fixedExpenses.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-medium text-ink-mid mb-2">固定支出</h2>
          <div className="space-y-2.5">
            {fixedExpenses.map((r) => (
              <RecurringItem
                key={r.id}
                recurring={r}
                accounts={accounts ?? []}
                onEdit={() => setEditItem(r)}
                onDelete={() => deleteMut.mutate(r._row)}
                isDeleting={deleteMut.isPending}
              />
            ))}
          </div>
        </section>
      )}

      {/* 投資區塊 */}
      {investments.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-medium text-ink-mid mb-2">投資</h2>
          <div className="space-y-2.5">
            {investments.map((r) => (
              <RecurringItem
                key={r.id}
                recurring={r}
                accounts={accounts ?? []}
                onEdit={() => setEditItem(r)}
                onDelete={() => deleteMut.mutate(r._row)}
                isDeleting={deleteMut.isPending}
              />
            ))}
          </div>
        </section>
      )}

      {/* 空狀態 */}
      {recurring?.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center text-ink-mid">
          <p className="text-sm mb-5">尚未新增任何固定金流</p>
          <Button onClick={() => setAddOpen(true)}>
            <Plus size={16} />
            新增第一筆
          </Button>
        </div>
      )}

      {/* 新增按鈕 */}
      {recurring && recurring.length > 0 && (
        <div className="mt-4">
          <Button
            variant="ghost"
            className="w-full border border-dashed border-surface-border hover:border-brand-500/40"
            onClick={() => setAddOpen(true)}
          >
            <Plus size={16} />
            新增固定金流
          </Button>
        </div>
      )}

      {/* Modals */}
      {addOpen && <RecurringFormModal onClose={() => setAddOpen(false)} />}
      {editItem && (
        <RecurringFormModal
          recurring={editItem}
          onClose={() => setEditItem(null)}
        />
      )}
    </div>
  )
}
