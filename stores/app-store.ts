'use client'

import { create } from 'zustand'
import type { AppUser, Journal, Journals, Records, Site, Trade, UserType, WorkerRecord, WorkerSite, DayRecord, ExpenseItem } from '@/lib/types'
import { withEntry } from '@/lib/utils'
import { auth, db } from '@/lib/firebase'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile as updateAuthProfile
} from 'firebase/auth'
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot
} from 'firebase/firestore'

interface AppState {
  authed: boolean
  user: AppUser
  sites: Site[]
  trades: Trade[]
  records: Records
  journals: Journals
  workerSites: WorkerSite[]
  workerRecords: WorkerRecord[]
  expenses: ExpenseItem[]
  toast: string
  authInitialized: boolean

  // auth
  login: (email: string, pass: string) => Promise<void>
  registerUser: (email: string, pass: string, name: string) => Promise<void>
  resetPasswordEmail: (email: string) => Promise<void>
  switchUserType: (type: UserType) => Promise<void>
  logout: () => Promise<void>
  fetchData: () => Promise<void>
  updateProfile: (patch: { name: string; phone?: string; bank?: string; account?: string; holder?: string }) => Promise<void>

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
  setJournal: (siteId: string, dateStr: string, patch: Partial<Journal>) => Promise<void>

  // worker ledger
  addWorkerSite: (site: Omit<WorkerSite, 'id'>) => Promise<void>
  updateWorkerSite: (site: WorkerSite) => Promise<void>
  deleteWorkerSite: (id: string) => Promise<void>
  addWorkerRecord: (record: Omit<WorkerRecord, 'id'>) => Promise<void>
  updateWorkerRecord: (record: WorkerRecord) => Promise<void>
  deleteWorkerRecord: (id: string) => Promise<void>

  // expenses CRUD
  addExpense: (expense: Omit<ExpenseItem, 'id'>) => Promise<void>
  updateExpense: (expense: ExpenseItem) => Promise<void>
  deleteExpense: (id: string) => Promise<void>

  // expense categories
  addExpenseCategory: (category: string) => Promise<void>
  deleteExpenseCategory: (category: string) => Promise<void>

  // toast
  flash: (message: string) => void

  // realtime listeners
  unsubscribes: (() => void)[]
  setupRealtimeListeners: () => void
  cleanupRealtimeListeners: () => void

