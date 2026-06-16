import type { AppUser, Journals, Records, Site, Trade } from './types'
import { addDays, ymd } from './utils'

const today = new Date()
today.setHours(0, 0, 0, 0)

export const DEMO_USER: AppUser = {
  id: 'demo-user',
  org_id: 'demo-org',
  name: '김현장',
  role: '관리자',
  email: 'demo@sitelog.local',
  avatar: '김',
  phone: '010-1234-5678',
  company: '사이트로그 데모',
  joined: '2026-06',
}

export const SEED_SITES: Site[] = [
  {
    id: 'site-1',
    name: '강남 주거 리모델링',
    addr: '서울 강남구 테헤란로',
    status: '진행중',
    start: ymd(addDays(today, -18)),
    manager: '박소장',
  },
  {
    id: 'site-2',
    name: '성수 카페 인테리어',
    addr: '서울 성동구 연무장길',
    status: '마감임박',
    start: ymd(addDays(today, -31)),
    manager: '이팀장',
  },
  {
    id: 'site-3',
    name: '판교 오피스 원상복구',
    addr: '경기 성남시 분당구',
    status: '완료',
    start: ymd(addDays(today, -52)),
    manager: '최대리',
  },
]

export const SEED_TRADES: Trade[] = [
  { id: 'trade-1', name: '목공', color: '#2563EB', rate: 230000, company: '한빛목공', contact: '정목수', phone: '010-2345-6789', sort_order: 1 },
  { id: 'trade-2', name: '전기', color: '#F59E0B', rate: 260000, company: '라인전기', contact: '오기사', phone: '010-3456-7890', sort_order: 2 },
  { id: 'trade-3', name: '설비', color: '#14B8A6', rate: 250000, company: '대성설비', contact: '문반장', phone: '010-4567-8901', sort_order: 3 },
  { id: 'trade-4', name: '도장', color: '#EC4899', rate: 210000, company: '컬러페인트', contact: '장대표', phone: '010-5678-9012', sort_order: 4 },
]

export const SEED_RECORDS: Records = Array.from({ length: 7 }, (_, i) => {
  const date = ymd(addDays(today, i - 6))
  return [
    [`site-1|${date}`, {
      'trade-1': { count: i % 2 === 0 ? 3 : 2, memo: '' },
      'trade-2': { count: i >= 4 ? 1 : 0, memo: '' },
    }],
    [`site-2|${date}`, {
      'trade-3': { count: i % 3 === 0 ? 2 : 1, memo: '' },
      'trade-4': { count: i >= 5 ? 2 : 0, memo: '' },
    }],
  ]
}).flat().reduce<Records>((acc, [key, value]) => {
  acc[key as string] = value as Records[string]
  return acc
}, {})

export const SEED_JOURNALS: Journals = {
  [`site-1|${ymd(today)}`]: {
    memo: '거실 목공 마감과 전기 배선 확인.',
    photos: 0,
  },
  [`site-2|${ymd(today)}`]: {
    memo: '주방 설비 위치 조정, 도장 전 퍼티 작업 진행.',
    photos: 0,
  },
}

export function cloneDemoData() {
  return {
    user: { ...DEMO_USER },
    sites: SEED_SITES.map((site) => ({ ...site })),
    trades: SEED_TRADES.map((trade) => ({ ...trade })),
    records: structuredClone(SEED_RECORDS),
    journals: structuredClone(SEED_JOURNALS),
  }
}
