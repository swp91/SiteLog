/* ============================================================
   screens-attendance.jsx — SiteDetail, Input(A/B/C), Calendar, Table
   ============================================================ */

/* ---- immutable entry update ---- */
function withEntry(records, siteId, date, tradeId, patch) {
  const key = `${siteId}|${date}`;
  const cur = records[key] || {};
  const curE = cur[tradeId] || { count: 0, memo: '' };
  const next = { ...curE, ...patch };
  const nextDay = { ...cur };
  if ((next.count || 0) === 0 && !next.memo) delete nextDay[tradeId];
  else nextDay[tradeId] = next;
  const out = { ...records };
  if (Object.keys(nextDay).length === 0) delete out[key];
  else out[key] = nextDay;
  return out;
}

/* ---- horizontal date strip ---- */
function DateStrip({ date, onPick }) {
  const sel = parseYmd(date);
  const scroller = useRef(null);
  const days = Array.from({ length: 21 }, (_, i) => addDays(TODAY, i - 16));
  useEffect(() => {
    if (scroller.current) {
      const el = scroller.current.querySelector('[data-sel="1"]');
      if (el) scroller.current.scrollLeft = el.offsetLeft - scroller.current.clientWidth / 2 + 30;
    }
  }, [date]);
  return (
    <div ref={scroller} style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 0 8px', scrollbarWidth: 'none' }}>
      {days.map((d, i) => {
        const isSel = ymd(d) === date;
        const isToday = ymd(d) === ymd(TODAY);
        const sun = d.getDay() === 0, sat = d.getDay() === 6;
        return (
          <button key={i} data-sel={isSel ? '1' : '0'} onClick={() => onPick(ymd(d))}
            style={{ flex: 'none', width: 52, padding: '9px 0', borderRadius: 'var(--r-sm)', border: isSel ? '0' : '1px solid var(--slate-200)',
              background: isSel ? 'var(--blue-600)' : '#fff', cursor: 'pointer', textAlign: 'center', boxShadow: isSel ? 'var(--sh-blue)' : 'none' }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: isSel ? 'rgba(255,255,255,.8)' : sun ? 'var(--red-500)' : sat ? 'var(--blue-500)' : 'var(--slate-400)' }}>{WEEKDAYS[d.getDay()]}</div>
            <div className="tnum" style={{ fontSize: 18, fontWeight: 800, color: isSel ? '#fff' : 'var(--ink)', marginTop: 2 }}>{d.getDate()}</div>
            {isToday && <div style={{ width: 5, height: 5, borderRadius: 99, background: isSel ? '#fff' : 'var(--blue-600)', margin: '3px auto 0' }} />}
          </button>
        );
      })}
    </div>
  );
}

/* =========================================================
   INPUT VARIANT A — 스테퍼 카드형
   ========================================================= */
