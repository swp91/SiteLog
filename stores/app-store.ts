'use client'

import { create } from 'zustand'
import type { Site, Trade, Records, Journals, AppUser } from '@/lib/types'
import { SEED_SITES, SEED_TRADES, buildAttendance, JOURNAL_SEED, MOCK_USER } from '@/lib/mock-data'
import { withEntry } from '@/lib/utils'

interface AppState {
  authed: boolean
  user: AppUser
  sites: Site[]
  trades: Trade[]
  records: Records
  journals: Journals
  toast: string

  // auth
  login: () => void
  logout: () => void

  // sites CRUD
  addSite: (site: Site) => void
  updateSite: (site: Site) => void
  deleteSite: (id: string) => void

  // trades CRUD
  addTrade: (trade: Trade) => void
  updateTrade: (trade: Trade) => void
  deleteTrade: (id: string) => void

  // attendance
  setAttendance: (siteId: string, dateStr: string, tradeId: string, patch: Partial<{ count: number; memo: string }>) => void

  // journal
  setJournal: (siteId: string, dateStr: string, patch: Partial<{ memo: string; photos: number }>) => void

  // toast
  flash: (message: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  authed: true, // start authenticated for dev
  user: MOCK_USER,
  sites: SEED_SITES,
  trades: SEED_TRADES,
  records: buildAttendance(),
  journals: JOURNAL_SEED,
  toast: '',

  login: () => set({ authed: true }),
  logout: () => set({ authed: false }),

  addSite: (site) => set((s) => ({ sites: [...s.sites, site] })),
  updateSite: (site) => set((s) => ({ sites: s.sites.map((x) => (x.id === site.id ? site : x)) })),
  deleteSite: (id) => set((s) => ({ sites: s.sites.filter((x) => x.id !== id) })),

  addTrade: (trade) => set((s) => ({ trades: [...s.trades, trade] })),
  updateTrade: (trade) => set((s) => ({ trades: s.trades.map((x) => (x.id === trade.id ? trade : x)) })),
  deleteTrade: (id) => set((s) => ({ trades: s.trades.filter((x) => x.id !== id) })),

  setAttendance: (siteId, dateStr, tradeId, patch) =>
    set((s) => ({ records: withEntry(s.records, siteId, dateStr, tradeId, patch) })),

  setJournal: (siteId, dateStr, patch) =>
    set((s) => {
      const key = `${siteId}|${dateStr}`
      return { journals: { ...s.journals, [key]: { ...(s.journals[key] ?? {}), ...patch } } }
    }),

  flash: (message) => {
    set({ toast: message })
    setTimeout(() => set({ toast: '' }), 1800)
  },
}))
