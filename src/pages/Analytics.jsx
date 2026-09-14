import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { ArcElement as _Arc } from 'chart.js'; // kept for tree-shaking
import {
  TrendingUp, ShoppingCart, Package, DollarSign,
  RefreshCw, XCircle, CalendarRange, Trophy, TrendingDown,
} from 'lucide-react';
import { getAnalyticsDashboard, getProducts } from '../services/api';
import {
  localYMD, addDaysYMD, startOfMonthYMD, startOfQuarterYMD, startOfYearYMD,
} from '../utils/dateUtils';

// ─── Same GLOBAL_CSS as Dashboard so variables always resolve ─────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  .abk-dash {
    --cream:#F0F7E2;--cream-deep:#E4F0CF;--ink:#0F1F04;--ink-mid:#3A5220;
    --ink-light:#6A8A4A;--ink-faint:#A8C080;--border:#D0E4B0;--border-light:#E2EFC8;
    --card:#FFFFFF;--card-hover:#F3FAE6;
    --green:#1D9E75;--green-bg:#E1F5EE;
    --blue:#185FA5;--blue-bg:#E6F1FB;
    --purple:#534AB7;--purple-bg:#EEEDFE;
    --amber:#854F0B;--amber-bg:#FAEEDA;
    --red-bg:#FCEBEB;--red-border:#F7C1C1;--red-text:#791F1F;
    --yellow-bg:#FAEEDA;--yellow-border:#FAC775;--yellow-text:#633806;
    --texture-col:#C8DCA8;
  }
  .abk-dash.abk-dark {
    --cream:#0D1117;--cream-deep:#161B22;--ink:#E6EDF3;--ink-mid:#B8C9DB;
    --ink-light:#8BA4BE;--ink-faint:#5A7A96;--border:#21303F;--border-light:#1A2535;
    --card:#13192A;--card-hover:#1C2540;
    --green:#3DD68C;--green-bg:#0D2B1F;
    --blue:#58A6FF;--blue-bg:#0D1F35;
    --purple:#A78BFA;--purple-bg:#1A1535;
    --amber:#F0A742;--amber-bg:#2A1C06;
    --red-bg:#1F0D0D;--red-border:#3D1515;--red-text:#FF8080;
    --yellow-bg:#1F1608;--yellow-border:#3D2A0A;--yellow-text:#F5C842;
    --texture-col:#1A2535;
  }
  .abk-dash,.abk-dash *{font-family:'DM Sans',sans-serif;box-sizing:border-box;}
  .abk-serif{font-family:'Playfair Display',Georgia,serif !important;}
  .abk-texture::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;
    background-image:linear-gradient(var(--texture-col) 1px,transparent 1px),linear-gradient(90deg,var(--texture-col) 1px,transparent 1px);
    background-size:48px 48px;opacity:.25;}
  .abk-dash.abk-dark.abk-texture::before{opacity:.18;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes scaleIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
  @keyframes barGrow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  .abk-anim-fade-up{opacity:0;animation:fadeUp .45s ease both;}
  .abk-anim-scale-in{opacity:0;animation:scaleIn .45s ease both;}
  .abk-prog-fill{transform-origin:left;animation:barGrow .85s ease both;}

  /* ── Responsive: tablet ── */
  @media (max-width:1023px) {
    .abk-ana-kpi-4  { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
    .abk-ana-grid-2 { grid-template-columns: 1fr !important; }
    .abk-ana-grid-3 { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
    .abk-ana-filter { flex-wrap: wrap !important; }
  }

  /* ── Responsive: phone ── */
  @media (max-width:767px) {
    .abk-ana-pad    { padding: 1rem 0.75rem 3rem !important; }
    .abk-ana-kpi-4  { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
    .abk-ana-grid-2 { grid-template-columns: 1fr !important; }
    .abk-ana-grid-3 { grid-template-columns: 1fr !important; }
    .abk-ana-filter { flex-direction: column !important; }
    .abk-ana-filter > * { width: 100% !important; }
    /* Rank cards: 2 per row on phone instead of 5 */
    .abk-ana-rank-grid { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }
  }

  @media (max-width:480px) {
    .abk-ana-pad { padding: 0.75rem 0.5rem 2rem !important; }
    .abk-ana-kpi-4 { grid-template-columns: 1fr !important; }
  }
  /* iOS: prevent zoom on input focus */
  @media (max-width:767px) {
    input, select, textarea { font-size: 16px !important; }
  }

`;

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

const fmt    = n => (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = n => (n ?? 0).toLocaleString('en-US');

// ─── Date helpers ─────────────────────────────────────────────────────────────
// ── Date range resolver — maps preset IDs to from/to/granularity ─────────────
function resolveRange(preset, customFrom, customTo) {
  const today = localYMD();
  switch (preset) {
    // Day = today only
    case 'DAY':
      return { from: today, to: today, granularity: 'hour' };
    // Week = last 7 days
    case 'WEEK':
      return { from: addDaysYMD(today, -6), to: today, granularity: 'day' };
    // Month = start of current month to today
    case 'MONTH':
      return { from: startOfMonthYMD(), to: today, granularity: 'day' };
    // Year = start of current year to today
    case 'YEAR':
      return { from: startOfYearYMD(), to: today, granularity: 'month' };
    // Custom = user-selected date range
    case 'CUSTOM': {
      let from = customFrom || today;
      let to   = customTo   || today;
      if (from > to) { const s = from; from = to; to = s; }
      const days = Math.max(0, Math.round(
        (new Date(to + 'T00:00:00') - new Date(from + 'T00:00:00')) / 86400000
      )) + 1;
      return {
        from,
        to,
        granularity: from === to ? 'hour' : days > 120 ? 'month' : 'day',
      };
    }
    // Fallback
    default:
      return { from: addDaysYMD(today, -6), to: today, granularity: 'day' };
  }
}

// ─── KPI Card — matches Dashboard's KpiCard style ────────────────────────────
function KpiCard({ label, value, sub, Icon, stripeColor, iconBg, iconColor, progPct, delay }) {
  return (
    <div className="abk-anim-fade-up" style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: '1.1rem 1.1rem .9rem',
      position: 'relative',
      overflow: 'hidden',
      transition: 'background .3s, border-color .3s',
      animationDelay: delay,
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: stripeColor }} />
      <div style={{
        width: 32, height: 32, borderRadius: 8, background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 9, marginTop: 4,
      }}>
        <Icon size={15} color={iconColor} />
      </div>
      <div className="abk-serif" style={{
        fontSize: 24, fontWeight: 700, color: iconColor,
        letterSpacing: -0.3, marginBottom: 4,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.15,
      }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-light)', fontWeight: 400 }}>{label}</div>
      <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', fontWeight: 300, marginTop: 1 }}>{sub}</div>
      <div style={{ height: 2, background: 'var(--cream-deep)', borderRadius: 2, overflow: 'hidden', marginTop: 9 }}>
        <div className="abk-prog-fill" style={{
          height: '100%', borderRadius: 2, background: stripeColor,
          width: `${Math.max(2, progPct)}%`,
          animationDelay: `calc(${delay} + .5s)`,
        }} />
      </div>
    </div>
  );
}

// ─── Section card wrapper ─────────────────────────────────────────────────────
function SectionCard({ title, sub, delay, children, style }) {
  return (
    <div className="abk-anim-scale-in" style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: '1.15rem',
      transition: 'background .3s, border-color .3s',
      animationDelay: delay,
      ...style,
    }}>
      <div style={{ marginBottom: 14 }}>
        <div className="abk-serif" style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2, fontWeight: 300 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Analytics({ dark: darkProp }) {
  const { t } = useTranslation();

  // Inject shared CSS — same pattern as Dashboard
  useEffect(() => {
    const id = 'abk-analytics-css';
    let tag = document.getElementById(id);
    if (!tag) {
      tag = document.createElement('style');
      tag.id = id;
      document.head.appendChild(tag);
    }
    tag.innerHTML = GLOBAL_CSS;
    return () => { const el = document.getElementById(id); if (el) el.remove(); };
  }, []);

  // Accept dark from parent; fall back to localStorage so theme is consistent
  const dark = darkProp ?? (localStorage.getItem('abk-dark') === 'true');

  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(false);
  const [preset, setPreset]         = useState('WEEK');
  const [customFrom, setCustomFrom] = useState(localYMD());
  const [customTo, setCustomTo]     = useState(localYMD());
  const [summary, setSummary]       = useState(null);
  const [activeTab, setActiveTab]   = useState('top');

  // ── Filter presets: Day · Week · Month · Year · Custom ──────────────────
  const PRESETS = useMemo(() => [
    { id: 'DAY',    label: t('analytics.today')     || 'Day'    },
    { id: 'WEEK',   label: t('analytics.last7')     || 'Week'   },
    { id: 'MONTH',  label: t('analytics.thisMonth') || 'Month'  },
    { id: 'YEAR',   label: t('analytics.year')      || 'Year'   },
    { id: 'CUSTOM', label: t('analytics.custom')    || 'Custom' },
  ], [t]);

  const range = useMemo(() => resolveRange(preset, customFrom, customTo), [preset, customFrom, customTo]);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const { from, to, granularity } = resolveRange(preset, customFrom, customTo);
      const [p, dash] = await Promise.all([
        getProducts().catch(() => []),
        getAnalyticsDashboard({ from, to, granularity, includeSeries: true }),
      ]);
      setProducts(Array.isArray(p) ? p : []);
      if (!dash) { setError(true); setSummary(null); }
      else       { setSummary(dash); setError(false); }
    } catch { setError(true); }
    finally   { setLoading(false); }
  }, [preset, customFrom, customTo]);

  useEffect(() => { load(); }, [load]);

  // ── Stock counts ──────────────────────────────────────────────────────────
  const stockCounts = useMemo(() => ({
    inStock:    products.filter(x => x.status === 'IN_STOCK').length,
    lowStock:   products.filter(x => x.status === 'LOW_STOCK').length,
    outOfStock: products.filter(x => x.status === 'OUT_OF_STOCK').length,
    total:      products.length,
  }), [products]);

  // ── Donut (reuse Dashboard's SVG approach) ────────────────────────────────
  const donutSegments = [
    { label: t('analytics.inStock'),    value: stockCounts.inStock,    color: dark ? '#3DD68C' : '#34d399' },
    { label: t('analytics.lowStock'),   value: stockCounts.lowStock,   color: dark ? '#58A6FF' : '#60a5fa' },
    { label: t('analytics.outOfStock'), value: stockCounts.outOfStock, color: dark ? '#A78BFA' : '#a78bfa' },
  ];

  function DonutChart({ segments, total }) {
    const cx = 80, cy = 80, R = 58, r = 36, gap = 3;
    function polar(deg, radius) {
      const rad = ((deg - 90) * Math.PI) / 180;
      return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
    }
    function arcPath(s, e) {
      const s1 = polar(s + gap/2, R), e1 = polar(e - gap/2, R);
      const s2 = polar(e - gap/2, r), e2 = polar(s + gap/2, r);
      const lg = e - s - gap > 180 ? 1 : 0;
      return `M${s1.x} ${s1.y} A${R} ${R} 0 ${lg} 1 ${e1.x} ${e1.y} L${s2.x} ${s2.y} A${r} ${r} 0 ${lg} 0 ${e2.x} ${e2.y}Z`;
    }
    let cur = 0;
    const computed = segments.map(seg => {
      const pct = total > 0 ? seg.value / total : 0;
      const sw = pct * 360;
      const s = cur; cur += sw;
      return { ...seg, pct: Math.round(pct * 100), start: s, end: cur };
    });
    return (
      <svg viewBox="0 0 160 160" width="148" height="148">
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--cream-deep)" strokeWidth={19} />
        {computed.map((seg, i) => {
          if (!seg.value) return null;
          const lp = polar((seg.start + seg.end) / 2, R + 18);
          return (
            <g key={i}>
              <path d={arcPath(seg.start, seg.end)} fill={seg.color}
                style={{ filter: 'drop-shadow(0 1px 4px rgba(0,0,0,.25))' }} />
              <text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle"
                fontSize="9.5" fontWeight="700" fill={seg.color}>{seg.pct}%</text>
            </g>
          );
        })}
        <text x={cx} y={cy-7} textAnchor="middle" fontSize="21" fontWeight="700"
          fill="var(--ink)" className="abk-serif">{total}</text>
        <text x={cx} y={cy+12} textAnchor="middle" fontSize="8"
          fill="var(--ink-faint)" letterSpacing="0.5">total</text>
      </svg>
    );
  }

  // ── Product rankings ──────────────────────────────────────────────────────
  const allProducts = useMemo(() => {
    const source = summary?.topProducts?.length
      ? summary.topProducts
      : products.filter(p => (p.revenue ?? p.totalRevenue ?? 0) > 0).map(p => ({
          name: p.name,
          revenue: p.revenue ?? p.totalRevenue ?? 0,
          quantity: p.quantity ?? p.totalQuantity ?? p.unitsSold ?? 0,
        }));
    return [...source].sort((a, b) => (b.revenue ?? 0) - (a.revenue ?? 0));
  }, [summary, products]);

  const top5    = allProducts.slice(0, 5);
  const bottom5 = [...allProducts].reverse().slice(0, 5);

  // ── Chart colors derived from CSS vars (works light + dark) ──────────────
  const chartColors = dark
    ? { revenue: '#58A6FF', profit: '#3DD68C', loss: '#FF8080', qty: '#A78BFA', revBg: 'rgba(88,166,255,0.10)', profBg: 'rgba(61,214,140,0.08)', lossBg: 'rgba(255,128,128,0.08)', qtyBg: 'rgba(167,139,250,0.10)' }
    : { revenue: '#185FA5', profit: '#1D9E75', loss: '#ef4444', qty: '#534AB7', revBg: 'rgba(24,95,165,0.10)', profBg: 'rgba(29,158,117,0.08)', lossBg: 'rgba(239,68,68,0.08)', qtyBg: 'rgba(83,74,183,0.10)' };

  const series = summary?.series || [];
  const labels = series.map(p => p.label || p.dateKey || '');

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 10, font: { size: 11, family: "'DM Sans', sans-serif" },
          color: dark ? '#8BA4BE' : '#6A8A4A', padding: 14,
        },
      },
      tooltip: {
        backgroundColor: dark ? '#13192A' : '#fff',
        borderColor: dark ? '#21303F' : '#D0E4B0',
        borderWidth: 1,
        titleColor: dark ? '#E6EDF3' : '#0F1F04',
        bodyColor: dark ? '#8BA4BE' : '#6A8A4A',
        titleFont: { family: "'Playfair Display', serif", size: 12 },
        bodyFont: { family: "'DM Sans', sans-serif", size: 11 },
        padding: 10,
      },
    },
    scales: {
      x: {
        ticks: { maxRotation: 45, minRotation: 0, font: { size: 10, family: "'DM Sans', sans-serif" }, color: dark ? '#5A7A96' : '#A8C080' },
        grid: { display: false },
        border: { color: dark ? '#21303F' : '#D0E4B0' },
      },
      y: {
        ticks: { font: { size: 10, family: "'DM Sans', sans-serif" }, color: dark ? '#5A7A96' : '#A8C080' },
        grid: { color: dark ? 'rgba(33,48,63,0.8)' : 'rgba(208,228,176,0.5)' },
        border: { display: false },
      },
    },
  };

  const barOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: dark ? '#13192A' : '#fff',
        borderColor: dark ? '#21303F' : '#D0E4B0',
        borderWidth: 1,
        titleColor: dark ? '#E6EDF3' : '#0F1F04',
        bodyColor: dark ? '#8BA4BE' : '#6A8A4A',
        titleFont: { family: "'Playfair Display', serif", size: 12 },
        bodyFont: { family: "'DM Sans', sans-serif", size: 11 },
        padding: 10,
        callbacks: { label: ctx => ` $${fmt(ctx.parsed.y)}` },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11, family: "'DM Sans', sans-serif" }, color: dark ? '#5A7A96' : '#A8C080' }, border: { color: 'transparent' } },
      y: {
        grid: { color: dark ? 'rgba(33,48,63,0.8)' : 'rgba(208,228,176,0.5)' },
        ticks: { font: { size: 10, family: "'DM Sans', sans-serif" }, color: dark ? '#5A7A96' : '#A8C080', callback: v => `$${fmtInt(v)}` },
        border: { display: false },
      },
    },
  };

  const topBarColors    = dark
    ? ['rgba(240,167,66,.8)', 'rgba(88,166,255,.7)', 'rgba(61,214,140,.7)', 'rgba(167,139,250,.7)', 'rgba(90,122,150,.7)']
    : ['rgba(240,167,66,.85)', 'rgba(24,95,165,.75)', 'rgba(29,158,117,.75)', 'rgba(83,74,183,.75)', 'rgba(168,192,128,.75)'];
  const bottomBarColors = dark
    ? ['rgba(255,128,128,.8)', 'rgba(249,115,22,.7)', 'rgba(234,179,8,.7)', 'rgba(167,139,250,.7)', 'rgba(90,122,150,.7)']
    : ['rgba(239,68,68,.8)', 'rgba(249,115,22,.7)', 'rgba(234,179,8,.7)', 'rgba(83,74,183,.6)', 'rgba(168,192,128,.6)'];

  const top5BarData = {
    labels: top5.map(p => p.name?.length > 14 ? p.name.slice(0, 14) + '…' : p.name || '—'),
    datasets: [{ label: t('analytics.revenue'), data: top5.map(p => p.revenue ?? 0), backgroundColor: topBarColors, borderColor: topBarColors, borderWidth: 0, borderRadius: 8, borderSkipped: false, barThickness: 36 }],
  };

  const bottom5BarData = {
    labels: bottom5.map(p => p.name?.length > 14 ? p.name.slice(0, 14) + '…' : p.name || '—'),
    datasets: [{ label: t('analytics.revenue'), data: bottom5.map(p => p.revenue ?? 0), backgroundColor: bottomBarColors, borderColor: bottomBarColors, borderWidth: 0, borderRadius: 8, borderSkipped: false, barThickness: 36 }],
  };

  const revenueChart = {
    labels,
    datasets: [{ label: t('analytics.revenue'), data: series.map(p => p.revenue ?? 0), borderColor: chartColors.revenue, backgroundColor: chartColors.revBg, fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: chartColors.revenue }],
  };

  const profitLossChart = {
    labels,
    datasets: [
      { label: t('analytics.netProfitPositive'), data: series.map(p => p.profit ?? 0), borderColor: chartColors.profit, backgroundColor: chartColors.profBg, fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: chartColors.profit },
      { label: t('analytics.netLossMagnitude'),  data: series.map(p => p.loss   ?? 0), borderColor: chartColors.loss,   backgroundColor: chartColors.lossBg,  fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: chartColors.loss },
    ],
  };

  const qtyChart = {
    labels,
    datasets: [{ label: t('analytics.unitsSold'), data: series.map(p => p.quantity ?? 0), borderColor: chartColors.qty, backgroundColor: chartColors.qtyBg, fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: chartColors.qty }],
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) return (
    <div className={`abk-dash${dark ? ' abk-dark' : ''}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--cream)', transition: 'background .3s' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 34, height: 34, border: '3px solid var(--border)', borderTopColor: 'var(--green)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: 'var(--ink-faint)', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>{t('ui.loading')}</p>
      </div>
    </div>
  );

  // ── Error state ───────────────────────────────────────────────────────────
  if (error || !summary) return (
    <div className={`abk-dash${dark ? ' abk-dark' : ''}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--cream)' }}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--red-border)', borderRadius: 14, padding: '2rem', textAlign: 'center', maxWidth: 340 }}>
        <XCircle size={36} style={{ color: 'var(--red-text)', margin: '0 auto 12px' }} />
        <p style={{ color: 'var(--red-text)', fontWeight: 500, marginBottom: 6, fontFamily: "'Playfair Display', serif", fontSize: 16 }}>{t('analytics.unavailable')}</p>
        <p style={{ color: 'var(--ink-faint)', fontSize: 12, marginBottom: 16, fontWeight: 300 }}>{t('analytics.unavailableSub')}</p>
        <button onClick={load} style={{
          padding: '7px 18px', background: 'var(--green)', color: '#fff', border: 'none',
          borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 500,
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          <RefreshCw size={13} /> {t('ui.retry')}
        </button>
      </div>
    </div>
  );

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className={`abk-dash abk-texture${dark ? ' abk-dark' : ''}`}
      style={{ background: 'var(--cream)', minHeight: '100vh', position: 'relative', transition: 'background .3s' }}>

      <div className="abk-ana-pad" style={{ position: 'relative', zIndex: 1, padding: '0 1.5rem 2.5rem' }}>

        {/* ── Page Header ────────────────────────────────────────────────── */}
        <div className="abk-anim-fade-up" style={{ padding: '1.75rem 0 1.25rem' }}>
          <div style={{
            fontSize: 10.5, fontWeight: 500, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--ink-light)',
            marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ display: 'inline-block', width: 18, height: 1.5, background: 'var(--blue)', borderRadius: 1 }} />
            {t('analytics.title') || 'Analytics & Reports'}
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div className="abk-serif" style={{ fontSize: 28, fontWeight: 500, color: 'var(--ink)', letterSpacing: -0.5, lineHeight: 1.15 }}>
                {t('analytics.title') || 'Analytics'}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-light)', fontWeight: 300, marginTop: 4 }}>
                {range.from} → {range.to} · <em style={{ color: 'var(--ink-faint)' }}>{range.granularity}</em>
              </div>
            </div>

            {/* Preset pill strip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 3,
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 12, padding: 4,
              }}>
                {PRESETS.map(p => (
                  <button key={p.id} onClick={() => setPreset(p.id)} style={{
                    padding: '5px 11px', borderRadius: 9, border: 'none', cursor: 'pointer',
                    fontSize: 11.5, fontWeight: 600, letterSpacing: '0.01em',
                    transition: 'background .18s, color .18s',
                    background: preset === p.id ? 'var(--blue)' : 'transparent',
                    color: preset === p.id ? '#fff' : 'var(--ink-light)',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    {p.label}
                  </button>
                ))}
              </div>
              <button onClick={load} style={{
                padding: 8, background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 10, cursor: 'pointer', color: 'var(--ink-light)',
                display: 'flex', alignItems: 'center', transition: 'background .15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--cream-deep)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--card)'}
              >
                <RefreshCw size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Custom date picker ─────────────────────────────────────────── */}
        {preset === 'CUSTOM' && (
          <div className="abk-anim-fade-up" style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 12,
            marginBottom: 16, padding: '14px 16px',
            background: 'var(--card)', borderRadius: 12,
            border: '1px solid var(--border)',
          }}>
            {[
              { label: t('analytics.from'), val: customFrom, set: setCustomFrom },
              { label: t('analytics.to'),   val: customTo,   set: setCustomTo   },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-light)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 4 }}>{label}</div>
                <input type="date" value={val} onChange={e => set(e.target.value)} style={{
                  border: '1px solid var(--border)', borderRadius: 9, padding: '7px 12px',
                  fontSize: 13, background: 'var(--cream-deep)', color: 'var(--ink)',
                  fontFamily: "'DM Sans', sans-serif", outline: 'none',
                }} />
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--ink-faint)', fontWeight: 300 }}>
              <CalendarRange size={13} /> {t('analytics.localDates')}
            </div>
          </div>
        )}

        {/* ── KPI Cards ─────────────────────────────────────────────────── */}
        <div className="abk-ana-kpi-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 10, marginBottom: '1.1rem' }}>
          <KpiCard label={t('analytics.revenue')}  value={`$${fmt(summary.totalRevenue)}`}    sub={`${summary.saleCount} ${t('analytics.sales')}`}            Icon={DollarSign}   stripeColor="var(--green)"  iconBg="var(--green-bg)"  iconColor="var(--green)"  progPct={72} delay=".06s" />
          <KpiCard label={t('analytics.itemsSold')} value={fmtInt(summary.totalQuantity)}      sub={t('analytics.units')}                                      Icon={ShoppingCart} stripeColor="var(--blue)"   iconBg="var(--blue-bg)"   iconColor="var(--blue)"   progPct={60} delay=".13s" />
          <KpiCard label={t('analytics.avgOrder')}  value={`$${fmt(summary.avgOrderValue)}`}  sub={t('analytics.perSale')}                                    Icon={TrendingUp}   stripeColor="var(--purple)" iconBg="var(--purple-bg)" iconColor="var(--purple)" progPct={50} delay=".20s" />
          <KpiCard label={t('analytics.netProfit')} value={`$${fmt(summary.netProfit)}`}      sub={`${summary.netMarginPct?.toFixed?.(1) ?? 0}% ${t('analytics.netMargin')}`} Icon={Package} stripeColor="var(--amber)" iconBg="var(--amber-bg)" iconColor="var(--amber)" progPct={40} delay=".27s" />
        </div>

        {/* ── Line Charts row ────────────────────────────────────────────── */}
        <div className="abk-ana-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10, marginBottom: 10 }}>
          <SectionCard title={t('analytics.revenueTrend')} sub={t('analytics.last7') + ' · ' + range.granularity} delay=".32s">
            <div style={{ height: 240 }}><Line data={revenueChart} options={chartOptions} /></div>
          </SectionCard>
          <SectionCard title={t('analytics.profitVsLoss')} sub={t('analytics.netProfitPositive') + ' vs ' + t('analytics.netLossMagnitude')} delay=".38s">
            <div style={{ height: 240 }}><Line data={profitLossChart} options={chartOptions} /></div>
          </SectionCard>
        </div>

        <SectionCard title={t('analytics.salesVolume')} sub={t('analytics.unitsSold')} delay=".44s" style={{ marginBottom: 10 }}>
          <div style={{ height: 200 }}><Line data={qtyChart} options={chartOptions} /></div>
        </SectionCard>

        {/* ── Bottom section: Donut + Rankings ──────────────────────────── */}
        <div className="abk-ana-grid-2" style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 10 }}>

          {/* Inventory Donut */}
          <SectionCard title={t('analytics.inventoryHealth')} sub={`${stockCounts.total} ${t('analytics.productsTotal')}`} delay=".50s">
            {stockCounts.total === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180, color: 'var(--ink-faint)', fontSize: 13 }}>
                {t('analytics.noProductData')}
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0 14px' }}>
                  <DonutChart segments={donutSegments} total={stockCounts.total} />
                </div>
                {donutSegments.map(seg => {
                  const pct = stockCounts.total > 0 ? Math.round((seg.value / stockCounts.total) * 100) : 0;
                  return (
                    <div key={seg.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderTop: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: seg.color }} />
                        <span style={{ fontSize: 11.5, color: 'var(--ink-light)', marginLeft: 7, fontWeight: 300 }}>{seg.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)' }}>{seg.value}</span>
                        <span style={{ fontSize: 10.5, fontWeight: 500, minWidth: 30, textAlign: 'right', color: seg.color }}>{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </SectionCard>

          {/* Top / Bottom Products */}
          <SectionCard title={activeTab === 'top' ? (t('analytics.top5Title') || 'Top 5 Products') : (t('analytics.bottom5Title') || 'Least 5 Products')} delay=".56s">

            {/* Tab toggle — pill style matching Dashboard's aesthetic */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, marginTop: -4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {activeTab === 'top'
                  ? <Trophy size={14} style={{ color: 'var(--amber)' }} />
                  : <TrendingDown size={14} style={{ color: 'var(--red-text)' }} />}
              </div>
              <div style={{ display: 'flex', gap: 4, background: 'var(--cream-deep)', border: '1px solid var(--border)', borderRadius: 10, padding: 3 }}>
                <button onClick={() => setActiveTab('top')} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 11.5, fontWeight: 600, letterSpacing: '0.01em',
                  transition: 'background .18s, color .18s',
                  background: activeTab === 'top' ? 'var(--amber)' : 'transparent',
                  color: activeTab === 'top' ? '#fff' : 'var(--ink-light)',
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  <Trophy size={10} /> Top 5
                </button>
                <button onClick={() => setActiveTab('bottom')} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 11.5, fontWeight: 600, letterSpacing: '0.01em',
                  transition: 'background .18s, color .18s',
                  background: activeTab === 'bottom' ? 'var(--red-text)' : 'transparent',
                  color: activeTab === 'bottom' ? '#fff' : 'var(--ink-light)',
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  <TrendingDown size={10} /> Least 5
                </button>
              </div>
            </div>

            {allProducts.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--ink-faint)', fontSize: 13 }}>
                {t('analytics.noSalesData')}
              </div>
            ) : (
              <>
                <div style={{ height: 190, marginBottom: 14 }}>
                  <Bar data={activeTab === 'top' ? top5BarData : bottom5BarData} options={barOptions} />
                </div>

                {/* Mini rank cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 6 }}
                  className="abk-ana-rank-grid">
                  {(activeTab === 'top' ? top5 : bottom5).map((item, i) => {
                    const isTop = activeTab === 'top';
                    const color = isTop ? topBarColors[i] : bottomBarColors[i];
                    const rankEmoji = isTop ? ['🥇', '🥈', '🥉', '4th', '5th'] : ['1st', '2nd', '3rd', '4th', '5th'];
                    return (
                      <div key={item.name || i} style={{
                        borderRadius: 10, padding: '10px 8px',
                        border: '1px solid var(--border-light)',
                        background: 'var(--cream-deep)',
                        textAlign: 'center',
                        transition: 'background .15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--card-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--cream-deep)'}
                      >
                        <div style={{ fontSize: 16, marginBottom: 4 }}>{isTop ? rankEmoji[i] : <span style={{ fontSize: 10.5, fontWeight: 700, color }}>{rankEmoji[i]}</span>}</div>
                        <p style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--ink)', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.name?.length > 11 ? item.name.slice(0, 11) + '…' : item.name || '—'}
                        </p>
                        <p style={{ fontSize: 11.5, fontWeight: 700, color, margin: 0 }}>${fmt(item.revenue)}</p>
                        {item.quantity != null && (
                          <p style={{ fontSize: 10, color: 'var(--ink-faint)', margin: '2px 0 0', fontWeight: 300 }}>{fmtInt(item.quantity)} {t('analytics.units')}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </SectionCard>
        </div>

        {/* ── Footer rule ────────────────────────────────────────────────── */}
        <div style={{
          marginTop: '1.1rem', paddingTop: 14,
          borderTop: dark ? '1px solid rgba(88,166,255,.08)' : '1px solid rgba(168,192,128,.3)',
          fontSize: 11, color: dark ? 'rgba(91,143,179,.45)' : 'rgba(168,192,128,.6)',
          fontWeight: 300, letterSpacing: '0.02em',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          Analytics data reflects the selected date range. All figures in USD.
        </div>

      </div>
    </div>
  );
}