function InputStepper({ trades, entries, onSet }) {
  const [openMemo, setOpenMemo] = useState({});
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      {trades.map(t => {
        const e = entries[t.id] || { count: 0, memo: '' };
        const active = e.count > 0;
        return (
          <Card key={t.id} style={{ padding: '15px 16px', borderColor: active ? t.color + '55' : 'var(--slate-200)',
            background: active ? t.color + '0A' : '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
              <span style={{ width: 40, height: 40, borderRadius: 12, background: t.color + '1A', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <TradeDot color={t.color} size={15} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16.5, fontWeight: 800 }}>{t.name}</div>
                <button onClick={() => setOpenMemo({ ...openMemo, [t.id]: !openMemo[t.id] })}
                  style={{ border: 0, background: 'none', padding: 0, fontSize: 12.5, color: e.memo ? 'var(--blue-600)' : 'var(--slate-400)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="edit" size={12} />{e.memo ? e.memo : '작업 메모 추가'}
                </button>
              </div>
              <Stepper size="md" value={e.count} onChange={v => onSet(t.id, { count: v })} />
            </div>
            {openMemo[t.id] && (
              <div style={{ marginTop: 12 }}>
                <TextInput value={e.memo} onChange={v => onSet(t.id, { memo: v })} placeholder="작업 내용 (예: 천장 마감)" icon="edit" />
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

/* =========================================================
   INPUT VARIANT B — 퀵 그리드 + 숫자패드
   ========================================================= */
function InputPad({ trades, entries, onSet }) {
  const [sel, setSel] = useState(trades[0] && trades[0].id);
  const selTrade = trades.find(t => t.id === sel);
  const e = (sel && entries[sel]) || { count: 0, memo: '' };
  function tap(n) {
    if (n === 'del') onSet(sel, { count: Math.floor(e.count / 10) });
    else if (n === 'c') onSet(sel, { count: 0 });
    else onSet(sel, { count: Math.min(99, e.count * 10 + n) });
  }
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 9, marginBottom: 16 }}>
        {trades.map(t => {
          const c = (entries[t.id] || {}).count || 0;
          const isSel = t.id === sel;
          return (
            <button key={t.id} onClick={() => setSel(t.id)}
              style={{ border: isSel ? `2px solid ${t.color}` : '1px solid var(--slate-200)', borderRadius: 'var(--r)',
                padding: '13px 10px', background: c > 0 ? t.color + '12' : '#fff', cursor: 'pointer', textAlign: 'left', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><TradeDot color={t.color} size={9} /><span style={{ fontSize: 13.5, fontWeight: 700 }}>{t.name}</span></div>
              <div className="tnum" style={{ fontSize: 24, fontWeight: 800, marginTop: 4, color: c > 0 ? t.color : 'var(--slate-300)' }}>{c}<span style={{ fontSize: 12, color: 'var(--slate-400)', fontWeight: 700 }}> 명</span></div>
            </button>
          );
        })}
      </div>

      {selTrade && (
        <Card style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 16 }}><TradeDot color={selTrade.color} size={13} />{selTrade.name}</div>
            <div className="tnum" style={{ fontSize: 30, fontWeight: 800, color: 'var(--blue-600)' }}>{e.count}<span style={{ fontSize: 14, color: 'var(--slate-400)' }}> 명</span></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <button key={n} onClick={() => tap(n)} style={padKeyStyle}>{n}</button>
            ))}
            <button onClick={() => tap('c')} style={{ ...padKeyStyle, color: 'var(--slate-400)', fontSize: 17 }}>C</button>
            <button onClick={() => tap(0)} style={padKeyStyle}>0</button>
            <button onClick={() => tap('del')} style={{ ...padKeyStyle, color: 'var(--blue-600)' }}><Icon name="back" size={22} /></button>
          </div>
          <div style={{ marginTop: 12 }}>
            <TextInput value={e.memo} onChange={v => onSet(sel, { memo: v })} placeholder="작업 메모 (선택)" icon="edit" />
          </div>
        </Card>
      )}
    </div>
  );
}
const padKeyStyle = {
  border: '1px solid var(--slate-200)', borderRadius: 'var(--r-sm)', background: '#fff', height: 54,
  fontSize: 22, fontWeight: 800, color: 'var(--ink)', cursor: 'pointer', fontFamily: 'var(--font)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', fontVariantNumeric: 'tabular-nums',
};

/* =========================================================
   INPUT VARIANT C — 리스트 인라인
   ========================================================= */
function InputInline({ trades, entries, onSet }) {
  return (
    <Card style={{ overflow: 'hidden' }}>
      {trades.map((t, i) => {
        const e = entries[t.id] || { count: 0, memo: '' };
        return (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
            borderTop: i ? '1px solid var(--slate-100)' : 0, background: e.count > 0 ? t.color + '08' : '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 96, flex: 'none' }}>
              <TradeDot color={t.color} size={11} /><span style={{ fontSize: 15, fontWeight: 700 }}>{t.name}</span>
            </div>
            <Stepper size="sm" value={e.count} onChange={v => onSet(t.id, { count: v })} />
            <input value={e.memo} onChange={ev => onSet(t.id, { memo: ev.target.value })} placeholder="작업 메모"
              style={{ flex: 1, minWidth: 0, border: '1px solid var(--slate-200)', borderRadius: 'var(--r-xs)', padding: '8px 11px',
                fontSize: 13.5, background: '#fff', outline: 'none', color: 'var(--ink)' }} />
          </div>
        );
      })}
    </Card>
  );
}

/* =========================================================
   ATTENDANCE INPUT wrapper
   ========================================================= */
function AttendanceInput({ site, date, trades, records, setRecords, variant, wide }) {
  const entries = dayEntries(records, site.id, date);
  const total = dayTotal(records, site.id, date);
  const filled = Object.keys(entries).length;
  const onSet = (tid, patch) => setRecords(r => withEntry(r, site.id, date, tid, patch));
  const Variant = variant === 'pad' ? InputPad : variant === 'inline' ? InputInline : InputStepper;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14,
        background: 'var(--blue-50)', border: '1px solid var(--blue-100)', borderRadius: 'var(--r)', padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="users" size={18} stroke="var(--blue-600)" />
          <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--blue-800,#1E40AF)' }}>{fmtKDate(parseYmd(date))} 출근</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12.5, color: 'var(--slate-500)', fontWeight: 600 }}>{filled}개 공종</span>
          <span className="tnum" style={{ fontSize: 20, fontWeight: 800, color: 'var(--blue-600)' }}>{total}<span style={{ fontSize: 13, color: 'var(--slate-400)' }}> 명</span></span>
        </div>
      </div>
      <Variant trades={trades} entries={entries} onSet={onSet} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 16, color: 'var(--green-600)', fontSize: 13, fontWeight: 600 }}>
        <Icon name="check" size={15} /> 입력 즉시 자동 저장됩니다
      </div>
    </div>
  );
}

/* =========================================================
   CALENDAR VIEW
   ========================================================= */
function CalendarView({ site, date, trades, records, onPickDate, wide }) {
  const [month, setMonth] = useState(() => { const d = parseYmd(date); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const tradeMap = Object.fromEntries(trades.map(t => [t.id, t]));
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const startPad = (first.getDay()); // Sun start
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d));

  // max for intensity
  let maxT = 1;
  cells.forEach(c => { if (c) maxT = Math.max(maxT, dayTotal(records, site.id, ymd(c))); });

  const selEntries = dayEntries(records, site.id, date);
  const selTotal = dayTotal(records, site.id, date);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: wide ? '1.4fr 1fr' : '1fr', gap: 18 }}>
      <Card style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} style={navBtn}><Icon name="chevL" size={18} /></button>
          <div style={{ fontSize: 17, fontWeight: 800 }}>{month.getFullYear()}년 {month.getMonth() + 1}월</div>
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} style={navBtn}><Icon name="chevR" size={18} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5 }}>
          {WEEKDAYS.map((w, i) => <div key={w} style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: i === 0 ? 'var(--red-500)' : i === 6 ? 'var(--blue-500)' : 'var(--slate-400)', paddingBottom: 4 }}>{w}</div>)}
          {cells.map((c, i) => {
            if (!c) return <div key={i} />;
            const ds = ymd(c);
            const t = dayTotal(records, site.id, ds);
            const isSel = ds === date;
            const isToday = ds === ymd(TODAY);
            const intensity = t / maxT;
            const bg = t === 0 ? '#fff' : `rgba(37,99,235,${0.12 + intensity * 0.7})`;
            return (
              <button key={i} onClick={() => onPickDate(ds)}
                style={{ aspectRatio: '1', border: isSel ? '2px solid var(--blue-600)' : '1px solid var(--slate-100)',
                  borderRadius: 10, background: bg, cursor: 'pointer', padding: 4, position: 'relative',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span className="tnum" style={{ fontSize: 13.5, fontWeight: isToday ? 800 : 600, color: t > maxT * 0.45 ? '#fff' : 'var(--slate-600)' }}>{c.getDate()}</span>
                {t > 0 && <span className="tnum" style={{ fontSize: 11, fontWeight: 800, color: t > maxT * 0.45 ? '#fff' : 'var(--blue-600)' }}>{t}</span>}
                {isToday && <span style={{ position: 'absolute', top: 4, right: 5, width: 5, height: 5, borderRadius: 99, background: t > maxT * 0.45 ? '#fff' : 'var(--blue-600)' }} />}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 12, color: 'var(--slate-400)' }}>
          <span>적음</span>
          <div style={{ display: 'flex', gap: 3 }}>{[0.15, 0.35, 0.55, 0.75, 0.95].map(o => <span key={o} style={{ width: 16, height: 12, borderRadius: 3, background: `rgba(37,99,235,${o})` }} />)}</div>
          <span>많음</span>
        </div>
      </Card>

      {/* selected day detail */}
      <Card style={{ padding: 18, alignSelf: 'start' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{fmtKDate(parseYmd(date))}</div>
          <span className="tnum" style={{ fontSize: 22, fontWeight: 800, color: 'var(--blue-600)' }}>{selTotal}<span style={{ fontSize: 13, color: 'var(--slate-400)' }}> 명</span></span>
        </div>
        {Object.keys(selEntries).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 10px', color: 'var(--slate-400)' }}>
            <Icon name="calendar" size={30} /><div style={{ marginTop: 8, fontSize: 13.5, fontWeight: 600 }}>출근 기록이 없습니다</div>
            <Button size="sm" variant="secondary" icon="plus" style={{ marginTop: 12 }} onClick={() => onPickDate(date, true)}>이 날 입력하기</Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {Object.entries(selEntries).map(([tid, e]) => {
              const t = tradeMap[tid]; if (!t) return null;
              return (
                <div key={tid} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', background: 'var(--slate-50)', borderRadius: 'var(--r-sm)' }}>
                  <TradeDot color={t.color} size={11} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700 }}>{t.name}</div>
                    {e.memo && <div style={{ fontSize: 12, color: 'var(--slate-400)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.memo}</div>}
                  </div>
                  <span className="tnum" style={{ fontSize: 17, fontWeight: 800, color: t.color }}>{e.count}<span style={{ fontSize: 12, color: 'var(--slate-400)', fontWeight: 700 }}>명</span></span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
const navBtn = { width: 36, height: 36, borderRadius: 10, border: '1px solid var(--slate-200)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate-600)' };

/* =========================================================
   JOURNAL VIEW (일일 일지 — 사진 + 메모)
   ========================================================= */
function JournalView({ site, date, journal, setJournal, wide }) {
  const key = `${site.id}|${date}`;
  const entry = journal[key] || { memo: '', photos: 2 };
  const photoCount = Math.max(entry.photos || 2, 2);
  function setMemo(v) { setJournal(j => ({ ...j, [key]: { ...(j[key] || { photos: 2 }), memo: v } })); }
  function addPhoto() { setJournal(j => ({ ...j, [key]: { ...(j[key] || { memo: '' }), photos: ((j[key] && j[key].photos) || 2) + 1 } })); }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: wide ? '1.3fr 1fr' : '1fr', gap: 18 }}>
      {/* photos */}
      <Card style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15.5, fontWeight: 800 }}><Icon name="site" size={18} stroke="var(--blue-600)" /> 현장 사진</div>
          <span style={{ fontSize: 12.5, color: 'var(--slate-400)', fontWeight: 600 }}>{fmtKDate(parseYmd(date))}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: wide ? 'repeat(2,1fr)' : 'repeat(2,1fr)', gap: 10 }}>
          {Array.from({ length: photoCount }, (_, i) => (
            <image-slot key={i} id={`js-${site.id}-${date}-${i}`} shape="rounded" radius="12"
              placeholder="사진 드래그" style={{ width: '100%', aspectRatio: '4/3', display: 'block' }}></image-slot>
          ))}
          <button onClick={addPhoto} style={{ aspectRatio: '4/3', border: '2px dashed var(--slate-300)', borderRadius: 12, background: 'var(--slate-50)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', color: 'var(--slate-400)' }}>
            <Icon name="plus" size={24} /><span style={{ fontSize: 12.5, fontWeight: 700 }}>사진 칸 추가</span>
          </button>
        </div>
        <div style={{ fontSize: 12, color: 'var(--slate-400)', marginTop: 12, lineHeight: 1.5 }}>칸을 탭하거나 사진을 끌어다 놓으면 현장 사진이 등록됩니다.</div>
      </Card>

      {/* memo */}
      <Card style={{ padding: 18, alignSelf: 'start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15.5, fontWeight: 800, marginBottom: 14 }}><Icon name="edit" size={17} stroke="var(--blue-600)" /> 작업 일지</div>
        <textarea value={entry.memo} onChange={e => setMemo(e.target.value)} placeholder="오늘의 작업 내용, 특이사항, 자재 입고 등을 기록하세요."
          style={{ width: '100%', minHeight: 150, border: '1px solid var(--slate-200)', borderRadius: 'var(--r-sm)', padding: '13px 14px',
            fontSize: 14.5, lineHeight: 1.6, fontFamily: 'var(--font)', resize: 'vertical', outline: 'none', color: 'var(--ink)', boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 12, color: 'var(--green-600)', fontSize: 13, fontWeight: 600 }}>
          <Icon name="check" size={15} /> 자동 저장됩니다
        </div>
      </Card>
    </div>
  );
}

/* =========================================================
   TABLE VIEW (기간 × 공종)
   ========================================================= */
function TableView({ site, date, trades, records, wide }) {
  const [period, setPeriod] = useState(7);
  const end = parseYmd(date);
  const dates = Array.from({ length: period }, (_, i) => addDays(end, -(period - 1 - i)));
  const tradesUsed = trades; // show all
  const colTotals = {}; let grand = 0;
  dates.forEach(d => tradesUsed.forEach(t => {
    const e = dayEntries(records, site.id, ymd(d))[t.id];
    if (e) { colTotals[t.id] = (colTotals[t.id] || 0) + e.count; grand += e.count; }
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <Segmented value={period} onChange={setPeriod} options={[{ value: 7, label: '최근 7일' }, { value: 14, label: '2주' }, { value: 30, label: '한 달' }]} />
        <Button size="sm" variant="outline" icon="download">CSV 내보내기</Button>
      </div>
      <Card style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 120 + tradesUsed.length * 64 }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, position: 'sticky', left: 0, zIndex: 2, background: 'var(--slate-50)', textAlign: 'left', minWidth: 92 }}>날짜</th>
                {tradesUsed.map(t => (
                  <th key={t.id} style={thStyle}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      <TradeDot color={t.color} size={9} /><span>{t.name}</span>
                    </div>
                  </th>
                ))}
                <th style={{ ...thStyle, background: 'var(--blue-50)', color: 'var(--blue-700)' }}>합계</th>
              </tr>
            </thead>
            <tbody>
              {dates.map((d, ri) => {
                const dayEnt = dayEntries(records, site.id, ymd(d));
                const rowTotal = dayTotal(records, site.id, ymd(d));
                const isToday = ymd(d) === ymd(TODAY);
                const sun = d.getDay() === 0;
                return (
                  <tr key={ri} style={{ background: isToday ? 'var(--blue-50)' : '#fff' }}>
                    <td style={{ ...tdStyle, position: 'sticky', left: 0, zIndex: 1, background: isToday ? 'var(--blue-50)' : '#fff', textAlign: 'left', fontWeight: 700 }}>
                      <span className="tnum">{fmtKShort(d)}</span>
                      <span style={{ fontSize: 11.5, color: sun ? 'var(--red-500)' : 'var(--slate-400)', marginLeft: 5, fontWeight: 600 }}>{WEEKDAYS[d.getDay()]}</span>
                    </td>
                    {tradesUsed.map(t => {
                      const e = dayEnt[t.id];
                      return <td key={t.id} className="tnum" style={{ ...tdStyle, color: e ? 'var(--ink)' : 'var(--slate-200)', fontWeight: e ? 700 : 400 }}>{e ? e.count : '·'}</td>;
                    })}
                    <td className="tnum" style={{ ...tdStyle, fontWeight: 800, color: 'var(--blue-600)', background: isToday ? 'var(--blue-100)' : 'var(--blue-50)' }}>{rowTotal || '·'}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ ...tdStyle, position: 'sticky', left: 0, background: 'var(--slate-100)', fontWeight: 800, textAlign: 'left' }}>합계</td>
                {tradesUsed.map(t => <td key={t.id} className="tnum" style={{ ...tdStyle, background: 'var(--slate-100)', fontWeight: 800 }}>{colTotals[t.id] || 0}</td>)}
                <td className="tnum" style={{ ...tdStyle, background: 'var(--blue-600)', color: '#fff', fontWeight: 800, fontSize: 15 }}>{grand}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <Stat label="기간 누계" value={grand} unit="man·day" />
        <Stat label="일 평균" value={(grand / period).toFixed(1)} unit="명/일" />
        <Stat label="최다 공종" value={(() => { const top = Object.entries(colTotals).sort((a, b) => b[1] - a[1])[0]; const t = trades.find(x => x.id === (top && top[0])); return t ? t.name : '-'; })()} unit="" />
      </div>
    </div>
  );
}
const thStyle = { padding: '11px 8px', fontSize: 12.5, fontWeight: 700, color: 'var(--slate-500)', borderBottom: '1.5px solid var(--slate-200)', textAlign: 'center', whiteSpace: 'nowrap' };
const tdStyle = { padding: '10px 8px', fontSize: 13.5, textAlign: 'center', borderBottom: '1px solid var(--slate-100)', whiteSpace: 'nowrap' };
function Stat({ label, value, unit }) {
  return (
    <div style={{ flex: 1, minWidth: 120, background: '#fff', border: '1px solid var(--slate-200)', borderRadius: 'var(--r)', padding: '14px 16px' }}>
      <div style={{ fontSize: 12.5, color: 'var(--slate-400)', fontWeight: 600 }}>{label}</div>
      <div className="tnum" style={{ fontSize: 22, fontWeight: 800, marginTop: 3 }}>{value}{unit && <span style={{ fontSize: 12.5, color: 'var(--slate-400)', fontWeight: 600, marginLeft: 4 }}>{unit}</span>}</div>
    </div>
  );
}

/* =========================================================
   SITE DETAIL (shell with tabs)
   ========================================================= */
function SiteDetailScreen({ site, trades, records, setRecords, journal, setJournal, onBack, variant, wide, initialTab }) {
  const [tab, setTab] = useState(initialTab || 'input');
  const [date, setDate] = useState(ymd(TODAY));
  const statusTone = { '진행중': 'blue', '마감임박': 'amber', '완료': 'slate' };
  return (
    <div style={{ padding: wide ? '24px 34px 40px' : '0 0 30px' }}>
      {/* header */}
      <div style={{ padding: wide ? 0 : '16px 18px 0' }}>
        <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 0, background: 'none', color: 'var(--slate-500)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 10 }}>
          <Icon name="arrowL" size={16} /> 현장 목록
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: wide ? 25 : 21, fontWeight: 800, letterSpacing: '-.02em' }}>{site.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--slate-500)', marginTop: 5 }}>
              <Icon name="location" size={14} />{site.addr}
            </div>
          </div>
          <Badge tone={statusTone[site.status]} dot>{site.status}</Badge>
        </div>
      </div>

      {/* tabs */}
      <div style={{ padding: wide ? '16px 0 0' : '14px 18px 0', position: 'sticky', top: 0, zIndex: 20, background: 'var(--slate-50)' }}>
        <Segmented full value={tab} onChange={setTab} options={[
          { value: 'input', label: '입력', icon: 'plus' },
          { value: 'calendar', label: '달력', icon: 'calendar' },
          { value: 'table', label: '표', icon: 'table' },
          { value: 'journal', label: '일지', icon: 'edit' },
        ]} />
        {(tab === 'input' || tab === 'journal') && <div style={{ marginTop: 12 }}><DateStrip date={date} onPick={setDate} /></div>}
      </div>

      <div style={{ padding: wide ? '18px 0 0' : '14px 18px 0' }}>
        {tab === 'input' && <AttendanceInput site={site} date={date} trades={trades} records={records} setRecords={setRecords} variant={variant} wide={wide} />}
        {tab === 'calendar' && <CalendarView site={site} date={date} trades={trades} records={records} wide={wide}
          onPickDate={(ds, goInput) => { setDate(ds); if (goInput) setTab('input'); }} />}
        {tab === 'table' && <TableView site={site} date={date} trades={trades} records={records} wide={wide} />}
        {tab === 'journal' && <JournalView site={site} date={date} journal={journal} setJournal={setJournal} wide={wide} />}
      </div>
    </div>
  );
}

Object.assign(window, {
  withEntry, DateStrip, InputStepper, InputPad, InputInline, AttendanceInput,
  CalendarView, TableView, SiteDetailScreen, Stat, JournalView,
});
