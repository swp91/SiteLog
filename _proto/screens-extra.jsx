/* ============================================================
   screens-extra.jsx — UnifiedCalendar, Payroll, VendorDetail, Settings
   ============================================================ */

const SITE_COLORS = ['#2563EB', '#0EA5E9', '#8B5CF6', '#F59E0B', '#14B8A6', '#EC4899', '#6366F1', '#EF4444'];
const xNavBtn = { width: 36, height: 36, borderRadius: 10, border: '1px solid var(--slate-200)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate-600)' };

/* =========================================================
   UNIFIED CALENDAR (전체 현장 통합 달력)
   ========================================================= */
function UnifiedCalendarScreen({ sites, trades, records, wide, onOpenSite }) {
  const activeSites = sites.filter(s => s.status !== '완료');
  const colorOf = id => SITE_COLORS[sites.findIndex(s => s.id === id) % SITE_COLORS.length];
  const [hidden, setHidden] = useState({});
  const [month, setMonth] = useState(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
  const [sel, setSel] = useState(ymd(TODAY));

  const shown = activeSites.filter(s => !hidden[s.id]);
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d));

  function dayBySite(ds) {
    return shown.map(s => ({ site: s, total: dayTotal(records, s.id, ds) })).filter(x => x.total > 0);
  }
  const selBreak = dayBySite(sel);
  const selTotal = selBreak.reduce((a, x) => a + x.total, 0);

  return (
    <div style={{ padding: wide ? '30px 34px 40px' : '20px 18px 30px' }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: wide ? 26 : 23, fontWeight: 800, letterSpacing: '-.02em' }}>통합 달력</h1>
        <div style={{ fontSize: 14, color: 'var(--slate-500)', marginTop: 3 }}>여러 현장의 출근을 한 달력에서 한눈에</div>
      </div>

      {/* site legend / toggle */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {activeSites.map(s => {
          const off = hidden[s.id];
          return (
            <button key={s.id} onClick={() => setHidden(h => ({ ...h, [s.id]: !h[s.id] }))}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: '1px solid var(--slate-200)', background: off ? 'var(--slate-50)' : '#fff',
                borderRadius: 'var(--r-full)', padding: '7px 13px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: off ? .5 : 1 }}>
              <TradeDot color={colorOf(s.id)} size={10} />
              <span style={{ whiteSpace: 'nowrap' }}>{s.name}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: wide ? '1.5fr 1fr' : '1fr', gap: 18 }}>
        <Card style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} style={xNavBtn}><Icon name="chevL" size={18} /></button>
            <div style={{ fontSize: 17, fontWeight: 800 }}>{month.getFullYear()}년 {month.getMonth() + 1}월</div>
            <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} style={xNavBtn}><Icon name="chevR" size={18} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5 }}>
            {WEEKDAYS.map((w, i) => <div key={w} style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: i === 0 ? 'var(--red-500)' : i === 6 ? 'var(--blue-500)' : 'var(--slate-400)', paddingBottom: 4 }}>{w}</div>)}
            {cells.map((c, i) => {
              if (!c) return <div key={i} />;
              const ds = ymd(c);
              const bySite = dayBySite(ds);
              const tot = bySite.reduce((a, x) => a + x.total, 0);
              const isSel = ds === sel;
              const isToday = ds === ymd(TODAY);
              return (
                <button key={i} onClick={() => setSel(ds)}
                  style={{ minHeight: wide ? 72 : 58, border: isSel ? '2px solid var(--blue-600)' : '1px solid var(--slate-100)', borderRadius: 10,
                    background: isToday ? 'var(--blue-50)' : '#fff', cursor: 'pointer', padding: '6px 5px', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 3, position: 'relative' }}>
                  <span className="tnum" style={{ fontSize: 12.5, fontWeight: isToday ? 800 : 600, color: c.getDay() === 0 ? 'var(--red-500)' : 'var(--slate-600)', textAlign: 'left', paddingLeft: 2 }}>{c.getDate()}</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'flex-start' }}>
                    {bySite.slice(0, 6).map(x => <span key={x.site.id} style={{ width: 6, height: 6, borderRadius: 99, background: colorOf(x.site.id) }} />)}
                  </div>
                  {tot > 0 && <span className="tnum" style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--blue-600)', marginTop: 'auto', textAlign: 'right' }}>{tot}명</span>}
                </button>
              );
            })}
          </div>
        </Card>

        {/* selected day */}
        <Card style={{ padding: 18, alignSelf: 'start' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{fmtKDate(parseYmd(sel))}</div>
            <span className="tnum" style={{ fontSize: 22, fontWeight: 800, color: 'var(--blue-600)' }}>{selTotal}<span style={{ fontSize: 13, color: 'var(--slate-400)' }}> 명</span></span>
          </div>
          {selBreak.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 10px', color: 'var(--slate-400)' }}>
              <Icon name="calendar" size={30} /><div style={{ marginTop: 8, fontSize: 13.5, fontWeight: 600 }}>출근 기록이 없습니다</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {selBreak.sort((a, b) => b.total - a.total).map(x => (
                <button key={x.site.id} onClick={() => onOpenSite(x.site.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 12px', background: 'var(--slate-50)', borderRadius: 'var(--r-sm)', border: 0, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                  <TradeDot color={colorOf(x.site.id)} size={11} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.site.name}</span>
                  <span className="tnum" style={{ fontSize: 16, fontWeight: 800, color: 'var(--blue-600)' }}>{x.total}<span style={{ fontSize: 12, color: 'var(--slate-400)', fontWeight: 700 }}>명</span></span>
                  <Icon name="chevR" size={16} stroke="var(--slate-300)" />
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* =========================================================
   PAYROLL (노무비 계산)
   ========================================================= */
function PayrollScreen({ sites, trades, records, wide }) {
  const [month, setMonth] = useState(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
  const [siteFilter, setSiteFilter] = useState('all');
  const y = month.getFullYear(), m = month.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const from = ymd(new Date(y, m, 1));
  const to = ymd(new Date(y, m, daysInMonth));
  const siteIds = (siteFilter === 'all' ? sites : sites.filter(s => s.id === siteFilter)).map(s => s.id);
  const md = tradeManDays(records, siteIds, from, to);

  const rows = trades.map(t => {
    const manday = md[t.id] || 0;
    return { ...t, manday, cost: manday * t.rate };
  }).filter(r => r.manday > 0).sort((a, b) => b.cost - a.cost);
  const totalCost = rows.reduce((a, r) => a + r.cost, 0);
  const totalMd = rows.reduce((a, r) => a + r.manday, 0);
  const maxCost = Math.max(...rows.map(r => r.cost), 1);

  return (
    <div style={{ padding: wide ? '30px 34px 40px' : '20px 18px 30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: wide ? 26 : 23, fontWeight: 800, letterSpacing: '-.02em' }}>노무비 계산</h1>
          <div style={{ fontSize: 14, color: 'var(--slate-500)', marginTop: 3 }}>공종별 일당 × 투입 인원(man·day)</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setMonth(new Date(y, m - 1, 1))} style={xNavBtn}><Icon name="chevL" size={18} /></button>
          <div style={{ fontSize: 16, fontWeight: 800, minWidth: 96, textAlign: 'center' }}>{y}년 {m + 1}월</div>
          <button onClick={() => setMonth(new Date(y, m + 1, 1))} style={xNavBtn}><Icon name="chevR" size={18} /></button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 16, scrollbarWidth: 'none' }}>
        <Chip active={siteFilter === 'all'} onClick={() => setSiteFilter('all')}>전체 현장</Chip>
        {sites.map(s => <Chip key={s.id} active={siteFilter === s.id} onClick={() => setSiteFilter(s.id)}>{s.name}</Chip>)}
      </div>

      {/* hero total */}
      <Card style={{ padding: 22, background: 'linear-gradient(135deg, var(--blue-600), var(--blue-700))', border: 0, color: '#fff', boxShadow: 'var(--sh-blue)', marginBottom: 16 }}>
        <div style={{ fontSize: 14, opacity: .85, fontWeight: 600 }}>이 달 총 노무비 {siteFilter !== 'all' ? `· ${sites.find(s => s.id === siteFilter).name}` : ''}</div>
        <div className="tnum" style={{ fontSize: wide ? 44 : 36, fontWeight: 800, lineHeight: 1.1, marginTop: 4 }}>{wonFmt(totalCost)}<span style={{ fontSize: 20, fontWeight: 700, opacity: .85, marginLeft: 6 }}>원</span></div>
        <div style={{ display: 'flex', gap: 20, marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.18)' }}>
          <div><span className="tnum" style={{ fontSize: 18, fontWeight: 800 }}>{totalMd}</span><span style={{ fontSize: 13, opacity: .85, marginLeft: 5 }}>man·day</span></div>
          <div><span className="tnum" style={{ fontSize: 18, fontWeight: 800 }}>{rows.length}</span><span style={{ fontSize: 13, opacity: .85, marginLeft: 5 }}>공종</span></div>
          <div><span className="tnum" style={{ fontSize: 18, fontWeight: 800 }}>{totalMd ? wonShort(totalCost / totalMd) : 0}</span><span style={{ fontSize: 13, opacity: .85, marginLeft: 5 }}>평균 일당</span></div>
        </div>
      </Card>

      <Card style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 18px', borderBottom: '1px solid var(--slate-100)' }}>
          <div style={{ fontSize: 15.5, fontWeight: 800 }}>공종별 노무비</div>
          <Button size="sm" variant="outline" icon="download">정산서 내보내기</Button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 540 }}>
            <thead>
              <tr>
                <th style={{ ...xTh, textAlign: 'left', paddingLeft: 18 }}>공종 · 업체</th>
                <th style={xTh}>일당</th>
                <th style={xTh}>man·day</th>
                <th style={{ ...xTh, textAlign: 'right', paddingRight: 18 }}>노무비</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td style={{ ...xTd, textAlign: 'left', paddingLeft: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <TradeDot color={r.color} size={11} />
                      <div>
                        <div style={{ fontSize: 14.5, fontWeight: 700 }}>{r.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--slate-400)' }}>{r.company}</div>
                      </div>
                    </div>
                  </td>
                  <td className="tnum" style={xTd}>{wonFmt(r.rate)}</td>
                  <td className="tnum" style={{ ...xTd, fontWeight: 700 }}>{r.manday}</td>
                  <td className="tnum" style={{ ...xTd, textAlign: 'right', paddingRight: 18, fontWeight: 800, color: 'var(--blue-600)', fontSize: 15 }}>{wonFmt(r.cost)}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={4} style={{ ...xTd, padding: 40, color: 'var(--slate-400)' }}>이 달 기록이 없습니다</td></tr>}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ ...xTd, textAlign: 'left', paddingLeft: 18, fontWeight: 800, background: 'var(--slate-50)' }}>합계</td>
                <td style={{ ...xTd, background: 'var(--slate-50)' }}></td>
                <td className="tnum" style={{ ...xTd, fontWeight: 800, background: 'var(--slate-50)' }}>{totalMd}</td>
                <td className="tnum" style={{ ...xTd, textAlign: 'right', paddingRight: 18, fontWeight: 800, background: 'var(--blue-600)', color: '#fff', fontSize: 15 }}>{wonFmt(totalCost)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* cost bars */}
      {rows.length > 0 && (
        <Card style={{ padding: 20, marginTop: 16 }}>
          <div style={{ fontSize: 15.5, fontWeight: 800, marginBottom: 16 }}>공종별 비중</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {rows.map(r => (
              <div key={r.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 700 }}><TradeDot color={r.color} size={10} />{r.name}</span>
                  <span className="tnum" style={{ fontSize: 14, fontWeight: 800 }}>{wonFmt(r.cost)}원 <span style={{ fontSize: 11.5, color: 'var(--slate-400)', fontWeight: 600 }}>({Math.round(r.cost / totalCost * 100)}%)</span></span>
                </div>
                <div style={{ height: 8, background: 'var(--slate-100)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(r.cost / maxCost) * 100}%`, background: r.color, borderRadius: 99, transition: 'width .5s' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
const xTh = { padding: '11px 10px', fontSize: 12.5, fontWeight: 700, color: 'var(--slate-500)', borderBottom: '1.5px solid var(--slate-200)', textAlign: 'center', whiteSpace: 'nowrap' };
const xTd = { padding: '12px 10px', fontSize: 13.5, textAlign: 'center', borderBottom: '1px solid var(--slate-100)', whiteSpace: 'nowrap' };

/* =========================================================
   VENDOR DETAIL (업체/협력사 상세)
   ========================================================= */
function VendorDetailScreen({ trade, sites, records, wide, onBack, onEdit }) {
  const siteMap = Object.fromEntries(sites.map(s => [s.id, s]));
  // build history across all sites
  const history = [];
  let totalMd = 0;
  Object.entries(records).forEach(([key, day]) => {
    const e = day[trade.id];
    if (e) {
      const [siteId, date] = key.split('|');
      history.push({ siteId, date, count: e.count, memo: e.memo });
      totalMd += e.count;
    }
  });
  history.sort((a, b) => b.date.localeCompare(a.date));
  const totalCost = totalMd * trade.rate;
  const sitesWorked = [...new Set(history.map(h => h.siteId))];

  return (
    <div style={{ padding: wide ? '24px 34px 40px' : '20px 18px 30px' }}>
      <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 0, background: 'none', color: 'var(--slate-500)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 12 }}>
        <Icon name="arrowL" size={16} /> 공종 · 업체
      </button>

      {/* header card */}
      <Card style={{ padding: 22, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ width: 56, height: 56, borderRadius: 16, background: trade.color + '1A', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <TradeDot color={trade.color} size={22} />
          </span>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-.02em' }}>{trade.company}</h1>
              <Badge tone="blue">{trade.name}</Badge>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap', fontSize: 13.5, color: 'var(--slate-600)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="user" size={15} stroke="var(--slate-400)" />{trade.contact}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="bell" size={15} stroke="var(--slate-400)" />{trade.phone}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button size="sm" variant="secondary" icon="arrowR">전화</Button>
            <Button size="sm" variant="outline" icon="edit" onClick={onEdit}>수정</Button>
          </div>
        </div>
      </Card>

      {/* stats */}
      <div style={{ display: 'grid', gridTemplateColumns: wide ? 'repeat(4,1fr)' : 'repeat(2,1fr)', gap: 12, marginBottom: 16 }}>
        <KPI label="일당" value={wonShort(trade.rate)} unit="원" accent />
        <KPI label="누적 man·day" value={totalMd} />
        <KPI label="누적 노무비" value={wonShort(totalCost)} unit="원" />
        <KPI label="투입 현장" value={sitesWorked.length} unit="곳" />
      </div>

      {/* history */}
      <Card style={{ overflow: 'hidden' }}>
        <div style={{ padding: '15px 18px', borderBottom: '1px solid var(--slate-100)', fontSize: 15.5, fontWeight: 800 }}>투입 이력</div>
        <div>
          {history.slice(0, 30).map((h, i) => {
            const s = siteMap[h.siteId];
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderTop: i ? '1px solid var(--slate-100)' : 0 }}>
                <div className="tnum" style={{ width: 52, flex: 'none', fontSize: 13, fontWeight: 700, color: 'var(--slate-500)' }}>{fmtKShort(parseYmd(h.date))}<span style={{ color: 'var(--slate-300)', marginLeft: 4 }}>{WEEKDAYS[parseYmd(h.date).getDay()]}</span></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s ? s.name : '—'}</div>
                  {h.memo && <div style={{ fontSize: 12, color: 'var(--slate-400)' }}>{h.memo}</div>}
                </div>
                <span className="tnum" style={{ fontSize: 15, fontWeight: 800, color: trade.color, flex: 'none' }}>{h.count}<span style={{ fontSize: 12, color: 'var(--slate-400)', fontWeight: 700 }}>명</span></span>
              </div>
            );
          })}
          {history.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: 'var(--slate-400)', fontSize: 13.5 }}>투입 이력이 없습니다</div>}
        </div>
      </Card>
    </div>
  );
}

/* =========================================================
   SETTINGS (내 정보 / 설정)
   ========================================================= */
function SettingsScreen({ sites, records, wide, onLogout }) {
  const [notif, setNotif] = useState({ missing: true, weekly: true, vendor: false });
  const managed = sites.filter(s => s.manager === USER.name).length;
  const totalEntered = Object.values(records).reduce((a, d) => a + Object.values(d).reduce((b, e) => b + e.count, 0), 0);

  function Row({ icon, label, value, children, onClick, danger }) {
    return (
      <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 18px', borderTop: '1px solid var(--slate-100)', cursor: onClick ? 'pointer' : 'default' }}>
        <span style={{ width: 34, height: 34, borderRadius: 10, background: danger ? 'var(--red-50)' : 'var(--slate-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', color: danger ? 'var(--red-500)' : 'var(--slate-500)' }}><Icon name={icon} size={17} /></span>
        <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600, color: danger ? 'var(--red-500)' : 'var(--ink)' }}>{label}</span>
        {value && <span style={{ fontSize: 13.5, color: 'var(--slate-400)', fontWeight: 500 }}>{value}</span>}
        {children}
        {onClick && !children && <Icon name="chevR" size={17} stroke="var(--slate-300)" />}
      </div>
    );
  }
  function Toggle({ on, onClick }) {
    return (
      <button onClick={onClick} style={{ width: 46, height: 28, borderRadius: 99, border: 0, cursor: 'pointer', background: on ? 'var(--blue-600)' : 'var(--slate-300)', position: 'relative', transition: 'background .2s', flex: 'none' }}>
        <span style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 22, height: 22, borderRadius: 99, background: '#fff', boxShadow: 'var(--sh-sm)', transition: 'left .2s' }} />
      </button>
    );
  }

  return (
    <div style={{ padding: wide ? '30px 34px 40px' : '20px 18px 30px', maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ margin: '0 0 18px', fontSize: wide ? 26 : 23, fontWeight: 800, letterSpacing: '-.02em' }}>내 정보 · 설정</h1>

      {/* profile */}
      <Card style={{ padding: 22, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar name={USER.avatar} size={62} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{USER.name}</div>
            <div style={{ fontSize: 13.5, color: 'var(--slate-500)', marginTop: 2 }}>{USER.role} · {USER.company}</div>
          </div>
          <Button size="sm" variant="outline" icon="edit">편집</Button>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
          <div style={{ flex: 1, background: 'var(--slate-50)', borderRadius: 'var(--r-sm)', padding: '13px 14px' }}>
            <div className="tnum" style={{ fontSize: 22, fontWeight: 800, color: 'var(--blue-600)' }}>{managed}</div>
            <div style={{ fontSize: 12, color: 'var(--slate-500)', fontWeight: 600 }}>담당 현장</div>
          </div>
          <div style={{ flex: 1, background: 'var(--slate-50)', borderRadius: 'var(--r-sm)', padding: '13px 14px' }}>
            <div className="tnum" style={{ fontSize: 22, fontWeight: 800, color: 'var(--blue-600)' }}>{totalEntered}</div>
            <div style={{ fontSize: 12, color: 'var(--slate-500)', fontWeight: 600 }}>누적 출근 입력</div>
          </div>
          <div style={{ flex: 1, background: 'var(--slate-50)', borderRadius: 'var(--r-sm)', padding: '13px 14px' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--blue-600)' }}>{USER.joined.replace('-', '.')}</div>
            <div style={{ fontSize: 12, color: 'var(--slate-500)', fontWeight: 600 }}>가입</div>
          </div>
        </div>
      </Card>

      {/* account */}
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--slate-400)', margin: '0 4px 8px', letterSpacing: '.02em' }}>계정</div>
      <Card style={{ overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ height: 1 }} />
        <Row icon="user" label="이메일" value={USER.email} />
        <Row icon="bell" label="휴대폰" value={USER.phone} />
        <Row icon="bolt" label="비밀번호 변경" onClick={() => {}} />
        <Row icon="trades" label="카카오 계정 연결" value="연결됨" />
      </Card>

      {/* notifications */}
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--slate-400)', margin: '0 4px 8px', letterSpacing: '.02em' }}>알림</div>
      <Card style={{ overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ height: 1 }} />
        <Row icon="bell" label="미입력 현장 알림"><Toggle on={notif.missing} onClick={() => setNotif(n => ({ ...n, missing: !n.missing }))} /></Row>
        <Row icon="stats" label="주간 요약 리포트"><Toggle on={notif.weekly} onClick={() => setNotif(n => ({ ...n, weekly: !n.weekly }))} /></Row>
        <Row icon="trades" label="업체 투입 변동 알림"><Toggle on={notif.vendor} onClick={() => setNotif(n => ({ ...n, vendor: !n.vendor }))} /></Row>
      </Card>

      {/* danger */}
      <Card style={{ overflow: 'hidden' }}>
        <div style={{ height: 1 }} />
        <Row icon="logout" label="로그아웃" danger onClick={onLogout} />
      </Card>

      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--slate-400)', marginTop: 22 }}>현장출근기록 v1.0 · 김현장님</div>
    </div>
  );
}

Object.assign(window, { UnifiedCalendarScreen, PayrollScreen, VendorDetailScreen, SettingsScreen, SITE_COLORS });
