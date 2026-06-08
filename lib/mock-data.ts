import type { Trade, Site, Records, Journals, AppUser } from './types'
import { ymd, parseYmd, addDays } from './utils'

export const SEED_TRADES: Trade[] = [
  { id: 't1', name: '경량',   color: '#2563EB', rate: 220000, company: '(주)대한경량',  contact: '김경량', phone: '010-2841-7733', sort_order: 0 },
  { id: 't2', name: '설비',   color: '#0EA5E9', rate: 250000, company: '한빛설비',      contact: '이설비', phone: '010-5520-1184', sort_order: 1 },
  { id: 't3', name: '에어컨', color: '#06B6D4', rate: 240000, company: '쿨에어시스템',  contact: '박에어', phone: '010-3349-6620', sort_order: 2 },
  { id: 't4', name: '전기',   color: '#F59E0B', rate: 270000, company: '정밀전기',      contact: '최전기', phone: '010-7781-2055', sort_order: 3 },
  { id: 't5', name: '목공',   color: '#8B5CF6', rate: 230000, company: '우드크래프트',  contact: '정목수', phone: '010-4412-8890', sort_order: 4 },
  { id: 't6', name: '도장',   color: '#EC4899', rate: 210000, company: '컬러페인트',    contact: '강도장', phone: '010-6628-3301', sort_order: 5 },
  { id: 't7', name: '타일',   color: '#14B8A6', rate: 235000, company: '명품타일',      contact: '윤타일', phone: '010-9015-4476', sort_order: 6 },
]

export const SEED_SITES: Site[] = [
  { id: 's1', name: '강남 OO병원 리모델링',     addr: '서울 강남구 역삼동 814',        status: '진행중',  start: '2026-05-04', manager: '김현장' },
  { id: 's2', name: '분당 OO상가',              addr: '경기 성남시 분당구 정자동',      status: '진행중',  start: '2026-05-18', manager: '이기사' },
  { id: 's3', name: '판교 OO오피스 인테리어',   addr: '경기 성남시 분당구 삼평동',      status: '진행중',  start: '2026-06-01', manager: '박감독' },
  { id: 's4', name: '마포 OO카페',              addr: '서울 마포구 연남동 239',          status: '마감임박', start: '2026-04-20', manager: '김현장' },
  { id: 's5', name: '송도 OO학원',              addr: '인천 연수구 송도동 12',           status: '완료',    start: '2026-03-10', manager: '최반장' },
]

export const MOCK_USER: AppUser = {
  name: '김현장',
  role: '현장 관리기사',
  email: 'kim@hyunjang.co.kr',
  avatar: '김',
  phone: '010-3024-7781',
  company: '현장건설(주)',
  joined: '2025-11',
}

export const JOURNAL_SEED: Journals = {
  's1|2026-06-08': { memo: '병동 3층 천장 경량 작업 마무리. 설비 배관 2층까지 진행. 내일 도장 투입 예정.', photos: 2 },
  's1|2026-06-05': { memo: '에어컨 실외기 4대 설치 완료. 전기 배선 점검.', photos: 1 },
  's2|2026-06-08': { memo: '상가 1층 목공 몰딩 시공 중. 타일 자재 입고.', photos: 1 },
}

// Deterministic PRNG (seeded)
function mulberry32(a: number) {
  return function () {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const MEMOS = ['천장 마감', '배관 작업', '실외기 설치', '배선 정리', '몰딩 시공', '벽면 도장', '바닥 타일', '덕트 작업', '석고보드', '콘센트 설치', '']

export function buildAttendance(): Records {
  const rng = mulberry32(20260608)
  const records: Records = {}
  const TODAY = new Date(2026, 5, 8)

  for (const site of SEED_SITES) {
    const sStart = parseYmd(site.start!)
    const end = site.status === '완료' ? addDays(sStart, 40) : TODAY
    let cursor = new Date(sStart)
    const activeTrades = SEED_TRADES.filter(() => rng() > 0.25)
    while (cursor <= end) {
      const dow = cursor.getDay()
      if (dow !== 0 && rng() > 0.12) {
        const entries: Record<string, { count: number; memo: string }> = {}
        for (const t of activeTrades) {
          if (rng() > 0.45) {
            entries[t.id] = {
              count: 1 + Math.floor(rng() * 6),
              memo: MEMOS[Math.floor(rng() * MEMOS.length)] ?? '',
            }
          }
        }
        if (Object.keys(entries).length) records[`${site.id}|${ymd(cursor)}`] = entries
      }
      cursor = addDays(cursor, 1)
    }
  }
  return records
}
