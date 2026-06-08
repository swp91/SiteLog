# Supabase 스키마 제안 — 현장출근기록

> Postgres + Supabase Auth + RLS 기준. 인테리어 현장 출근 관리.
> 여러 관리기사가 함께 쓰므로 **조직(회사)** 단위로 데이터를 공유하는 구조를 권장합니다.

---

## 테이블 구조

```sql
-- ───────────────────────────────────────────
-- 1. 조직 (회사) — 여러 관리기사가 같은 현장/공종을 공유
-- ───────────────────────────────────────────
create table orgs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

-- ───────────────────────────────────────────
-- 2. 프로필 (auth.users 1:1 확장)
-- ───────────────────────────────────────────
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  org_id      uuid references orgs(id) on delete set null,
  name        text not null,
  role        text not null default '현장 관리기사',
  phone       text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- ───────────────────────────────────────────
-- 3. 현장 (sites)
-- ───────────────────────────────────────────
create type site_status as enum ('진행중', '마감임박', '완료');

create table sites (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references orgs(id) on delete cascade,
  name        text not null,
  addr        text,
  status      site_status not null default '진행중',
  start_date  date,
  manager_id  uuid references profiles(id) on delete set null,  -- 담당 관리기사
  manager_name text,                                            -- (선택) 외부 담당자명 캐시
  created_at  timestamptz not null default now()
);

-- ───────────────────────────────────────────
-- 4. 공종 / 협력사 (trades) — 출근 입력 카테고리 + 업체 정보 + 일당
-- ───────────────────────────────────────────
create table trades (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references orgs(id) on delete cascade,
  name        text not null,                 -- 경량, 설비, 에어컨...
  color       text not null default '#2563EB',
  company     text,                          -- 협력사 상호
  contact     text,                          -- 담당자
  phone       text,                          -- 연락처
  rate        integer not null default 0,    -- 일당 (원)
  sort_order  integer default 0,
  created_at  timestamptz not null default now()
);

-- ───────────────────────────────────────────
-- 5. 출근 기록 (attendance) — 현장×날짜×공종 별 인원 + 메모
--    프로토타입의 records{ "siteId|date": { tradeId: {count, memo} } } 를 정규화
-- ───────────────────────────────────────────
create table attendance (
  id          uuid primary key default gen_random_uuid(),
  site_id     uuid not null references sites(id) on delete cascade,
  trade_id    uuid not null references trades(id) on delete cascade,
  work_date   date not null,
  count       integer not null default 0,    -- 출근 인원
  memo        text,                           -- 작업 내용
  updated_by  uuid references profiles(id) on delete set null,
  updated_at  timestamptz not null default now(),
  unique (site_id, trade_id, work_date)       -- 같은 날 같은 공종은 1행 (upsert)
);

create index on attendance (site_id, work_date);
create index on attendance (trade_id, work_date);

-- ───────────────────────────────────────────
-- 6. 일일 일지 (journals) — 현장×날짜 메모 + 사진
-- ───────────────────────────────────────────
create table journals (
  id          uuid primary key default gen_random_uuid(),
  site_id     uuid not null references sites(id) on delete cascade,
  work_date   date not null,
  memo        text,
  updated_by  uuid references profiles(id) on delete set null,
  updated_at  timestamptz not null default now(),
  unique (site_id, work_date)
);

create table journal_photos (
  id          uuid primary key default gen_random_uuid(),
  journal_id  uuid not null references journals(id) on delete cascade,
  storage_path text not null,                 -- Supabase Storage 경로
  created_at  timestamptz not null default now()
);
```

---

## 핵심 쿼리 패턴

