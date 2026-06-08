/* ============================================================
   ui.jsx — icons + shared UI primitives
   ============================================================ */
const { useState, useEffect, useRef, useMemo, useCallback } = React;

/* ---------------- Icons (stroke line icons) ---------------- */
const ICON_PATHS = {
  dashboard: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
  site:      'M3 21h18M5 21V7l8-4v18M19 21V11l-6-3M9 9h0M9 12h0M9 15h0',
  calendar:  'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
  table:     'M3 9h18M3 15h18M9 5v14M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z',
  trades:    'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z',
  stats:     'M3 3v18h18M7 16l4-4 3 3 5-6',
  user:      'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  plus:      'M12 5v14M5 12h14',
  minus:     'M5 12h14',
  check:     'M20 6L9 17l-5-5',
  x:         'M18 6L6 18M6 6l12 12',
  chevR:     'M9 18l6-6-6-6',
  chevL:     'M15 18l-6-6 6-6',
  chevDown:  'M6 9l6 6 6-6',
  edit:      'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  trash:     'M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2',
  search:    'M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z',
  menu:      'M3 12h18M3 6h18M3 18h18',
  logout:    'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  location:  'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z',
  clock:     'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
  arrowR:    'M5 12h14M13 6l6 6-6 6',
  arrowL:    'M19 12H5M11 18l-6-6 6-6',
  more:      'M12 13a1 1 0 100-2 1 1 0 000 2zM19 13a1 1 0 100-2 1 1 0 000 2zM5 13a1 1 0 100-2 1 1 0 000 2z',
  users:     'M17 21v-2a4 4 0 00-3-3.87M9 21v-2a4 4 0 014-4h0M9 11a4 4 0 100-8 4 4 0 000 8zm8-1a3 3 0 100-6',
  bell:      'M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0',
  bolt:      'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  download:  'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
  filter:    'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
  back:      'M19 12H5M12 19l-7-7 7-7',
};
function Icon({ name, size = 22, stroke = 'currentColor', sw = 2, fill = 'none', style }) {
  const p = ICON_PATHS[name] || '';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      {p.split('M').filter(Boolean).map((seg, i) => <path key={i} d={'M' + seg} />)}
    </svg>
  );
}
function KakaoIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#191600" d="M12 3C6.9 3 3 6.3 3 10.3c0 2.6 1.7 4.9 4.3 6.2-.2.7-.7 2.5-.8 2.9 0 0 0 .2.1.3.1 0 .3 0 .3-.1.4-.3 2.6-1.8 3.3-2.3.3 0 .6.1 1 .1 5.1 0 9-3.3 9-7.3S17.1 3 12 3z"/>
    </svg>
  );
}

/* ---------------- Button ---------------- */
function Button({ children, variant = 'primary', size = 'md', icon, iconRight, full, onClick, style, type, disabled }) {
  const base = {
    border: 0, borderRadius: 'var(--r-sm)', fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontFamily: 'var(--font)', width: full ? '100%' : undefined, transition: 'transform .08s, filter .15s, background .15s',
    opacity: disabled ? .5 : 1, whiteSpace: 'nowrap',
  };
  const sizes = {
    sm: { fontSize: 13.5, padding: '8px 13px' },
    md: { fontSize: 15, padding: '12px 18px' },
    lg: { fontSize: 16.5, padding: '15px 22px' },
  };
  const variants = {
    primary:   { background: 'var(--blue-600)', color: '#fff', boxShadow: 'var(--sh-blue)' },
    secondary: { background: 'var(--blue-50)', color: 'var(--blue-700)', border: '1px solid var(--blue-100)' },
    ghost:     { background: 'var(--slate-100)', color: 'var(--slate-700)' },
    outline:   { background: '#fff', color: 'var(--slate-700)', border: '1px solid var(--slate-200)' },
    danger:    { background: 'var(--red-50)', color: 'var(--red-500)' },
    white:     { background: '#fff', color: 'var(--blue-700)', boxShadow: 'var(--sh-sm)' },
  };
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 20 : 18;
  return (
    <button type={type || 'button'} disabled={disabled} onClick={onClick}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      onMouseDown={e => !disabled && (e.currentTarget.style.transform = 'scale(.97)')}
      onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
      {icon && <Icon name={icon} size={iconSize} />}
      {children}
      {iconRight && <Icon name={iconRight} size={iconSize} />}
    </button>
  );
}

/* ---------------- Card ---------------- */
function Card({ children, style, onClick, hover }) {
  const [h, setH] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        background: '#fff', border: '1px solid var(--slate-200)', borderRadius: 'var(--r-lg)',
        boxShadow: hover && h ? 'var(--sh-md)' : 'var(--sh-sm)',
        transition: 'box-shadow .18s, transform .18s, border-color .18s',
        transform: hover && h ? 'translateY(-2px)' : 'none',
        borderColor: hover && h ? 'var(--blue-300)' : 'var(--slate-200)',
        cursor: onClick ? 'pointer' : 'default', ...style,
      }}>
      {children}
    </div>
  );
}

