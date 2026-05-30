import { useState } from 'react'
import { Sparkles, AlertCircle } from 'lucide-react'
import { GoogleLogo } from '@/components/ui/GoogleLogo'
import { useAuthStore } from '@/stores/useAuthStore'

export function Welcome() {
  const [isPending, setIsPending] = useState(false)
  const authError = useAuthStore((s) => s.authError)
  const setAuthError = useAuthStore((s) => s.setAuthError)
  const signIn = useAuthStore((s) => s.signIn)

  const handleSignIn = async () => {
    setIsPending(true)
    setAuthError(null)
    try {
      await signIn()
    } catch (err) {
      console.error(err)
      // store.signIn 已經把錯誤寫進 authError，這裡只需收尾
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500/15 text-brand-300 mb-6">
          <Sparkles size={26} />
        </div>

        <h1 className="text-3xl font-semibold text-ink-high mb-3">
          歡迎使用財務管理
        </h1>
        <p className="text-sm text-ink-mid leading-relaxed mb-8">
          您的所有資料都會儲存在自己的 Google Drive，
          <br />
          我們不會看到、也不會儲存任何財務資訊。
        </p>

        <button
          type="button"
          onClick={handleSignIn}
          disabled={isPending}
          className="inline-flex items-center justify-center gap-3 w-full rounded-xl bg-white px-5 py-3.5 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 active:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          <GoogleLogo size={18} />
          {isPending ? '登入中…' : '使用 Google 帳號登入'}
        </button>

        {authError && (
          <div className="mt-4 rounded-xl border border-negative/40 bg-negative/10 p-4 text-left">
            <div className="flex gap-2.5">
              <AlertCircle size={18} className="shrink-0 text-negative mt-0.5" />
              <div className="space-y-1.5">
                <div className="text-sm font-medium text-ink-high">登入失敗</div>
                <div className="text-xs text-ink-mid leading-relaxed break-words">
                  {authError}
                </div>
              </div>
            </div>
          </div>
        )}

        <ul className="mt-10 space-y-3 text-left text-xs text-ink-mid">
          <Bullet>離線可用，按按鈕才同步到您的 Google Sheet</Bullet>
          <Bullet>之後換手機或瀏覽器，登入即可繼續使用</Bullet>
          <Bullet>App 沒有後端，沒有任何人能看到您的資料</Bullet>
        </ul>
      </div>
    </div>
  )
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="mt-1.5 inline-block w-1 h-1 rounded-full bg-brand-400 shrink-0" />
      <span className="leading-relaxed">{children}</span>
    </li>
  )
}
