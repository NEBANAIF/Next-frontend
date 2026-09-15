/**
 * ─────────────────────────────────────────────────────────────────────────
 *  Transfers.jsx — Stock transfer management
 *
 *  Request → Approve → Complete workflow between any two branches
 *  (Warehouse↔Warehouse, Warehouse↔Store, or Store↔Store — every
 *  location's stock lives on a branch either way).
 *
 *  Any operational role can request a transfer between branches they can
 *  see. Approving/rejecting a request requires access to the SOURCE
 *  branch (it's the moment stock actually leaves); completing requires
 *  access to the DESTINATION branch (confirming receipt). ADMIN can do
 *  all of the above regardless of branch. The backend enforces all of
 *  this — this page just calls the endpoints and shows what comes back.
 * ─────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect } from 'react';
import {
  Search, Plus, X, RefreshCw, CheckCircle, ArrowLeftRight, ArrowRight,
  Clock, CheckCircle2, XCircle, PackageCheck, ChevronLeft, ChevronRight,
} from 'lucide-react';
import {
  getProducts, getActiveBranches, getAvailableBatches,
  getPendingTransfers, searchTransfers, requestTransfer,
  approveTransfer, rejectTransfer, completeTransfer,
} from '../services/api';

/* Reuses the same design tokens as Branches.jsx / Batches.jsx */
const TR_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  .abk-transfer {
    --cream:#F0F7E2; --cream-deep:#E4F0CF; --ink:#0F1F04; --ink-mid:#3A5220;
    --ink-light:#6A8A4A; --ink-faint:#A8C080; --border:#D0E4B0; --border-light:#E2EFC8;
    --card:#FFFFFF; --card-hover:#F3FAE6; --green:#1D9E75; --green-bg:#E1F5EE;
    --blue:#185FA5; --blue-bg:#E6F1FB; --purple:#534AB7; --purple-bg:#EEEDFE;
    --amber:#854F0B; --amber-bg:#FAEEDA; --red-bg:#FCEBEB; --red-border:#F7C1C1;
    --red-text:#791F1F; --texture-col:#C8DCA8;
  }
  .abk-transfer.abk-dark {
    --cream:#0D1117; --cream-deep:#161B22; --ink:#E6EDF3; --ink-mid:#B8C9DB;
    --ink-light:#8BA4BE; --ink-faint:#5A7A96; --border:#21303F; --border-light:#1A2535;
    --card:#13192A; --card-hover:#1C2540; --green:#3DD68C; --green-bg:#0D2B1F;
    --blue:#58A6FF; --blue-bg:#0D1F35; --purple:#A78BFA; --purple-bg:#1A1535;
    --amber:#F0A742; --amber-bg:#2A1C06; --red-bg:#1F0D0D; --red-border:#3D1515;
    --red-text:#FF8080; --texture-col:#1A2535;
  }
  .abk-transfer, .abk-transfer * { font-family:'DM Sans',sans-serif; box-sizing:border-box; }
  .abk-transfer .abk-serif { font-family:'Playfair Display',Georgia,serif !important; }
  .abk-transfer.abk-texture::before {
    content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
    background-image: linear-gradient(var(--texture-col) 1px, transparent 1px), linear-gradient(90deg, var(--texture-col) 1px, transparent 1px);
    background-size:48px 48px; opacity:.25;
  }
  .abk-transfer.abk-dark.abk-texture::before { opacity:.18; }
  @keyframes abkTrFadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes abkTrFadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes abkTrScaleIn { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
  @keyframes abkTrToast   { 0%{opacity:0;transform:translateY(-12px)} 10%{opacity:1;transform:translateY(0)} 85%{opacity:1} 100%{opacity:0} }
  .abk-transfer .abk-anim-fade-up  { opacity:0; animation:abkTrFadeUp  .45s ease both; }
  .abk-transfer .abk-anim-fade-in  { opacity:0; animation:abkTrFadeIn  .45s ease both; }
  .abk-transfer .abk-anim-scale-in { opacity:0; animation:abkTrScaleIn .45s ease both; }
  .abk-transfer .abk-toast         { animation:abkTrToast 3.2s ease forwards; }
  .abk-transfer .abk-row-hover { transition:background .15s; }
  .abk-transfer .abk-row-hover:hover { background:var(--card-hover) !important; }
  .abk-transfer .abk-input {
    width:100%; border:1px solid var(--border); border-radius:10px;
    padding:9px 12px; font-size:13px; color:var(--ink);
    background:var(--card); outline:none;
    transition:border-color .15s, box-shadow .15s;
    font-family:'DM Sans',sans-serif;
  }
  .abk-transfer .abk-input:focus { border-color:var(--blue); box-shadow:0 0 0 3px rgba(24,95,165,.12); }
  .abk-transfer .abk-input::placeholder { color:var(--ink-faint); }
  .abk-transfer.abk-dark .abk-input { background:var(--cream-deep); }
  .abk-transfer select.abk-input { cursor:pointer; }
  .abk-transfer .abk-label {
    display:block; font-size:10.5px; font-weight:600; text-transform:uppercase;
    letter-spacing:.09em; color:var(--ink-light); margin-bottom:6px;
  }
  .abk-transfer ::-webkit-scrollbar { width:5px; }
  .abk-transfer ::-webkit-scrollbar-track { background:transparent; }
  .abk-transfer ::-webkit-scrollbar-thumb { background:var(--border); border-radius:4px; }
  .abk-transfer .abk-tab-btn {
    padding:8px 16px; border-radius:10px; font-size:12.5px; font-weight:600;
    cursor:pointer; border:1px solid var(--border); background:var(--card);
    color:var(--ink-light); transition:all .15s; font-family:'DM Sans',sans-serif;
    display:inline-flex; align-items:center; gap:6px;
  }
  .abk-transfer .abk-tab-btn.active { background:var(--blue-bg); color:var(--blue); border-color:var(--blue); }

  @media (max-width:1023px) {
    .abk-tr-filter { flex-wrap: wrap !important; }
    .abk-tr-filter > * { min-width: 140px !important; }
  }
  @media (max-width:767px) {
    .abk-tr-pad    { padding: 1rem 0.75rem 3rem !important; }
    .abk-tr-filter { flex-direction: column !important; }
    .abk-tr-filter > * { width: 100% !important; }
    .abk-tr-header { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
    .abk-tr-header > * { width: 100% !important; }
    .abk-tr-modal-grid { grid-template-columns: 1fr !important; }
    .abk-tr-table-wrap { overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; }
    .abk-tr-table-wrap table { min-width: 760px !important; table-layout: auto !important; }
  }
  @media (max-width:767px) { input, select, textarea { font-size: 16px !important; } }
`;

/* ── shared UI atoms (same pattern as Branches.jsx / Batches.jsx) ─────────── */
function Modal({ onClose, children, maxWidth = 480 }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, padding: 16, backdropFilter: 'blur(4px)',
    }}>
      <div className="abk-anim-scale-in" style={{
        background: 'var(--card)', borderRadius: 18, width: '100%', maxWidth,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,.2), 0 2px 8px rgba(0,0,0,.1)',
        border: '1px solid var(--border)',
      }}>{children}</div>
    </div>
  );
}

function ModalHeader({ title, subtitle, onClose, accent }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '1.1rem 1.4rem', borderBottom: '1px solid var(--border-light)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accent }} />
      <div style={{ marginTop: 4 }}>
        <div className="abk-serif" style={{ fontSize: 16, fontWeight: 500, color: 'var(--ink)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2, fontWeight: 300 }}>{subtitle}</div>}
      </div>
      <button onClick={onClose} style={{
        width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)',
        background: 'var(--cream-deep)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', cursor: 'pointer', color: 'var(--ink-light)',
      }}><X size={14} /></button>
    </div>
  );
}

function ModalFooter({ children }) {
  return (
    <div style={{ display: 'flex', gap: 10, padding: '1rem 1.4rem', borderTop: '1px solid var(--border-light)' }}>
      {children}
    </div>
  );
}

function BtnPrimary({ onClick, disabled, children, color = 'var(--blue)' }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      flex: 1, padding: '10px 0', background: color, color: '#fff',
      border: 'none', borderRadius: 11, fontSize: 13, fontWeight: 500,
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .5 : 1,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      transition: 'filter .15s', fontFamily: 'DM Sans,sans-serif',
    }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.filter = 'brightness(1.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
    >{children}</button>
  );
}

function BtnSecondary({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '10px 0', background: 'var(--cream-deep)', color: 'var(--ink-mid)',
      border: '1px solid var(--border)', borderRadius: 11, fontSize: 13, fontWeight: 500,
      cursor: 'pointer', fontFamily: 'DM Sans,sans-serif',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--cream-deep)'}
    >{children}</button>
  );
}

function IconBtn({ onClick, title, danger, children }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 28, height: 28, borderRadius: 8,
      border: `1px solid ${danger ? 'var(--red-border)' : 'var(--border)'}`,
      background: danger ? 'var(--red-bg)' : 'var(--cream-deep)',
      color: danger ? 'var(--red-text)' : 'var(--ink-mid)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    }}>{children}</button>
  );
}

function StatusBadge({ status }) {
  const map = {
    PENDING:   { bg: 'var(--amber-bg)', fg: 'var(--amber)', Icon: Clock },
    APPROVED:  { bg: 'var(--blue-bg)',  fg: 'var(--blue)',  Icon: CheckCircle2 },
    REJECTED:  { bg: 'var(--red-bg)',   fg: 'var(--red-text)', Icon: XCircle },
    COMPLETED: { bg: 'var(--green-bg)', fg: 'var(--green)', Icon: PackageCheck },
  };
  const c = map[status] || map.PENDING;
  const { Icon } = c;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600,
      padding: '2px 9px', borderRadius: 20, background: c.bg, color: c.fg,
    }}><Icon size={10} /> {status}</span>
  );
}

function Pagination({ page, setPage, rowsPerPage, setRowsPerPage, totalPages, totalElements }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderTop: '1px solid var(--border-light)', background: 'var(--cream-deep)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--ink-faint)', fontWeight: 300 }}>
        <span>Rows:</span>
        {[10, 20, 50].map(n => (
          <button key={n} onClick={() => { setRowsPerPage(n); setPage(1); }} style={{
            padding: '2px 9px', borderRadius: 7, fontSize: 11, fontWeight: 500, cursor: 'pointer',
            background: rowsPerPage === n ? 'var(--blue)' : 'var(--card)',
            color: rowsPerPage === n ? '#fff' : 'var(--ink-faint)',
            border: `1px solid ${rowsPerPage === n ? 'var(--blue)' : 'var(--border)'}`,
          }}>{n}</button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--ink-faint)', fontWeight: 300 }}>
        <span>{totalElements === 0 ? 0 : (page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, totalElements)} / {totalElements}</span>
        {[
          { Icon: ChevronLeft,  action: () => setPage(p => Math.max(1, p - 1)),         disabled: page === 1 },
          { Icon: ChevronRight, action: () => setPage(p => Math.min(totalPages, p + 1)), disabled: page === totalPages },
        ].map(({ Icon, action, disabled }, i) => (
          <button key={i} onClick={action} disabled={disabled} style={{
            width: 26, height: 26, borderRadius: 7, border: '1px solid var(--border)',
            background: 'var(--card)', color: 'var(--ink-light)', cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? .35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Icon size={13} /></button>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Root
   ════════════════════════════════════════════════════════════════════════════ */
export default function Transfers({ dark, user }) {
  useEffect(() => {
    const id = 'abk-transfer-css';
    let tag = document.getElementById(id);
    if (!tag) { tag = document.createElement('style'); tag.id = id; document.head.appendChild(tag); }
    tag.innerHTML = TR_CSS;
    return () => { const el = document.getElementById(id); if (el) el.remove(); };
  }, []);

  const [view, setView] = useState('pending'); // 'pending' | 'all'
  const [successMsg, setSuccessMsg] = useState('');
  function showSuccess(msg) { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3200); }

  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  useEffect(() => {
    getProducts().then(setProducts).catch(() => setProducts([]));
    getActiveBranches().then(setBranches).catch(() => setBranches([]));
  }, []);

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  function refresh() { setRefreshTick(t => t + 1); }

  const actor = user?.name || 'Admin';

  return (
    <div className={`abk-transfer abk-texture${dark ? ' abk-dark' : ''}`}
      style={{ background: 'var(--cream)', minHeight: '100vh', position: 'relative', transition: 'background .3s' }}>

      {successMsg && (
        <div className="abk-toast" style={{
          position: 'fixed', top: 20, right: 20, zIndex: 100,
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'var(--blue)', color: '#fff', padding: '10px 18px', borderRadius: 12,
          fontSize: 13, fontWeight: 500, boxShadow: '0 4px 20px rgba(24,95,165,.35)',
        }}>
          <CheckCircle size={15} /> {successMsg}
        </div>
      )}

      <div className="abk-tr-pad" style={{ position: 'relative', zIndex: 1, padding: '1.5rem 1.5rem 3rem' }}>

        <div className="abk-anim-fade-up abk-tr-header" style={{ padding: '0.5rem 0 1.4rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-light)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-block', width: 18, height: 1.5, background: 'var(--blue)', borderRadius: 1 }} />
              Stock Movement
            </div>
            <div className="abk-serif" style={{ fontSize: 28, fontWeight: 500, color: 'var(--ink)', letterSpacing: -0.5, lineHeight: 1.1 }}>
              Stock Transfers
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 4, fontWeight: 300 }}>
              Move stock between branches — request, approve, and confirm receipt.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className={`abk-tab-btn${view === 'pending' ? ' active' : ''}`} onClick={() => setView('pending')}>
              <Clock size={13} /> Pending
            </button>
            <button className={`abk-tab-btn${view === 'all' ? ' active' : ''}`} onClick={() => setView('all')}>
              <ArrowLeftRight size={13} /> All
            </button>
            <button onClick={() => setShowRequestModal(true)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 11,
              fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif',
              boxShadow: '0 2px 8px rgba(24,95,165,.3)', whiteSpace: 'nowrap',
            }}><Plus size={14} /> Request Transfer</button>
          </div>
        </div>

        {view === 'pending'
          ? <PendingList branches={branches} actor={actor} showSuccess={showSuccess} refreshTick={refreshTick} refresh={refresh} />
          : <AllTransfersList branches={branches} actor={actor} showSuccess={showSuccess} refreshTick={refreshTick} refresh={refresh} />}
      </div>

      {showRequestModal && (
        <RequestTransferModal
          products={products}
          branches={branches}
          actor={actor}
          onClose={() => setShowRequestModal(false)}
          onSuccess={() => { setShowRequestModal(false); showSuccess('Transfer requested'); refresh(); }}
        />
      )}
    </div>
  );
}

/* ── Pending list (no pagination — this is meant to be short/actionable) ─── */
function PendingList({ branches, actor, showSuccess, refreshTick, refresh }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { setRows(await getPendingTransfers()); }
    catch { setRows([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [refreshTick]);

  async function handleApprove(t) {
    try { await approveTransfer(t.id, actor); showSuccess(`Transfer #${t.id} approved — stock moved`); refresh(); }
    catch (e) { alert(e?.response?.data?.error || e.message || 'Failed to approve transfer.'); }
  }
  async function handleReject(t) {
    const reason = window.prompt('Reason for rejecting this transfer (optional):') || '';
    try { await rejectTransfer(t.id, actor, reason); showSuccess(`Transfer #${t.id} rejected`); refresh(); }
    catch (e) { alert(e?.response?.data?.error || e.message || 'Failed to reject transfer.'); }
  }

  return (
    <TransferTable
      rows={rows}
      loading={loading}
      emptyLabel="No pending transfers"
      renderActions={t => (
        <div style={{ display: 'flex', gap: 6 }}>
          <IconBtn onClick={() => handleApprove(t)} title="Approve — moves the stock now"><CheckCircle2 size={12} /></IconBtn>
          <IconBtn onClick={() => handleReject(t)} title="Reject" danger><XCircle size={12} /></IconBtn>
        </div>
      )}
    />
  );
}

