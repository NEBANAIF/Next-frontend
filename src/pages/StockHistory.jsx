import { useState, useEffect } from 'react';
import {
  Search, Trash2, RefreshCw, ChevronLeft, ChevronRight,
  X, Clock, TrendingUp, TrendingDown, ShoppingCart,
  Package, Calendar, XCircle, CheckCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getStockHistory, deleteStockHistory } from '../services/api';

// ─── Same shared CSS as Dashboard & Analytics ─────────────────────────────────
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
    background-image:linear-gradient(var(--texture-col) 1px,transparent 1px),
      linear-gradient(90deg,var(--texture-col) 1px,transparent 1px);
    background-size:48px 48px;opacity:.25;}
  .abk-dash.abk-dark.abk-texture::before{opacity:.18;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes scaleIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
  @keyframes barGrow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  .abk-anim-fade-up{opacity:0;animation:fadeUp .45s ease both;}
  .abk-anim-scale-in{opacity:0;animation:scaleIn .45s ease both;}
  .abk-anim-fade-in{opacity:0;animation:fadeIn .35s ease both;}
  .abk-prog-fill{transform-origin:left;animation:barGrow .85s ease both;}
  .abk-row-hover{transition:background .15s;}
  .abk-row-hover:hover{background:var(--card-hover) !important;}
  .abk-dark .abk-row-hover:hover{background:var(--card-hover) !important;}
  .abk-dark ::-webkit-scrollbar{width:6px;}
  .abk-dark ::-webkit-scrollbar-track{background:#0D1117;}
  .abk-dark ::-webkit-scrollbar-thumb{background:#21303F;border-radius:3px;}

  /* ── Responsive: tablet ── */
  @media (max-width:1023px) {
    .abk-stk-kpi-4  { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
    .abk-stk-filter { flex-wrap: wrap !important; }
    .abk-stk-filter > * { min-width: 140px !important; }
  }

  /* ── Responsive: phone ── */
  @media (max-width:767px) {
    .abk-stk-pad    { padding: 1rem 0.75rem 3rem !important; }
    .abk-stk-kpi-4  { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
    .abk-stk-filter { flex-direction: column !important; }
    .abk-stk-filter > * { width: 100% !important; }
    .abk-stk-header { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }

    /* ── Stock History table: horizontal scroll — full table, swipe to see all columns ──
       NOTE: explicit px min-width (not width:max-content) — max-content is unreliable
       for <table> sizing on mobile browsers and was causing columns to squish/wrap
       instead of triggering scroll. Matches the 9-column width already set in
       responsive.css (.abk-stk-table-wrap) and the pattern used by Products/Sales. */
    .abk-stk-table-wrap { overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; }
    .abk-stk-table-wrap table { min-width: 900px !important; table-layout: auto !important; }
  }

  @media (max-width:480px) {
    .abk-stk-pad { padding: 0.75rem 0.5rem 2rem !important; }
    .abk-stk-kpi-4 { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
  }

  @media (max-width:380px) {
    .abk-stk-kpi-4 { grid-template-columns: 1fr !important; }
  }
  /* iOS: prevent zoom on input focus */
  @media (max-width:767px) {
    input, select, textarea { font-size: 16px !important; }
  }

`;

function fmtDate(dateStr, timeStr, fallbackISO) {
  // If date is missing, try falling back to createdAt (ISO datetime string from backend)
  if (!dateStr && fallbackISO) {
    try {
      const dt = new Date(fallbackISO);
      if (!isNaN(dt.getTime())) {
        return {
          date: dt.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          time: dt.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' }),
        };
      }
    } catch {}
  }
  if (!dateStr) return { date: '—', time: '' };
  try {
    // Truncate time to HH:mm:ss to avoid nanosecond precision rejection (Java LocalTime serialises as HH:mm:ss.nnnnnnnnn)
    const safeTime = timeStr ? timeStr.replace(/(\d{2}:\d{2}:\d{2}).*/, '$1') : '00:00:00';
    const dt = new Date(dateStr + 'T' + safeTime);
    if (isNaN(dt.getTime())) return { date: dateStr, time: timeStr || '' };
    return {
      date: dt.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: dt.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
  } catch { return { date: dateStr, time: timeStr || '' }; }
}

// Per-type config: colors use CSS vars, not Tailwind
const TYPE_CFG = {
  SALE:           { labelKey: 'stock.typeSale',       color: 'var(--red-text)',   bg: 'var(--red-bg)',    border: 'var(--red-border)',   icon: ShoppingCart },
  STOCK_ADDITION: { labelKey: 'stock.typeAdded',      color: 'var(--green)',      bg: 'var(--green-bg)',  border: 'var(--border)',       icon: TrendingUp   },
  ADJUSTMENT:     { labelKey: 'stock.typeAdjustment', color: 'var(--blue)',       bg: 'var(--blue-bg)',   border: 'var(--border)',       icon: Package      },
  RETURN:         { labelKey: 'stock.typeReturn',     color: 'var(--purple)',     bg: 'var(--purple-bg)', border: 'var(--border)',       icon: TrendingDown },
  DISCARD:        { labelKey: 'stock.typeDiscard',    color: 'var(--amber)',      bg: 'var(--amber-bg)',  border: 'var(--yellow-border)',icon: Trash2       },
};

// ─── KPI Card — identical pattern to Dashboard / Analytics ───────────────────
function KpiCard({ labelKey, value, Icon, stripeColor, iconBg, iconColor, progPct, delay, t }) {
  return (
    <div className="abk-anim-fade-up" style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '1.1rem 1.1rem .9rem',
      position: 'relative', overflow: 'hidden',
      transition: 'background .3s, border-color .3s', animationDelay: delay,
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
        letterSpacing: -0.3, marginBottom: 4, lineHeight: 1.15,
      }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-light)', fontWeight: 400 }}>{t(labelKey)}</div>
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

export default function StockHistory({ dark: darkProp }) {
  const { t } = useTranslation();

  // Inject shared CSS
  useEffect(() => {
    const id = 'abk-stockhistory-css';
    let tag = document.getElementById(id);
    if (!tag) {
      tag = document.createElement('style');
      tag.id = id;
      document.head.appendChild(tag);
    }
    tag.innerHTML = GLOBAL_CSS;
    return () => { const el = document.getElementById(id); if (el) el.remove(); };
  }, []);

  const dark = darkProp ?? (localStorage.getItem('abk-dark') === 'true');

  const [history, setHistory]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [search, setSearch]               = useState('');
  const [typeFilter, setTypeFilter]       = useState('ALL');
  const [dateFilter, setDateFilter]       = useState('');
  const [page, setPage]                   = useState(1);
  const [rowsPerPage, setRowsPerPage]     = useState(10);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [successMsg, setSuccessMsg]       = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true); setError(null);
    try {
      const data = await getStockHistory();
      setHistory(data);
    } catch { setError(t('sales.errorConnect')); }
    finally   { setLoading(false); }
  }

  function showSuccess(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  }

  async function handleDelete(id) {
    try {
      await deleteStockHistory(id);
      setHistory(prev => prev.filter(h => h.id !== id));
      setDeleteConfirm(null);
      showSuccess(t('stock.deleteRecord') + ' ✓');
    } catch (e) { alert('Failed to delete record: ' + e.message); }
  }

  const totalAdded   = history.filter(h => (h.quantityChange ?? 0) > 0).reduce((s, h) => s + (h.quantityChange ?? 0), 0);
  const totalRemoved = history.filter(h => (h.quantityChange ?? 0) < 0).reduce((s, h) => s + Math.abs(h.quantityChange ?? 0), 0);
  const saleCount    = history.filter(h => h.type === 'SALE').length;

  const filtered = history.filter(h => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      (h.product?.name ?? '').toLowerCase().includes(q) ||
      (h.reason ?? '').toLowerCase().includes(q) ||
      (h.user   ?? '').toLowerCase().includes(q);
    return matchSearch && (typeFilter === 'ALL' || h.type === typeFilter) && (!dateFilter || String(h.date) === dateFilter);
  })
  // Sort by date in DECREASING order (newest first)
  .sort((a, b) => {
    const dateA = new Date(a.date || a.createdAt || 0).getTime();
    const dateB = new Date(b.date || b.createdAt || 0).getTime();
    return dateB - dateA; // Decreasing order (newest first)
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated  = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Input style helper
  const inputStyle = {
    background: 'var(--card)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '7px 12px',
    fontSize: 13, color: 'var(--ink)', outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'border-color .2s',
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className={`abk-dash${dark ? ' abk-dark' : ''}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--cream)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 34, height: 34, border: '3px solid var(--border)', borderTopColor: 'var(--green)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: 'var(--ink-faint)', fontSize: 13 }}>{t('ui.loading')}</p>
      </div>
    </div>
  );

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) return (
    <div className={`abk-dash${dark ? ' abk-dark' : ''}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--cream)' }}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--red-border)', borderRadius: 14, padding: '2rem', textAlign: 'center', maxWidth: 340 }}>
        <XCircle size={36} style={{ color: 'var(--red-text)', margin: '0 auto 12px' }} />
        <p className="abk-serif" style={{ color: 'var(--red-text)', fontWeight: 500, marginBottom: 6, fontSize: 16 }}>{t('sales.errorTitle')}</p>
        <p style={{ color: 'var(--ink-faint)', fontSize: 12, marginBottom: 16, fontWeight: 300 }}>{error}</p>
        <button onClick={load} style={{
          padding: '7px 18px', background: 'var(--green)', color: '#fff',
          border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: 12,
          fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          <RefreshCw size={13} /> {t('ui.retry')}
        </button>
      </div>
    </div>
  );

  // ── Main ──────────────────────────────────────────────────────────────────
  return (
    <div className={`abk-dash abk-texture${dark ? ' abk-dark' : ''}`}
      style={{ background: 'var(--cream)', minHeight: '100vh', position: 'relative', transition: 'background .3s' }}>

      {/* Toast */}
      {successMsg && (
        <div className="abk-anim-fade-in" style={{
          position: 'fixed', top: 20, right: 20, zIndex: 50,
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--green)', color: '#fff',
          padding: '10px 16px', borderRadius: 12,
          fontSize: 13, fontWeight: 500,
          boxShadow: '0 4px 20px rgba(0,0,0,.2)',
        }}>
          <CheckCircle size={15} /> {successMsg}
        </div>
      )}

      <div className="abk-stk-pad" style={{ position: 'relative', zIndex: 1, padding: '0 1.5rem 2.5rem' }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="abk-anim-fade-up" style={{ padding: '1.75rem 0 1.25rem' }}>
          <div style={{
            fontSize: 10.5, fontWeight: 500, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--ink-light)',
            marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ display: 'inline-block', width: 18, height: 1.5, background: 'var(--purple)', borderRadius: 1 }} />
            {t('stock.title') || 'Stock History'}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div className="abk-serif" style={{ fontSize: 28, fontWeight: 500, color: 'var(--ink)', letterSpacing: -0.5, lineHeight: 1.15 }}>
                {t('stock.title') || 'Stock History'}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-light)', fontWeight: 300, marginTop: 4 }}>
                {t('stock.subtitle') || 'Full audit trail of all stock movements'}
              </div>
            </div>
            <button onClick={load} style={{
              padding: 8, background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 10, cursor: 'pointer', color: 'var(--ink-light)',
              display: 'flex', alignItems: 'center', transition: 'background .15s', flexShrink: 0,
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--cream-deep)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--card)'}
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* ── KPI Cards ─────────────────────────────────────────────────── */}
        <div className="abk-stk-kpi-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10, marginBottom: '1.1rem' }}>
          <KpiCard t={t} labelKey="stock.totalRecords"  value={history.length}     Icon={Clock}        stripeColor="var(--blue)"   iconBg="var(--blue-bg)"   iconColor="var(--blue)"   progPct={70} delay=".06s" />
          <KpiCard t={t} labelKey="stock.unitsAdded"    value={`+${totalAdded}`}   Icon={TrendingUp}   stripeColor="var(--green)"  iconBg="var(--green-bg)"  iconColor="var(--green)"  progPct={80} delay=".13s" />
          <KpiCard t={t} labelKey="stock.unitsRemoved"  value={`-${totalRemoved}`} Icon={TrendingDown} stripeColor="var(--red-text)" iconBg="var(--red-bg)" iconColor="var(--red-text)" progPct={55} delay=".20s" />
          <KpiCard t={t} labelKey="stock.salesRecorded" value={saleCount}          Icon={ShoppingCart} stripeColor="var(--purple)" iconBg="var(--purple-bg)" iconColor="var(--purple)" progPct={40} delay=".27s" />
        </div>

        {/* ── Filters ───────────────────────────────────────────────────── */}
        <div className="abk-anim-fade-up abk-stk-filter" style={{
          display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10,
          animationDelay: '.32s',
        }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('stock.searchPlaceholder')}
              style={{ ...inputStyle, width: '100%', paddingLeft: 32 }}
              onFocus={e => e.target.style.borderColor = 'var(--blue)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="ALL">{t('stock.allTypes')}</option>
            <option value="SALE">{t('stock.typeSale')}</option>
            <option value="STOCK_ADDITION">{t('stock.typeAdded')}</option>
            <option value="ADJUSTMENT">{t('stock.typeAdjustment')}</option>
            <option value="RETURN">{t('stock.typeReturn')}</option>
            <option value="DISCARD">{t('stock.typeDiscard')}</option>
          </select>

          {/* Date filter - with label */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('stock.filterByDate') || 'Filter by Date'}
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Calendar size={13} style={{ position: 'absolute', left: 11, color: 'var(--ink-faint)', pointerEvents: 'none' }} />
              <input
                type="date" 
                value={dateFilter}
                onChange={e => { setDateFilter(e.target.value); setPage(1); }}
                style={{ ...inputStyle, paddingLeft: 32, backgroundColor: dateFilter ? 'var(--green-bg)' : 'var(--card)' }}
              />
            </div>
          </div>

          {/* Clear */}
          {(search || typeFilter !== 'ALL' || dateFilter) && (
            <button
              onClick={() => { setSearch(''); setTypeFilter('ALL'); setDateFilter(''); setPage(1); }}
              style={{
                ...inputStyle, display: 'flex', alignItems: 'center', gap: 5,
                cursor: 'pointer', color: 'var(--red-text)', borderColor: 'var(--red-border)',
                background: 'var(--red-bg)', paddingLeft: 12, paddingRight: 12,
              }}
            >
              <X size={13} /> {t('ui.clear')}
            </button>
          )}
        </div>

        {/* ── Table card ────────────────────────────────────────────────── */}
        <div className="abk-anim-scale-in" style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 14, overflow: 'hidden', width: '100%',
          transition: 'background .3s, border-color .3s',
          animationDelay: '.38s',
        }}>

          {/* Table header bar */}
          <div style={{
            padding: '12px 18px', borderBottom: '1px solid var(--border-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--cream-deep)',
          }}>
            <div className="abk-serif" style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>
              {t('stock.stockMovement') || 'Stock Movement'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontWeight: 300 }}>
              {filtered.length} {t('dashboard.records')}
            </div>
          </div>

          <div className="abk-stk-table-wrap" style={{ overflowX: 'auto', width: '100%', display: 'block' }}>
            <table style={{ width: '100%', minWidth: 'max-content', borderCollapse: 'collapse' }}>
              {/* colgroup — controls per-column widths on mobile via CSS col selectors */}
              <colgroup>
                <col />{/* Date & Time */}
                <col />{/* Product */}
                <col />{/* Type */}
                <col />{/* Change */}
                <col />{/* Before */}
                <col />{/* After */}
                <col />{/* Reason */}
                <col />{/* User */}
                <col />{/* Actions */}
              </colgroup>
              <thead>
                <tr style={{ background: 'var(--cream-deep)', borderBottom: '1px solid var(--border)' }}>
                  {[
                    t('stock.dateTime'), t('stock.product'), t('stock.type'),
                    t('stock.change'), t('stock.beforeQty'), t('stock.afterQty'),
                    t('stock.reason'), t('stock.user'), t('ui.actions'),
                  ].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '10px 14px',
                      fontSize: 10.5, fontWeight: 600, color: 'var(--ink-light)',
                      textTransform: 'uppercase', letterSpacing: '0.09em', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '3.5rem 0' }}>
                      <Clock size={32} style={{ color: 'var(--ink-faint)', margin: '0 auto 10px' }} />
                      <p style={{ color: 'var(--ink-faint)', fontSize: 13, fontWeight: 300 }}>
                        {search || typeFilter !== 'ALL' || dateFilter ? t('stock.noHistoryFilter') : t('stock.noHistory')}
                      </p>
                    </td>
                  </tr>
                ) : paginated.map((h, idx) => {
                  const cfg        = TYPE_CFG[h.type] || TYPE_CFG.ADJUSTMENT;
                  const Icon       = cfg.icon;
                  const isPositive = (h.quantityChange ?? 0) > 0;
                  const { date, time } = fmtDate(h.date, h.time, h.createdAt);

                  return (
                    <tr key={h.id} className="abk-row-hover" style={{
                      borderBottom: '1px solid var(--border-light)',
                      background: idx % 2 === 0 ? 'var(--card)' : 'transparent',
                    }}>

                      {/* Date & Time */}
                      <td data-label="Date & Time" style={{ padding: '10px 14px' }}>
                        <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink)' }}>{date}</div>
                        {time && (
                          <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3, fontWeight: 300 }}>
                            <Clock size={9} />{time}
                          </div>
                        )}
                      </td>

                      {/* Product */}
                      <td data-label="Product" style={{ padding: '10px 14px' }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>{h.product?.name || '—'}</div>
                      </td>

                      {/* Type badge */}
                      <td data-label="Type" style={{ padding: '10px 14px' }}>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '3px 10px', borderRadius: 20,
                          background: cfg.bg, border: `1px solid ${cfg.border}`,
                          fontSize: 11, fontWeight: 600, color: cfg.color,
                          whiteSpace: 'nowrap',
                        }}>
                          <Icon size={10} />
                          {t(cfg.labelKey)}
                        </div>
                      </td>

                      {/* Change */}
                      <td data-label="Change" style={{ padding: '10px 14px' }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          fontSize: 13, fontWeight: 700,
                          color: isPositive ? 'var(--green)' : 'var(--red-text)',
                        }}>
                          {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                          {isPositive ? '+' : ''}{h.quantityChange ?? 0}
                        </div>
                        <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', fontWeight: 300 }}>{t('stock.units')}</div>
                      </td>

                      {/* Before */}
                      <td data-label="Before" style={{ padding: '10px 14px' }}>
                        <span style={{
                          display: 'inline-block',
                          fontSize: 12.5, fontWeight: 600, color: 'var(--ink)',
                          background: 'var(--cream-deep)', border: '1px solid var(--border)',
                          padding: '2px 10px', borderRadius: 8,
                        }}>{h.previousStock ?? '—'}</span>
                      </td>

                      {/* After */}
                      <td data-label="After" style={{ padding: '10px 14px' }}>
                        <span style={{
                          display: 'inline-block',
                          fontSize: 12.5, fontWeight: 600,
                          padding: '2px 10px', borderRadius: 8,
                          background: h.newStock === 0 ? 'var(--red-bg)' : isPositive ? 'var(--green-bg)' : 'var(--amber-bg)',
                          border: `1px solid ${h.newStock === 0 ? 'var(--red-border)' : isPositive ? 'var(--border)' : 'var(--yellow-border)'}`,
                          color: h.newStock === 0 ? 'var(--red-text)' : isPositive ? 'var(--green)' : 'var(--amber)',
                        }}>{h.newStock ?? '—'}</span>
                      </td>

                      {/* Reason */}
                      <td data-label="Reason" style={{ padding: '10px 14px' }}>
                        <div style={{ fontSize: 12, color: 'var(--ink-mid)', fontWeight: 300 }}>
                          {h.reason || '—'}
                        </div>
                      </td>

                      {/* User */}
                      <td data-label="User" style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{
                            width: 26, height: 26, borderRadius: '50%',
                            background: 'var(--blue-bg)', border: '1px solid var(--border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)' }}>
                              {(h.user || 'A')[0].toUpperCase()}
                            </span>
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--ink-mid)', fontWeight: 300 }}>{h.user || 'Admin'}</span>
                        </div>
                      </td>

                      {/* Delete */}
                      <td className="abk-td-actions" style={{ padding: '10px 14px' }}>
                        <button
                          onClick={() => setDeleteConfirm(h)}
                          style={{
                            padding: '5px 7px', borderRadius: 8, cursor: 'pointer',
                            background: 'var(--red-bg)', border: '1px solid var(--red-border)',
                            color: 'var(--red-text)', display: 'flex', alignItems: 'center',
                            transition: 'opacity .15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '.7'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ───────────────────────────────────────────────── */}
          <div style={{
            padding: '10px 16px', borderTop: '1px solid var(--border-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--cream-deep)',
          }}>
            {/* Rows per page */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-light)' }}>
              <span style={{ fontWeight: 300 }}>{t('ui.rows')}:</span>
              {[10, 20, 50, 100].map(n => (
                <button key={n} onClick={() => { setRowsPerPage(n); setPage(1); }} style={{
                  padding: '3px 9px', borderRadius: 8, border: '1px solid var(--border)',
                  fontSize: 11.5, fontWeight: 600, cursor: 'pointer', transition: 'background .15s, color .15s',
                  background: rowsPerPage === n ? 'var(--blue)' : 'var(--card)',
                  color: rowsPerPage === n ? '#fff' : 'var(--ink-light)',
                }}>
                  {n}
                </button>
              ))}
            </div>

            {/* Page controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11.5, color: 'var(--ink-faint)', fontWeight: 300 }}>
                {filtered.length === 0 ? 0 : (page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, filtered.length)} / {filtered.length}
              </span>
              {[
                { Icon: ChevronLeft,  disabled: page === 1,          action: () => setPage(p => Math.max(1, p - 1)) },
                { Icon: ChevronRight, disabled: page === totalPages,  action: () => setPage(p => Math.min(totalPages, p + 1)) },
              ].map(({ Icon, disabled, action }, i) => (
                <button key={i} onClick={action} disabled={disabled} style={{
                  padding: 5, borderRadius: 8, border: '1px solid var(--border)',
                  background: 'var(--card)', color: 'var(--ink-light)', cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.3 : 1, display: 'flex', alignItems: 'center', transition: 'background .15s',
                }}>
                  <Icon size={14} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div style={{
          marginTop: '1.1rem', paddingTop: 14,
          borderTop: dark ? '1px solid rgba(88,166,255,.08)' : '1px solid rgba(168,192,128,.3)',
          fontSize: 11, color: dark ? 'rgba(91,143,179,.45)' : 'rgba(168,192,128,.6)',
          fontWeight: 300, letterSpacing: '0.02em',
        }}>
          Stock history is a permanent audit trail. Deletions are irreversible.
        </div>
      </div>

      {/* ── Delete Confirm Modal ──────────────────────────────────────────── */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: dark ? 'rgba(0,0,0,.65)' : 'rgba(0,0,0,.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div className="abk-anim-scale-in" style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 16, width: '100%', maxWidth: 360,
            padding: '1.75rem', textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,.25)',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--red-bg)', border: '2px solid var(--red-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <Trash2 size={22} style={{ color: 'var(--red-text)' }} />
            </div>
            <div className="abk-serif" style={{ fontSize: 17, fontWeight: 500, color: 'var(--ink)', marginBottom: 6 }}>
              {t('stock.deleteRecord')}
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-light)', marginBottom: 4, fontWeight: 300 }}>
              {deleteConfirm.product?.name} — {t(TYPE_CFG[deleteConfirm.type]?.labelKey || 'stock.typeAdjustment')}
            </p>
            <p style={{
              fontSize: 14, fontWeight: 700, marginBottom: 4,
              color: (deleteConfirm.quantityChange ?? 0) > 0 ? 'var(--green)' : 'var(--red-text)',
            }}>
              {(deleteConfirm.quantityChange ?? 0) > 0 ? '+' : ''}{deleteConfirm.quantityChange} {t('stock.units')}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: 12, color: 'var(--ink-faint)', marginBottom: 16 }}>
              <span>{t('stock.before')}: <strong style={{ color: 'var(--ink)' }}>{deleteConfirm.previousStock}</strong></span>
              <span>→</span>
              <span>{t('stock.after')}: <strong style={{ color: 'var(--ink)' }}>{deleteConfirm.newStock}</strong></span>
            </div>
            <p style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginBottom: 20, fontWeight: 300 }}>{t('products.cannotUndo')}</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{
                flex: 1, padding: '10px 0', borderRadius: 10,
                background: 'var(--cream-deep)', border: '1px solid var(--border)',
                color: 'var(--ink-mid)', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                transition: 'background .15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--cream-deep)'}
              >
                {t('ui.cancel')}
              </button>
              <button onClick={() => handleDelete(deleteConfirm.id)} style={{
                flex: 1, padding: '10px 0', borderRadius: 10,
                background: 'var(--red-text)', border: 'none',
                color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                boxShadow: '0 2px 8px rgba(0,0,0,.15)', transition: 'opacity .15s',
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                {t('ui.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}