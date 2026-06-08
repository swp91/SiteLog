# SiteLog — 현장출근기록

인테리어 공사 현장의 일별 출근 현황을 기록·조회하는 모바일 우선 웹앱.

## 스택

- **Next.js 15** App Router + TypeScript
- **Tailwind CSS** (디자인 토큰 → `tailwind.config.ts`)
- **Zustand** 전역 상태 (`stores/app-store.ts`) — 현재 mock 데이터, 추후 Supabase로 교체
- **Supabase** (예정) — Postgres + Auth(이메일/카카오) + RLS
- **lucide-react** 아이콘, **date-fns** 날짜, **Pretendard** 폰트

## 구조

```
app/
  (auth)/login/         로그인 (이메일 + 카카오)
  (app)/
    dashboard/          오늘 출근 요약 + 7일 추이
    sites/              현장 목록 + CRUD
    sites/[siteId]/     현장 상세 (4탭: 입력·달력·표·일지)
    calendar/           통합 달력 (현장별 색상 점)
    stats/              월별 통계
    payroll/            노무비 계산 (일당 × man-day)
    trades/             공종·업체 CRUD
    settings/           프로필·알림
    more/               모바일 더보기 메뉴
components/
  ui/                   Button, Card, Badge, Sheet, Stepper, DateStrip 등
  layout/               Sidebar(PC), TopBar+BottomNav(모바일), AppShell
lib/
  types.ts              Site, Trade, Records, Journals, AppUser
  utils.ts              ymd, dayTotal, tradeManDays, withEntry, wonFmt 등
  mock-data.ts          SEED_SITES, SEED_TRADES, buildAttendance
stores/app-store.ts     Zustand store
_proto/                 원본 HTML 프로토타입 (UI 참고용)
SUPABASE_SCHEMA.md      DB 스키마 + RLS + 카카오 OAuth 설정 가이드
```

## 반응형 브레이크포인트

`wide: 880px` — 이상이면 PC(사이드바), 미만이면 모바일(하단 탭바)

## 디자인 토큰

`tailwind.config.ts`에 정의됨:
- primary: `blue-600 = #2563EB`
- 카드: 흰 배경 + `border-slate-200` + `rounded-lg` + `shadow-sm`
- hover 카드: `shadow-md` + `-translate-y-0.5` + `border-blue-300`
- FAB: `w-[58px] h-[58px]` 원형, `bottom-[92px]` (모바일 탭바 위)
- 터치 타깃 최소 44px

## 주요 패턴

- 출근 입력은 **자동 저장** (별도 저장 버튼 없음) — `setAttendance` 호출 즉시 반영
- CRUD 폼은 `Sheet` 컴포넌트 (바텀시트) 사용
- 토스트 알림: `useAppStore().flash('메시지')` → 1.8초 자동 소멸

## Supabase 연동 (미완성)

`.env.local` 파일 필요:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
스키마 전체는 `SUPABASE_SCHEMA.md` 참고. 연동 시 `stores/app-store.ts`의 mock 데이터를 Supabase 쿼리로 교체.
