/* ============================================================
   app.jsx — shell, routing, responsive nav, tweaks
   ============================================================ */

const NAV_SIDEBAR = [
  { name: 'dashboard', label: '대시보드', icon: 'dashboard' },
  { name: 'sites', label: '현장', icon: 'site' },
  { name: 'calendar', label: '통합 달력', icon: 'calendar' },
  { name: 'stats', label: '월별 통계', icon: 'stats' },
  { name: 'payroll', label: '노무비', icon: 'bolt' },
  { name: 'trades', label: '공종 · 업체', icon: 'trades' },
];
const NAV_MOBILE = [
  { name: 'dashboard', label: '홈', icon: 'dashboard' },
  { name: 'sites', label: '현장', icon: 'site' },
  { name: 'calendar', label: '달력', icon: 'calendar' },
  { name: 'stats', label: '통계', icon: 'stats' },
  { name: 'more', label: '더보기', icon: 'menu' },
];
const MORE_ROUTES = ['more', 'payroll', 'trades', 'vendor', 'settings'];
function navActive(route, name) {
  if (name === 'sites') return route.name === 'sites' || route.name === 'site';
  if (name === 'more') return MORE_ROUTES.includes(route.name);
  if (name === 'trades') return route.name === 'trades' || route.name === 'vendor';
  return route.name === name;
}

const ACCENTS = {
  blue:   { 700: '#1D4ED8', 600: '#2563EB', 500: '#3B82F6', 300: '#93C5FD', 100: '#DBEAFE', 50: '#EFF6FF', sh: '37,99,235' },
  sky:    { 700: '#0369A1', 600: '#0EA5E9', 500: '#38BDF8', 300: '#7DD3FC', 100: '#BAE6FD', 50: '#F0F9FF', sh: '14,165,233' },
  indigo: { 700: '#4338CA', 600: '#4F46E5', 500: '#6366F1', 300: '#A5B4FC', 100: '#E0E7FF', 50: '#EEF2FF', sh: '79,70,229' },
};

/* ---------- Sidebar (desktop) ---------- */
function Sidebar({ route, go }) {
  return (
    <aside style={{ width: 244, flex: 'none', background: '#fff', borderRight: '1px solid var(--slate-200)', display: 'flex', flexDirection: 'column', padding: '22px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '4px 8px 22px' }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--blue-600)', boxShadow: 'var(--sh-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="site" size={22} stroke="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-.02em' }}>현장출근기록</div>
          <div style={{ fontSize: 11.5, color: 'var(--slate-400)', fontWeight: 600 }}>출근 관리</div>
        </div>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {NAV_SIDEBAR.map(n => {
          const active = navActive(route, n.name);
          return (
            <button key={n.name} onClick={() => go(n.name)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 13px', borderRadius: 'var(--r-sm)', border: 0, cursor: 'pointer',
                background: active ? 'var(--blue-50)' : 'transparent', color: active ? 'var(--blue-700)' : 'var(--slate-600)', fontSize: 15, fontWeight: 700, textAlign: 'left', transition: 'background .15s' }}>
              <Icon name={n.icon} size={21} sw={active ? 2.3 : 2} /> {n.label}
            </button>
          );
        })}
      </nav>
      <div onClick={() => go('settings')} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px', borderRadius: 'var(--r-sm)', background: route.name === 'settings' ? 'var(--blue-50)' : 'var(--slate-50)', cursor: 'pointer' }}>
        <Avatar name={USER.avatar} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{USER.name}</div>
          <div style={{ fontSize: 11.5, color: 'var(--slate-400)' }}>{USER.role}</div>
        </div>
        <button title="로그아웃" onClick={e => { e.stopPropagation(); go('logout'); }} style={{ border: 0, background: 'none', color: 'var(--slate-400)', cursor: 'pointer', display: 'flex' }}><Icon name="logout" size={18} /></button>
      </div>
    </aside>
  );
}

/* ---------- Top bar (mobile) ---------- */
function TopBar({ route }) {
  const titles = { dashboard: '대시보드', sites: '현장 관리', site: '현장 상세', calendar: '통합 달력', stats: '월별 통계', payroll: '노무비 계산', trades: '공종 · 업체', vendor: '업체 상세', settings: '내 정보 · 설정', more: '더보기' };
  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: '#fff', borderBottom: '1px solid var(--slate-200)', flex: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--blue-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="site" size={17} stroke="#fff" /></div>
        <span style={{ fontSize: 16.5, fontWeight: 800, letterSpacing: '-.02em' }}>{titles[route.name] || '현장출근기록'}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button style={{ border: 0, background: 'none', color: 'var(--slate-500)', position: 'relative', display: 'flex', padding: 6, cursor: 'pointer' }}>
          <Icon name="bell" size={21} />
          <span style={{ position: 'absolute', top: 5, right: 6, width: 7, height: 7, borderRadius: 99, background: 'var(--red-500)', border: '1.5px solid #fff' }} />
        </button>
        <Avatar name={USER.avatar} size={32} />
      </div>
    </header>
  );
}

