import type {
  AppUser,
  Journals,
  Records,
  Site,
  Trade,
  UserType,
  WorkerRecord,
  WorkerSite,
} from "./types";
import { addDays, ymd } from "./utils";

const today = new Date();
today.setHours(0, 0, 0, 0);

export const DEMO_USER: AppUser = {
  id: "demo-user",
  org_id: "demo-org",
  type: "manager",
  name: "김현장",
  role: "관리자",
  email: "demo@sitelog.local",
  avatar: "김",
  phone: "010-1234-5678",
  company: "사이트로그 데모",
  joined: "2026-06",
};

export const DEMO_WORKER_USER: AppUser = {
  id: "demo-worker",
  org_id: "worker-private",
  type: "worker",
  name: "이공수",
  role: "노동자",
  email: "worker@sitelog.local",
  avatar: "이",
  phone: "010-9876-5432",
  company: "개인 공수 장부",
  joined: "2026-06",
};

export const SEED_SITES: Site[] = [
  {
    id: "site-1",
    name: "아산 성모내과",
    addr: "아산 탕정",
    status: "진행중",
    start: ymd(addDays(today, -18)),
    manager: "박성우",
  },
];

export const SEED_TRADES: Trade[] = [
  {
    id: "trade-1",
    name: "금속",
    color: "#64748B",
    rate: 0,
    sort_order: 1,
  },
  {
    id: "trade-2",
    name: "설비",
    color: "#14B8A6",
    rate: 0,
    sort_order: 2,
  },
  {
    id: "trade-3",
    name: "경량",
    color: "#8B5CF6",
    rate: 0,
    sort_order: 3,
  },
  {
    id: "trade-4",
    name: "전기",
    color: "#F59E0B",
    rate: 0,
    sort_order: 4,
  },
  {
    id: "trade-5",
    name: "소방",
    color: "#EF4444",
    rate: 0,
    sort_order: 5,
  },
  {
    id: "trade-6",
    name: "에어컨",
    color: "#0EA5E9",
    rate: 0,
    sort_order: 6,
  },
  {
    id: "trade-7",
    name: "목공",
    color: "#2563EB",
    rate: 0,
    sort_order: 7,
  },
  {
    id: "trade-8",
    name: "셔터",
    color: "#F97316",
    rate: 0,
    sort_order: 8,
  },
  {
    id: "trade-9",
    name: "철거",
    color: "#111827",
    rate: 0,
    sort_order: 9,
  },
];

export const SEED_RECORDS: Records = {
  "site-1|2026-05-12": {
    "trade-1": { count: 2, memo: "" },
    "trade-2": { count: 4, memo: "" },
  },
  "site-1|2026-05-13": {
    "trade-1": { count: 2, memo: "" },
    "trade-2": { count: 4, memo: "" },
  },
  "site-1|2026-05-14": {
    "trade-1": { count: 2, memo: "" },
    "trade-2": { count: 4, memo: "" },
  },
  "site-1|2026-05-15": {
    "trade-1": { count: 2, memo: "" },
    "trade-2": { count: 4, memo: "" },
    "trade-3": { count: 4, memo: "" },
  },
  "site-1|2026-05-16": {
    "trade-1": { count: 2, memo: "" },
    "trade-3": { count: 4, memo: "" },
  },
  "site-1|2026-05-25": {
    "trade-3": { count: 2, memo: "" },
    "trade-4": { count: 1, memo: "" },
  },
  "site-1|2026-05-26": {
    "trade-3": { count: 3, memo: "" },
  },
  "site-1|2026-05-27": {
    "trade-3": { count: 2, memo: "" },
  },
  "site-1|2026-05-28": {
    "trade-3": { count: 2, memo: "" },
  },
  "site-1|2026-05-29": {
    "trade-3": { count: 6, memo: "" },
    "trade-5": { count: 4, memo: "" },
  },
  "site-1|2026-05-30": {
    "trade-3": { count: 4, memo: "" },
    "trade-5": { count: 5, memo: "" },
  },
  "site-1|2026-06-01": {
    "trade-3": { count: 4, memo: "" },
    "trade-1": { count: 1, memo: "" },
  },
  "site-1|2026-06-02": {
    "trade-3": { count: 4, memo: "" },
  },
  "site-1|2026-06-03": {
    "trade-3": { count: 4, memo: "" },
  },
  "site-1|2026-06-04": {
    "trade-3": { count: 5, memo: "" },
    "trade-6": { count: 3, memo: "" },
    "trade-2": { count: 2, memo: "" },
  },
  "site-1|2026-06-05": {
    "trade-3": { count: 5, memo: "" },
    "trade-4": { count: 1, memo: "" },
    "trade-7": { count: 2, memo: "" },
  },
  "site-1|2026-06-06": {
    "trade-3": { count: 4, memo: "" },
    "trade-7": { count: 2, memo: "" },
    "trade-6": { count: 2, memo: "" },
  },
  "site-1|2026-06-07": {
    "trade-6": { count: 2, memo: "" },
  },
  "site-1|2026-06-08": {
    "trade-3": { count: 3, memo: "" },
    "trade-6": { count: 5, memo: "" },
  },
  "site-1|2026-06-09": {
    "trade-4": { count: 1, memo: "" },
    "trade-3": { count: 2, memo: "" },
    "trade-2": { count: 2, memo: "" },
  },
  "site-1|2026-06-10": {
    "trade-4": { count: 1, memo: "" },
    "trade-3": { count: 3, memo: "" },
    "trade-7": { count: 3, memo: "" },
    "trade-8": { count: 3, memo: "" },
  },
  "site-1|2026-06-11": {
    "trade-7": { count: 6, memo: "" },
    "trade-3": { count: 3, memo: "" },
  },
  "site-1|2026-06-12": {
    "trade-2": { count: 2, memo: "" },
    "trade-3": { count: 5, memo: "" },
    "trade-7": { count: 6, memo: "" },
    "trade-4": { count: 2, memo: "" },
  },
  "site-1|2026-06-13": {
    "trade-3": { count: 3, memo: "" },
    "trade-4": { count: 3, memo: "" },
    "trade-7": { count: 6, memo: "" },
  },
  "site-1|2026-06-15": {
    "trade-7": { count: 5.5, memo: "" },
  },
  "site-1|2026-06-16": {
    "trade-7": { count: 6, memo: "" },
    "trade-3": { count: 3, memo: "" },
    "trade-5": { count: 2, memo: "" },
  },
  "site-1|2026-06-17": {
    "trade-3": { count: 3, memo: "" },
    "trade-7": { count: 6, memo: "" },
    "trade-4": { count: 1, memo: "" },
    "trade-5": { count: 4, memo: "" },
    "trade-6": { count: 1, memo: "" },
    "trade-9": { count: 2, memo: "" },
  },
};

