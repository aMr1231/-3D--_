import { create } from 'zustand'

/**
 * «Справка» — единое место для второстепенной информации: пояснений, подсказок, обозначений и технических сведений.
 * Разделы приложения портируют в неё свой контекст через <PageInfo> (см. components/info/PageInfo.tsx).
 */
interface InfoState {
  open: boolean
  /** Секция, к которой прокрутить при открытии (id без префикса «info-»). */
  section: string | null
  /** DOM-узел внутри панели, куда страница выводит свои секции. */
  slot: HTMLElement | null
  show: (section?: string) => void
  hide: () => void
  toggle: () => void
  setSlot: (el: HTMLElement | null) => void
}

export const useInfoStore = create<InfoState>()((set) => ({
  open: false,
  section: null,
  slot: null,
  show: (section) => set({ open: true, section: section ?? null }),
  hide: () => set({ open: false, section: null }),
  toggle: () => set((s) => ({ open: !s.open, section: null })),
  setSlot: (slot) => set({ slot }),
}))

export const showInfo = (section?: string) => useInfoStore.getState().show(section)
