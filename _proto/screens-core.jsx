/* ============================================================
   screens-core.jsx — Login, Dashboard, SiteList
   ============================================================ */

/* ===================== LOGIN ===================== */
function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState('login'); // login | signup
  const [email, setEmail] = useState('kim@hyunjang.co.kr');
  const [pw, setPw] = useState('••••••••');
  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center',
      padding: '32px 26px', background: 'linear-gradient(170deg, #EFF6FF 0%, #fff 42%)' }}>
      <div style={{ width: '100%', maxWidth: 380, margin: '0 auto' }}>
        {/* brand */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 30 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--blue-600)', boxShadow: 'var(--sh-blue)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Icon name="site" size={34} stroke="#fff" />
          </div>
          <div style={{ fontSize: 25, fontWeight: 800, letterSpacing: '-.02em' }}>현장출근기록</div>
          <div style={{ fontSize: 14.5, color: 'var(--slate-500)', marginTop: 5 }}>인테리어 현장 출근 관리</div>
        </div>

        <Card style={{ padding: 24 }}>
          <div style={{ marginBottom: 18 }}>
            <Segmented full value={mode} onChange={setMode}
              options={[{ value: 'login', label: '로그인' }, { value: 'signup', label: '회원가입' }]} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'signup' && <Field label="이름"><TextInput icon="user" value="" placeholder="현장 관리기사 이름" onChange={() => {}} /></Field>}
            <Field label="이메일"><TextInput icon="user" value={email} onChange={setEmail} placeholder="이메일 주소" /></Field>
            <Field label="비밀번호"><TextInput icon="bolt" type="password" value={pw} onChange={setPw} placeholder="비밀번호" /></Field>
            {mode === 'login' && (
              <div style={{ textAlign: 'right', marginTop: -4 }}>
                <a style={{ fontSize: 13, color: 'var(--slate-500)', textDecoration: 'none', fontWeight: 600 }}>비밀번호 찾기</a>
              </div>
            )}
            <Button size="lg" full onClick={onLogin}>{mode === 'login' ? '로그인' : '가입하고 시작하기'}</Button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--slate-200)' }} />
            <span style={{ fontSize: 12.5, color: 'var(--slate-400)', fontWeight: 600 }}>또는</span>
            <div style={{ flex: 1, height: 1, background: 'var(--slate-200)' }} />
          </div>

          <button onClick={onLogin} style={{ width: '100%', border: 0, borderRadius: 'var(--r-sm)', padding: '14px',
            background: '#FEE500', color: '#191600', fontWeight: 800, fontSize: 15.5, display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 9, fontFamily: 'var(--font)' }}>
            <KakaoIcon size={20} /> 카카오로 {mode === 'login' ? '로그인' : '간편가입'}
          </button>
        </Card>

        <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--slate-400)', marginTop: 22, lineHeight: 1.6 }}>
          로그인 시 서비스 이용약관과 개인정보처리방침에<br />동의하게 됩니다.
        </p>
      </div>
    </div>
  );
}

