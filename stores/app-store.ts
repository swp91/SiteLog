'use client'

import { create } from 'zustand'
import type { AppUser, Journals, Records, Site, Trade, UserType, WorkerRecord, WorkerSite } from '@/lib/types'
import { cloneDemoData, cloneUserForType } from '@/lib/mock-data'
import { withEntry } from '@/lib/utils'

const DEMO_SESSION_KEY = 'sitelog-demo-session'

interface AppState {
  authed: boolean
  user: AppUser
  sites: Site[]
  trades: Trade[]
  records: Records
  journals: Journals
  workerSites: WorkerSite[]
  workerRecords: WorkerRecord[]
  toast: string

  // auth
  login: (type?: UserType) => void
  switchUserType: (type: UserType) => void
  logout: () => Promise<void>
  fetchData: () => Promise<void>
  updateProfile: (patch: { name: string; phone?: string }) => Promise<void>

  // sites CRUD
  addSite: (site: Omit<Site, 'id'>) => Promise<void>
  updateSite: (site: Site) => Promise<void>
  deleteSite: (id: string) => Promise<void>

  // trades CRUD
  addTrade: (trade: Omit<Trade, 'id'>) => Promise<void>
  updateTrade: (trade: Trade) => Promise<void>
  deleteTrade: (id: string) => Promise<void>

  // attendance
  setAttendance: (siteId: string, dateStr: string, tradeId: string, patch: Partial<{ count: number; memo: string }>) => Promise<void>

  // journal
  setJournal: (siteId: string, dateStr: string, patch: Partial<{ memo: string; photos: number }>) => Promise<void>

  // worker ledger
  addWorkerSite: (site: Omit<WorkerSite, 'id'>) => Promise<void>
  updateWorkerSite: (site: WorkerSite) => Promise<void>
  deleteWorkerSite: (id: string) => Promise<void>
  addWorkerRecord: (record: Omit<WorkerRecord, 'id'>) => Promise<void>
  updateWorkerRecord: (record: WorkerRecord) => Promise<void>
  deleteWorkerRecord: (id: string) => Promise<void>

  // toast
  flash: (message: string) => void
}

const EMPTY_USER: AppUser = {
  id: '',
  org_id: '',
  type: 'manager',
  name: '',
  role: '',
  email: '',
  avatar: '',
}

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function setDemoSession(enabled: boolean) {
  if (typeof window === 'undefined') return
  if (enabled) {
    window.sessionStorage.setItem(DEMO_SESSION_KEY, 'manager')
  } else {
    window.sessionStorage.removeItem(DEMO_SESSION_KEY)
  }
}

function getDemoSessionType(): UserType | null {
  if (typeof window === 'undefined') return null
  const value = window.sessionStorage.getItem(DEMO_SESSION_KEY)
  return value === 'worker' || value === 'manager' ? value : null
}

function setDemoSessionType(type: UserType) {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(DEMO_SESSION_KEY, type)
}

