import { Loader2 } from 'lucide-react'

export function FullPageLoading({ message }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-ink-mid">
      <Loader2 size={28} className="animate-spin text-brand-400" />
      {message && <p className="text-sm">{message}</p>}
    </div>
  )
}
