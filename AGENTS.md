# SiteLog — 현장출근기록

인테리어 공사 현장의 일별 출근 현황을 기록·조회하는 모바일 우선 웹앱.

## 스택

- **Next.js 15** App Router + TypeScript
- **Tailwind CSS** (디자인 토큰 → `tailwind.config.ts`)
- **Zustand** 전역 상태 (`stores/app-store.ts`) — 현재 mock 데이터, 추후 Firebase로 교체
- **Firebase** (예정) — Auth + Firestore/Storage 검토 예정
- **lucide-react** 아이콘, **date-fns** 날짜, **Pretendard** 폰트
- Package manager: **npm**

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
  mock-data.ts          DEMO_USER, SEED_SITES, SEED_TRADES, SEED_RECORDS
stores/app-store.ts     Zustand store
_proto/                 원본 HTML 프로토타입 (UI 참고용)
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

## Firebase 연동 (예정)

`.env.local` 파일 필요:
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```
- Firebase Admin SDK 키는 서버에서만 사용한다. 클라이언트 컴포넌트에 노출하지 않는다.
- 연동 시 `stores/app-store.ts`의 mock 데이터를 Firebase 쿼리로 교체.

---

## 작업 전 기본 태도

작업을 시작하면 먼저 현재 코드를 읽고 판단한다. 과거 지식이나 추측으로 바로 수정하지 않는다.

- 기존 패턴을 먼저 따른다.
- 관련 없는 리팩터링은 하지 않는다.
- 사용자가 만든 변경사항을 되돌리지 않는다.
- 큰 기능은 설계와 영향 범위를 먼저 설명하고 진행한다.
- 작은 스타일/문구 수정은 과하게 검사하지 않아도 된다.

## 코딩 원칙

### Think Before Coding
구현 전에 가정을 명시한다. 해석이 여러 가지면 제시하고 고른다. 불확실하면 멈추고 묻는다.

### Simplicity First
요청한 것만 만든다.
- 요청 범위를 넘는 기능 추가 금지
- 단일 사용 코드에 추상화 금지
- 요청하지 않은 "유연성"이나 "설정 가능성" 금지
- 200줄로 짰는데 50줄에 가능하면 다시 쓴다

### Surgical Changes
건드려야 할 것만 건드린다.
- 인접한 코드, 주석, 포매팅을 "개선"하지 않는다
- 내가 만든 변경으로 생긴 고아(미사용 import/변수)는 내가 제거한다
- 기존 dead code는 언급만 하고 삭제하지 않는다

## 커밋 규칙

Conventional Commit 형식, 타입은 영어, 설명은 한국어.

```
feat: 현장 상세 달력 탭 구현
fix: DateStrip 선택일 스크롤 버그 수정
style: 대시보드 카드 간격 조정
refactor: tradeManDays 유틸 함수 분리
```

커밋 전 확인:
- 스타일만 바꾼 경우: diff 확인 후 커밋
- 기능/서버 액션 변경: `npx tsc --noEmit`
- 큰 기능 변경: `npm run lint`, 가능하면 `npm run build`

## 검증 습관

작업 후 "됐다"고 말하기 전에 실제 확인 결과를 말한다.

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`

## 답변 스타일

- 한국어로 간결하게 말한다.
- 무엇을 바꿨는지, 무엇을 확인했는지 알려준다.
- 불확실한 것은 불확실하다고 말하고 확인한다.
- 사용자가 질문한 것보다 더 큰 위험이 보이면 짧게 짚어준다.
- 장황한 설명보다 현재 작업에 필요한 핵심을 우선한다.