export const useAppStore = create<AppState>((set, get) => ({
  authed: false,
  user: EMPTY_USER,
  sites: [],
  trades: [],
  records: {},
  journals: {},
  workerSites: [],
  workerRecords: [],
  toast: '',

  login: (type = 'manager') => {
    const data = cloneDemoData()
    setDemoSessionType(type)
    set({
      authed: true,
      user: cloneUserForType(type),
      sites: data.sites,
      trades: data.trades,
      records: data.records,
      journals: data.journals,
      workerSites: data.workerSites,
      workerRecords: data.workerRecords,
    })
  },

  switchUserType: (type) => {
    const data = cloneDemoData()
    setDemoSessionType(type)
    set({
      authed: true,
      user: cloneUserForType(type),
      sites: data.sites,
      trades: data.trades,
      records: data.records,
      journals: data.journals,
      workerSites: data.workerSites,
      workerRecords: data.workerRecords,
    })
  },

  logout: async () => {
    setDemoSession(false)
    set({ authed: false, user: EMPTY_USER, sites: [], trades: [], records: {}, journals: {}, workerSites: [], workerRecords: [] })
  },

  fetchData: async () => {
    const type = getDemoSessionType()
    if (!type) return

    const data = cloneDemoData()
    set({
      authed: true,
      user: cloneUserForType(type),
      sites: data.sites,
      trades: data.trades,
      records: data.records,
      journals: data.journals,
      workerSites: data.workerSites,
      workerRecords: data.workerRecords,
    })
  },

  addSite: async (site) => {
    const newSite: Site = { ...site, id: createId('site') }
    set((s) => ({ sites: [...s.sites, newSite] }))
  },

  updateSite: async (site) => {
    set((s) => ({ sites: s.sites.map((x) => (x.id === site.id ? site : x)) }))
  },

  deleteSite: async (id) => {
    set((s) => ({
      sites: s.sites.filter((x) => x.id !== id),
      records: Object.fromEntries(Object.entries(s.records).filter(([key]) => !key.startsWith(`${id}|`))),
      journals: Object.fromEntries(Object.entries(s.journals).filter(([key]) => !key.startsWith(`${id}|`))),
    }))
  },

  addTrade: async (trade) => {
    const newTrade: Trade = { ...trade, id: createId('trade') }
    set((s) => ({ trades: [...s.trades, newTrade] }))
  },

  updateTrade: async (trade) => {
    set((s) => ({ trades: s.trades.map((x) => (x.id === trade.id ? trade : x)) }))
  },

  deleteTrade: async (id) => {
    set((s) => {
      const records = Object.fromEntries(
        Object.entries(s.records)
          .map(([key, day]) => {
            const { [id]: _, ...rest } = day
            return [key, rest] as const
          })
          .filter(([, day]) => Object.keys(day).length > 0),
      )

      return {
        trades: s.trades.filter((x) => x.id !== id),
        records,
      }
    })
  },

  setAttendance: async (siteId, dateStr, tradeId, patch) => {
    set((s) => ({ records: withEntry(s.records, siteId, dateStr, tradeId, patch) }))
  },

  setJournal: async (siteId, dateStr, patch) => {
    const key = `${siteId}|${dateStr}`

    set((s) => {
      const prev = s.journals[key] ?? { memo: '', photos: 0 }
      const next = { ...prev, ...patch }

      if (!next.memo && !next.photos) {
        const { [key]: _, ...rest } = s.journals
        return { journals: rest }
      }

      return {
        journals: {
          ...s.journals,
          [key]: next,
        },
      }
    })
  },

  addWorkerSite: async (site) => {
    const newSite: WorkerSite = { ...site, id: createId('worker-site') }
    set((s) => ({ workerSites: [...s.workerSites, newSite] }))
  },

  updateWorkerSite: async (site) => {
    set((s) => ({ workerSites: s.workerSites.map((x) => (x.id === site.id ? site : x)) }))
  },

  deleteWorkerSite: async (id) => {
    set((s) => ({
      workerSites: s.workerSites.filter((x) => x.id !== id),
      workerRecords: s.workerRecords.filter((x) => x.siteId !== id),
    }))
  },

  addWorkerRecord: async (record) => {
    const newRecord: WorkerRecord = { ...record, id: createId('worker-record') }
    set((s) => ({ workerRecords: [...s.workerRecords, newRecord] }))
  },

  updateWorkerRecord: async (record) => {
    set((s) => ({ workerRecords: s.workerRecords.map((x) => (x.id === record.id ? record : x)) }))
  },

  deleteWorkerRecord: async (id) => {
    set((s) => ({ workerRecords: s.workerRecords.filter((x) => x.id !== id) }))
  },

  updateProfile: async (patch) => {
    set((s) => ({
      user: {
        ...s.user,
        name: patch.name,
        phone: patch.phone || '',
        avatar: patch.name ? patch.name[0] : s.user.avatar,
      },
    }))
  },

  flash: (message) => {
    set({ toast: message })
    setTimeout(() => set({ toast: '' }), 1800)
  },
}))