/* ---------------- Stepper ---------------- */
function Stepper({ value, onChange, size = 'md' }) {
  const dim = size === 'lg' ? 52 : size === 'sm' ? 36 : 44;
  const fz = size === 'lg' ? 24 : size === 'sm' ? 16 : 20;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--slate-200)',
      borderRadius: 'var(--r-full)', overflow: 'hidden', background: '#fff', userSelect: 'none' }}>
      <button onClick={() => onChange(Math.max(0, value - 1))}
        style={{ width: dim, height: dim, border: 0, background: '#fff', color: value > 0 ? 'var(--blue-600)' : 'var(--slate-300)',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="minus" size={fz - 4} sw={2.5} />
      </button>
      <span className="tnum" style={{ minWidth: dim + 4, textAlign: 'center', fontSize: fz, fontWeight: 800,
        color: value > 0 ? 'var(--ink)' : 'var(--slate-300)' }}>{value}</span>
      <button onClick={() => onChange(value + 1)}
        style={{ width: dim, height: dim, border: 0, background: '#fff', color: 'var(--blue-600)',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="plus" size={fz - 4} sw={2.5} />
      </button>
    </div>
  );
}

/* ---------------- Badge ---------------- */
function Badge({ children, tone = 'blue', dot }) {
  const tones = {
    blue:  { background: 'var(--blue-50)', color: 'var(--blue-700)' },
    green: { background: 'var(--green-50)', color: 'var(--green-600)' },
    amber: { background: 'var(--amber-50)', color: '#B45309' },
    red:   { background: 'var(--red-50)', color: 'var(--red-500)' },
    slate: { background: 'var(--slate-100)', color: 'var(--slate-600)' },
  };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700,
      padding: '5px 10px', borderRadius: 'var(--r-full)', ...tones[tone] }}>
      {dot && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor' }} />}
      {children}
    </span>
  );
}

/* ---------------- Field ---------------- */
function Field({ label, children, hint }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {label && <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--slate-600)' }}>{label}</span>}
      {children}
      {hint && <span style={{ fontSize: 12, color: 'var(--slate-400)' }}>{hint}</span>}
    </label>
  );
}
function TextInput({ value, onChange, placeholder, type = 'text', icon, style }) {
  const [f, setF] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {icon && <span style={{ position: 'absolute', left: 13, color: f ? 'var(--blue-500)' : 'var(--slate-400)', display: 'flex' }}><Icon name={icon} size={18} /></span>}
      <input type={type} value={value} placeholder={placeholder}
        onChange={e => onChange && onChange(e.target.value)}
        onFocus={() => setF(true)} onBlur={() => setF(false)}
        style={{ width: '100%', padding: icon ? '13px 14px 13px 42px' : '13px 14px', fontSize: 15,
          border: `1px solid ${f ? 'var(--blue-500)' : 'var(--slate-200)'}`, borderRadius: 'var(--r-sm)',
          boxShadow: f ? '0 0 0 3px var(--blue-100)' : 'none', outline: 'none', color: 'var(--ink)',
          transition: 'border .15s, box-shadow .15s', background: '#fff', ...style }} />
    </div>
  );
}

/* ---------------- Segmented control ---------------- */
function Segmented({ options, value, onChange, full }) {
  return (
    <div style={{ display: 'inline-flex', background: 'var(--slate-100)', borderRadius: 'var(--r-sm)', padding: 4, gap: 4, width: full ? '100%' : undefined }}>
      {options.map(o => {
        const active = o.value === value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)}
            style={{ flex: full ? 1 : undefined, border: 0, borderRadius: 'calc(var(--r-sm) - 3px)',
              padding: '9px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              background: active ? '#fff' : 'transparent', color: active ? 'var(--blue-700)' : 'var(--slate-500)',
              boxShadow: active ? 'var(--sh-sm)' : 'none', transition: 'all .15s' }}>
            {o.icon && <Icon name={o.icon} size={16} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Sheet / Modal ---------------- */
function Sheet({ open, onClose, children, title, maxWidth = 460 }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 60, display: 'flex',
      alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,.45)', backdropFilter: 'blur(2px)', animation: 'fadeIn .2s ease' }} />
      <div onClick={e => e.stopPropagation()} className="sheet-panel"
        style={{ position: 'relative', background: '#fff', width: '100%', maxWidth, borderRadius: '24px 24px 0 0',
          padding: '22px', boxShadow: 'var(--sh-lg)', maxHeight: '88%', overflowY: 'auto', animation: 'slideUp .26s cubic-bezier(.16,1,.3,1)' }}>
        <div style={{ width: 40, height: 4, background: 'var(--slate-200)', borderRadius: 99, margin: '0 auto 16px' }} />
        {title && <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>{title}</h3>
          <button onClick={onClose} style={{ border: 0, background: 'var(--slate-100)', width: 34, height: 34, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate-500)' }}><Icon name="x" size={18} /></button>
        </div>}
        {children}
      </div>
    </div>
  );
}

/* ---------------- Avatar ---------------- */
function Avatar({ name, size = 38, color = 'var(--blue-600)' }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: size * 0.4, flex: 'none' }}>
      {name}
    </div>
  );
}

/* ---------------- TradeDot ---------------- */
function TradeDot({ color, size = 11 }) {
  return <span style={{ width: size, height: size, borderRadius: '50%', background: color, flex: 'none', display: 'inline-block' }} />;
}

Object.assign(window, {
  Icon, KakaoIcon, Button, Card, Stepper, Badge, Field, TextInput, Segmented, Sheet, Avatar, TradeDot,
});