  // theme
  theme: 'light' | 'dark'
  initTheme: () => void
  toggleTheme: () => void
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

export const useAppStore = create<AppState>((set, get) => ({
  authed: false,
  user: EMPTY_USER,
  sites: [],
  trades: [],
  records: {},
  journals: {},
  workerSites: [],
  workerRecords: [],
  expenses: [],
  toast: '',
  authInitialized: false,
  unsubscribes: [],
  theme: 'light',

  login: async (email, pass) => {
    await signInWithEmailAndPassword(auth, email, pass)
  },

  registerUser: async (email, pass, name) => {
    const credential = await createUserWithEmailAndPassword(auth, email, pass)
    const uid = credential.user.uid
    // Auth profile displayName 동기화
    await updateAuthProfile(credential.user, { displayName: name })
    // Firestore 사용자 문서 기본값 생성
    await setDoc(doc(db, 'users', uid), {
      name,
      email,
      type: 'manager',
      joined: new Date().toISOString().slice(0, 7)
    })
  },

  resetPasswordEmail: async (email) => {
    await sendPasswordResetEmail(auth, email)
  },

  switchUserType: async (type) => {
    const uid = get().user.id
    if (!uid) return
    
    // Firestore에 활성 모드 업데이트
    await updateDoc(doc(db, 'users', uid), { type })
    
    set((s) => ({
      user: {
        ...s.user,
        type,
        role: type === 'worker' ? '노동자' : '관리자'
      }
    }))
  },

  logout: async () => {
    get().cleanupRealtimeListeners()
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sitelog_user_hint')
    }
    await signOut(auth)
  },

  setupRealtimeListeners: () => {
    const uid = get().user.id
    if (!uid) return

    get().cleanupRealtimeListeners()

    const unsubs: (() => void)[] = []

    try {
      const sitesUnsub = onSnapshot(collection(db, 'users', uid, 'sites'), (snapshot) => {
        const sitesList: Site[] = []
        snapshot.forEach((d) => {
          sitesList.push({ id: d.id, ...d.data() } as Site)
        })
        set({ sites: sitesList })
      }, (err) => console.error('Sites sync error:', err))
      unsubs.push(sitesUnsub)

      const tradesUnsub = onSnapshot(collection(db, 'users', uid, 'trades'), (snapshot) => {
        const tradesList: Trade[] = []
        snapshot.forEach((d) => {
          tradesList.push({ id: d.id, ...d.data() } as Trade)
        })
        set({ trades: tradesList })
      }, (err) => console.error('Trades sync error:', err))
      unsubs.push(tradesUnsub)

      const recordsUnsub = onSnapshot(collection(db, 'users', uid, 'records'), (snapshot) => {
        const recordsObj: Records = {}
        snapshot.forEach((d) => {
          recordsObj[d.id] = d.data() as DayRecord
        })
        set({ records: recordsObj })
      }, (err) => console.error('Records sync error:', err))
      unsubs.push(recordsUnsub)

      const journalsUnsub = onSnapshot(collection(db, 'users', uid, 'journals'), (snapshot) => {
        const journalsObj: Journals = {}
        snapshot.forEach((d) => {
          journalsObj[d.id] = d.data() as Journal
        })
        set({ journals: journalsObj })
      }, (err) => console.error('Journals sync error:', err))
      unsubs.push(journalsUnsub)

      const workerSitesUnsub = onSnapshot(collection(db, 'users', uid, 'workerSites'), (snapshot) => {
        const workerSitesList: WorkerSite[] = []
        snapshot.forEach((d) => {
          workerSitesList.push({ id: d.id, ...d.data() } as WorkerSite)
        })
        set({ workerSites: workerSitesList })
      }, (err) => console.error('WorkerSites sync error:', err))
      unsubs.push(workerSitesUnsub)

      const workerRecordsUnsub = onSnapshot(collection(db, 'users', uid, 'workerRecords'), (snapshot) => {
        const workerRecordsList: WorkerRecord[] = []
        snapshot.forEach((d) => {
          workerRecordsList.push({ id: d.id, ...d.data() } as WorkerRecord)
        })
        set({ workerRecords: workerRecordsList })
      }, (err) => console.error('WorkerRecords sync error:', err))
      unsubs.push(workerRecordsUnsub)

      const expensesUnsub = onSnapshot(collection(db, 'users', uid, 'expenses'), (snapshot) => {
        const expensesList: ExpenseItem[] = []
        snapshot.forEach((d) => {
          expensesList.push({ id: d.id, ...d.data() } as ExpenseItem)
        })
        set({ expenses: expensesList })
      }, (err) => console.error('Expenses sync error:', err))
      unsubs.push(expensesUnsub)

      set({ unsubscribes: unsubs })
    } catch (e) {
      console.error('Error setting up realtime listeners:', e)
    }
  },

  cleanupRealtimeListeners: () => {
    const unsubs = get().unsubscribes
    if (unsubs && unsubs.length > 0) {
      unsubs.forEach((unsub) => {
        try {
          unsub()
        } catch (e) {
          console.error('Error unsubscribing listener:', e)
        }
      })
    }
    set({ unsubscribes: [] })
  },

  fetchData: async () => {
    const uid = get().user.id
    if (!uid) return

    // 1. Sites 로드
    const sitesSnapshot = await getDocs(collection(db, 'users', uid, 'sites'))
    const sitesList: Site[] = []
    sitesSnapshot.forEach((d) => {
      sitesList.push({ id: d.id, ...d.data() } as Site)
    })


    // 2. 나머지 데이터 정상 조회
    const tradesSnapshot = await getDocs(collection(db, 'users', uid, 'trades'))
    const tradesList: Trade[] = []
    tradesSnapshot.forEach((d) => {
      tradesList.push({ id: d.id, ...d.data() } as Trade)
    })

    const recordsSnapshot = await getDocs(collection(db, 'users', uid, 'records'))
    const recordsObj: Records = {}
    recordsSnapshot.forEach((d) => {
      recordsObj[d.id] = d.data() as DayRecord
    })

    const journalsSnapshot = await getDocs(collection(db, 'users', uid, 'journals'))
    const journalsObj: Journals = {}
    journalsSnapshot.forEach((d) => {
      journalsObj[d.id] = d.data() as Journal
    })

    const workerSitesSnapshot = await getDocs(collection(db, 'users', uid, 'workerSites'))
    const workerSitesList: WorkerSite[] = []
    workerSitesSnapshot.forEach((d) => {
      workerSitesList.push({ id: d.id, ...d.data() } as WorkerSite)
    })

    const workerRecordsSnapshot = await getDocs(collection(db, 'users', uid, 'workerRecords'))
    const workerRecordsList: WorkerRecord[] = []
    workerRecordsSnapshot.forEach((d) => {
      workerRecordsList.push({ id: d.id, ...d.data() } as WorkerRecord)
    })

    const expensesSnapshot = await getDocs(collection(db, 'users', uid, 'expenses'))
    const expensesList: ExpenseItem[] = []
    expensesSnapshot.forEach((d) => {
      expensesList.push({ id: d.id, ...d.data() } as ExpenseItem)
    })

    set({
      sites: sitesList,
      trades: tradesList,
      records: recordsObj,
      journals: journalsObj,
      workerSites: workerSitesList,
      workerRecords: workerRecordsList,
      expenses: expensesList,
    })
  },

  addSite: async (site) => {
    const uid = get().user.id
    if (!uid) return
    const newSite: Site = { ...site, id: createId('site') }
    await setDoc(doc(db, 'users', uid, 'sites', newSite.id), newSite)
  },

  updateSite: async (site) => {
    const uid = get().user.id
    if (!uid) return
    await setDoc(doc(db, 'users', uid, 'sites', site.id), site)
  },

  deleteSite: async (id) => {
    const uid = get().user.id
    if (!uid) return
    
    // Firestore 삭제
    await deleteDoc(doc(db, 'users', uid, 'sites', id))
    
    // 관련된 하위 기록 삭제 처리
    const newRecords = Object.fromEntries(Object.entries(get().records).filter(([key]) => !key.startsWith(`${id}|`)))
    const newJournals = Object.fromEntries(Object.entries(get().journals).filter(([key]) => !key.startsWith(`${id}|`)))
    
    set({
      records: newRecords,
      journals: newJournals
    })
  },

  addTrade: async (trade) => {
    const uid = get().user.id
    if (!uid) return
    const newTrade: Trade = { ...trade, id: createId('trade') }
    await setDoc(doc(db, 'users', uid, 'trades', newTrade.id), newTrade)
  },

  updateTrade: async (trade) => {
    const uid = get().user.id
    if (!uid) return
    await setDoc(doc(db, 'users', uid, 'trades', trade.id), trade)
  },

  deleteTrade: async (id) => {
    const uid = get().user.id
    if (!uid) return

    await deleteDoc(doc(db, 'users', uid, 'trades', id))

    const records = Object.fromEntries(
      Object.entries(get().records)
        .map(([key, day]) => {
          const { [id]: _, ...rest } = day
          return [key, rest] as const
        })
        .filter(([, day]) => Object.keys(day).length > 0),
    )

    set({
      records,
    })
  },

  setAttendance: async (siteId, dateStr, tradeId, patch) => {
    const uid = get().user.id
    if (!uid) return

    const key = `${siteId}|${dateStr}`
    const nextRecords = withEntry(get().records, siteId, dateStr, tradeId, patch)
    const dayRecord = nextRecords[key]

    if (dayRecord && Object.keys(dayRecord).length > 0) {
      await setDoc(doc(db, 'users', uid, 'records', key), dayRecord)
    } else {
      await deleteDoc(doc(db, 'users', uid, 'records', key))
    }

    set({ records: nextRecords })
  },

  setJournal: async (siteId, dateStr, patch) => {
    const uid = get().user.id
    if (!uid) return

    const key = `${siteId}|${dateStr}`
    const prev = get().journals[key] ?? { title: '', body: '', memo: '', photos: [] }
    const next = { ...prev, ...patch }
    const body = next.body ?? next.memo ?? ''
    const photoCount = next.photos?.length ?? 0

    if (!next.title && !body && photoCount === 0) {
      await deleteDoc(doc(db, 'users', uid, 'journals', key))
      set((s) => {
        const { [key]: _, ...rest } = s.journals
        return { journals: rest }
      })
    } else {
      await setDoc(doc(db, 'users', uid, 'journals', key), next)
      set((s) => ({
        journals: {
          ...s.journals,
          [key]: next,
        },
      }))
    }
  },

  addWorkerSite: async (site) => {
    const uid = get().user.id
    if (!uid) return
    const newSite: WorkerSite = { ...site, id: createId('worker-site') }
    await setDoc(doc(db, 'users', uid, 'workerSites', newSite.id), newSite)
  },

  updateWorkerSite: async (site) => {
    const uid = get().user.id
    if (!uid) return
    await setDoc(doc(db, 'users', uid, 'workerSites', site.id), site)
  },

  deleteWorkerSite: async (id) => {
    const uid = get().user.id
    if (!uid) return

    await deleteDoc(doc(db, 'users', uid, 'workerSites', id))
    
    set((s) => ({
      workerRecords: s.workerRecords.filter((x) => x.siteId !== id),
    }))
  },

  addWorkerRecord: async (record) => {
    const uid = get().user.id
    if (!uid) return
    const newRecord: WorkerRecord = { ...record, id: createId('worker-record') }
    await setDoc(doc(db, 'users', uid, 'workerRecords', newRecord.id), newRecord)
  },

  updateWorkerRecord: async (record) => {
    const uid = get().user.id
    if (!uid) return
    await setDoc(doc(db, 'users', uid, 'workerRecords', record.id), record)
  },

  deleteWorkerRecord: async (id) => {
    const uid = get().user.id
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'workerRecords', id))
  },