/* ===================== DASHBOARD ===================== */
function MiniBar({ data, max, color = 'var(--blue-600)' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7, height: 96 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
          <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', height: 72 }}>
            <div style={{ width: '100%', height: `${max ? (d.v / max) * 100 : 0}%`, minHeight: d.v ? 6 : 0,
              background: d.today ? color : 'var(--blue-100)', borderRadius: 6, transition: 'height .5s cubic-bezier(.16,1,.3,1)' }} />
          </div>
          <span style={{ fontSize: 11.5, fontWeight: d.today ? 800 : 600, color: d.today ? 'var(--blue-700)' : 'var(--slate-400)' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function DashboardScreen({ sites, trades, records, onOpenSite, wide, greeting }) {
  const todayStr = ymd(TODAY);
  const activeSites = sites.filter(s => s.status !== '완료');
  const todayTotal = allSitesDayTotal(records, todayStr);

  // recent 7 days (ending today)
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(TODAY, i - 6);
    return { label: WEEKDAYS[d.getDay()], v: allSitesDayTotal(records, ymd(d)), today: ymd(d) === todayStr };
  });
  const wkMax = Math.max(...week.map(d => d.v), 1);
  const weekTotal = week.reduce((s, d) => s + d.v, 0);

  const tradeMap = Object.fromEntries(trades.map(t => [t.id, t]));

  return (
    <div style={{ padding: wide ? '30px 34px 40px' : '20px 18px 30px' }}>
      {/* greeting */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 14, color: 'var(--slate-500)', fontWeight: 600 }}>{fmtKDate(TODAY)} · 오늘</div>
          <h1 style={{ margin: '4px 0 0', fontSize: wide ? 27 : 23, fontWeight: 800, letterSpacing: '-.02em' }}>{greeting || `안녕하세요, ${USER.name}님 👷`}</h1>
        </div>
      </div>

      {/* hero summary */}
      <div style={{ display: 'grid', gridTemplateColumns: wide ? '1.1fr 1fr' : '1fr', gap: 16, marginBottom: 16 }}>
        <Card style={{ padding: 24, background: 'linear-gradient(135deg, var(--blue-600), var(--blue-700))', border: 0, color: '#fff', boxShadow: 'var(--sh-blue)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 14, opacity: .85, fontWeight: 600 }}>오늘 전체 출근</div>
              <div className="tnum" style={{ fontSize: 46, fontWeight: 800, lineHeight: 1.05, marginTop: 4 }}>{todayTotal}<span style={{ fontSize: 19, fontWeight: 700, opacity: .85, marginLeft: 6 }}>명</span></div>
            </div>
            <div style={{ background: 'rgba(255,255,255,.16)', borderRadius: 12, padding: '9px 12px', textAlign: 'center' }}>
              <div className="tnum" style={{ fontSize: 22, fontWeight: 800 }}>{activeSites.length}</div>
              <div style={{ fontSize: 11.5, opacity: .85, fontWeight: 600 }}>진행현장</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 18, marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.18)' }}>
            <div><span className="tnum" style={{ fontSize: 19, fontWeight: 800 }}>{weekTotal}</span><span style={{ fontSize: 13, opacity: .85, marginLeft: 5 }}>최근 7일 man·day</span></div>
            <div><span className="tnum" style={{ fontSize: 19, fontWeight: 800 }}>{trades.length}</span><span style={{ fontSize: 13, opacity: .85, marginLeft: 5 }}>공종</span></div>
          </div>
        </Card>

        <Card style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>최근 7일 출근 추이</div>
            <Badge tone="blue">{weekTotal} man·day</Badge>
          </div>
          <MiniBar data={week} max={wkMax} />
        </Card>
      </div>

      {/* per-site today */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '26px 4px 14px' }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>현장별 오늘 출근</h2>
        <span style={{ fontSize: 13, color: 'var(--slate-400)', fontWeight: 600 }}>{activeSites.length}개 현장</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: wide ? 'repeat(2,1fr)' : '1fr', gap: 12 }}>
        {activeSites.map(site => {
          const entries = dayEntries(records, site.id, todayStr);
          const total = dayTotal(records, site.id, todayStr);
          const tlist = Object.entries(entries);
          return (
            <Card key={site.id} hover onClick={() => onOpenSite(site.id)} style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{site.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--slate-400)', marginTop: 3 }}>
                    <Icon name="location" size={13} /> {site.addr}
                  </div>
                </div>
                {total > 0
                  ? <div style={{ textAlign: 'right', flex: 'none' }}><span className="tnum" style={{ fontSize: 24, fontWeight: 800, color: 'var(--blue-600)' }}>{total}</span><span style={{ fontSize: 13, color: 'var(--slate-400)', fontWeight: 700 }}>명</span></div>
                  : <Badge tone="amber" dot>미입력</Badge>}
              </div>
              {tlist.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 13 }}>
                  {tlist.map(([tid, e]) => {
                    const t = tradeMap[tid]; if (!t) return null;
                    return (
                      <span key={tid} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600,
                        background: 'var(--slate-50)', border: '1px solid var(--slate-200)', borderRadius: 'var(--r-full)', padding: '4px 10px' }}>
                        <TradeDot color={t.color} size={9} />{t.name} <b className="tnum" style={{ color: 'var(--ink)' }}>{e.count}</b>
                      </span>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ===================== SITE LIST ===================== */
function SiteListScreen({ sites, setSites, records, onOpenSite, wide }) {
  const [q, setQ] = useState('');
  const [sheet, setSheet] = useState(null); // null | 'new' | site object (edit)
  const [draft, setDraft] = useState({ name: '', addr: '', manager: '' });

  const filtered = sites.filter(s => s.name.includes(q) || s.addr.includes(q));
  const statusTone = { '진행중': 'blue', '마감임박': 'amber', '완료': 'slate' };

  function openNew() { setDraft({ name: '', addr: '', manager: USER.name }); setSheet('new'); }
  function openEdit(s) { setDraft({ name: s.name, addr: s.addr, manager: s.manager }); setSheet(s); }
  function save() {
    if (!draft.name.trim()) return;
    if (sheet === 'new') {
      setSites([{ id: 's' + Date.now(), status: '진행중', start: ymd(TODAY), ...draft }, ...sites]);
    } else {
      setSites(sites.map(s => s.id === sheet.id ? { ...s, ...draft } : s));
    }
    setSheet(null);
  }
  function remove(s) { setSites(sites.filter(x => x.id !== s.id)); setSheet(null); }

  return (
    <div style={{ padding: wide ? '30px 34px 40px' : '20px 18px 30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: wide ? 26 : 23, fontWeight: 800, letterSpacing: '-.02em' }}>현장 관리</h1>
          <div style={{ fontSize: 14, color: 'var(--slate-500)', marginTop: 3 }}>전체 {sites.length}개 현장</div>
        </div>
        {wide && <Button icon="plus" onClick={openNew}>현장 추가</Button>}
      </div>

      <div style={{ marginBottom: 16 }}>
        <TextInput icon="search" value={q} onChange={setQ} placeholder="현장 이름 · 주소 검색" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: wide ? 'repeat(2,1fr)' : '1fr', gap: 12 }}>
        {filtered.map(site => {
          const total = dayTotal(records, site.id, ymd(TODAY));
          return (
            <Card key={site.id} hover style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div onClick={() => onOpenSite(site.id)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-.01em' }}>{site.name}</div>
                  <Badge tone={statusTone[site.status]} dot>{site.status}</Badge>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--slate-500)', marginTop: 6 }}>
                  <Icon name="location" size={14} />{site.addr}
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 13, color: 'var(--slate-500)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="user" size={14} />{site.manager}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="users" size={14} />오늘 <b className="tnum" style={{ color: 'var(--blue-600)' }}>{total}</b>명</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid var(--slate-100)' }}>
                <Button size="sm" variant="secondary" icon="calendar" onClick={() => onOpenSite(site.id)} style={{ flex: 1 }}>출근 기록</Button>
                <Button size="sm" variant="outline" icon="edit" onClick={() => openEdit(site)}>수정</Button>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '50px 20px', color: 'var(--slate-400)' }}>
            <Icon name="search" size={34} /><div style={{ marginTop: 10, fontWeight: 600 }}>검색 결과가 없습니다</div>
          </div>
        )}
      </div>

      {/* mobile FAB */}
      {!wide && (
        <button onClick={openNew} style={{ position: 'absolute', right: 18, bottom: 92, width: 58, height: 58, borderRadius: 20,
          background: 'var(--blue-600)', color: '#fff', border: 0, boxShadow: 'var(--sh-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40 }}>
          <Icon name="plus" size={28} />
        </button>
      )}

      <Sheet open={!!sheet} onClose={() => setSheet(null)} title={sheet === 'new' ? '새 현장 추가' : '현장 수정'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="현장 이름"><TextInput value={draft.name} onChange={v => setDraft({ ...draft, name: v })} placeholder="예: 강남 OO병원 리모델링" /></Field>
          <Field label="주소"><TextInput icon="location" value={draft.addr} onChange={v => setDraft({ ...draft, addr: v })} placeholder="현장 주소" /></Field>
          <Field label="담당 관리기사"><TextInput icon="user" value={draft.manager} onChange={v => setDraft({ ...draft, manager: v })} placeholder="담당자 이름" /></Field>
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            {sheet !== 'new' && <Button variant="danger" icon="trash" onClick={() => remove(sheet)}>삭제</Button>}
            <Button full onClick={save}>{sheet === 'new' ? '추가하기' : '저장'}</Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

Object.assign(window, { LoginScreen, DashboardScreen, SiteListScreen, MiniBar });
