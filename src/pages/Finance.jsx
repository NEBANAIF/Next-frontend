import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp, TrendingDown, DollarSign, Plus, Trash2,
  RefreshCw, X, CheckCircle, ChevronLeft, ChevronRight,
  Search, Calendar, Wallet, BarChart2, ShoppingCart,
  Package, AlertCircle, XCircle, Receipt,
} from 'lucide-react';
import { getSales, getExpenses, createExpense, deleteExpense, getAnalyticsDashboard } from '../services/api';
import { localYMD, addDaysYMD, startOfMonthYMD, startOfYearYMD } from '../utils/dateUtils';

/* ─────────────────────────────────────────────────────────────────────────────
   Design-system CSS — same token set as Dashboard / Products / Sales
   ───────────────────────────────────────────────────────────────────────── */
const FINANCE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  .abk-fin {
    --cream:         #F0F7E2;
    --cream-deep:    #E4F0CF;
    --ink:           #0F1F04;
    --ink-mid:       #3A5220;
    --ink-light:     #6A8A4A;
    --ink-faint:     #A8C080;
    --border:        #D0E4B0;
    --border-light:  #E2EFC8;
    --card:          #FFFFFF;
    --card-hover:    #F3FAE6;
    --green:         #1D9E75;
    --green-bg:      #E1F5EE;
    --blue:          #185FA5;
    --blue-bg:       #E6F1FB;
    --purple:        #534AB7;
    --purple-bg:     #EEEDFE;
    --amber:         #854F0B;
    --amber-bg:      #FAEEDA;
    --red-bg:        #FCEBEB;
    --red-border:    #F7C1C1;
    --red-text:      #791F1F;
    --red-accent:    #C53030;
    --yellow-bg:     #FAEEDA;
    --yellow-border: #FAC775;
    --yellow-text:   #633806;
    --texture-col:   #C8DCA8;
  }

  .abk-fin.abk-dark {
    --cream:         #0D1117;
    --cream-deep:    #161B22;
    --ink:           #E6EDF3;
    --ink-mid:       #B8C9DB;
    --ink-light:     #8BA4BE;
    --ink-faint:     #5A7A96;
    --border:        #21303F;
    --border-light:  #1A2535;
    --card:          #13192A;
    --card-hover:    #1C2540;
    --green:         #3DD68C;
    --green-bg:      #0D2B1F;
    --blue:          #58A6FF;
    --blue-bg:       #0D1F35;
    --purple:        #A78BFA;
    --purple-bg:     #1A1535;
    --amber:         #F0A742;
    --amber-bg:      #2A1C06;
    --red-bg:        #1F0D0D;
    --red-border:    #3D1515;
    --red-text:      #FF8080;
    --red-accent:    #E05252;
    --yellow-bg:     #1F1608;
    --yellow-border: #3D2A0A;
    --yellow-text:   #F5C842;
    --texture-col:   #1A2535;
  }

  .abk-fin, .abk-fin * { font-family:'DM Sans',sans-serif; box-sizing:border-box; }
  .abk-fin .abk-serif   { font-family:'Playfair Display',Georgia,serif !important; }

  .abk-fin.abk-texture::before {
    content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
    background-image:
      linear-gradient(var(--texture-col) 1px, transparent 1px),
      linear-gradient(90deg, var(--texture-col) 1px, transparent 1px);
    background-size:48px 48px; opacity:.25;
  }
  .abk-fin.abk-dark.abk-texture::before { opacity:.18; }

  @keyframes abkFFadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes abkFFadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes abkFScaleIn { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
  @keyframes abkFBarGrow { from{transform:scaleX(0)} to{transform:scaleX(1)} }
  @keyframes abkFToast   { 0%{opacity:0;transform:translateY(-12px)} 10%{opacity:1;transform:translateY(0)} 85%{opacity:1} 100%{opacity:0} }

  .abk-fin .abk-anim-fade-up  { opacity:0; animation:abkFFadeUp  .45s ease both; }
  .abk-fin .abk-anim-fade-in  { opacity:0; animation:abkFFadeIn  .45s ease both; }
  .abk-fin .abk-anim-scale-in { opacity:0; animation:abkFScaleIn .45s ease both; }
  .abk-fin .abk-toast          { animation:abkFToast 3.2s ease forwards; }

  .abk-fin .abk-row-hover { transition:background .15s; }
  .abk-fin .abk-row-hover:hover { background:var(--card-hover) !important; }
  .abk-fin .abk-period-row { transition:background .15s; cursor:pointer; }
  .abk-fin .abk-period-row:hover { background:var(--card-hover) !important; }

  .abk-fin .abk-prog-fill { transform-origin:left; animation:abkFBarGrow .85s ease both; }

  .abk-fin .abk-input {
    width:100%; border:1px solid var(--border); border-radius:10px;
    padding:9px 12px; font-size:13px; color:var(--ink);
    background:var(--card); outline:none;
    transition:border-color .15s, box-shadow .15s;
    font-family:'DM Sans',sans-serif;
  }
  .abk-fin .abk-input:focus {
    border-color:var(--red-accent);
    box-shadow:0 0 0 3px rgba(197,48,48,.1);
  }
  .abk-fin .abk-input::placeholder { color:var(--ink-faint); }
  .abk-fin.abk-dark .abk-input    { background:var(--cream-deep); }

  .abk-fin .abk-label {
    display:block; font-size:10.5px; font-weight:600;
    text-transform:uppercase; letter-spacing:.09em;
    color:var(--ink-light); margin-bottom:6px;
  }

  .abk-fin ::-webkit-scrollbar       { width:5px; }
  .abk-fin ::-webkit-scrollbar-track { background:transparent; }
  .abk-fin ::-webkit-scrollbar-thumb { background:var(--border); border-radius:4px; }

  /* ── Responsive: tablet ── */
  @media (max-width:1023px) {
    .abk-fin-kpi-3   { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
    .abk-fin-grid-2  { grid-template-columns: 1fr !important; }
    .abk-fin-filter  { flex-wrap: wrap !important; }
  }

  /* ── Responsive: phone ── */
  @media (max-width:767px) {
    /* Root page */
    .abk-fin { overflow-x: hidden !important; box-sizing: border-box !important; }
    .abk-fin-pad { padding: 1rem 0.75rem 3rem !important; box-sizing: border-box !important; width: 100% !important; }

    /* Grids */
    /* Stacked full-width cards on phone — one KPI per row, easier to read */
    .abk-fin-kpi-3  { grid-template-columns: 1fr !important; }
    .abk-fin-grid-2 { grid-template-columns: 1fr !important; }

    /* Kill inline gridColumn span — period table must not span 2 cols on 1-col grid */
    .abk-fin-period-span { grid-column: 1 !important; }

    /* Filters */
    .abk-fin-filter { flex-direction: column !important; }
    .abk-fin-filter > * { width: 100% !important; box-sizing: border-box !important; }

    /* Page header */
    .abk-fin-header { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
    .abk-fin-header > * { width: 100% !important; }

    /* All cards: prevent overflow */
    .abk-fin-grid-2 > div,
    .abk-fin-period-span {
      min-width: 0 !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
    }

    /* Scrollable tables */
    /* Scrollable tables (period comparison - keep scrollable) */
    .abk-fin-table-wrap.abk-fin-scroll-table {
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch !important;
    }
    .abk-fin-table-wrap.abk-fin-scroll-table table { min-width: 720px !important; table-layout: auto !important; }
    .abk-fin-table-wrap.abk-fin-scroll-table th { padding: 8px 8px !important; font-size: 9px !important; }
    .abk-fin-table-wrap.abk-fin-scroll-table td { padding: 8px 8px !important; font-size: 11.5px !important; white-space: nowrap !important; }

    /* ── Expenses table: horizontal scroll — full table, swipe to see all columns ──
       NOTE: explicit px min-width (not width:max-content) — max-content is unreliable
       for <table> sizing on mobile browsers and was causing columns to squish/wrap
       (e.g. amounts and category badges breaking mid-word) instead of triggering
       scroll. Matches responsive.css's .abk-fin-table-wrap.abk-fin-stack-table rule
       and the pattern used by Products/Sales/UserAccess. */
    .abk-fin-table-wrap.abk-fin-stack-table { overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; }
    .abk-fin-table-wrap.abk-fin-stack-table table { min-width: 700px !important; table-layout: auto !important; }

    /* Net profit chip: stack vertically */
    .abk-fin-net-chip {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 4px !important;
    }
    .abk-fin-net-chip .abk-fin-net-val { font-size: 18px !important; }

    /* Formula row: stack vertically */
    .abk-fin-formula-row {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 4px !important;
    }
    .abk-fin-formula-text {
      font-size: 10px !important;
      word-break: break-all !important;
      white-space: normal !important;
      max-width: 100% !important;
    }
    .abk-fin-formula-val { font-size: 16px !important; }

    /* KPI mini-cards: overflow safety net (value font-size is fixed at 17px by design) */
    .abk-fin-kpi-mini { min-width: 0 !important; overflow: hidden !important; }
    .abk-fin-kpi-mini .abk-fin-kpi-val {
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
    }

    /* Bar rows: label + value must not overflow */
    .abk-fin-bar-row {
      display: flex !important;
      justify-content: space-between !important;
      overflow: hidden !important;
    }
    .abk-fin-bar-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 55%; }
    .abk-fin-bar-val   { flex-shrink: 0; }

    /* Modal grid */
    .abk-fin-modal-grid { grid-template-columns: 1fr !important; }
  }

  @media (max-width:480px) {
    .abk-fin-pad { padding: 0.75rem 0.5rem 2rem !important; }
    .abk-fin-kpi-3 { grid-template-columns: 1fr !important; }
  }

  /* iOS: prevent zoom on input focus */
  @media (max-width:767px) {
    input, select, textarea { font-size: 16px !important; }
  }

`;

/* ── helpers ──────────────────────────────────────────────────────────────── */
function fmt(n) {
  return (Math.abs(n) ?? 0).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(String(d) + 'T00:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}
function calcFinancials(sales, expenses) {
  const revenue       = sales.reduce((s, x) => s + (x.total || 0), 0);
  const cogs          = sales.reduce((s, x) => s + ((x.product?.cost ?? 0) * (x.quantity ?? 0)), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const grossProfit   = revenue - cogs;
  const netProfit     = grossProfit - totalExpenses;
  const grossMargin   = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const netMargin     = revenue > 0 ? (netProfit   / revenue) * 100 : 0;
  return { revenue, cogs, totalExpenses, grossProfit, netProfit, grossMargin, netMargin };
}
// ── Finance date range resolver ──────────────────────────────────────────────
// Supports: day · week · month · year · custom
function getRange(period, customFrom, customTo) {
  const today  = localYMD();
  const labels = {
    day:    'Today',
    week:   'Last 7 Days',
    month:  'This Month',
    year:   'This Year',
    custom: 'Custom Range',
  };
  if (period === 'day')    return { from: today,                 to: today,  label: labels.day   };
  if (period === 'week')   return { from: addDaysYMD(today, -6), to: today,  label: labels.week  };
  if (period === 'month')  return { from: startOfMonthYMD(),     to: today,  label: labels.month };
  if (period === 'year')   return { from: startOfYearYMD(),      to: today,  label: labels.year  };
  if (period === 'custom') {
    const from = customFrom || today;
    const to   = customTo   || today;
    return { from: from < to ? from : to, to: from < to ? to : from, label: labels.custom };
  }
  // fallback — all time
  return { from: '2000-01-01', to: today, label: 'All Time' };
}

const EXPENSE_CATEGORIES = [
  'Rent','Salaries','Utilities','Supplies',
  'Marketing','Transport','Maintenance','Taxes','Other',
];

// Maps English key → translated label for display
function useCategoryLabel() {
  const { t } = useTranslation();
  return (cat) => t(`finance.categories.${cat}`, cat);
}
const emptyExpenseForm = () => ({ category:'', amount:'', description:'', date:localYMD() });

/* ── shared UI atoms ──────────────────────────────────────────────────────── */
function Modal({ onClose, children, maxWidth = 480 }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:16, backdropFilter:'blur(4px)' }}>
      <div className="abk-anim-scale-in" style={{ background:'var(--card)', borderRadius:18, width:'100%', maxWidth, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,.2), 0 2px 8px rgba(0,0,0,.1)', border:'1px solid var(--border)' }}>
        {children}
      </div>
    </div>
  );
}
function ModalHeader({ title, subtitle, onClose, accent }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.1rem 1.4rem', borderBottom:'1px solid var(--border-light)', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:accent }} />
      <div style={{ marginTop:4 }}>
        <div className="abk-serif" style={{ fontSize:16, fontWeight:500, color:'var(--ink)' }}>{title}</div>
        {subtitle && <div style={{ fontSize:11, color:'var(--ink-faint)', marginTop:2, fontWeight:300 }}>{subtitle}</div>}
      </div>
      <button onClick={onClose} style={{ width:30, height:30, borderRadius:8, border:'1px solid var(--border)', background:'var(--cream-deep)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--ink-light)' }}><X size={14} /></button>
    </div>
  );
}
function ModalFooter({ children }) {
  return <div style={{ display:'flex', gap:10, padding:'1rem 1.4rem', borderTop:'1px solid var(--border-light)' }}>{children}</div>;
}
function BtnPrimary({ onClick, disabled, children, color = 'var(--green)' }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ flex:1, padding:'10px 0', background:color, color:'#fff', border:'none', borderRadius:11, fontSize:13, fontWeight:500, cursor:disabled ? 'not-allowed':'pointer', opacity:disabled?.5:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, transition:'filter .15s', fontFamily:'DM Sans,sans-serif' }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.filter='brightness(1.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.filter='none'; }}
    >{children}</button>
  );
}
function BtnSecondary({ onClick, children }) {
  return (
    <button onClick={onClick} style={{ flex:1, padding:'10px 0', background:'var(--cream-deep)', color:'var(--ink-mid)', border:'1px solid var(--border)', borderRadius:11, fontSize:13, fontWeight:500, cursor:'pointer', transition:'background .15s', fontFamily:'DM Sans,sans-serif' }}
      onMouseEnter={e => e.currentTarget.style.background='var(--border)'}
      onMouseLeave={e => e.currentTarget.style.background='var(--cream-deep)'}
    >{children}</button>
  );
}

/* ── KPI card (same style as Loans/Sales/Dashboard) ──────────────────────── */
function KpiCard({ label, value, sub, Icon, stripeColor, iconBg, iconColor, progPct, delay }) {
  return (
    <div className="abk-anim-fade-up" style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:'1.1rem 1.1rem .9rem', position:'relative', overflow:'hidden', transition:'background .3s, border-color .3s', animationDelay:delay, boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:stripeColor }} />
      <div style={{ width:32, height:32, borderRadius:8, background:iconBg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:9, marginTop:4 }}>
        <Icon size={15} color={iconColor} />
      </div>
      <div className="abk-serif" style={{ fontSize:24, fontWeight:700, color:iconColor, letterSpacing:-0.3, marginBottom:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', lineHeight:1.15 }}>{value}</div>
      <div style={{ fontSize:11, color:'var(--ink-light)', fontWeight:400 }}>{label}</div>
      <div style={{ fontSize:10.5, color:'var(--ink-faint)', fontWeight:300, marginTop:1 }}>{sub}</div>
      <div style={{ height:2, background:'var(--cream-deep)', borderRadius:2, overflow:'hidden', marginTop:9 }}>
        <div className="abk-prog-fill" style={{ height:'100%', borderRadius:2, background:stripeColor, width:`${Math.max(2, progPct)}%`, animationDelay:`calc(${delay} + .5s)` }} />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Finance component
   ════════════════════════════════════════════════════════════════════════════ */
export default function Finance({ dark }) {
  const { t } = useTranslation();
  const categoryLabel = useCategoryLabel();

  useEffect(() => {
    const id = 'abk-finance-css';
    let tag = document.getElementById(id);
    if (!tag) {
      tag = document.createElement('style');
      tag.id = id;
      document.head.appendChild(tag);
    }
    tag.innerHTML = FINANCE_CSS;
    return () => { const el = document.getElementById(id); if (el) el.remove(); };
  }, []);

  const [allSales,       setAllSales]       = useState([]);
  const [allExpenses,    setAllExpenses]     = useState([]);
  const [loading,        setLoading]         = useState(true);
  const [error,          setError]           = useState(false);
  const [period,         setPeriod]          = useState('month');
  const [customFrom,     setCustomFrom]      = useState(localYMD());
  const [customTo,       setCustomTo]        = useState(localYMD());
  const [activeTab,      setActiveTab]       = useState('overview');
  const [showModal,      setShowModal]       = useState(false);
  const [form,           setForm]            = useState(() => emptyExpenseForm());
  const [saving,         setSaving]          = useState(false);
  const [deleteConfirm,  setDeleteConfirm]   = useState(null);
  const [successMsg,     setSuccessMsg]      = useState('');
  const [search,         setSearch]          = useState('');
  const [catFilter,      setCatFilter]       = useState('ALL');
  const [dateFilter,     setDateFilter]      = useState('');
  const [dateFrom,       setDateFrom]        = useState('');
  const [dateTo,         setDateTo]          = useState('');
  const [page,           setPage]            = useState(1);
  const [rowsPerPage,     setRowsPerPage]     = useState(10);
  const [summary,        setSummary]         = useState(null);
  const [compare,        setCompare]         = useState([]);
  const [metricsTick,    setMetricsTick]     = useState(0);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const [sales, expenses] = await Promise.all([getSales().catch(() => []), getExpenses().catch(() => [])]);
      setAllSales(Array.isArray(sales) ? sales : []);
      setAllExpenses(Array.isArray(expenses) ? expenses : []);
    } catch { setError(true); }
    finally { setLoading(false); setMetricsTick(t => t + 1); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let cancelled = false;
    const r = getRange(period, customFrom, customTo);
    (async () => {
      try {
        const s = await getAnalyticsDashboard({ from:r.from, to:r.to, granularity:'day', includeSeries:false });
        if (!cancelled) setSummary(s);
      } catch { if (!cancelled) setSummary(null); }
    })();
    return () => { cancelled = true; };
  }, [period, metricsTick]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const keys = ['day','week','month','year','all'];
      try {
        const rows = await Promise.all(keys.map(async key => {
          const r = getRange(key);
          const s = await getAnalyticsDashboard({ from:r.from, to:r.to, granularity:'day', includeSeries:false }).catch(() => null);
          if (!s) return { key, label:r.label, revenue:0, cogs:0, totalExpenses:0, grossProfit:0, netProfit:0, grossMargin:0, netMargin:0 };
          return { key, label:r.label, revenue:s.totalRevenue, cogs:s.cogs, totalExpenses:s.expenses, grossProfit:s.grossProfit, netProfit:s.netProfit, grossMargin:s.grossMarginPct, netMargin:s.netMarginPct };
        }));
        if (!cancelled) setCompare(rows);
      } catch { if (!cancelled) setCompare([]); }
    })();
    return () => { cancelled = true; };
  }, [metricsTick]);

  function showSuccess(msg) { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3200); }

  const range          = getRange(period, customFrom, customTo);
  const periodSales    = allSales.filter(s => String(s.saleDate).slice(0,10) >= range.from && String(s.saleDate).slice(0,10) <= range.to);
  const periodExpenses = allExpenses.filter(e => String(e.date).slice(0,10) >= range.from && String(e.date).slice(0,10) <= range.to);
  const finFallback    = calcFinancials(periodSales, periodExpenses);
  const fin = summary ? { revenue:summary.totalRevenue, cogs:summary.cogs, totalExpenses:summary.expenses, grossProfit:summary.grossProfit, netProfit:summary.netProfit, grossMargin:summary.grossMarginPct, netMargin:summary.netMarginPct } : finFallback;

  const filteredExp = allExpenses.filter(e => {
    const q = search.toLowerCase();
    const d = String(e.date);
    return (!search || e.category?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q))
      && (catFilter === 'ALL' || e.category === catFilter)
      && (!dateFilter || d === dateFilter)
      && (!dateFrom || d >= dateFrom)
      && (!dateTo   || d <= dateTo);
  });
  const totalPages = Math.max(1, Math.ceil(filteredExp.length / rowsPerPage));
  const paginated  = filteredExp.slice((page-1)*rowsPerPage, page*rowsPerPage);

  const byCategory = EXPENSE_CATEGORIES.map(cat => ({
    cat,
    total: periodExpenses.filter(e => e.category === cat).reduce((s, e) => s + (e.amount || 0), 0),
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  async function handleSave() {
    if (!form.category || !form.amount || !form.date) { alert('Category, amount and date are required.'); return; }
    setSaving(true);
    try {
      const saved = await createExpense({ category:form.category, amount:parseFloat(form.amount), description:form.description || null, date:form.date });
      setAllExpenses(prev => [saved, ...prev]);
      setShowModal(false); setForm(emptyExpenseForm()); setMetricsTick(t => t+1);
      showSuccess(t('finance.savedToDb'));
    } catch (e) { alert('Failed to save: ' + e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    try {
      await deleteExpense(id);
      setAllExpenses(prev => prev.filter(e => e.id !== id));
      setDeleteConfirm(null); setMetricsTick(t => t+1);
      showSuccess('Expense deleted from database.');
    } catch (e) { alert('Failed to delete: ' + e.message); }
  }

  const periodRows = compare.length > 0 ? compare : ['day','week','month','year'].map(p => {
    const r = getRange(p);
    const s = allSales.filter(x => String(x.saleDate).slice(0,10) >= r.from && String(x.saleDate).slice(0,10) <= r.to);
    const e = allExpenses.filter(x => String(x.date).slice(0,10) >= r.from && String(x.date).slice(0,10) <= r.to);
    return { key:p, label:r.label, ...calcFinancials(s,e) };
  });

  /* ── Loading ── */
  if (loading) return (
    <div className={`abk-fin abk-texture${dark?' abk-dark':''}`} style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--cream)' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:34, height:34, border:'3px solid var(--border)', borderTopColor:'var(--green)', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 12px' }} />
        <p style={{ color:'var(--ink-faint)', fontSize:13, fontWeight:300 }}>{t('ui.loading')}</p>
      </div>
    </div>
  );

  /* ── Error ── */
  if (error) return (
    <div className={`abk-fin abk-texture${dark?' abk-dark':''}`} style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--cream)' }}>
      <div style={{ background:'var(--card)', border:'1px solid var(--red-border)', borderRadius:18, padding:32, textAlign:'center', maxWidth:380, boxShadow:'0 4px 24px rgba(0,0,0,.1)' }}>
        <XCircle size={38} style={{ color:'var(--red-text)', marginBottom:12 }} />
        <div className="abk-serif" style={{ fontSize:16, fontWeight:500, color:'var(--ink)', marginBottom:6 }}>Connection Error</div>
        <p style={{ color:'var(--ink-faint)', fontSize:12, marginBottom:16, fontWeight:300 }}>Make sure Spring Boot is running on port 8080</p>
        <button onClick={load} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 18px', background:'var(--green)', color:'#fff', border:'none', borderRadius:10, fontSize:13, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
          <RefreshCw size={13} /> {t('ui.retry')}
        </button>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className={`abk-fin abk-texture${dark?' abk-dark':''}`} style={{ background:'var(--cream)', minHeight:'100vh', width:'100%', maxWidth:'100%', position:'relative', transition:'background .3s' }}>

      {/* Toast */}
      {successMsg && (
        <div className="abk-toast" style={{ position:'fixed', top:20, right:20, zIndex:100, display:'inline-flex', alignItems:'center', gap:8, background:'var(--green)', color:'#fff', padding:'10px 18px', borderRadius:12, fontSize:13, fontWeight:500, boxShadow:'0 4px 20px rgba(29,158,117,.35)' }}>
          <CheckCircle size={15} /> {successMsg}
        </div>
      )}

      <div className="abk-fin-pad" style={{ position:'relative', zIndex:1, padding:'1.5rem 1.5rem 3rem' }}>

        {/* ── Page Header ──────────────────────────────────────────────── */}
        <div className="abk-anim-fade-up" style={{ padding:'0.5rem 0 1.4rem', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
          <div>
            <div style={{ fontSize:10.5, fontWeight:500, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--ink-light)', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ display:'inline-block', width:18, height:1.5, background:'var(--green)', borderRadius:1 }} />
              {t('finance.title')}
            </div>
            <div className="abk-serif" style={{ fontSize:28, fontWeight:500, color:'var(--ink)', letterSpacing:-0.5, lineHeight:1.1 }}>{t('finance.title')}</div>
            <div style={{ fontSize:12, color:'var(--ink-faint)', marginTop:4, fontWeight:300 }}>{t('finance.subtitle')}</div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center', paddingTop:4 }}>
            <button onClick={load} style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'8px 14px', background:'var(--card)', border:'1px solid var(--border)', borderRadius:11, color:'var(--ink-mid)', fontSize:12, cursor:'pointer', fontFamily:'DM Sans,sans-serif', transition:'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background='var(--cream-deep)'}
              onMouseLeave={e => e.currentTarget.style.background='var(--card)'}
            ><RefreshCw size={12} /> Refresh</button>
            <button onClick={() => { setForm(emptyExpenseForm()); setShowModal(true); }} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', background:'var(--red-accent)', color:'#fff', border:'none', borderRadius:11, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'DM Sans,sans-serif', boxShadow:'0 2px 8px rgba(197,48,48,.3)', transition:'filter .15s' }}
              onMouseEnter={e => e.currentTarget.style.filter='brightness(1.1)'}
              onMouseLeave={e => e.currentTarget.style.filter='none'}
            ><Plus size={14} /> {t('finance.addExpense')}</button>
          </div>
        </div>

        {/* ── Period Selector ───────────────────────────────────────────── */}
        <div className="abk-anim-fade-in abk-fin-filter" style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'1.1rem', animationDelay:'.08s' }}>
          <span style={{ fontSize:10.5, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.10em', color:'var(--ink-light)', marginRight:2 }}>{t('finance.period')}:</span>
          <div style={{ display:'flex', gap:4, background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:4, boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
            {[
              { key:'day',    label: 'Day'    },
              { key:'week',   label: 'Week'   },
              { key:'month',  label: 'Month'  },
              { key:'year',   label: 'Year'   },
              { key:'custom', label: 'Custom' },
            ].map(p => (
              <button key={p.key} onClick={() => setPeriod(p.key)} style={{
                padding:'6px 14px', borderRadius:9, border:'none', cursor:'pointer', fontSize:12, fontWeight:500,
                background: period===p.key ? 'var(--blue)' : 'transparent',
                color: period===p.key ? '#fff' : 'var(--ink-faint)',
                transition:'all .15s', fontFamily:'DM Sans,sans-serif',
              }}>{p.label}</button>
            ))}
          </div>
          {/* Custom date pickers — shown only when Custom is selected */}
          {period === 'custom' && (
            <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:8 }}>
              <input
                type="date"
                value={customFrom}
                max={customTo}
                onChange={e => setCustomFrom(e.target.value)}
                className="abk-input"
                style={{ width:140, padding:'5px 10px', fontSize:12, borderRadius:9 }}
              />
              <span style={{ fontSize:11, color:'var(--ink-faint)' }}>→</span>
              <input
                type="date"
                value={customTo}
                min={customFrom}
                max={localYMD()}
                onChange={e => setCustomTo(e.target.value)}
                className="abk-input"
                style={{ width:140, padding:'5px 10px', fontSize:12, borderRadius:9 }}
              />
            </div>
          )}
          <span style={{ fontSize:11, color:'var(--ink-faint)', fontWeight:300 }}>· {range.label}</span>
        </div>

        {/* ── Formula Banner ────────────────────────────────────────────── */}
        <div className="abk-anim-fade-in" style={{ background:'var(--blue-bg)', border:'1px solid rgba(24,95,165,.2)', borderRadius:14, padding:'1rem 1.2rem', marginBottom:'1.1rem', display:'flex', alignItems:'flex-start', gap:12, animationDelay:'.14s' }}>
          <AlertCircle size={17} style={{ color:'var(--blue)', marginTop:2, flexShrink:0 }} />
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10.5, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.10em', color:'var(--blue)', marginBottom:10 }}>{t('finance.formulaBanner')} · {range.label}</div>
            <div className="abk-fin-kpi-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:8, marginBottom:10 }}>
              {[
                { val:`$${fmt(fin.revenue)}`,       label:t('finance.revenueLabel'),  sub:`${periodSales.length} ${t('finance.salesRecorded')}`, color:'var(--green)',    iconBg:'var(--green-bg)', Icon:ShoppingCart, prefix:'' },
                { val:`$${fmt(fin.cogs)}`,          label:t('finance.cogsLabel'),     sub:t('finance.costTimesQty'),                             color:'var(--amber)',    iconBg:'var(--amber-bg)', Icon:Package,      prefix:'−' },
                { val:`$${fmt(fin.totalExpenses)}`, label:t('finance.expensesLabel'), sub:`${periodExpenses.length} ${t('finance.expenseCount')}`,color:'var(--red-text)',iconBg:'var(--red-bg)',   Icon:Receipt,      prefix:'−' },
              ].map(item => (
                <div key={item.label} className="abk-fin-kpi-mini" style={{ background:'var(--card)', borderRadius:12, padding:'12px 14px', border:'1px solid var(--border-light)', minWidth:0, overflow:'hidden', display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:item.iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <item.Icon size={16} color={item.color} />
                  </div>
                  <div style={{ minWidth:0, flex:1 }}>
                    <div className="abk-fin-kpi-val abk-serif" style={{ fontSize:17, fontWeight:700, color:item.color }}>{item.prefix}{item.val}</div>
                    <div style={{ fontSize:12, color:'var(--ink)', marginTop:2, fontWeight:500 }}>{item.label}</div>
                    <div style={{ fontSize:10.5, color:'var(--ink-faint)', fontWeight:300 }}>{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background:'var(--card)', border:`2px solid ${fin.netProfit >= 0 ? 'rgba(29,158,117,.4)' : 'var(--red-border)'}`, borderRadius:11, padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }} className="abk-fin-formula-row">
              <span className="abk-fin-formula-text" style={{ fontSize:12, color:'var(--ink-light)', fontWeight:400 }}>
                {t('finance.netProfit')} = ${fmt(fin.revenue)} − ${fmt(fin.cogs)} − ${fmt(fin.totalExpenses)}
              </span>
              <span className="abk-fin-formula-val abk-serif" style={{ fontSize:20, fontWeight:700, color:fin.netProfit>=0 ? 'var(--green)' : 'var(--red-text)', flexShrink:0, marginLeft:8 }}>
                {fin.netProfit>=0 ? '+' : '−'}${fmt(fin.netProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* ── KPI Cards ─────────────────────────────────────────────────── */}
        <div className="abk-fin-kpi-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:10, marginBottom:'1.1rem' }}>
          <KpiCard label={t('finance.revenue')}        value={`$${fmt(fin.revenue)}`}                              sub={`${summary?.saleCount ?? periodSales.length} ${t('finance.salesRecorded')}`}  Icon={ShoppingCart} stripeColor="var(--green)"    iconBg="var(--green-bg)"  iconColor="var(--green)"    progPct={fin.revenue>0?68:2}                       delay=".06s" />
          <KpiCard label={t('finance.cogs')}           value={`$${fmt(fin.cogs)}`}                                 sub={t('finance.costTimesQty')}                                                     Icon={Package}      stripeColor="var(--amber)"    iconBg="var(--amber-bg)"  iconColor="var(--amber)"    progPct={fin.revenue>0?Math.round(fin.cogs/fin.revenue*100):2} delay=".13s" />
          <KpiCard label={t('finance.expenses')}       value={`$${fmt(fin.totalExpenses)}`}                        sub={`${periodExpenses.length} ${t('finance.expenseCount')}`}                       Icon={TrendingDown}  stripeColor="var(--red-accent)" iconBg="var(--red-bg)" iconColor="var(--red-text)" progPct={fin.revenue>0?Math.round(fin.totalExpenses/fin.revenue*100):2} delay=".20s" />
          <KpiCard label={t('finance.grossProfit')}    value={`${fin.grossProfit>=0?'':'-'}$${fmt(fin.grossProfit)}`} sub={`${fin.grossMargin.toFixed(1)}% ${t('finance.margin')}`}                   Icon={TrendingUp}   stripeColor={fin.grossProfit>=0?'var(--blue)':'var(--red-accent)'}  iconBg={fin.grossProfit>=0?'var(--blue-bg)':'var(--red-bg)'}  iconColor={fin.grossProfit>=0?'var(--blue)':'var(--red-text)'} progPct={Math.abs(fin.grossMargin)} delay=".27s" />
          <KpiCard label={t('finance.netProfit')}      value={`${fin.netProfit>=0?'':'-'}$${fmt(fin.netProfit)}`}   sub={`${fin.netMargin.toFixed(1)}% ${t('finance.margin')}`}                        Icon={DollarSign}   stripeColor={fin.netProfit>=0?'var(--purple)':'var(--red-accent)'}  iconBg={fin.netProfit>=0?'var(--purple-bg)':'var(--red-bg)'}  iconColor={fin.netProfit>=0?'var(--purple)':'var(--red-text)'} progPct={Math.abs(fin.netMargin)} delay=".34s" />
          <KpiCard label={t('finance.inventoryValue')} value={`$${fmt(summary?.inventoryValue ?? 0)}`}              sub="stock × cost (unsold)"                                                         Icon={BarChart2}    stripeColor="var(--purple)"   iconBg="var(--purple-bg)" iconColor="var(--purple)"   progPct={60}                                       delay=".41s" />
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <div className="abk-anim-fade-in" style={{ display:'flex', gap:6, marginBottom:'1rem', animationDelay:'.45s' }}>
          {[
            { key:'overview', label:t('finance.overview'),   Icon:BarChart2 },
            { key:'expenses', label:t('finance.expenseTab'), Icon:Wallet    },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              display:'inline-flex', alignItems:'center', gap:7, padding:'8px 18px',
              borderRadius:11, border:'none', cursor:'pointer', fontSize:13, fontWeight:500,
              background: activeTab===tab.key ? 'var(--blue)' : 'var(--card)',
              color: activeTab===tab.key ? '#fff' : 'var(--ink-mid)',
              border: activeTab===tab.key ? 'none' : '1px solid var(--border)',
              boxShadow: activeTab===tab.key ? '0 2px 8px rgba(24,95,165,.25)' : '0 1px 3px rgba(0,0,0,.05)',
              transition:'all .15s', fontFamily:'DM Sans,sans-serif',
            }}>
              <tab.Icon size={13} /> {tab.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            TAB: Overview
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="abk-fin-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>

            {/* Profit breakdown bars */}
            <div className="abk-anim-scale-in" style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:16, padding:'1.2rem', boxShadow:'0 2px 12px rgba(0,0,0,.06)', animationDelay:'.08s', transition:'background .3s, border-color .3s', minWidth:0, overflow:'hidden', width:'100%' }}>
              <div className="abk-serif" style={{ fontSize:15, fontWeight:500, color:'var(--ink)', marginBottom:3 }}>{t('finance.profitBreakdown')}</div>
              <div style={{ fontSize:11, color:'var(--ink-faint)', fontWeight:300, marginBottom:18 }}>{range.label}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {[
                  { label:t('finance.revenueLabel'),  value:fin.revenue,               color:'var(--green)',     barBg:'var(--green-bg)', max:fin.revenue },
                  { label:t('finance.cogsLabel'),      value:fin.cogs,                  color:'var(--amber)',     barBg:'var(--amber-bg)', max:fin.revenue },
                  { label:t('finance.expensesLabel'),  value:fin.totalExpenses,          color:'var(--red-text)', barBg:'var(--red-bg)',   max:fin.revenue },
                  { label:t('finance.netProfit'),      value:Math.max(0,fin.netProfit), color:'var(--blue)',      barBg:'var(--blue-bg)',  max:fin.revenue },
                ].map(item => (
                  <div key={item.label}>
                    <div className="abk-fin-bar-row" style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:5 }}>
                      <span className="abk-fin-bar-label" style={{ color:'var(--ink-light)', fontWeight:400 }}>{item.label}</span>
                      <span className="abk-fin-bar-val abk-serif" style={{ fontWeight:600, color:item.color, flexShrink:0, marginLeft:6 }}>${fmt(item.value)}</span>
                    </div>
                    <div style={{ height:6, background:'var(--cream-deep)', borderRadius:3, overflow:'hidden' }}>
                      <div style={{ height:'100%', background:item.color, borderRadius:3, width:item.max>0?`${Math.min((item.value/item.max)*100,100)}%`:'0%', transition:'width .6s ease', opacity:.85 }} />
                    </div>
                  </div>
                ))}
              </div>
              {/* Net result chip */}
              <div className="abk-fin-net-chip" style={{ marginTop:18, background:fin.netProfit>=0?'var(--green-bg)':'var(--red-bg)', border:`2px solid ${fin.netProfit>=0?'rgba(29,158,117,.35)':'var(--red-border)'}`, borderRadius:11, padding:'12px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:fin.netProfit>=0?'var(--green)':'var(--red-text)' }}>
                    {fin.netProfit>=0 ? `✓ ${t('finance.netProfit')}` : `✗ ${t('finance.netLoss')}`}
                  </div>
                  <div className="abk-fin-formula-text" style={{ fontSize:10.5, color:'var(--ink-faint)', fontWeight:300, marginTop:2 }}>
                    ${fmt(fin.revenue)} − ${fmt(fin.cogs)} − ${fmt(fin.totalExpenses)}
                  </div>
                </div>
                <div className="abk-fin-net-val abk-serif" style={{ fontSize:22, fontWeight:700, color:fin.netProfit>=0?'var(--green)':'var(--red-text)', flexShrink:0, marginLeft:8 }}>
                  {fin.netProfit>=0?'+':'−'}${fmt(fin.netProfit)}
                </div>
              </div>
            </div>

            {/* Expense by category */}
            <div className="abk-anim-scale-in" style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:16, padding:'1.2rem', boxShadow:'0 2px 12px rgba(0,0,0,.06)', animationDelay:'.16s', transition:'background .3s, border-color .3s', minWidth:0, overflow:'hidden', width:'100%' }}>
              <div className="abk-serif" style={{ fontSize:15, fontWeight:500, color:'var(--ink)', marginBottom:3 }}>{t('finance.expenseByCategory')}</div>
              <div style={{ fontSize:11, color:'var(--ink-faint)', fontWeight:300, marginBottom:18 }}>{range.label}</div>
              {byCategory.length === 0 ? (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'2.5rem 0', color:'var(--border)' }}>
                  <Wallet size={30} style={{ marginBottom:8 }} />
                  <p style={{ color:'var(--ink-faint)', fontSize:13, fontWeight:300 }}>{t('finance.noExpensesInPeriod')}</p>
                </div>
              ) : byCategory.map(({ cat, total }) => (
                <div key={cat} style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                    <span style={{ color:'var(--ink-light)', fontWeight:400, maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{categoryLabel(cat)}</span>
                    <span className="abk-serif" style={{ fontWeight:600, color:'var(--red-text)', flexShrink:0 }}>${fmt(total)}</span>
                  </div>
                  <div style={{ height:5, background:'var(--red-bg)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', background:'var(--red-text)', borderRadius:3, opacity:.6, width:fin.totalExpenses>0?`${(total/fin.totalExpenses)*100}%`:'0%', transition:'width .5s ease' }} />
                  </div>
                  <div style={{ fontSize:10, color:'var(--ink-faint)', textAlign:'right', marginTop:2, fontWeight:300 }}>
                    {fin.totalExpenses>0 ? `${((total/fin.totalExpenses)*100).toFixed(1)}%` : ''}
                  </div>
                </div>
              ))}
            </div>

            {/* Period comparison table */}
            <div className="abk-anim-fade-up abk-fin-period-span" style={{ gridColumn:'1 / -1', background:'var(--card)', border:'1px solid var(--border)', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,.06)', animationDelay:'.24s', transition:'background .3s, border-color .3s', minWidth:0, width:'100%', overflow:'hidden' }}>
              <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border-light)', background:'var(--cream-deep)', display:'flex', alignItems:'center', justifyContent:'space-between', borderRadius:'16px 16px 0 0' }}>
                <div className="abk-serif" style={{ fontSize:14, fontWeight:500, color:'var(--ink)' }}>{t('finance.periodComparison')}</div>
                <span style={{ fontSize:11, color:'var(--ink-faint)', fontWeight:300 }}>{t('finance.clickRow')}</span>
              </div>
              <div className="abk-fin-table-wrap abk-fin-scroll-table" style={{ width:'100%', display:'block', overflowX:'auto', borderRadius:'0 0 16px 16px' }}>
                <table style={{ width:'100%', minWidth:'max-content', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'var(--cream-deep)', borderBottom:'1px solid var(--border)' }}>
                      {[t('finance.period'), t('finance.revenue'), t('finance.cogs'), t('finance.grossProfit'), t('finance.expenses'), t('finance.netProfit'), t('finance.margin')].map(h => (
                        <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:600, letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--ink-light)', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {periodRows.map(row => (
                      <tr key={row.key} className="abk-period-row" onClick={() => setPeriod(row.key)} style={{ borderBottom:'1px solid var(--border-light)', background: period===row.key ? 'var(--blue-bg)' : 'var(--card)' }}>
                        <td style={{ padding:'11px 14px', fontSize:12, fontWeight:600, color:period===row.key?'var(--blue)':'var(--ink-light)', whiteSpace:'nowrap' }}>{period===row.key && '→ '}{row.label}</td>
                        <td style={{ padding:'11px 14px', whiteSpace:'nowrap' }}><span className="abk-serif" style={{ fontSize:13, fontWeight:600, color:'var(--green)' }}>${fmt(row.revenue)}</span></td>
                        <td style={{ padding:'11px 14px', fontSize:12, color:'var(--amber)', fontWeight:300, whiteSpace:'nowrap' }}>−${fmt(row.cogs)}</td>
                        <td style={{ padding:'11px 14px', whiteSpace:'nowrap' }}><span className="abk-serif" style={{ fontSize:13, fontWeight:600, color:row.grossProfit>=0?'var(--blue)':'var(--red-text)' }}>{row.grossProfit>=0?'':'-'}${fmt(row.grossProfit)}</span></td>
                        <td style={{ padding:'11px 14px', fontSize:12, color:'var(--red-text)', fontWeight:300, whiteSpace:'nowrap' }}>−${fmt(row.totalExpenses)}</td>
                        <td style={{ padding:'11px 14px', whiteSpace:'nowrap' }}><span className="abk-serif" style={{ fontSize:14, fontWeight:700, color:row.netProfit>=0?'var(--green)':'var(--red-text)' }}>{row.netProfit>=0?'+':'−'}${fmt(row.netProfit)}</span></td>
                        <td style={{ padding:'11px 14px', whiteSpace:'nowrap' }}>
                          <span style={{ fontSize:11, fontWeight:600, padding:'2px 10px', borderRadius:20, background:row.netMargin>=0?'var(--green-bg)':'var(--red-bg)', color:row.netMargin>=0?'var(--green)':'var(--red-text)', border:`1px solid ${row.netMargin>=0?'rgba(29,158,117,.25)':'var(--red-border)'}` }}>
                            {row.netMargin.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB: Expenses
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'expenses' && (
          <>
            {/* Filters */}
            <div className="abk-anim-fade-in abk-fin-filter" style={{ display:'flex', gap:8, marginBottom:'1rem', animationDelay:'.06s' }}>
              <div style={{ flex:1, position:'relative' }}>
                <Search size={14} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--ink-faint)', pointerEvents:'none' }} />
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder={t('ui.search')} className="abk-input" style={{ paddingLeft:34 }} />
              </div>
              <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }} className="abk-input" style={{ minWidth:180, cursor:'pointer' }}>
                <option value="ALL">{t('finance.selectCategory')}</option>
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{categoryLabel(c)}</option>)}
              </select>
              <div style={{ position:'relative' }}>
                <Calendar size={13} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--ink-faint)', pointerEvents:'none' }} />
                <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className="abk-input" style={{ paddingLeft:32, minWidth:140, cursor:'pointer', colorScheme:dark?'dark':'light' }} placeholder="From" title="From date" />
              </div>
              <div style={{ position:'relative' }}>
                <Calendar size={13} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--ink-faint)', pointerEvents:'none' }} />
                <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className="abk-input" style={{ paddingLeft:32, minWidth:140, cursor:'pointer', colorScheme:dark?'dark':'light' }} placeholder="To" title="To date" />
              </div>
              {(search || catFilter !== 'ALL' || dateFilter || dateFrom || dateTo) && (
                <button onClick={() => { setSearch(''); setCatFilter('ALL'); setDateFilter(''); setDateFrom(''); setDateTo(''); setPage(1); }} style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'0 13px', background:'var(--red-bg)', border:'1px solid var(--red-border)', borderRadius:10, color:'var(--red-text)', fontSize:12, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
                  <X size={12} /> {t('ui.clear')}
                </button>
              )}
            </div>

            {/* Expense table */}
            <div className="abk-anim-scale-in" style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,.06)', animationDelay:'.12s', transition:'background .3s, border-color .3s' }}>
              <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border-light)', background:'var(--cream-deep)', display:'flex', alignItems:'center', justifyContent:'space-between', borderRadius:'16px 16px 0 0' }}>
                <div className="abk-serif" style={{ fontSize:14, fontWeight:500, color:'var(--ink)' }}>{t('finance.allExpenseRecords')}</div>
                <span style={{ fontSize:11, color:'var(--ink-faint)', fontWeight:300 }}>{filteredExp.length} {t('finance.expenseCount')} · {t('finance.recordsInDb')}</span>
              </div>
              <div className="abk-fin-table-wrap abk-fin-stack-table" style={{ width:'100%', display:'block', overflowX:'auto', borderRadius:'0 0 16px 16px' }}>
                <table style={{ width:'100%', minWidth:'max-content', borderCollapse:'collapse' }}>
                  {/* colgroup — controls per-column widths on mobile via CSS col selectors */}
                  <colgroup>
                    <col />{/* Date */}
                    <col />{/* Category */}
                    <col />{/* Description */}
                    <col />{/* Amount */}
                    <col />{/* Actions */}
                  </colgroup>
                  <thead>
                    <tr style={{ background:'var(--cream-deep)', borderBottom:'1px solid var(--border)' }}>
                      {[t('finance.date'), t('finance.category'), t('finance.description'), t('finance.amount'), t('ui.actions')].map(h => (
                        <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:600, letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--ink-light)', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign:'center', padding:'3.5rem 0' }}>
                          <Wallet size={34} style={{ color:'var(--border)', margin:'0 auto 10px', display:'block' }} />
                          <p style={{ color:'var(--ink-faint)', fontSize:13, fontWeight:300 }}>{t('finance.noExpenses')}</p>
                        </td>
                      </tr>
                    ) : paginated.map(e => (
                      <tr key={e.id} className="abk-row-hover" style={{ borderBottom:'1px solid var(--border-light)', background:'var(--card)' }}>
                        <td data-label="Date" style={{ padding:'11px 14px', fontSize:13, fontWeight:500, color:'var(--ink)' }}>{fmtDate(e.date)}</td>
                        <td data-label="Category" style={{ padding:'11px 14px' }}>
                          <span style={{ display:'inline-flex', alignItems:'center', fontSize:10.5, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', padding:'2px 10px', borderRadius:20, background:'var(--red-bg)', color:'var(--red-text)', border:'1px solid var(--red-border)' }}>{categoryLabel(e.category)}</span>
                        </td>
                        <td data-label="Description" style={{ padding:'11px 14px', fontSize:12, color:'var(--ink-faint)', fontWeight:300 }}>{e.description || '—'}</td>
                        <td data-label="Amount" style={{ padding:'11px 14px' }}>
                          <span className="abk-serif" style={{ fontSize:14, fontWeight:600, color:'var(--red-text)' }}>−${fmt(e.amount)}</span>
                        </td>
                        <td className="abk-td-actions" style={{ padding:'11px 14px' }}>
                          <button onClick={() => setDeleteConfirm(e)} style={{ width:28, height:28, borderRadius:8, border:'1px solid var(--red-border)', background:'var(--red-bg)', color:'var(--red-text)', display:'inline-flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'background .15s, transform .1s' }}
                            onMouseEnter={ev => { ev.currentTarget.style.background='var(--red-border)'; ev.currentTarget.style.transform='translateY(-1px)'; }}
                            onMouseLeave={ev => { ev.currentTarget.style.background='var(--red-bg)'; ev.currentTarget.style.transform='none'; }}
                          ><Trash2 size={12} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderTop:'1px solid var(--border-light)', background:'var(--cream-deep)', flexWrap:'wrap', gap:8 }}>
                {/* Rows-per-page selector */}
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:11, color:'var(--ink-faint)', fontWeight:300 }}>Rows:</span>
                  {[10, 20, 50, 100].map(n => (
                    <button key={n} onClick={() => { setRowsPerPage(n); setPage(1); }} style={{
                      padding:'3px 9px', borderRadius:7, fontSize:11, fontWeight:500, cursor:'pointer',
                      border:`1px solid ${rowsPerPage===n ? 'var(--blue)' : 'var(--border)'}`,
                      background: rowsPerPage===n ? 'var(--blue)' : 'var(--card)',
                      color: rowsPerPage===n ? '#fff' : 'var(--ink-faint)',
                      transition:'all .15s',
                    }}>{n}</button>
                  ))}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, color:'var(--ink-faint)', fontWeight:300 }}>
                  <span>Page {page} of {totalPages}</span>
                  <span style={{ opacity:.5 }}>·</span>
                  <span>{filteredExp.length===0?0:(page-1)*rowsPerPage+1}–{Math.min(page*rowsPerPage,filteredExp.length)} of {filteredExp.length}</span>
                  {[
                    { Icon:ChevronLeft,  action:() => setPage(p => Math.max(1,p-1)),         disabled:page===1 },
                    { Icon:ChevronRight, action:() => setPage(p => Math.min(totalPages,p+1)), disabled:page===totalPages },
                  ].map(({ Icon, action, disabled }, i) => (
                    <button key={i} onClick={action} disabled={disabled} style={{ width:26, height:26, borderRadius:7, border:'1px solid var(--border)', background:'var(--card)', color:'var(--ink-light)', cursor:disabled?'not-allowed':'pointer', opacity:disabled?.35:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Icon size={13} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            MODAL: Add Expense
        ══════════════════════════════════════════════════════════════════ */}
        {showModal && (
          <Modal onClose={() => setShowModal(false)} maxWidth={460}>
            <ModalHeader title={t('finance.addExpense')} subtitle={t('finance.savedToDb')} onClose={() => setShowModal(false)} accent="var(--red-accent)" />
            <div style={{ padding:'1.2rem 1.4rem', display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label className="abk-label">{t('finance.category')} *</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category:e.target.value }))} className="abk-input" style={{ cursor:'pointer' }}>
                  <option value="">{t('finance.selectCategory')}</option>
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{categoryLabel(c)}</option>)}
                </select>
              </div>
              <div className="abk-fin-modal-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label className="abk-label">{t('finance.amount')} *</label>
                  <input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount:e.target.value }))} placeholder="0.00" className="abk-input" />
                </div>
                <div>
                  <label className="abk-label">{t('finance.date')} *</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date:e.target.value }))} className="abk-input" style={{ cursor:'pointer', colorScheme:dark?'dark':'light' }} />
                </div>
              </div>
              <div>
                <label className="abk-label">{t('finance.description')}</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description:e.target.value }))} placeholder={t('finance.optionalNotes')} rows={2} className="abk-input" style={{ resize:'none' }} />
              </div>
              {form.amount && parseFloat(form.amount) > 0 && (
                <div style={{ background:'var(--red-bg)', border:'1px solid var(--red-border)', borderRadius:10, padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:12, color:'var(--red-text)', fontWeight:500 }}>{t('finance.expenseLabel')}</span>
                  <span className="abk-serif" style={{ fontSize:16, fontWeight:700, color:'var(--red-text)' }}>−${fmt(parseFloat(form.amount))}</span>
                </div>
              )}
            </div>
            <ModalFooter>
              <BtnSecondary onClick={() => setShowModal(false)}>{t('ui.cancel')}</BtnSecondary>
              <BtnPrimary onClick={handleSave} disabled={saving} color="var(--red-accent)">
                {saving
                  ? <><RefreshCw size={13} style={{ animation:'spin 1s linear infinite' }} /> {t('ui.saving')}</>
                  : <><Plus size={13} /> {t('finance.saveToDatabase')}</>}
              </BtnPrimary>
            </ModalFooter>
          </Modal>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            MODAL: Delete Confirm
        ══════════════════════════════════════════════════════════════════ */}
        {deleteConfirm && (
          <Modal onClose={() => setDeleteConfirm(null)} maxWidth={360}>
            <div style={{ padding:'2rem 1.6rem 1.4rem', textAlign:'center' }}>
              <div style={{ width:52, height:52, borderRadius:'50%', background:'var(--red-bg)', border:'2px solid var(--red-border)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
                <Trash2 size={22} style={{ color:'var(--red-text)' }} />
              </div>
              <div className="abk-serif" style={{ fontSize:17, fontWeight:500, color:'var(--ink)', marginBottom:6 }}>{t('finance.deleteExpense')}</div>
              <p style={{ fontSize:13, color:'var(--ink-light)', marginBottom:4, fontWeight:300 }}>{categoryLabel(deleteConfirm.category)}</p>
              <p className="abk-serif" style={{ fontSize:20, fontWeight:700, color:'var(--red-text)', marginBottom:4 }}>−${fmt(deleteConfirm.amount)}</p>
              <p style={{ fontSize:11, color:'var(--ink-faint)', marginBottom:20, fontWeight:300 }}>This will be permanently deleted from the database.</p>
              <div style={{ display:'flex', gap:10 }}>
                <BtnSecondary onClick={() => setDeleteConfirm(null)}>{t('ui.cancel')}</BtnSecondary>
                <BtnPrimary onClick={() => handleDelete(deleteConfirm.id)} color="var(--red-accent)">{t('ui.delete')}</BtnPrimary>
              </div>
            </div>
          </Modal>
        )}

      </div>
    </div>
  );
}