```sql
-- 오늘 전체 출근 (대시보드)
select s.id, s.name, coalesce(sum(a.count),0) as total
from sites s
left join attendance a on a.site_id = s.id and a.work_date = current_date
where s.org_id = :org and s.status <> '완료'
group by s.id;

-- 현장 상세 · 특정 날짜 공종별 (입력/달력)
select t.id, t.name, t.color, a.count, a.memo
from trades t
left join attendance a
  on a.trade_id = t.id and a.site_id = :site and a.work_date = :date
where t.org_id = :org
order by t.sort_order;

-- 출근 입력 (자동 저장) — upsert
insert into attendance (site_id, trade_id, work_date, count, memo, updated_by)
values (:site, :trade, :date, :count, :memo, auth.uid())
on conflict (site_id, trade_id, work_date)
do update set count = excluded.count, memo = excluded.memo,
              updated_by = excluded.updated_by, updated_at = now();
-- count=0 이고 memo가 비면 행 삭제 처리(클라이언트 또는 트리거)

-- 노무비 (월·공종별): 일당 × man-day
select t.id, t.name, t.company, t.rate,
       sum(a.count) as man_day,
       sum(a.count) * t.rate as labor_cost
from attendance a
join trades t on t.id = a.trade_id
where a.work_date >= :from and a.work_date <= :to
  and (:site is null or a.site_id = :site)
group by t.id
order by labor_cost desc;

-- 업체(공종) 투입 이력
select a.work_date, s.name as site_name, a.count, a.memo
from attendance a join sites s on s.id = a.site_id
where a.trade_id = :trade
order by a.work_date desc
limit 30;
```

---

## RLS (Row Level Security)

조직 단위 격리 — 같은 `org_id` 멤버만 접근.

```sql
alter table sites enable row level security;
alter table trades enable row level security;
alter table attendance enable row level security;
alter table journals enable row level security;

-- 헬퍼: 현재 유저의 org_id
create or replace function auth_org_id() returns uuid
language sql stable security definer as $$
  select org_id from profiles where id = auth.uid();
$$;

-- sites / trades: 같은 org만 모든 작업 허용
create policy "org members" on sites
  for all using (org_id = auth_org_id()) with check (org_id = auth_org_id());
create policy "org members" on trades
  for all using (org_id = auth_org_id()) with check (org_id = auth_org_id());

-- attendance: 소속 현장이 같은 org일 때
create policy "org attendance" on attendance
  for all using (exists (
    select 1 from sites s where s.id = attendance.site_id and s.org_id = auth_org_id()
  )) with check (exists (
    select 1 from sites s where s.id = attendance.site_id and s.org_id = auth_org_id()
  ));

-- journals 동일 패턴
create policy "org journals" on journals
  for all using (exists (
    select 1 from sites s where s.id = journals.site_id and s.org_id = auth_org_id()
  )) with check (exists (
    select 1 from sites s where s.id = journals.site_id and s.org_id = auth_org_id()
  ));
```

> profiles 는 본인 행 select/update + 같은 org 멤버 select 정도로 정책 구성.

---

## 인증 (Supabase Auth)

- **이메일/비밀번호**: 자체 회원가입 — 가입 시 트리거로 `profiles` 행 생성(+ 신규 org 생성 또는 초대 코드로 기존 org 합류).
- **카카오 OAuth**: Supabase Auth → Providers에서 **Kakao** 활성화.
  - 카카오 개발자 콘솔에서 앱 생성 → REST API 키 / Client Secret 발급 → Redirect URI 등록(`https://<project>.supabase.co/auth/v1/callback`).
  - 클라이언트: `supabase.auth.signInWithOAuth({ provider: 'kakao' })`.
- 신규 유저 → `profiles` 자동 생성 트리거:

```sql
create or replace function handle_new_user() returns trigger
language plpgsql security definer as $$
begin
  insert into profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', '신규 사용자'));
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

---

## Storage
- 버킷 `journal-photos` (현장 일지 사진). 경로 예: `{org_id}/{site_id}/{work_date}/{uuid}.jpg`.
- RLS: 같은 org 멤버만 read/write.

## 권장 npm 패키지
- `@supabase/supabase-js`, `@supabase/ssr` (App Router용)
- `lucide-react` (아이콘), `pretendard` (폰트)
- 스타일: `tailwindcss` — 위 디자인 토큰을 `tailwind.config` theme.extend로 옮기기
- 날짜: `date-fns` (프로토타입의 자체 date 헬퍼 대체)
- 차트가 복잡해지면 `recharts` (현재는 div 막대로 충분)