/* ---------- Bottom nav (mobile) ---------- */
function BottomNav({ route, go }) {
  return (
    <nav style={{ display: 'flex', background: '#fff', borderTop: '1px solid var(--slate-200)', flex: 'none', paddingBottom: 'env(safe-area-inset-bottom, 0)', zIndex: 50 }}>
      {NAV_MOBILE.map(n => {
        const active = navActive(route, n.name);
        return (
          <button key={n.name} onClick={() => go(n.name)}
            style={{ flex: 1, border: 0, background: 'none', padding: '9px 0 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', color: active ? 'var(--blue-600)' : 'var(--slate-400)' }}>
            <Icon name={n.icon} size={23} sw={active ? 2.4 : 2} />
            <span style={{ fontSize: 11, fontWeight: active ? 800 : 600 }}>{n.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/* ---------- More menu (mobile) ---------- */
function MoreMenu({ go }) {
  const items = [
    { name: 'payroll', label: '노무비 계산', desc: '공종별 일당 × 인원', icon: 'bolt' },
    { name: 'trades', label: '공종 · 업체 관리', desc: '카테고리 · 협력사 연락처', icon: 'trades' },
    { name: 'settings', label: '내 정보 · 설정', desc: '프로필 · 계정 · 알림', icon: 'user' },
  ];
  return (
    <div style={{ padding: '20px 18px 30px' }}>
      <h1 style={{ margin: '0 0 18px', fontSize: 23, fontWeight: 800, letterSpacing: '-.02em' }}>더보기</h1>
      <Card style={{ overflow: 'hidden' }}>
        {items.map((it, i) => (
          <button key={it.name} onClick={() => go(it.name)} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '16px 18px', borderTop: i ? '1px solid var(--slate-100)' : 0, border: i ? '' : 0, borderLeft: 0, borderRight: 0, borderBottom: 0, background: '#fff', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', color: 'var(--blue-600)' }}><Icon name={it.icon} size={20} /></span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15.5, fontWeight: 700 }}>{it.label}</div>
              <div style={{ fontSize: 12.5, color: 'var(--slate-400)' }}>{it.desc}</div>
            </div>
            <Icon name="chevR" size={18} stroke="var(--slate-300)" />
          </button>
        ))}
      </Card>
      <button onClick={() => go('logout')} style={{ width: '100%', marginTop: 14, border: '1px solid var(--slate-200)', background: '#fff', borderRadius: 'var(--r-lg)', padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', color: 'var(--red-500)', fontSize: 15, fontWeight: 700 }}>
        <Icon name="logout" size={18} /> 로그아웃
      </button>
    </div>
  );
}

/* ---------- Toast ---------- */
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ position: 'absolute', bottom: 84, left: '50%', transform: 'translateX(-50%)', zIndex: 80,
      background: 'var(--ink)', color: '#fff', padding: '11px 18px', borderRadius: 'var(--r-full)', fontSize: 14, fontWeight: 600,
      boxShadow: 'var(--sh-lg)', display: 'flex', alignItems: 'center', gap: 8, animation: 'slideUp .25s ease', whiteSpace: 'nowrap' }}>
      <Icon name="check" size={16} stroke="var(--green-500)" sw={3} /> {msg}
    </div>
  );
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "inputVariant": "stepper",
  "accent": "blue",
  "greeting": "안녕하세요, 김현장님 👷"
}/*EDITMODE-END*/;

function parseHash() {
  const h = (typeof location !== 'undefined' ? location.hash.replace('#', '') : '').trim();
  if (!h || h === 'login') return { authed: false, route: { name: 'dashboard' } };
  if (h === 'site') return { authed: true, route: { name: 'site', siteId: 's1', initialTab: 'input' } };
  if (['dashboard', 'sites', 'trades', 'stats', 'calendar', 'payroll', 'settings'].includes(h)) return { authed: true, route: { name: h } };
  return { authed: false, route: { name: 'dashboard' } };
}

/* ---------- App ---------- */
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const init = parseHash();
  const [authed, setAuthed] = useState(init.authed);
  const [route, setRoute] = useState(init.route);
  const [sites, setSites] = useState(SEED_SITES);
  const [trades, setTrades] = useState(SEED_TRADES);
  const [records, setRecords] = useState(() => buildAttendance());
  const [journal, setJournal] = useState(JOURNAL_SEED);
  const [editTradeId, setEditTradeId] = useState(null);
  const [toast, setToast] = useState('');
  const [wide, setWide] = useState(typeof window !== 'undefined' && window.innerWidth >= 880);

  useEffect(() => {
    const onResize = () => setWide(window.innerWidth >= 880);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const scrollRef = useRef(null);
  function go(name, params = {}) {
    if (name === 'logout') { setAuthed(false); setRoute({ name: 'dashboard' }); return; }
    setRoute({ name, ...params });
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }
  function flash(m) { setToast(m); clearTimeout(window.__tt); window.__tt = setTimeout(() => setToast(''), 1800); }

  const acc = ACCENTS[t.accent] || ACCENTS.blue;
  const accentVars = {
    '--blue-700': acc[700], '--blue-600': acc[600], '--blue-500': acc[500],
    '--blue-300': acc[300], '--blue-100': acc[100], '--blue-50': acc[50],
    '--sh-blue': `0 8px 24px rgba(${acc.sh},.28)`,
  };

  const currentSite = route.name === 'site' ? sites.find(s => s.id === route.siteId) : null;
  const currentTrade = route.name === 'vendor' ? trades.find(t => t.id === route.tradeId) : null;

  if (!authed) {
    return (
      <div style={{ height: '100vh', overflow: 'auto', ...accentVars }}>
        <LoginScreen onLogin={() => setAuthed(true)} />
        <TweaksUI t={t} setTweak={setTweak} />
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: '100vh', display: 'flex', overflow: 'hidden', background: 'var(--slate-50)', ...accentVars }}>
      {wide && <Sidebar route={route} go={go} />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {!wide && <TopBar route={route} />}
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', paddingBottom: wide ? 0 : 4 }}>
          {route.name === 'dashboard' && <DashboardScreen sites={sites} trades={trades} records={records} wide={wide} onOpenSite={id => go('site', { siteId: id })} greeting={t.greeting} />}
          {route.name === 'sites' && <SiteListScreen sites={sites} setSites={s => { setSites(s); }} records={records} wide={wide} onOpenSite={id => go('site', { siteId: id })} />}
          {route.name === 'site' && currentSite && <SiteDetailScreen site={currentSite} trades={trades} records={records} setRecords={setRecords} journal={journal} setJournal={setJournal} wide={wide} variant={t.inputVariant} onBack={() => go('sites')} initialTab={route.initialTab} />}
          {route.name === 'calendar' && <UnifiedCalendarScreen sites={sites} trades={trades} records={records} wide={wide} onOpenSite={id => go('site', { siteId: id })} />}
          {route.name === 'stats' && <StatsScreen sites={sites} trades={trades} records={records} wide={wide} />}
          {route.name === 'payroll' && <PayrollScreen sites={sites} trades={trades} records={records} wide={wide} />}
          {route.name === 'trades' && <TradeManageScreen trades={trades} setTrades={setTrades} records={records} wide={wide} onOpenVendor={id => go('vendor', { tradeId: id })} editTradeId={editTradeId} clearEditTrade={() => setEditTradeId(null)} />}
          {route.name === 'vendor' && currentTrade && <VendorDetailScreen trade={currentTrade} sites={sites} records={records} wide={wide} onBack={() => go('trades')} onEdit={() => { setEditTradeId(currentTrade.id); go('trades'); }} />}
          {route.name === 'settings' && <SettingsScreen sites={sites} records={records} wide={wide} onLogout={() => go('logout')} />}
          {route.name === 'more' && <MoreMenu go={go} />}
        </div>
        {!wide && <BottomNav route={route} go={go} />}
      </div>
      <Toast msg={toast} />
      <TweaksUI t={t} setTweak={setTweak} />
    </div>
  );
}

/* ---------- Tweaks UI ---------- */
function TweaksUI({ t, setTweak }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="출근 입력 방식" />
      <TweakRadio label="입력 UI" value={t.inputVariant}
        options={[{ value: 'stepper', label: '스테퍼' }, { value: 'pad', label: '숫자패드' }, { value: 'inline', label: '리스트' }]}
        onChange={v => setTweak('inputVariant', v)} />
      <div style={{ fontSize: 11.5, color: '#94A3B8', padding: '2px 2px 6px', lineHeight: 1.5 }}>
        현장 상세 → ‘입력’ 탭에서 방식을 비교해 보세요. A 스테퍼 카드 · B 숫자패드 · C 리스트 인라인.
      </div>
      <TweakSection label="브랜드 색상" />
      <TweakColor label="강조색" value={t.accent === 'blue' ? '#2563EB' : t.accent === 'sky' ? '#0EA5E9' : '#4F46E5'}
        options={['#2563EB', '#0EA5E9', '#4F46E5']}
        onChange={hex => setTweak('accent', hex === '#0EA5E9' ? 'sky' : hex === '#4F46E5' ? 'indigo' : 'blue')} />
      <TweakSection label="문구" />
      <TweakText label="대시보드 인사말" value={t.greeting} onChange={v => setTweak('greeting', v)} />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