  addExpense: async (expense) => {
    const uid = get().user.id
    if (!uid) return
    const newExpense: ExpenseItem = { ...expense, id: createId('expense') }
    await setDoc(doc(db, 'users', uid, 'expenses', newExpense.id), newExpense)
  },

  updateExpense: async (expense) => {
    const uid = get().user.id
    if (!uid) return
    await setDoc(doc(db, 'users', uid, 'expenses', expense.id), expense)
  },

  deleteExpense: async (id) => {
    const uid = get().user.id
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'expenses', id))
  },

  addExpenseCategory: async (category) => {
    const uid = get().user.id
    if (!uid) return
    const current = get().user.expenseCategories ?? []
    const list = current.length > 0 ? current : ['예비비', '점심식사', '현장물품', '현장간식', '월세비', '기타']
    if (list.includes(category)) return
    const next = [...list, category]
    await updateDoc(doc(db, 'users', uid), { expenseCategories: next })
    set((s) => ({ user: { ...s.user, expenseCategories: next } }))
  },

  deleteExpenseCategory: async (category) => {
    const uid = get().user.id
    if (!uid) return
    const current = get().user.expenseCategories ?? []
    const list = current.length > 0 ? current : ['예비비', '점심식사', '현장물품', '현장간식', '월세비', '기타']
    const next = list.filter((x) => x !== category)
    await updateDoc(doc(db, 'users', uid), { expenseCategories: next })
    set((s) => ({ user: { ...s.user, expenseCategories: next } }))
  },

  updateProfile: async (patch) => {
    const uid = get().user.id
    if (!uid) return

    await updateDoc(doc(db, 'users', uid), {
      name: patch.name,
      phone: patch.phone || '',
      bank: patch.bank || '',
      account: patch.account || '',
      holder: patch.holder || ''
    })

    // Auth profile displayName 동기화
    if (auth.currentUser) {
      await updateAuthProfile(auth.currentUser, { displayName: patch.name })
    }

    set((s) => ({
      user: {
        ...s.user,
        name: patch.name,
        phone: patch.phone || '',
        avatar: patch.name ? patch.name[0] : s.user.avatar,
        bank: patch.bank || '',
        account: patch.account || '',
        holder: patch.holder || ''
      },
    }))
  },

  flash: (message) => {
    set({ toast: message })
    setTimeout(() => set({ toast: '' }), 1800)
  },

  initTheme: () => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem('sitelog_theme') as 'light' | 'dark' | null
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialTheme = saved || (prefersDark ? 'dark' : 'light')
    
    set({ theme: initialTheme })
    
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  },

  toggleTheme: () => {
    const nextTheme = get().theme === 'light' ? 'dark' : 'light'
    set({ theme: nextTheme })
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('sitelog_theme', nextTheme)
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  },
}))

