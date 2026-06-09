'use client'

import { create } from 'zustand'
import type { Site, Trade, Records, Journals, AppUser } from '@/lib/types'
import { withEntry } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface AppState {
  authed: boolean
  user: AppUser
  sites: Site[]
  trades: Trade[]
  records: Records
  journals: Journals
  toast: string

  // auth
  login: (user: AppUser) => void
  logout: () => void
  fetchData: () => Promise<void>

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

  // toast
  flash: (message: string) => void
}

const DEFAULT_USER: AppUser = {
  id: '',
  org_id: '',
  name: '',
  role: '',
  email: '',
  avatar: '',
}

export const useAppStore = create<AppState>((set, get) => ({
  authed: false,
  user: DEFAULT_USER,
  sites: [],
  trades: [],
  records: {},
  journals: {},
  toast: '',

  login: (user) => set({ authed: true, user }),
  logout: async () => {
    console.log('useAppStore: logout() called, authed =', get().authed)
    if (get().authed) {
      await supabase.auth.signOut()
    }
    set({ authed: false, user: DEFAULT_USER, sites: [], trades: [], records: {}, journals: {} })
  },

  fetchData: async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, orgs(name)')
      .eq('id', authUser.id)
      .single()

    if (!profile) return

    const mappedUser: AppUser = {
      id: profile.id,
      org_id: profile.org_id,
      name: profile.name,
      role: profile.role,
      email: authUser.email || '',
      avatar: profile.avatar_url || (profile.name ? profile.name[0] : ''),
      phone: profile.phone || '',
      company: profile.orgs?.name || '',
      joined: profile.created_at ? new Date(profile.created_at).toISOString().slice(0, 7) : '',
    }

    // Fetch sites
    const { data: sitesData } = await supabase
      .from('sites')
      .select('*')
      .eq('org_id', profile.org_id)

    // Fetch trades
    const { data: tradesData } = await supabase
      .from('trades')
      .select('*')
      .eq('org_id', profile.org_id)
      .order('sort_order', { ascending: true })

    // Fetch attendance
    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('*, sites!inner(org_id)')
      .eq('sites.org_id', profile.org_id)

    // Fetch journals
    const { data: journalsData } = await supabase
      .from('journals')
      .select('*, sites!inner(org_id)')
      .eq('sites.org_id', profile.org_id)

    const sites = (sitesData || []).map((s) => ({
      id: s.id,
      name: s.name,
      addr: s.addr || '',
      status: s.status,
      start: s.start_date || '',
      manager: s.manager_name || '',
    }))

    const trades = (tradesData || []).map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      rate: t.rate,
      company: t.company || '',
      contact: t.contact || '',
      phone: t.phone || '',
      sort_order: t.sort_order,
    }))

    const records: Records = {}
    if (attendanceData) {
      for (const item of attendanceData) {
        const key = `${item.site_id}|${item.work_date}`
        if (!records[key]) records[key] = {}
        records[key][item.trade_id] = {
          count: item.count,
          memo: item.memo || '',
        }
      }
    }

    const journals: Journals = {}
    if (journalsData) {
      for (const item of journalsData) {
        const key = `${item.site_id}|${item.work_date}`
        journals[key] = {
          memo: item.memo || '',
          photos: 0,
        }
      }
    }

    set({
      authed: true,
      user: mappedUser,
      sites,
      trades,
      records,
      journals,
    })
  },

  addSite: async (site) => {
    const { user } = get()
    if (!user || !user.org_id) return

    const { data, error } = await supabase
      .from('sites')
      .insert({
        org_id: user.org_id,
        name: site.name,
        addr: site.addr || null,
        status: site.status,
        start_date: site.start || null,
        manager_name: site.manager || null,
      })
      .select()
      .single()

    if (data && !error) {
      const newSite: Site = {
        id: data.id,
        name: data.name,
        addr: data.addr || '',
        status: data.status,
        start: data.start_date || '',
        manager: data.manager_name || '',
      }
      set((s) => ({ sites: [...s.sites, newSite] }))
    }
  },

  updateSite: async (site) => {
    const { error } = await supabase
      .from('sites')
      .update({
        name: site.name,
        addr: site.addr || null,
        status: site.status,
        start_date: site.start || null,
        manager_name: site.manager || null,
      })
      .eq('id', site.id)

    if (!error) {
      set((s) => ({ sites: s.sites.map((x) => (x.id === site.id ? site : x)) }))
    }
  },

  deleteSite: async (id) => {
    const { error } = await supabase.from('sites').delete().eq('id', id)
    if (!error) {
      set((s) => ({ sites: s.sites.filter((x) => x.id !== id) }))
    }
  },

  addTrade: async (trade) => {
    const { user } = get()
    if (!user || !user.org_id) return

    const { data, error } = await supabase
      .from('trades')
      .insert({
        org_id: user.org_id,
        name: trade.name,
        color: trade.color,
        rate: trade.rate,
        company: trade.company || null,
        contact: trade.contact || null,
        phone: trade.phone || null,
        sort_order: trade.sort_order ?? 0,
      })
      .select()
      .single()

    if (data && !error) {
      const newTrade: Trade = {
        id: data.id,
        name: data.name,
        color: data.color,
        rate: data.rate,
        company: data.company || '',
        contact: data.contact || '',
        phone: data.phone || '',
        sort_order: data.sort_order,
      }
      set((s) => ({ trades: [...s.trades, newTrade] }))
    }
  },

  updateTrade: async (trade) => {
    const { error } = await supabase
      .from('trades')
      .update({
        name: trade.name,
        color: trade.color,
        rate: trade.rate,
        company: trade.company || null,
        contact: trade.contact || null,
        phone: trade.phone || null,
        sort_order: trade.sort_order ?? 0,
      })
      .eq('id', trade.id)

    if (!error) {
      set((s) => ({ trades: s.trades.map((x) => (x.id === trade.id ? trade : x)) }))
    }
  },

  deleteTrade: async (id) => {
    const { error } = await supabase.from('trades').delete().eq('id', id)
    if (!error) {
      set((s) => ({ trades: s.trades.filter((x) => x.id !== id) }))
    }
  },

  setAttendance: async (siteId, dateStr, tradeId, patch) => {
    const { user, records } = get()
    if (!user) return

    const key = `${siteId}|${dateStr}`
    const prev = records[key] ?? {}
    const entry = { ...(prev[tradeId] ?? { count: 0, memo: '' }), ...patch }

    const isZero = entry.count === 0 && !entry.memo

    if (isZero) {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .match({ site_id: siteId, trade_id: tradeId, work_date: dateStr })

      if (!error) {
        set((s) => ({ records: withEntry(s.records, siteId, dateStr, tradeId, patch) }))
      }
    } else {
      const { error } = await supabase
        .from('attendance')
        .upsert({
          site_id: siteId,
          trade_id: tradeId,
          work_date: dateStr,
          count: entry.count,
          memo: entry.memo || '',
          updated_by: user.id || null,
        }, {
          onConflict: 'site_id,trade_id,work_date',
        })

      if (!error) {
        set((s) => ({ records: withEntry(s.records, siteId, dateStr, tradeId, patch) }))
      }
    }
  },

  setJournal: async (siteId, dateStr, patch) => {
    const { user, journals } = get()
    if (!user) return

    const key = `${siteId}|${dateStr}`
    const prev = journals[key] ?? {}
    const entry = { ...(prev ?? { memo: '', photos: 0 }), ...patch }

    const isZero = !entry.memo

    if (isZero) {
      const { error } = await supabase
        .from('journals')
        .delete()
        .match({ site_id: siteId, work_date: dateStr })

      if (!error) {
        set((s) => {
          const { [key]: _, ...rest } = s.journals
          return { journals: rest }
        })
      }
    } else {
      const { error } = await supabase
        .from('journals')
        .upsert({
          site_id: siteId,
          work_date: dateStr,
          memo: entry.memo || '',
          updated_by: user.id || null,
        }, {
          onConflict: 'site_id,work_date',
        })

      if (!error) {
        set((s) => ({
          journals: {
            ...s.journals,
            [key]: { ...prev, ...patch },
          },
        }))
      }
    }
  },

  flash: (message) => {
    set({ toast: message })
    setTimeout(() => set({ toast: '' }), 1800)
  },
}))
