/* ============================================================
   screens-manage.jsx — TradeManage, Stats
   ============================================================ */

const TRADE_PALETTE = ['#2563EB', '#0EA5E9', '#06B6D4', '#14B8A6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#6366F1', '#64748B', '#0F172A'];

/* ===================== TRADE (공종) MANAGE ===================== */
function TradeManageScreen({ trades, setTrades, records, wide, onOpenVendor, editTradeId, clearEditTrade }) {
  const [sheet, setSheet] = useState(null); // null | 'new' | trade
  const [draft, setDraft] = useState({ name: '', color: TRADE_PALETTE[0], company: '', contact: '', phone: '', rate: 220000 });

  // usage count across all records
  const usage = {};
  Object.values(records).forEach(day => Object.entries(day).forEach(([tid, e]) => { usage[tid] = (usage[tid] || 0) + e.count; }));

  function openNew() { setDraft({ name: '', color: TRADE_PALETTE[trades.length % TRADE_PALETTE.length], company: '', contact: '', phone: '', rate: 220000 }); setSheet('new'); }
  function openEdit(t) { setDraft({ name: t.name, color: t.color, company: t.company || '', contact: t.contact || '', phone: t.phone || '', rate: t.rate || 220000 }); setSheet(t); }

  // open edit sheet when navigated with editTradeId (from vendor detail)
  useEffect(() => {
    if (editTradeId) {
      const t = trades.find(x => x.id === editTradeId);
      if (t) openEdit(t);
      clearEditTrade && clearEditTrade();
    }
  }, [editTradeId]);

  function save() {
    if (!draft.name.trim()) return;
    if (sheet === 'new') setTrades([...trades, { id: 't' + Date.now(), ...draft }]);
    else setTrades(trades.map(t => t.id === sheet.id ? { ...t, ...draft } : t));
    setSheet(null);
  }
  function remove(t) { setTrades(trades.filter(x => x.id !== t.id)); setSheet(null); }

  return (
    <div style={{ padding: wide ? '30px 34px 40px' : '20px 18px 30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: wide ? 26 : 23, fontWeight: 800, letterSpacing: '-.02em' }}>공종 · 업체 관리</h1>
          <div style={{ fontSize: 14, color: 'var(--slate-500)', marginTop: 3 }}>출근 입력에 쓰이는 공종(협력업체) {trades.length}개 · 탭하면 업체 상세</div>
        </div>
        {wide && <Button icon="plus" onClick={openNew}>공종 추가</Button>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: wide ? 'repeat(3,1fr)' : '1fr', gap: 12 }}>
        {trades.map(t => (
          <Card key={t.id} hover onClick={() => onOpenVendor && onOpenVendor(t.id)} style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 13 }}>
            <span style={{ width: 44, height: 44, borderRadius: 13, background: t.color + '1A', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
              <TradeDot color={t.color} size={17} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16.5, fontWeight: 800 }}>{t.name}</span>
                <span style={{ fontSize: 12.5, color: 'var(--slate-400)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.company}</span>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--slate-400)', fontWeight: 600, marginTop: 2 }}>일당 <b className="tnum" style={{ color: 'var(--slate-600)' }}>{wonFmt(t.rate || 0)}</b>원 · 누적 <b className="tnum" style={{ color: 'var(--slate-600)' }}>{usage[t.id] || 0}</b> man·day</div>
            </div>
            <button onClick={e => { e.stopPropagation(); openEdit(t); }} style={{ border: '1px solid var(--slate-200)', background: '#fff', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--slate-500)', flex: 'none' }}><Icon name="edit" size={16} /></button>
          </Card>
        ))}
      </div>

      {!wide && (
        <button onClick={openNew} style={{ position: 'absolute', right: 18, bottom: 92, width: 58, height: 58, borderRadius: 20, background: 'var(--blue-600)', color: '#fff', border: 0, boxShadow: 'var(--sh-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40 }}>
          <Icon name="plus" size={28} />
        </button>
      )}

      <Sheet open={!!sheet} onClose={() => setSheet(null)} title={sheet === 'new' ? '새 공종 추가' : '공종 수정'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="공종 이름"><TextInput value={draft.name} onChange={v => setDraft({ ...draft, name: v })} placeholder="예: 경량, 설비, 에어컨..." /></Field>
          <Field label="업체명"><TextInput value={draft.company} onChange={v => setDraft({ ...draft, company: v })} placeholder="협력업체 상호" /></Field>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><Field label="담당자"><TextInput icon="user" value={draft.contact} onChange={v => setDraft({ ...draft, contact: v })} placeholder="이름" /></Field></div>
            <div style={{ flex: 1 }}><Field label="연락처"><TextInput value={draft.phone} onChange={v => setDraft({ ...draft, phone: v })} placeholder="010-0000-0000" /></Field></div>
          </div>
          <Field label="일당 (원)" hint="노무비 계산에 사용됩니다">
            <TextInput type="number" value={draft.rate} onChange={v => setDraft({ ...draft, rate: Number(v) || 0 })} placeholder="220000" />
          </Field>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--slate-600)', marginBottom: 10 }}>컬러</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {TRADE_PALETTE.map(c => (
                <button key={c} onClick={() => setDraft({ ...draft, color: c })}
                  style={{ width: 38, height: 38, borderRadius: 11, background: c, border: draft.color === c ? '3px solid var(--ink)' : '3px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {draft.color === c && <Icon name="check" size={18} stroke="#fff" sw={3} />}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            {sheet !== 'new' && <Button variant="danger" icon="trash" onClick={() => remove(sheet)}>삭제</Button>}
            <Button full onClick={save}>{sheet === 'new' ? '추가하기' : '저장'}</Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

/* ===================== STATS (월별 통계) ===================== */
function StatsScreen({ sites, trades, records, wide }) {
  const [month, setMonth] = useState(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
  const [siteFilter, setSiteFilter] = useState('all');

  const y = month.getFullYear(), m = month.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const monthDates = Array.from({ length: daysInMonth }, (_, i) => ymd(new Date(y, m, i + 1)));
  const siteList = siteFilter === 'all' ? sites : sites.filter(s => s.id === siteFilter);

  // aggregate
  const tradeTotals = {}; const siteTotals = {}; let grand = 0; let workdays = 0;
  const dailyTotals = monthDates.map(ds => {
    let dTot = 0;
    siteList.forEach(site => {
      const e = dayEntries(records, site.id, ds);
      Object.entries(e).forEach(([tid, en]) => {
        tradeTotals[tid] = (tradeTotals[tid] || 0) + en.count;
        siteTotals[site.id] = (siteTotals[site.id] || 0) + en.count;
        grand += en.count; dTot += en.count;
      });
    });
    if (dTot > 0) workdays++;
    return dTot;
  });
  const maxDaily = Math.max(...dailyTotals, 1);
  const tradeRanked = trades.map(t => ({ ...t, total: tradeTotals[t.id] || 0 })).sort((a, b) => b.total - a.total);
  const maxTrade = Math.max(...tradeRanked.map(t => t.total), 1);
  const siteRanked = sites.map(s => ({ ...s, total: siteTotals[s.id] || 0 })).filter(s => s.total > 0).sort((a, b) => b.total - a.total);
  const maxSite = Math.max(...siteRanked.map(s => s.total), 1);

  return (
    <div style={{ padding: wide ? '30px 34px 40px' : '20px 18px 30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: wide ? 26 : 23, fontWeight: 800, letterSpacing: '-.02em' }}>월별 통계</h1>
          <div style={{ fontSize: 14, color: 'var(--slate-500)', marginTop: 3 }}>인원 집계 · man-day 분석</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setMonth(new Date(y, m - 1, 1))} style={navBtn}><Icon name="chevL" size={18} /></button>
          <div style={{ fontSize: 16, fontWeight: 800, minWidth: 96, textAlign: 'center' }}>{y}년 {m + 1}월</div>
          <button onClick={() => setMonth(new Date(y, m + 1, 1))} style={navBtn}><Icon name="chevR" size={18} /></button>
        </div>
      </div>

      {/* site filter */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 16, scrollbarWidth: 'none' }}>
        <Chip active={siteFilter === 'all'} onClick={() => setSiteFilter('all')}>전체 현장</Chip>
        {sites.map(s => <Chip key={s.id} active={siteFilter === s.id} onClick={() => setSiteFilter(s.id)}>{s.name}</Chip>)}
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: wide ? 'repeat(4,1fr)' : 'repeat(2,1fr)', gap: 12, marginBottom: 20 }}>
        <KPI label="총 man-day" value={grand} accent />
        <KPI label="작업일수" value={workdays} unit="일" />
        <KPI label="일 평균" value={workdays ? (grand / workdays).toFixed(1) : 0} unit="명" />
        <KPI label="활성 공종" value={tradeRanked.filter(t => t.total > 0).length} unit="개" />
      </div>

      {/* daily trend */}
      <Card style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 15.5, fontWeight: 800, marginBottom: 16 }}>일별 출근 추이</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120 }}>
          {dailyTotals.map((v, i) => {
            const dow = new Date(y, m, i + 1).getDay();
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                <div title={`${i + 1}일: ${v}명`} style={{ width: '100%', maxWidth: 16, height: `${(v / maxDaily) * 100}%`, minHeight: v ? 4 : 0,
                  background: dow === 0 ? 'var(--slate-200)' : 'var(--blue-500)', borderRadius: 3, transition: 'height .5s' }} />
                {wide && (i % 2 === 0) && <span className="tnum" style={{ fontSize: 9.5, color: 'var(--slate-400)' }}>{i + 1}</span>}
              </div>
            );
          })}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: wide ? '1fr 1fr' : '1fr', gap: 16 }}>
        {/* by trade */}
        <Card style={{ padding: 20 }}>
          <div style={{ fontSize: 15.5, fontWeight: 800, marginBottom: 16 }}>공종별 집계</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {tradeRanked.map(t => (
              <div key={t.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 700 }}><TradeDot color={t.color} size={10} />{t.name}</span>
                  <span className="tnum" style={{ fontSize: 14.5, fontWeight: 800 }}>{t.total}<span style={{ fontSize: 11.5, color: 'var(--slate-400)', fontWeight: 600 }}> man·day</span></span>
                </div>
                <div style={{ height: 8, background: 'var(--slate-100)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(t.total / maxTrade) * 100}%`, background: t.color, borderRadius: 99, transition: 'width .5s' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* by site */}
        <Card style={{ padding: 20 }}>
          <div style={{ fontSize: 15.5, fontWeight: 800, marginBottom: 16 }}>현장별 집계</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {siteRanked.length === 0 && <div style={{ color: 'var(--slate-400)', fontSize: 13.5, textAlign: 'center', padding: 20 }}>이 달 기록이 없습니다</div>}
            {siteRanked.map((s, i) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="tnum" style={{ fontSize: 14, fontWeight: 800, color: 'var(--slate-300)', width: 18 }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 6 }}>{s.name}</div>
                  <div style={{ height: 8, background: 'var(--slate-100)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(s.total / maxSite) * 100}%`, background: 'var(--blue-600)', borderRadius: 99, transition: 'width .5s' }} />
                  </div>
                </div>
                <span className="tnum" style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--blue-600)' }}>{s.total}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function KPI({ label, value, unit, accent }) {
  return (
    <div style={{ background: accent ? 'var(--blue-600)' : '#fff', border: accent ? '0' : '1px solid var(--slate-200)',
      borderRadius: 'var(--r)', padding: '16px 18px', boxShadow: accent ? 'var(--sh-blue)' : 'var(--sh-sm)' }}>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: accent ? 'rgba(255,255,255,.85)' : 'var(--slate-400)' }}>{label}</div>
      <div className="tnum" style={{ fontSize: 27, fontWeight: 800, marginTop: 4, color: accent ? '#fff' : 'var(--ink)' }}>
        {value}{unit && <span style={{ fontSize: 13, fontWeight: 600, marginLeft: 4, color: accent ? 'rgba(255,255,255,.8)' : 'var(--slate-400)' }}>{unit}</span>}
      </div>
    </div>
  );
}
function Chip({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{ flex: 'none', border: active ? '0' : '1px solid var(--slate-200)', background: active ? 'var(--blue-600)' : '#fff',
      color: active ? '#fff' : 'var(--slate-600)', borderRadius: 'var(--r-full)', padding: '8px 15px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
      {children}
    </button>
  );
}

Object.assign(window, { TradeManageScreen, StatsScreen, KPI, Chip, TRADE_PALETTE });