// SSR이 아닌 브라우저 환경에서 Firebase Auth 실시간 리스너 작동 (유지보수성 향상)
if (typeof window !== 'undefined') {
  // 테마 초기화 즉시 기동 (FOUC 깜빡임 최소화)
  useAppStore.getState().initTheme()

  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const docRef = doc(db, 'users', firebaseUser.uid)
        const docSnap = await getDoc(docRef)
        
        let userData: AppUser = EMPTY_USER
        if (docSnap.exists()) {
          const data = docSnap.data()
          userData = {
            id: firebaseUser.uid,
            org_id: firebaseUser.uid, // 회원별 독립 org_id 제공
            type: data.type || 'manager',
            name: data.name || '',
            role: data.type === 'worker' ? '노동자' : '관리자',
            email: firebaseUser.email || '',
            avatar: data.name ? data.name[0] : 'U',
            phone: data.phone || '',
            company: data.company || '',
            joined: data.joined || '',
            bank: data.bank || '',
            account: data.account || '',
            holder: data.holder || '',
            expenseCategories: data.expenseCategories || [],
          }
        } else {
          // 데이터베이스 미생성 당시 꼬였던 불완전 가입 계정 자동 복구
          const fallbackName = firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : '사용자')
          userData = {
            id: firebaseUser.uid,
            org_id: firebaseUser.uid,
            type: 'manager',
            name: fallbackName,
            role: '관리자',
            email: firebaseUser.email || '',
            avatar: fallbackName[0].toUpperCase(),
            phone: '',
            company: '',
            joined: new Date().toISOString().slice(0, 7),
            expenseCategories: [],
          }
          await setDoc(docRef, {
            name: userData.name,
            email: userData.email,
            type: userData.type,
            joined: userData.joined,
            expenseCategories: []
          })
        }

        
        // 1. 유저 상태를 먼저 설정하여 uid를 확보합니다.
        useAppStore.setState({
          authed: true,
          user: userData
        })
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('sitelog_user_hint', JSON.stringify(userData))
        }
        
        // 2. 실시간 동기화 리스너를 실행합니다.
        useAppStore.getState().setupRealtimeListeners()

        // 3. 로딩이 완료되었음을 설정합니다.
        useAppStore.setState({
          authInitialized: true
        })
      } catch (e) {
        console.error('Error fetching user profile:', e)
        useAppStore.setState({
          authInitialized: true
        })
      }
    } else {
      useAppStore.getState().cleanupRealtimeListeners()
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sitelog_user_hint')
      }
      useAppStore.setState({
        authed: false,
        user: EMPTY_USER,
        sites: [],
        trades: [],
        records: {},
        journals: {},
        workerSites: [],
        workerRecords: [],
        expenses: [],
        authInitialized: true
      })
    }
  })
}
