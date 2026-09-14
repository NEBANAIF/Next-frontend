import { useState, useEffect, useRef } from 'react';
import {
  Search, Plus, Trash2, DollarSign, ShoppingCart,
  TrendingUp, ChevronLeft, ChevronRight, X, RefreshCw,
  XCircle, Calendar, CheckCircle, Landmark, Wallet,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSalesPage, getSalesToday, recordSale, deleteSale, getProducts, getAnalyticsDashboard, getActiveBanks, getActiveBranches, getAvailableBatches } from '../services/api';
import { localYMD } from '../utils/dateUtils';

/* ─────────────────────────────────────────────────────────────────────────────
   Design-system CSS — same token set as Dashboard & Products
   ───────────────────────────────────────────────────────────────────────── */
const SALES_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  .abk-sales {
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
    --yellow-bg:     #FAEEDA;
    --yellow-border: #FAC775;
    --yellow-text:   #633806;
    --texture-col:   #C8DCA8;
  }

  .abk-sales.abk-dark {
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
    --yellow-bg:     #1F1608;
    --yellow-border: #3D2A0A;
    --yellow-text:   #F5C842;
    --texture-col:   #1A2535;
  }

  .abk-sales, .abk-sales * { font-family:'DM Sans',sans-serif; box-sizing:border-box; }
  .abk-sales .abk-serif     { font-family:'Playfair Display',Georgia,serif !important; }

  .abk-sales.abk-texture::before {
    content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
    background-image:
      linear-gradient(var(--texture-col) 1px, transparent 1px),
      linear-gradient(90deg, var(--texture-col) 1px, transparent 1px);
    background-size:48px 48px; opacity:.25;
  }
  .abk-sales.abk-dark.abk-texture::before { opacity:.18; }

  @keyframes abkSFadeUp  { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
  @keyframes abkSFadeIn  { from { opacity:0 } to { opacity:1 } }
  @keyframes abkSScaleIn { from { opacity:0; transform:scale(.94) } to { opacity:1; transform:scale(1) } }
  @keyframes abkSBarGrow { from { transform:scaleX(0) } to { transform:scaleX(1) } }
  @keyframes abkSToast   { 0%{opacity:0;transform:translateY(-12px)} 10%{opacity:1;transform:translateY(0)} 85%{opacity:1} 100%{opacity:0} }

  .abk-sales .abk-anim-fade-up  { opacity:0; animation:abkSFadeUp  .45s ease both; }
  .abk-sales .abk-anim-fade-in  { opacity:0; animation:abkSFadeIn  .45s ease both; }
  .abk-sales .abk-anim-scale-in { opacity:0; animation:abkSScaleIn .45s ease both; }
  .abk-sales .abk-toast         { animation:abkSToast 3.2s ease forwards; }

  .abk-sales .abk-row-hover { transition:background .15s; }
  .abk-sales .abk-row-hover:hover { background:var(--card-hover) !important; }

  .abk-sales .abk-prog-fill { transform-origin:left; animation:abkSBarGrow .85s ease both; }

  .abk-sales .abk-input {
    width:100%; border:1px solid var(--border); border-radius:10px;
    padding:9px 12px; font-size:13px; color:var(--ink);
    background:var(--card); outline:none;
    transition:border-color .15s, box-shadow .15s;
    font-family:'DM Sans',sans-serif;
  }
  .abk-sales .abk-input:focus {
    border-color:var(--green);
    box-shadow:0 0 0 3px rgba(29,158,117,.12);
  }
  .abk-sales .abk-input::placeholder { color:var(--ink-faint); }
  .abk-sales.abk-dark .abk-input    { background:var(--cream-deep); }

  .abk-sales .abk-label {
    display:block; font-size:10.5px; font-weight:600;
    text-transform:uppercase; letter-spacing:.09em;
    color:var(--ink-light); margin-bottom:6px;
  }

  .abk-sales ::-webkit-scrollbar       { width:5px; }
  .abk-sales ::-webkit-scrollbar-track { background:transparent; }
  .abk-sales ::-webkit-scrollbar-thumb { background:var(--border); border-radius:4px; }

  /* ── Responsive: tablet ── */
  @media (max-width:1023px) {
    .abk-sales-kpi-3  { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
    .abk-sales-filter { flex-wrap: wrap !important; }
    .abk-sales-filter > * { min-width: 140px !important; }
  }

  /* ── Responsive: phone ── */
  @media (max-width:767px) {
    .abk-sales-pad    { padding: 1rem 0.75rem 3rem !important; }
    /* Stacked full-width cards on phone — one KPI per row, easier to read */
    .abk-sales-kpi-3  { grid-template-columns: 1fr !important; }
    .abk-sales-filter { flex-direction: column !important; }
    .abk-sales-filter > * { width: 100% !important; }
    .abk-sales-header { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
    .abk-sales-header > * { width: 100% !important; }
    .abk-sales-modal-grid { grid-template-columns: 1fr !important; }

    /* ── Sales table: horizontal scroll — all columns visible, no hiding ── */
    .abk-sales-table-wrap { overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; }
    .abk-sales-table-wrap table { min-width: 760px !important; table-layout: auto !important; }
  }

  @media (max-width:480px) {
    .abk-sales-pad { padding: 0.75rem 0.5rem 2rem !important; }
    .abk-sales-kpi-3 { grid-template-columns: 1fr !important; }
  }
  /* iOS: prevent zoom on input focus */
  @media (max-width:767px) {
    input, select, textarea { font-size: 16px !important; }
  }

  /* Autocomplete dropdown */
  .abk-sales-ac { position: relative; }
  .abk-sales-ac-list {
    position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 200;
    background: var(--card); border: 1px solid var(--border); border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0,0,0,.12); max-height: 200px; overflow-y: auto;
  }
  .abk-sales-ac-item {
    padding: 9px 12px; cursor: pointer; font-size: 13px; color: var(--ink);
    transition: background .12s; display: flex; align-items: center; justify-content: space-between;
  }
  .abk-sales-ac-item:hover, .abk-sales-ac-item.ac-active { background: var(--card-hover); }
  .abk-sales-ac-item:not(:last-child) { border-bottom: 1px solid var(--border-light); }

`;

/* ── helpers ──────────────────────────────────────────────────────────────── */
function fmt(n) {
  return (n ?? 0).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}
function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

/* ── shared UI atoms (same pattern as Products) ───────────────────────────── */
function Modal({ onClose, children, maxWidth = 480 }) {
  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,.45)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:50, padding:16, backdropFilter:'blur(4px)',
    }}>
      <div className="abk-anim-scale-in" style={{
        background:'var(--card)', borderRadius:18, width:'100%', maxWidth,
        maxHeight:'90vh', overflowY:'auto',
        boxShadow:'0 20px 60px rgba(0,0,0,.2), 0 2px 8px rgba(0,0,0,.1)',
        border:'1px solid var(--border)',
      }}>{children}</div>
    </div>
  );
}

function ModalHeader({ title, subtitle, onClose, accent }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'1.1rem 1.4rem', borderBottom:'1px solid var(--border-light)',
      position:'relative', overflow:'hidden',
    }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:accent }} />
      <div style={{ marginTop:4 }}>
        <div className="abk-serif" style={{ fontSize:16, fontWeight:500, color:'var(--ink)' }}>{title}</div>
        {subtitle && <div style={{ fontSize:11, color:'var(--ink-faint)', marginTop:2, fontWeight:300 }}>{subtitle}</div>}
      </div>
      <button onClick={onClose} style={{
        width:30, height:30, borderRadius:8, border:'1px solid var(--border)',
        background:'var(--cream-deep)', display:'flex', alignItems:'center',
        justifyContent:'center', cursor:'pointer', color:'var(--ink-light)',
        transition:'background .15s',
      }}><X size={14} /></button>
    </div>
  );
}

function ModalFooter({ children }) {
  return (
    <div style={{ display:'flex', gap:10, padding:'1rem 1.4rem', borderTop:'1px solid var(--border-light)' }}>
      {children}
    </div>
  );
}

function BtnPrimary({ onClick, disabled, children, color = 'var(--green)' }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      flex:1, padding:'10px 0', background:color, color:'#fff',
      border:'none', borderRadius:11, fontSize:13, fontWeight:500,
      cursor:disabled ? 'not-allowed' : 'pointer', opacity:disabled ? .5 : 1,
      display:'flex', alignItems:'center', justifyContent:'center', gap:6,
      transition:'filter .15s', fontFamily:'DM Sans,sans-serif',
    }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.filter = 'brightness(1.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
    >{children}</button>
  );
}

function BtnSecondary({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      flex:1, padding:'10px 0', background:'var(--cream-deep)', color:'var(--ink-mid)',
      border:'1px solid var(--border)', borderRadius:11, fontSize:13, fontWeight:500,
      cursor:'pointer', transition:'background .15s', fontFamily:'DM Sans,sans-serif',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--cream-deep)'}
    >{children}</button>
  );
}

function KpiCard({ label, value, sub, Icon, stripeColor, iconBg, iconColor, progPct, delay }) {
  return (
    <div className="abk-anim-fade-up" style={{
      background:'var(--card)', border:'1px solid var(--border)',
      borderRadius:14, padding:'1.1rem 1.1rem .9rem',
      position:'relative', overflow:'hidden',
      transition:'background .3s, border-color .3s', animationDelay:delay,
      boxShadow:'0 1px 4px rgba(0,0,0,.06)',
    }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:stripeColor }} />
      <div style={{
        width:32, height:32, borderRadius:8, background:iconBg,
        display:'flex', alignItems:'center', justifyContent:'center',
        marginBottom:9, marginTop:4,
      }}>
        <Icon size={15} color={iconColor} />
      </div>
      <div className="abk-serif" style={{
        fontSize:24, fontWeight:700, color:iconColor, letterSpacing:-0.3,
        marginBottom:4, whiteSpace:'nowrap', overflow:'hidden',
        textOverflow:'ellipsis', lineHeight:1.15,
      }}>{value}</div>
      <div style={{ fontSize:11, color:'var(--ink-light)', fontWeight:400 }}>{label}</div>
      <div style={{ fontSize:10.5, color:'var(--ink-faint)', fontWeight:300, marginTop:1 }}>{sub}</div>
      <div style={{ height:2, background:'var(--cream-deep)', borderRadius:2, overflow:'hidden', marginTop:9 }}>
        <div className="abk-prog-fill" style={{
          height:'100%', borderRadius:2, background:stripeColor,
          width:`${Math.max(2, progPct)}%`,
          animationDelay:`calc(${delay} + .5s)`,
        }} />
      </div>
    </div>
  );
}

/* ── Product Autocomplete ─────────────────────────────────────────────────── */
function ProductAutocomplete({ products, value, onChange, placeholder }) {
  const [query,  setQuery]  = useState('');
  const [open,   setOpen]   = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef(null);
  const ref      = useRef(null);

  // When a product is selected externally (or cleared), sync the display text
  useEffect(() => {
    const p = products.find(p => String(p.id) === String(value));
    setQuery(p ? p.name : '');
  }, [value, products]);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        // If nothing selected, clear query
        if (!value) setQuery('');
        else {
          const p = products.find(p => String(p.id) === String(value));
          setQuery(p ? p.name : '');
        }
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [value, products]);

  const filtered = products.filter(p => {
    if (!query) return true;
    return p.name.toLowerCase().includes(query.toLowerCase());
  });

  function select(p) {
    onChange(p.id);
    setQuery(p.name);
    setOpen(false);
    setActive(-1);
  }

  function handleChange(e) {
    setQuery(e.target.value);
    setOpen(true);
    setActive(-1);
    // Only clear parent value if user is typing (not already matching)
    if (value) {
      const current = products.find(p => String(p.id) === String(value));
      if (!current || current.name !== e.target.value) onChange('');
    }
  }

  function handleFocus() {
    setOpen(true);
    setActive(-1);
    // Select all text so user can immediately type a new search
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function handleKey(e) {
    if (!open) { setOpen(true); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    if (e.key === 'Enter' && active >= 0) { e.preventDefault(); select(filtered[active]); }
    if (e.key === 'Escape') { setOpen(false); }
  }

  return (
    <div className="abk-sales-ac" ref={ref}>
      <div style={{ position: 'relative' }}>
        <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)', pointerEvents: 'none' }} />
        <input
          ref={inputRef}
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          onKeyDown={handleKey}
          placeholder={placeholder || 'Search product…'}
          className="abk-input"
          style={{ paddingLeft: 32, paddingRight: query ? 32 : 12 }}
          autoComplete="off"
        />
        {query && (
          <button
            onMouseDown={e => { e.preventDefault(); onChange(''); setQuery(''); setOpen(false); }}
            style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', display: 'flex', padding: 2 }}
          >
            <X size={13} />
          </button>
        )}
      </div>
      {open && (
        <div className="abk-sales-ac-list">
          {filtered.length === 0 ? (
            <div style={{ padding: '12px', fontSize: 12, color: 'var(--ink-faint)', textAlign: 'center' }}>No products found</div>
          ) : filtered.map((p, i) => (
            <div
              key={p.id}
              className={`abk-sales-ac-item${i === active ? ' ac-active' : ''}`}
              onMouseDown={e => { e.preventDefault(); select(p); }}
            >
              <div>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'monospace' }}>Stock: {p.stock}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Bank Autocomplete — searchable picker shown when Payment = Bank ───────── */
function BankAutocomplete({ banks, value, onChange, placeholder }) {
  const [query,  setQuery]  = useState('');
  const [open,   setOpen]   = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef(null);
  const ref      = useRef(null);

  useEffect(() => {
    const b = banks.find(b => String(b.id) === String(value));
    setQuery(b ? b.name : '');
  }, [value, banks]);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        if (!value) setQuery('');
        else {
          const b = banks.find(b => String(b.id) === String(value));
          setQuery(b ? b.name : '');
        }
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [value, banks]);

  const filtered = banks.filter(b => {
    if (!query) return true;
    return b.name.toLowerCase().includes(query.toLowerCase())
      || (b.branch || '').toLowerCase().includes(query.toLowerCase());
  });

  function select(b) {
    onChange(b.id);
    setQuery(b.name);
    setOpen(false);
    setActive(-1);
  }

  function handleChange(e) {
    setQuery(e.target.value);
    setOpen(true);
    setActive(-1);
    if (value) {
      const current = banks.find(b => String(b.id) === String(value));
      if (!current || current.name !== e.target.value) onChange('');
    }
  }

  function handleFocus() {
    setOpen(true);
    setActive(-1);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function handleKey(e) {
    if (!open) { setOpen(true); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    if (e.key === 'Enter' && active >= 0) { e.preventDefault(); select(filtered[active]); }
    if (e.key === 'Escape') { setOpen(false); }
  }

  return (
    <div className="abk-sales-ac" ref={ref}>
      <div style={{ position: 'relative' }}>
        <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)', pointerEvents: 'none' }} />
        <input
          ref={inputRef}
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          onKeyDown={handleKey}
          placeholder={placeholder || 'Search bank…'}
          className="abk-input"
          style={{ paddingLeft: 32, paddingRight: query ? 32 : 12 }}
          autoComplete="off"
        />
        {query && (
          <button
            onMouseDown={e => { e.preventDefault(); onChange(''); setQuery(''); setOpen(false); }}
            style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', display: 'flex', padding: 2 }}
          >
            <X size={13} />
          </button>
        )}
      </div>
      {open && (
        <div className="abk-sales-ac-list">
          {filtered.length === 0 ? (
            <div style={{ padding: '12px', fontSize: 12, color: 'var(--ink-faint)', textAlign: 'center' }}>
              {banks.length === 0 ? 'No banks registered yet' : 'No banks found'}
            </div>
          ) : filtered.map((b, i) => (
            <div
              key={b.id}
              className={`abk-sales-ac-item${i === active ? ' ac-active' : ''}`}
              onMouseDown={e => { e.preventDefault(); select(b); }}
            >
              <div>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{b.name}</div>
                {b.branch && <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{b.branch}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Sales component
   ════════════════════════════════════════════════════════════════════════════ */
export default function Sales({ dark, user }) {
  // ── Role flags ───────────────────────────────────────────────────────────
  // WORKER: can only see today's sales, can record sales, CANNOT delete
  // ADMIN:  full access — all sales, delete, analytics cards
  const isAdmin  = user?.role?.toUpperCase() === 'ADMIN';
  const isWorker = user?.role?.toUpperCase() === 'WORKER';
  const { t } = useTranslation();

  /* Inject CSS once */
  useEffect(() => {
    const id = 'abk-sales-css';
    let tag = document.getElementById(id);
    if (!tag) {
      tag = document.createElement('style');
      tag.id = id;
      document.head.appendChild(tag);
    }
    tag.innerHTML = SALES_CSS;
    return () => { const el = document.getElementById(id); if (el) el.remove(); };
  }, []);

  const [tableSales,     setTableSales]     = useState([]);   // current page of rows, from the server
  const [totalElements,  setTotalElements]  = useState(0);    // total matching rows, across all pages
  const [totalPages,     setTotalPages]     = useState(1);
  const [tableLoading,   setTableLoading]   = useState(false); // spinner scoped to the table only
  const [todaySales,     setTodaySales]     = useState([]);   // today's rows, via the small /sales/today endpoint
  const [products,       setProducts]       = useState([]);
  const [banks,          setBanks]          = useState([]);   // active banks, for the Bank payment picker
  const [loading,        setLoading]        = useState(true); // initial full-page load only
  const [error,          setError]          = useState(null);
  const [search,         setSearch]         = useState('');
  const [dateFilter,     setDateFilter]     = useState('');
  const [page,           setPage]           = useState(1);
  const [rowsPerPage,    setRowsPerPage]    = useState(10);
  const [showModal,      setShowModal]      = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [deleteConfirm,  setDeleteConfirm]  = useState(null);
  const [successMsg,     setSuccessMsg]     = useState('');
  const [form,           setForm]           = useState({
    productId:'', quantity:1, price:'', customerName:'', paymentStatus:'PAID_FULL', paidAmount:'',
    paymentMethod:'CASH', bankId:'', transactionRef:'', paymentNotes:'', branchId:'', batchId:'',
  });
  const [allTimeSummary, setAllTimeSummary] = useState(null);
  // ── Branch / batch selection (which branch this sale draws stock from) ──
  const [branches,       setBranches]       = useState([]);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [useManualBatch, setUseManualBatch] = useState(false);

  // ── Initial load: today's stats + products + (admin) all-time totals ──────
  // Uses the small, always-fast /api/sales/today endpoint for the "Today"
  // KPI cards instead of loading the whole sales table just to filter it
  // down to today's rows in the browser.
  useEffect(() => { if (user !== undefined) loadAll(); }, [user]);

  async function loadAll() {
    try {
      setLoading(true); setError(null);
      const today = localYMD();

      const [ts, p, b] = await Promise.all([
        getSalesToday(),   // /api/sales/today — small, permits both ADMIN and WORKER
        getProducts(),
        getActiveBanks().catch(() => []),  // banks available for the Bank-payment picker
      ]);
      setTodaySales(ts); setProducts(p); setBanks(b);
      getActiveBranches().then(setBranches).catch(() => setBranches([]));

      if (isAdmin) {
        // Total Revenue / Total Items are ADMIN-only (hidden from workers below),
        // and come from a server-computed aggregate — never from summing a
        // full sales list in the browser.
        const allAgg = await getAnalyticsDashboard({ from:'2000-01-01', to:today, granularity:'month', includeSeries:false }).catch(() => null);
        setAllTimeSummary(allAgg);
      } else {
        setAllTimeSummary(null);
      }
    } catch { setError(t('sales.errorConnect')); }
    finally { setLoading(false); }
  }

  // ── Table: one page at a time from the server ──────────────────────────────
  // Re-fetches whenever the page, rows-per-page, date filter, or (debounced)
  // search text changes. This is the piece that actually scales: no matter
  // how many sales pile up over months/years, this only ever asks the
  // database for `rowsPerPage` rows at a time — the payload size and query
  // cost stay flat instead of growing with the whole table.
  async function loadTablePage() {
    try {
      setTableLoading(true);
      const res = await getSalesPage({ page: page - 1, size: rowsPerPage, search, date: dateFilter });
      setTableSales(res.content ?? []);
      setTotalElements(res.totalElements ?? 0);
      setTotalPages(Math.max(1, res.totalPages ?? 1));
    } catch {
      setTableSales([]); setTotalElements(0); setTotalPages(1);
    } finally {
      setTableLoading(false);
    }
  }

  useEffect(() => {
    if (user === undefined) return;
    // Debounce search typing so we're not firing a request per keystroke —
    // date/page/rowsPerPage changes are already deliberate clicks, so those
    // fire immediately.
    const t = setTimeout(loadTablePage, search ? 350 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page, rowsPerPage, search, dateFilter]);

  function showSuccess(msg) { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3200); }

  // Refetch the available-batch list (for the optional manual picker)
  // whenever the product or branch selection changes. No branch selected
  // means "quick sale, no branch/cost tracking" — same as before branches
  // existed — so we don't fetch anything in that case.
  useEffect(() => {
    if (!form.productId || !form.branchId) { setAvailableBatches([]); return; }
    getAvailableBatches(parseInt(form.productId), parseInt(form.branchId))
      .then(setAvailableBatches)
      .catch(() => setAvailableBatches([]));
  }, [form.productId, form.branchId]);

  const todayRev   = todaySales.reduce((a, s) => a + (s.total || 0), 0);
  const totalRev   = allTimeSummary?.totalRevenue  ?? 0;   // server-computed aggregate, ADMIN only
  const totalItems = allTimeSummary?.totalQuantity ?? 0;   // server-computed aggregate, ADMIN only

  function openModal() {
    setForm({
      productId:'', quantity:1, price:'', customerName:'', paymentStatus:'PAID_FULL', paidAmount:'',
      paymentMethod:'CASH', bankId:'', transactionRef:'', paymentNotes:'', branchId:'', batchId:'',
    });
    setUseManualBatch(false);
    setShowModal(true);
  }

  function handleProductChange(productId) {
    setForm(f => ({ ...f, productId, price: '', batchId: '' }));
    setUseManualBatch(false);
  }

  async function handleRecord() {
    if (!form.productId || !form.quantity || !form.price) { alert(t('sales.alertFields')); return; }
    if (!form.customerName || !form.customerName.trim()) { alert('Customer name is required.'); return; }
    const sel = products.find(p => String(p.id) === String(form.productId));
    if (sel && parseInt(form.quantity) > sel.stock) { alert(`${t('sales.notEnoughStock')} ${sel.stock}`); return; }
    if (form.paymentMethod === 'BANK' && !form.bankId) { alert('Please select a bank for a bank payment.'); return; }

    const total = (parseFloat(form.price) || 0) * (parseInt(form.quantity) || 0);
    let paidAmount = total;
    let remainingLoan = 0;

    if (form.paymentStatus === 'PARTIAL_LOAN') {
      paidAmount = parseFloat(form.paidAmount) || 0;
      if (paidAmount < 0)      { alert('Amount paid cannot be negative.'); return; }
      if (paidAmount > total)  { alert(`Amount paid (${paidAmount.toFixed(2)}) cannot exceed the total (${total.toFixed(2)}).`); return; }
      remainingLoan = total - paidAmount;
    }

    setSaving(true);
    try {
      await recordSale({
        product:       { id: parseInt(form.productId) },
        quantity:      parseInt(form.quantity),
        price:         parseFloat(form.price),
        customerName:  form.customerName.trim(),
        paymentStatus: form.paymentStatus,
        paidAmount,
        remainingLoan,
        recordedBy:    user?.name || 'Staff',
        // Payment integration — creates a linked Payment record on the backend
        paymentMethod:  form.paymentMethod,
        bankId:         form.paymentMethod === 'BANK' ? parseInt(form.bankId) : null,
        transactionRef: form.transactionRef.trim() || null,
        paymentNotes:   form.paymentNotes.trim() || null,
        // Which branch this sale draws stock from — optional. Omitting it
        // keeps the old behavior (plain Product.stock deduction, no batch
        // tracking). batchId is an optional manual override; when unset,
        // the backend consumes automatically, oldest batch first.
        branch:  form.branchId ? { id: parseInt(form.branchId) } : null,
        batchId: (useManualBatch && form.batchId) ? parseInt(form.batchId) : null,
      });
      setShowModal(false); showSuccess(t('sales.successRecord')); await Promise.all([loadAll(), loadTablePage()]);
    } catch (e) { alert(e.message || t('sales.errorRecord')); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    try { await deleteSale(id); setDeleteConfirm(null); showSuccess(t('sales.successDelete')); await Promise.all([loadAll(), loadTablePage()]); }
    catch { alert(t('sales.errorDelete')); }
  }

  const selectedProduct = products.find(p => String(p.id) === String(form.productId));
  const saleTotal       = (parseFloat(form.price) || 0) * (parseInt(form.quantity) || 0);
  const paidAmt         = form.paymentStatus === 'PARTIAL_LOAN' ? (parseFloat(form.paidAmount) || 0) : saleTotal;
  const remainingAmt    = form.paymentStatus === 'PARTIAL_LOAN' ? Math.max(0, saleTotal - paidAmt) : 0;
  const paidAmtInvalid  = form.paymentStatus === 'PARTIAL_LOAN' && (paidAmt < 0 || paidAmt > saleTotal);

  /* ── Loading ── */
  if (loading) return (
    <div className={`abk-sales abk-texture${dark ? ' abk-dark' : ''}`}
      style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--cream)' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:34, height:34, border:'3px solid var(--border)', borderTopColor:'var(--green)', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 12px' }} />
        <p style={{ color:'var(--ink-faint)', fontSize:13, fontWeight:300 }}>{t('sales.loading')}</p>
      </div>
    </div>
  );

  /* ── Error ── */
  if (error) return (
    <div className={`abk-sales abk-texture${dark ? ' abk-dark' : ''}`}
      style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--cream)' }}>
      <div style={{ background:'var(--card)', border:'1px solid var(--red-border)', borderRadius:18, padding:32, textAlign:'center', maxWidth:380, boxShadow:'0 4px 24px rgba(0,0,0,.1)' }}>
        <XCircle size={38} style={{ color:'var(--red-text)', marginBottom:12 }} />
        <div className="abk-serif" style={{ fontSize:16, fontWeight:500, color:'var(--ink)', marginBottom:6 }}>{t('sales.errorTitle')}</div>
        <p style={{ color:'var(--ink-faint)', fontSize:12, marginBottom:16, fontWeight:300 }}>{error}</p>
        <button onClick={loadAll} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 18px', background:'var(--green)', color:'#fff', border:'none', borderRadius:10, fontSize:13, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
          <RefreshCw size={13} /> {t('sales.tryAgain')}
        </button>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className={`abk-sales abk-texture${dark ? ' abk-dark' : ''}`}
      style={{ background:'var(--cream)', minHeight:'100vh', position:'relative', transition:'background .3s' }}>

      {/* ── Toast ── */}
      {successMsg && (
        <div className="abk-toast" style={{
          position:'fixed', top:20, right:20, zIndex:100,
          display:'inline-flex', alignItems:'center', gap:8,
          background:'var(--green)', color:'#fff',
          padding:'10px 18px', borderRadius:12,
          fontSize:13, fontWeight:500,
          boxShadow:'0 4px 20px rgba(29,158,117,.35)',
        }}>
          <CheckCircle size={15} /> {successMsg}
        </div>
      )}

      <div className="abk-sales-pad" style={{ position:'relative', zIndex:1, padding:'1.5rem 1.5rem 3rem' }}>

        {/* ── Page Header ──────────────────────────────────────────────── */}
        <div className="abk-anim-fade-up" style={{ padding:'0.5rem 0 1.4rem', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
          <div>
            <div style={{ fontSize:10.5, fontWeight:500, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--ink-light)', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ display:'inline-block', width:18, height:1.5, background:'var(--green)', borderRadius:1 }} />
              {t('nav.sales')}
            </div>
            <div className="abk-serif" style={{ fontSize:28, fontWeight:500, color:'var(--ink)', letterSpacing:-0.5, lineHeight:1.1 }}>
              {t('nav.sales')}
            </div>
            <div style={{ fontSize:12, color:'var(--ink-faint)', marginTop:4, fontWeight:300 }}>
              {t('sales.subtitle')}
            </div>
            {/* WORKER mode notice — shown below page title */}
            {isWorker && (
              <div style={{
                marginTop:10, display:'inline-flex', alignItems:'center', gap:7,
                padding:'6px 12px', borderRadius:10,
                background: dark ? 'rgba(251,191,36,.08)' : '#FFFBEB',
                border: dark ? '1px solid rgba(251,191,36,.2)' : '1px solid #FDE68A',
                fontSize:11, color: dark ? '#FBBf24' : '#92400E',
              }}>
                <span style={{ fontWeight:600 }}>👷 Worker mode</span>
                <span style={{ fontWeight:300 }}>· No delete access</span>
              </div>
            )}
          </div>

          <div style={{ display:'flex', gap:8, alignItems:'center', paddingTop:4 }}>
            <button onClick={loadAll} style={{
              display:'inline-flex', alignItems:'center', gap:5, padding:'8px 14px',
              background:'var(--card)', border:'1px solid var(--border)', borderRadius:11,
              color:'var(--ink-mid)', fontSize:12, cursor:'pointer', fontFamily:'DM Sans,sans-serif',
              transition:'background .15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--cream-deep)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--card)'}
            >
              <RefreshCw size={12} /> Refresh
            </button>
            <button onClick={openModal} style={{
              display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px',
              background:'var(--green)', color:'#fff', border:'none', borderRadius:11,
              fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'DM Sans,sans-serif',
              boxShadow:'0 2px 8px rgba(29,158,117,.3)', transition:'filter .15s',
            }}
              onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
              onMouseLeave={e => e.currentTarget.style.filter = 'none'}
            >
              <Plus size={14} /> {t('sales.recordSale')}
            </button>
          </div>
        </div>

        {/* ── KPI Cards ─────────────────────────────────────────────────── */}
        <div className="abk-sales-kpi-3" style={{ display:'grid', gridTemplateColumns:`repeat(${isWorker ? 2 : 3},minmax(0,1fr))`, gap:10, marginBottom:'1.1rem' }}>
          <KpiCard
            label={t('sales.todayRevenue')} value={`$${fmt(todayRev)}`}
            sub={`${todaySales.length} ${t('sales.transactionsToday')}`}
            Icon={DollarSign} stripeColor="var(--green)" iconBg="var(--green-bg)" iconColor="var(--green)"
            progPct={todayRev > 0 ? 68 : 2} delay=".06s"
          />
          <KpiCard
            label={t('sales.todaySales')} value={todaySales.length}
            sub={`${todaySales.reduce((a, x) => a + (x.quantity || 0), 0)} ${t('sales.itemsSoldToday')}`}
            Icon={ShoppingCart} stripeColor="var(--blue)" iconBg="var(--blue-bg)" iconColor="var(--blue)"
            progPct={todaySales.length > 0 ? 55 : 2} delay=".13s"
          />
          {/* Total Revenue — ADMIN only; workers don't see cumulative revenue */}
          {!isWorker && (
            <KpiCard
              label={t('sales.totalRevenue')} value={`$${fmt(totalRev)}`}
              sub={`${totalItems} ${t('sales.totalItemsSold')}`}
              Icon={TrendingUp} stripeColor="var(--purple)" iconBg="var(--purple-bg)" iconColor="var(--purple)"
              progPct={82} delay=".20s"
            />
          )}
        </div>

        {/* ── Search & Filter ───────────────────────────────────────────── */}
        <div className="abk-anim-fade-in abk-sales-filter" style={{ display:'flex', gap:8, marginBottom:'1rem', animationDelay:'.28s' }}>
          <div style={{ flex:1, position:'relative' }}>
            <Search size={14} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--ink-faint)', pointerEvents:'none' }} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('sales.searchPlaceholder')} className="abk-input" style={{ paddingLeft:34 }} />
          </div>
          <div style={{ position:'relative' }}>
            <Calendar size={13} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--ink-faint)', pointerEvents:'none' }} />
            <input type="date" value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1); }}
              className="abk-input" style={{ paddingLeft:32, minWidth:160, cursor:'pointer', colorScheme: dark ? 'dark' : 'light' }} />
          </div>
          {(search || dateFilter) && (
            <button onClick={() => { setSearch(''); setDateFilter(''); setPage(1); }} style={{
              display:'inline-flex', alignItems:'center', gap:5, padding:'0 13px',
              background:'var(--red-bg)', border:'1px solid var(--red-border)',
              borderRadius:10, color:'var(--red-text)', fontSize:12, cursor:'pointer', fontFamily:'DM Sans,sans-serif',
            }}>
              <X size={12} /> {t('ui.clear')}
            </button>
          )}
        </div>

        {/* ── Table ─────────────────────────────────────────────────────── */}
        <div className="abk-anim-scale-in" style={{
          background:'var(--card)', border:'1px solid var(--border)',
          borderRadius:16, width:'100%', overflow:'hidden',
          boxShadow:'0 2px 12px rgba(0,0,0,.06)',
          animationDelay:'.32s', transition:'background .3s, border-color .3s',
        }}>
          {/* Table sub-header */}
          <div style={{
            padding:'10px 16px', borderBottom:'1px solid var(--border-light)',
            background:'var(--cream-deep)', display:'flex', alignItems:'center', justifyContent:'space-between',
            borderRadius:'16px 16px 0 0',
          }}>
            <div className="abk-serif" style={{ fontSize:14, fontWeight:500, color:'var(--ink)' }}>{t('sales.salesHistory')}</div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              {/* NOTE: the old "sum of all filtered rows" badge is gone here — with
                  server-side pagination, only the current page's rows are ever in
                  the browser, so summing them client-side would silently show the
                  wrong number (just this page's total, mislabeled as the filtered
                  total). Showing the accurate figure would need a small dedicated
                  SUM query on the backend — worth adding if this number is missed. */}
              <span style={{ fontSize:11, color:'var(--ink-faint)', fontWeight:300 }}>{totalElements} {t('dashboard.records')}</span>
            </div>
          </div>

          <div className="abk-sales-table-wrap" style={{ overflowX:'auto', borderRadius:'0 0 16px 16px', width:'100%', display:'block' }}>
            <table style={{ width:'100%', minWidth:'max-content', borderCollapse:'collapse' }}>
              {/* colgroup — controls per-column widths on mobile via CSS col selectors */}
              <colgroup>
                <col />{/* Date & Time */}
                <col />{/* Product */}
                <col />{/* Customer */}
                <col />{/* Qty */}
                <col />{/* Unit Price */}
                <col />{/* Total */}
                <col />{/* Payment */}
                {isAdmin && <col />}{/* Actions — admin only */}
              </colgroup>
              <thead>
                <tr style={{ background:'var(--cream-deep)', borderBottom:'1px solid var(--border)' }}>
                  {[
                    `${t('sales.date')} & ${t('sales.time')}`,
                    t('sales.product'), t('sales.customer'),
                    t('sales.qty'), t('sales.unitPrice'), t('sales.total'),
                    'Payment',
                    ...(isAdmin ? [t('ui.actions')] : []),
                  ].map(h => (
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:600, letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--ink-light)', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableLoading ? (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 7} style={{ textAlign:'center', padding:'3.5rem 0' }}>
                      <div style={{ width:24, height:24, border:'3px solid var(--border)', borderTopColor:'var(--green)', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto' }} />
                    </td>
                  </tr>
                ) : tableSales.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 7} style={{ textAlign:'center', padding:'3.5rem 0' }}>
                      <ShoppingCart size={34} style={{ color:'var(--border)', margin:'0 auto 10px', display:'block' }} />
                      <p style={{ color:'var(--ink-faint)', fontSize:13, fontWeight:300 }}>
                        {search || dateFilter ? t('sales.noSalesFilter') : t('sales.noSalesYet')}
                      </p>
                    </td>
                  </tr>
                ) : tableSales.map(s => (
                  <tr key={s.id} className="abk-row-hover" style={{ borderBottom:'1px solid var(--border-light)', background:'var(--card)' }}>
                    {/* Date / time */}
                    <td data-label="Date & Time" style={{ padding:'11px 14px' }}>
                      <div style={{ fontSize:13, fontWeight:500, color:'var(--ink)' }}>{fmtDate(s.saleDate)}</div>
                      {s.saleTime && <div style={{ fontSize:10.5, color:'var(--ink-faint)', marginTop:2, fontWeight:300 }}>{fmtTime(s.saleTime)}</div>}
                    </td>
                    {/* Product */}
                    <td data-label="Product" style={{ padding:'11px 14px' }}>
                      <div style={{ fontSize:13, fontWeight:500, color:'var(--ink)' }}>{s.product?.name || '—'}</div>
                    </td>
                    {/* Customer */}
                    <td data-label="Customer" style={{ padding:'11px 14px', fontSize:12, color:'var(--ink-light)', fontWeight:300 }}>
                      {s.customerName || <span style={{ color:'var(--border)' }}>—</span>}
                    </td>
                    {/* Qty */}
                    <td data-label="Qty" style={{ padding:'11px 14px' }}>
                      <span style={{
                        display:'inline-block', fontSize:12, fontWeight:600, color:'var(--blue)',
                        background:'var(--blue-bg)', border:'1px solid rgba(24,95,165,.18)',
                        padding:'2px 10px', borderRadius:20,
                      }}>{s.quantity}</span>
                    </td>
                    {/* Unit price */}
                    <td data-label="Unit Price" style={{ padding:'11px 14px', fontSize:12, color:'var(--ink-faint)', fontWeight:300 }}>
                      ${fmt(s.price)}
                    </td>
                    {/* Total */}
                    <td data-label="Total" style={{ padding:'11px 14px' }}>
                      <span className="abk-serif" style={{ fontSize:14, fontWeight:600, color:'var(--green)' }}>
                        ${fmt(s.total)}
                      </span>
                    </td>
                    {/* Payment status */}
                    <td data-label="Payment" style={{ padding:'11px 14px' }}>
                      {s.paymentStatus === 'PARTIAL_LOAN' ? (
                        <div>
                          <span style={{
                            display:'inline-block', fontSize:11, fontWeight:600, padding:'2px 9px',
                            borderRadius:20, background:'var(--amber-bg)',
                            color:'var(--amber)', border:'1px solid var(--yellow-border)',
                          }}>Loan</span>
                          {(s.remainingLoan ?? 0) > 0 && (
                            <div style={{ fontSize:10.5, color:'var(--amber)', marginTop:3, fontWeight:400 }}>
                              Owed: ${fmt(s.remainingLoan)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{
                          display:'inline-block', fontSize:11, fontWeight:600, padding:'2px 9px',
                          borderRadius:20, background:'var(--green-bg)',
                          color:'var(--green)', border:'1px solid rgba(29,158,117,.25)',
                        }}>Paid</span>
                      )}
                    </td>
                    {/* Actions — delete button only shown to ADMIN, and never for loan
                        records (partial or with an outstanding balance). Loans can never
                        be deleted by anyone, so the button is simply not rendered for them
                        rather than being shown and then rejected. */}
                    {isAdmin && (
                      <td className="abk-td-actions" style={{ padding:'11px 14px' }}>
                        {s.paymentStatus !== 'PARTIAL_LOAN' && (s.remainingLoan ?? 0) <= 0 && (
                          <button onClick={() => setDeleteConfirm(s)} style={{
                            width:28, height:28, borderRadius:8, border:'1px solid var(--red-border)',
                            background:'var(--red-bg)', color:'var(--red-text)',
                            display:'inline-flex', alignItems:'center', justifyContent:'center',
                            cursor:'pointer', transition:'background .15s, transform .1s',
                          }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-border)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--red-bg)'; e.currentTarget.style.transform = 'none'; }}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'10px 14px', borderTop:'1px solid var(--border-light)',
            background:'var(--cream-deep)',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--ink-faint)', fontWeight:300 }}>
              <span>Rows:</span>
              {[10, 20, 50, 100].map(n => (
                <button key={n} onClick={() => { setRowsPerPage(n); setPage(1); }} style={{
                  padding:'2px 9px', borderRadius:7, fontSize:11, fontWeight:500, cursor:'pointer',
                  background: rowsPerPage === n ? 'var(--green)' : 'var(--card)',
                  color: rowsPerPage === n ? '#fff' : 'var(--ink-faint)',
                  border:`1px solid ${rowsPerPage === n ? 'var(--green)' : 'var(--border)'}`,
                  fontFamily:'DM Sans,sans-serif', transition:'background .15s',
                }}>{n}</button>
              ))}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, color:'var(--ink-faint)', fontWeight:300 }}>
              <span>{totalElements === 0 ? 0 : (page-1)*rowsPerPage+1}–{Math.min(page*rowsPerPage, totalElements)} / {totalElements}</span>
              {[
                { Icon:ChevronLeft,  action:() => setPage(p => Math.max(1,p-1)),         disabled:page===1 },
                { Icon:ChevronRight, action:() => setPage(p => Math.min(totalPages,p+1)), disabled:page===totalPages },
              ].map(({ Icon, action, disabled }, i) => (
                <button key={i} onClick={action} disabled={disabled} style={{
                  width:26, height:26, borderRadius:7, border:'1px solid var(--border)',
                  background:'var(--card)', color:'var(--ink-light)', cursor:disabled ? 'not-allowed' : 'pointer',
                  opacity:disabled ? .35 : 1, display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'background .15s',
                }}><Icon size={13} /></button>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            MODAL: Record Sale
        ══════════════════════════════════════════════════════════════════ */}
        {showModal && (
          <Modal onClose={() => setShowModal(false)} maxWidth={460}>
            <ModalHeader title={t('sales.recordSale')} subtitle={t('sales.saleDetails')} onClose={() => setShowModal(false)} accent="var(--green)" />

            <div style={{ padding:'1.2rem 1.4rem', display:'flex', flexDirection:'column', gap:14 }}>

              {/* Product autocomplete */}
              <div>
                <label className="abk-label">{t('sales.product')} *</label>
                <ProductAutocomplete
                  products={products.filter(p => p.stock > 0)}
                  value={form.productId}
                  onChange={handleProductChange}
                  placeholder={t('sales.selectProduct')}
                />
                {products.filter(p => p.stock > 0).length === 0 && (
                  <div style={{ fontSize:11, color:'var(--red-text)', marginTop:5, display:'flex', alignItems:'center', gap:4 }}>
                    <XCircle size={11} /> {t('sales.noProductsAvailable')}
                  </div>
                )}
              </div>

              {/* Stock preview */}
              {selectedProduct && (
                <div style={{
                  background: selectedProduct.stock < 10 ? 'var(--amber-bg)' : 'var(--green-bg)',
                  border:`1px solid ${selectedProduct.stock < 10 ? 'var(--yellow-border)' : 'rgba(29,158,117,.25)'}`,
                  borderRadius:10, padding:'10px 14px', display:'flex', justifyContent:'space-between',
                }}>
                  <span style={{ fontSize:12, fontWeight:500, color: selectedProduct.stock < 10 ? 'var(--amber)' : 'var(--green)' }}>{t('sales.availableStock')}</span>
                  <span className="abk-serif" style={{ fontSize:14, fontWeight:600, color: selectedProduct.stock < 10 ? 'var(--amber)' : 'var(--green)' }}>
                    {selectedProduct.stock} {t('sales.availableUnit')}
                  </span>
                </div>
              )}

              {/* Branch — optional. Selecting one draws stock from that
                  branch's batches (own cost tracked); leaving it blank is a
                  quick sale against the product's overall stock total, same
                  as before branches existed. */}
              {branches.length > 0 && (
                <div>
                  <label className="abk-label">Branch (optional)</label>
                  <select
                    value={form.branchId}
                    onChange={e => { setForm(f => ({ ...f, branchId: e.target.value, batchId: '' })); setUseManualBatch(false); }}
                    className="abk-input"
                  >
                    <option value="">No branch — quick sale (no cost tracking)</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.location?.name ? `${b.location.name} — ${b.name}` : b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Manual batch override — only offered once a branch with
                  open batches is selected. Left off, the backend consumes
                  automatically, oldest batch first. */}
              {form.branchId && availableBatches.length > 0 && (
                <div>
                  <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:12.5, color:'var(--ink-mid)', cursor:'pointer', marginBottom: useManualBatch ? 8 : 0 }}>
                    <input type="checkbox" checked={useManualBatch} onChange={e => { setUseManualBatch(e.target.checked); setForm(f => ({ ...f, batchId: '' })); }} />
                    Choose a specific batch (otherwise oldest batch is used automatically)
                  </label>
                  {useManualBatch && (
                    <select value={form.batchId} onChange={e => setForm(f => ({ ...f, batchId: e.target.value }))} className="abk-input">
                      <option value="">Select a batch…</option>
                      {availableBatches.map(b => (
                        <option key={b.id} value={b.id}>
                          {(b.batchNumber || `Batch #${b.id}`)} — {b.quantityRemaining} left @ {b.costPerUnit}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Qty + Price */}
              <div className="abk-sales-modal-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label className="abk-label">{t('sales.qty')} *</label>
                  <input type="number" min="1" max={selectedProduct?.stock || 9999}
                    value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity:e.target.value }))}
                    className="abk-input" />
                </div>
                <div>
                  <label className="abk-label">{t('sales.unitPrice')} *</label>
                  <input type="number" min="0" step="0.01" value={form.price}
                    onChange={e => setForm(f => ({ ...f, price:e.target.value }))}
                    placeholder="0.00" className="abk-input" />
                </div>
              </div>

              {/* Customer — REQUIRED */}
              <div>
                <label className="abk-label">Customer Name *</label>
                <input
                  value={form.customerName}
                  onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                  placeholder="Enter customer name"
                  className="abk-input"
                  style={{ borderColor: form.customerName.trim() === '' && saving ? 'var(--red-text)' : undefined }}
                />
                {form.customerName.trim() === '' && (
                  <div style={{ fontSize:11, color:'var(--red-text)', marginTop:4, display:'flex', alignItems:'center', gap:3 }}>
                    <XCircle size={11} /> Customer name is required
                  </div>
                )}
              </div>

              {/* Payment Method — Cash or Bank. Selecting Bank reveals a
                  searchable list of registered banks below. */}
              <div>
                <label className="abk-label">Payment Method</label>
                <div style={{ display:'flex', gap:8 }}>
                  {[
                    { value:'CASH', label:'Cash', Icon:Wallet,   color:'var(--green)', bg:'var(--green-bg)' },
                    { value:'BANK', label:'Bank', Icon:Landmark, color:'var(--blue)',  bg:'var(--blue-bg)'  },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setForm(f => ({ ...f, paymentMethod: opt.value, bankId: opt.value === 'CASH' ? '' : f.bankId }))}
                      style={{
                        flex:1, padding:'9px 0', borderRadius:10, fontSize:12, fontWeight:600,
                        cursor:'pointer', fontFamily:'DM Sans,sans-serif',
                        display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6,
                        transition:'all .15s',
                        background: form.paymentMethod === opt.value ? opt.bg   : 'var(--card)',
                        color:      form.paymentMethod === opt.value ? opt.color : 'var(--ink-light)',
                        border:     form.paymentMethod === opt.value
                          ? `2px solid ${opt.color}`
                          : '1px solid var(--border)',
                      }}
                    ><opt.Icon size={13} /> {opt.label}</button>
                  ))}
                </div>
              </div>

              {/* Bank picker — only shown when Payment Method = Bank */}
              {form.paymentMethod === 'BANK' && (
                <div>
                  <label className="abk-label">Select Bank *</label>
                  <BankAutocomplete
                    banks={banks}
                    value={form.bankId}
                    onChange={bankId => setForm(f => ({ ...f, bankId }))}
                    placeholder="Search registered banks…"
                  />
                  {banks.length === 0 && (
                    <div style={{ fontSize:11, color:'var(--red-text)', marginTop:5, display:'flex', alignItems:'center', gap:4 }}>
                      <XCircle size={11} /> No banks registered yet — add one on the Payments page.
                    </div>
                  )}
                </div>
              )}

              {/* Optional transaction/reference number + note */}
              <div className="abk-sales-modal-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label className="abk-label">Transaction Ref <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0 }}>(optional)</span></label>
                  <input
                    value={form.transactionRef}
                    onChange={e => setForm(f => ({ ...f, transactionRef: e.target.value }))}
                    placeholder="e.g. TX-88213"
                    className="abk-input"
                  />
                </div>
                <div>
                  <label className="abk-label">Note <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0 }}>(optional)</span></label>
                  <input
                    value={form.paymentNotes}
                    onChange={e => setForm(f => ({ ...f, paymentNotes: e.target.value }))}
                    placeholder="Any note about this payment"
                    className="abk-input"
                  />
                </div>
              </div>

              {/* Payment status option */}
              <div>
                <label className="abk-label">Payment Status</label>
                <div style={{ display:'flex', gap:8 }}>
                  {[
                    { value:'PAID_FULL',    label:'Paid Full',     color:'var(--green)',  bg:'var(--green-bg)'  },
                    { value:'PARTIAL_LOAN', label:'Partial / Loan', color:'var(--amber)',  bg:'var(--amber-bg)'  },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setForm(f => ({ ...f, paymentStatus: opt.value, paidAmount: '' }))}
                      style={{
                        flex:1, padding:'9px 0', borderRadius:10, fontSize:12, fontWeight:600,
                        cursor:'pointer', fontFamily:'DM Sans,sans-serif',
                        transition:'all .15s',
                        background: form.paymentStatus === opt.value ? opt.bg   : 'var(--card)',
                        color:      form.paymentStatus === opt.value ? opt.color : 'var(--ink-light)',
                        border:     form.paymentStatus === opt.value
                          ? `2px solid ${opt.color}`
                          : '1px solid var(--border)',
                      }}
                    >{opt.label}</button>
                  ))}
                </div>
              </div>

              {/* Amount Paid — shown only for PARTIAL_LOAN */}
              {form.paymentStatus === 'PARTIAL_LOAN' && (
                <div>
                  <label className="abk-label">Amount Paid</label>
                  <input
                    type="number" min="0" max={saleTotal} step="0.01"
                    value={form.paidAmount}
                    onChange={e => setForm(f => ({ ...f, paidAmount: e.target.value }))}
                    placeholder={`0.00 – ${saleTotal.toFixed(2)}`}
                    className="abk-input"
                    style={{ borderColor: paidAmtInvalid ? 'var(--red-text)' : undefined }}
                  />
                  {paidAmtInvalid && (
                    <div style={{ fontSize:11, color:'var(--red-text)', marginTop:4, display:'flex', alignItems:'center', gap:3 }}>
                      <XCircle size={11} />
                      {paidAmt < 0 ? 'Cannot be negative.' : `Cannot exceed total of $${saleTotal.toFixed(2)}.`}
                    </div>
                  )}
                  {/* Remaining loan preview */}
                  {!paidAmtInvalid && saleTotal > 0 && (
                    <div style={{
                      marginTop:8, background:'var(--amber-bg)',
                      border:'1px solid var(--yellow-border)',
                      borderRadius:9, padding:'8px 12px',
                      display:'flex', justifyContent:'space-between', alignItems:'center',
                    }}>
                      <span style={{ fontSize:11, color:'var(--amber)', fontWeight:500 }}>Remaining Loan</span>
                      <span className="abk-serif" style={{ fontSize:15, fontWeight:700, color:'var(--amber)' }}>
                        ${remainingAmt.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Total preview */}
              <div style={{
                background:'var(--green-bg)', border:'1px solid rgba(29,158,117,.25)',
                borderRadius:11, padding:'12px 16px',
              }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontSize:11, color:'var(--green)', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.08em' }}>{t('sales.totalAmount')}</div>
                    <div style={{ fontSize:11, color:'var(--ink-faint)', marginTop:2, fontWeight:300 }}>{form.quantity || 0} × ${form.price || 0}</div>
                  </div>
                  <div className="abk-serif" style={{ fontSize:26, fontWeight:700, color:'var(--green)' }}>
                    ${saleTotal.toFixed(2)}
                  </div>
                </div>
                {form.paymentStatus === 'PARTIAL_LOAN' && saleTotal > 0 && !paidAmtInvalid && (
                  <div style={{
                    marginTop:10, paddingTop:10,
                    borderTop:'1px dashed rgba(29,158,117,.3)',
                    display:'flex', justifyContent:'space-between', fontSize:11,
                  }}>
                    <span style={{ color:'var(--green)', fontWeight:400 }}>Paid now</span>
                    <span style={{ color:'var(--green)', fontWeight:600 }}>${paidAmt.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            <ModalFooter>
              <BtnSecondary onClick={() => setShowModal(false)}>{t('ui.cancel')}</BtnSecondary>
              <BtnPrimary onClick={handleRecord} disabled={saving}>
                {saving
                  ? <><RefreshCw size={13} style={{ animation:'spin 1s linear infinite' }} /> {t('sales.recording')}</>
                  : <><CheckCircle size={13} /> {t('sales.recordSale')}</>}
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
              <div className="abk-serif" style={{ fontSize:17, fontWeight:500, color:'var(--ink)', marginBottom:6 }}>{t('sales.deleteSale')}</div>
              <p style={{ fontSize:13, color:'var(--ink-light)', marginBottom:4, fontWeight:300 }}>
                {t('sales.saleOf')} <strong style={{ color:'var(--ink)', fontWeight:500 }}>{deleteConfirm.product?.name}</strong> {t('sales.on')} {fmtDate(deleteConfirm.saleDate)}
              </p>
              <p style={{ fontSize:12, color:'var(--ink-faint)', marginBottom:4, fontWeight:300 }}>
                {t('sales.total')}: <span className="abk-serif" style={{ fontWeight:600, color:'var(--green)', fontSize:14 }}>${fmt(deleteConfirm.total)}</span>
              </p>
              <p style={{ fontSize:11, color:'var(--blue)', marginBottom:20, fontWeight:300 }}>{t('sales.stockRestored')}</p>
              <div style={{ display:'flex', gap:10 }}>
                <BtnSecondary onClick={() => setDeleteConfirm(null)}>{t('ui.cancel')}</BtnSecondary>
                <BtnPrimary onClick={() => handleDelete(deleteConfirm.id)} color="#c53030">{t('ui.delete')}</BtnPrimary>
              </div>
            </div>
          </Modal>
        )}

      </div>
    </div>
  );
}