/* ── All transfers (paginated, filterable by status/branch) ──────────────── */
function AllTransfersList({ branches, actor, showSuccess, refreshTick, refresh }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [branchFilter, setBranchFilter] = useState('');

  async function load() {
    setLoading(true);
    try { setRows(await searchTransfers(status, branchFilter || undefined)); }
    catch { setRows([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [status, branchFilter, refreshTick]);

  async function handleApprove(t) {
    try { await approveTransfer(t.id, actor); showSuccess(`Transfer #${t.id} approved — stock moved`); refresh(); }
    catch (e) { alert(e?.response?.data?.error || e.message || 'Failed to approve transfer.'); }
  }
  async function handleReject(t) {
    const reason = window.prompt('Reason for rejecting this transfer (optional):') || '';
    try { await rejectTransfer(t.id, actor, reason); showSuccess(`Transfer #${t.id} rejected`); refresh(); }
    catch (e) { alert(e?.response?.data?.error || e.message || 'Failed to reject transfer.'); }
  }
  async function handleComplete(t) {
    try { await completeTransfer(t.id, actor); showSuccess(`Transfer #${t.id} marked complete`); refresh(); }
    catch (e) { alert(e?.response?.data?.error || e.message || 'Failed to complete transfer.'); }
  }

  return (
    <>
      <div className="abk-anim-fade-in abk-tr-filter" style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
        <select value={status} onChange={e => setStatus(e.target.value)} className="abk-input" style={{ maxWidth: 200 }}>
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className="abk-input" style={{ maxWidth: 240 }}>
          <option value="">All branches</option>
          {branches.map(b => (
            <option key={b.id} value={b.id}>{b.location?.name ? `${b.location.name} — ${b.name}` : b.name}</option>
          ))}
        </select>
      </div>

      <TransferTable
        rows={rows}
        loading={loading}
        emptyLabel="No transfers match your filters"
        renderActions={t => (
          <div style={{ display: 'flex', gap: 6 }}>
            {t.status === 'PENDING' && (
              <>
                <IconBtn onClick={() => handleApprove(t)} title="Approve — moves the stock now"><CheckCircle2 size={12} /></IconBtn>
                <IconBtn onClick={() => handleReject(t)} title="Reject" danger><XCircle size={12} /></IconBtn>
              </>
            )}
            {t.status === 'APPROVED' && (
              <IconBtn onClick={() => handleComplete(t)} title="Mark as received at destination"><PackageCheck size={12} /></IconBtn>
            )}
            {(t.status === 'REJECTED' || t.status === 'COMPLETED') && (
              <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>—</span>
            )}
          </div>
        )}
      />
    </>
  );
}

/* ── Shared table shell ───────────────────────────────────────────────────── */
function TransferTable({ rows, loading, emptyLabel, renderActions }) {
  return (
    <div className="abk-anim-scale-in" style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 16, width: '100%', overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,.06)',
    }}>
      <div className="abk-tr-table-wrap" style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', minWidth: 'max-content', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--cream-deep)', borderBottom: '1px solid var(--border)' }}>
              {['Product', 'From', 'To', 'Qty', 'Status', 'Requested', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--ink-light)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3.5rem 0' }}>
                <div style={{ width: 24, height: 24, border: '3px solid var(--border)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
              </td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3.5rem 0' }}>
                <ArrowLeftRight size={34} style={{ color: 'var(--border)', margin: '0 auto 10px', display: 'block' }} />
                <p style={{ color: 'var(--ink-faint)', fontSize: 13, fontWeight: 300 }}>{emptyLabel}</p>
              </td></tr>
            ) : rows.map(t => (
              <tr key={t.id} className="abk-row-hover" style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{t.product?.name}</td>
                <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--ink-mid)' }}>{t.fromBranch?.name}</td>
                <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--ink-mid)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <ArrowRight size={11} style={{ color: 'var(--ink-faint)' }} /> {t.toBranch?.name}
                  </span>
                </td>
                <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{t.quantity}</td>
                <td style={{ padding: '11px 14px' }}><StatusBadge status={t.status} /></td>
                <td style={{ padding: '11px 14px', fontSize: 11, color: 'var(--ink-faint)', fontWeight: 300 }}>
                  {t.requestedBy}{t.requestedAt ? ` · ${new Date(t.requestedAt).toLocaleDateString()}` : ''}
                </td>
                <td style={{ padding: '11px 14px' }}>{renderActions(t)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Request modal ─────────────────────────────────────────────────────────── */
function RequestTransferModal({ products, branches, actor, onClose, onSuccess }) {
  const [productId,   setProductId]   = useState('');
  const [fromBranchId, setFromBranchId] = useState('');
  const [toBranchId,   setToBranchId]   = useState('');
  const [quantity,     setQuantity]     = useState('');
  const [notes,        setNotes]        = useState('');
  const [useManualBatch, setUseManualBatch] = useState(false);
  const [batchId,       setBatchId]       = useState('');
  const [availableBatches, setAvailableBatches] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!productId || !fromBranchId) { setAvailableBatches([]); return; }
    getAvailableBatches(parseInt(productId), parseInt(fromBranchId))
      .then(setAvailableBatches)
      .catch(() => setAvailableBatches([]));
  }, [productId, fromBranchId]);

  async function handleSubmit() {
    if (!productId)     { alert('Select a product.'); return; }
    if (!fromBranchId)  { alert('Select a source branch.'); return; }
    if (!toBranchId)    { alert('Select a destination branch.'); return; }
    if (fromBranchId === toBranchId) { alert('Source and destination branches must be different.'); return; }
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) { alert('Enter a valid quantity.'); return; }

    setSaving(true);
    try {
      await requestTransfer({
        productId: parseInt(productId),
        fromBranchId: parseInt(fromBranchId),
        toBranchId: parseInt(toBranchId),
        quantity: qty,
        batchId: (useManualBatch && batchId) ? parseInt(batchId) : null,
        notes: notes.trim() || null,
        requestedBy: actor,
      });
      onSuccess();
    } catch (e) { alert(e?.response?.data?.error || e.message || 'Failed to request transfer.'); }
    finally { setSaving(false); }
  }

  return (
    <Modal onClose={onClose} maxWidth={480}>
      <ModalHeader title="Request Transfer" subtitle="Move stock between branches" onClose={onClose} accent="var(--blue)" />
      <div style={{ padding: '1.2rem 1.4rem', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className="abk-label">Product *</label>
          <select value={productId} onChange={e => { setProductId(e.target.value); setBatchId(''); setUseManualBatch(false); }} className="abk-input">
            <option value="">Select a product…</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="abk-tr-modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className="abk-label">From Branch *</label>
            <select value={fromBranchId} onChange={e => { setFromBranchId(e.target.value); setBatchId(''); setUseManualBatch(false); }} className="abk-input">
              <option value="">Source…</option>
              {branches.map(b => (
                <option key={b.id} value={b.id} disabled={String(b.id) === String(toBranchId)}>
                  {b.location?.name ? `${b.location.name} — ${b.name}` : b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="abk-label">To Branch *</label>
            <select value={toBranchId} onChange={e => setToBranchId(e.target.value)} className="abk-input">
              <option value="">Destination…</option>
              {branches.map(b => (
                <option key={b.id} value={b.id} disabled={String(b.id) === String(fromBranchId)}>
                  {b.location?.name ? `${b.location.name} — ${b.name}` : b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="abk-label">Quantity *</label>
          <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} className="abk-input" placeholder="e.g. 10" />
        </div>

        {fromBranchId && availableBatches.length > 0 && (
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--ink-mid)', cursor: 'pointer', marginBottom: useManualBatch ? 8 : 0 }}>
              <input type="checkbox" checked={useManualBatch} onChange={e => { setUseManualBatch(e.target.checked); setBatchId(''); }} />
              Choose a specific batch (otherwise oldest batch is used automatically)
            </label>
            {useManualBatch && (
              <select value={batchId} onChange={e => setBatchId(e.target.value)} className="abk-input">
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

        <div>
          <label className="abk-label">Notes</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" className="abk-input" />
        </div>

        <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontWeight: 300, lineHeight: 1.4 }}>
          Nothing moves yet — this just files the request. Stock actually leaves the source branch when it's approved.
        </div>
      </div>
      <ModalFooter>
        <BtnSecondary onClick={onClose}>Cancel</BtnSecondary>
        <BtnPrimary onClick={handleSubmit} disabled={saving}>
          {saving ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Requesting…</> : <><ArrowLeftRight size={13} /> Request</>}
        </BtnPrimary>
      </ModalFooter>
    </Modal>
  );
}