export const SEED_JOURNALS: Journals = {
  [`site-1|${ymd(today)}`]: {
    title: "거실 목공 마감 확인",
    body: "거실 목공 마감과 전기 배선 확인.",
    photos: [],
  },
  [`site-2|${ymd(today)}`]: {
    title: "주방 설비 위치 조정",
    body: "주방 설비 위치 조정, 도장 전 퍼티 작업 진행.",
    photos: [],
  },
};

export const SEED_WORKER_SITES: WorkerSite[] = [
  {
    id: "worker-site-1",
    name: "아산 현장",
    defaultRate: 180000,
    color: "#2563EB",
  },
  {
    id: "worker-site-2",
    name: "천안 현장",
    defaultRate: 200000,
    color: "#14B8A6",
  },
  {
    id: "worker-site-3",
    name: "서울 오피스",
    defaultRate: 220000,
    color: "#F59E0B",
  },
];

export const SEED_WORKER_RECORDS: WorkerRecord[] = [
  {
    id: "worker-record-1",
    date: ymd(addDays(today, -12)),
    siteId: "worker-site-1",
    manDay: 1,
    rate: 180000,
    paymentStatus: "paid",
  },
  {
    id: "worker-record-2",
    date: ymd(addDays(today, -8)),
    siteId: "worker-site-2",
    manDay: 1.5,
    rate: 200000,
    paymentStatus: "unpaid",
    memo: "야간 정리 포함",
  },
  {
    id: "worker-record-3",
    date: ymd(addDays(today, -3)),
    siteId: "worker-site-3",
    manDay: 1,
    rate: 220000,
    paymentStatus: "unpaid",
  },
  {
    id: "worker-record-4",
    date: ymd(today),
    siteId: "worker-site-1",
    manDay: 0.5,
    rate: 180000,
    paymentStatus: "unpaid",
  },
];

export function cloneDemoData() {
  return {
    user: { ...DEMO_USER },
    sites: SEED_SITES.map((site) => ({ ...site })),
    trades: SEED_TRADES.map((trade) => ({ ...trade })),
    records: structuredClone(SEED_RECORDS),
    journals: structuredClone(SEED_JOURNALS),
    workerSites: SEED_WORKER_SITES.map((site) => ({ ...site })),
    workerRecords: SEED_WORKER_RECORDS.map((record) => ({ ...record })),
  };
}

export function cloneUserForType(type: UserType) {
  return type === "worker" ? { ...DEMO_WORKER_USER } : { ...DEMO_USER };
}
