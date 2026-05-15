import { create } from 'zustand'

/**
 * 隱私模式：開啟時把金額相關數字（總資產、帳戶餘額）變成 ••••••
 * 用於別人在旁邊看螢幕時的快速遮蔽。
 *
 * 不做 localStorage 持久化——每次重新打開 App 都預設為「顯示」。
 */
interface PrivacyState {
  hidden: boolean
  toggle: () => void
}

export const usePrivacyStore = create<PrivacyState>((set) => ({
  hidden: false,
  toggle: () => set((s) => ({ hidden: !s.hidden })),
}))
