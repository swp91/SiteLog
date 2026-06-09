export type SiteStatus = '진행중' | '마감임박' | '완료'

export interface Trade {
  id: string
  name: string
  color: string
  rate: number
  company?: string
  contact?: string
  phone?: string
  sort_order?: number
}

export interface Site {
  id: string
  name: string
  addr?: string
  status: SiteStatus
  start?: string
  manager?: string
}

export interface AttendanceEntry {
  count: number
  memo?: string
}

/** key: tradeId */
export type DayRecord = Record<string, AttendanceEntry>

/** key: "siteId|YYYY-MM-DD" */
export type Records = Record<string, DayRecord>

export interface Journal {
  memo?: string
  photos?: number
}

/** key: "siteId|YYYY-MM-DD" */
export type Journals = Record<string, Journal>

export interface AppUser {
  id: string
  org_id: string
  name: string
  role: string
  email: string
  avatar: string
  phone?: string
  company?: string
  joined?: string
}
