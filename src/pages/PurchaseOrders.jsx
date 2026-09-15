/**
 * ─────────────────────────────────────────────────────────────────────────
 *  PurchaseOrders.jsx — Draft → Ordered → Received purchase order workflow
 *
 *  Creating an order never touches stock — only receiving against a line
 *  does, and that's what actually creates a ProductBatch at the order's
 *  branch, carrying the exact cost agreed on that line (see
 *  PurchaseOrderService.receiveLine on the backend). A line can be
 *  received in more than one delivery; the order's own status
 *  (DRAFT/ORDERED/PARTIALLY_RECEIVED/RECEIVED/CANCELLED) is recalculated
 *  from all of its lines automatically.
 * ─────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect } from 'react';
import {
  Search, Plus, Trash2, X, RefreshCw, CheckCircle, ClipboardList,
  ChevronLeft, ChevronRight, PackageCheck, Ban, ArrowRight,
} from 'lucide-react';
import {
  getProducts, getActiveBranches, getActiveSuppliers,
  getPurchaseOrdersPage, getPurchaseOrderLines, createPurchaseOrder,
  markPurchaseOrderOrdered, cancelPurchaseOrder, receivePurchaseOrderLine,
} from '../services/api';

const PO_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');
  .abk-po {
    --cream:#F0F7E2; --cream-deep:#E4F0CF; --ink:#0F1F04; --ink-mid:#3A5220;
    --ink-light:#6A8A4A; --ink-faint:#A8C080; --border:#D0E4B0; --border-light:#E2EFC8;
    --card:#FFFFFF; --card-hover:#F3FAE6; --green:#1D9E75; --green-bg:#E1F5EE;
    --blue:#185FA5; --blue-bg:#E6F1FB; --purple:#534AB7; --purple-bg:#EEEDFE;
    --amber:#854F0B; --amber-bg:#FAEEDA; --red-bg:#FCEBEB; --red-border:#F7C1C1; --red-text:#791F1F;
    --texture-col:#C8DCA8;
  }
  .abk-po.abk-dark {
    --cream:#0D1117; --cream-deep:#161B22; --ink:#E6EDF3; --ink-mid:#B8C9DB;
    --ink-light:#8BA4BE; --ink-faint:#5A7A96; --border:#21303F; --border-light:#1A2535;
    --card:#13192A; --card-hover:#1C2540; --green:#3DD68C; --green-bg:#0D2B1F;
    --blue:#58A6FF; --blue-bg:#0D1F35; --purple:#A78BFA; --purple-bg:#1A1535;
    --amber:#F0A742; --amber-bg:#2A1C06; --red-bg:#1F0D0D; --red-border:#3D1515; --red-text:#FF8080;
    --texture-col:#1A2535;
  }
  .abk-po, .abk-po * { font-family:'DM Sans',sans-serif; box-sizing:border-box; }
  .abk-po .abk-serif { font-family:'Playfair Display',Georgia,serif !important; }
  .abk-po.abk-texture::before {
    content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
    background-image: linear-gradient(var(--texture-col) 1px, transparent 1px), linear-gradient(90deg, var(--texture-col) 1px, transparent 1px);
    background-size:48px 48px; opacity:.25;
  }
  .abk-po.abk-dark.abk-texture::before { opacity:.18; }
  @keyframes abkPFadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes abkPFadeIn{from{opacity:0}to{opacity:1}}
  @keyframes abkPScaleIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
  @keyframes abkPToast{0%{opacity:0;transform:translateY(-12px)}10%{opacity:1;transform:translateY(0)}85%{opacity:1}100%{opacity:0}}
  .abk-po .abk-anim-fade-up{opacity:0;animation:abkPFadeUp .45s ease both;}
  .abk-po .abk-anim-fade-in{opacity:0;animation:abkPFadeIn .45s ease both;}
  .abk-po .abk-anim-scale-in{opacity:0;animation:abkPScaleIn .45s ease both;}
  .abk-po .abk-toast{animation:abkPToast 3.2s ease forwards;}
  .abk-po .abk-row-hover{transition:background .15s;}
  .abk-po .abk-row-hover:hover{background:var(--card-hover) !important;}
  .abk-po .abk-input{width:100%;border:1px solid var(--border);border-radius:10px;padding:9px 12px;font-size:13px;color:var(--ink);background:var(--card);outline:none;transition:border-color .15s,box-shadow .15s;font-family:'DM Sans',sans-serif;}
  .abk-po .abk-input:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(24,95,165,.12);}
  .abk-po .abk-input::placeholder{color:var(--ink-faint);}
  .abk-po.abk-dark .abk-input{background:var(--cream-deep);}
  .abk-po .abk-label{display:block;font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--ink-light);margin-bottom:6px;}
  @media (max-width:767px) {
    .abk-po-pad{padding:1rem .75rem 3rem !important;}
    .abk-po-filter{flex-direction:column !important;}
    .abk-po-filter>*{width:100% !important;}
    .abk-po-table-wrap{overflow-x:auto !important;}
    .abk-po-table-wrap table{min-width:650px !important;}
    input,select,textarea{font-size:16px !important;}
  }
`;

function Modal({ onClose, children, maxWidth = 520 }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:16, backdropFilter:'blur(4px)' }}>
      <div className="abk-anim-scale-in" style={{ background:'var(--card)', borderRadius:18, width:'100%', maxWidth, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,.2), 0 2px 8px rgba(0,0,0,.1)', border:'1px solid var(--border)' }}>{children}</div>
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
function BtnPrimary({ onClick, disabled, children, color = 'var(--blue)' }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ flex:1, padding:'10px 0', background:color, color:'#fff', border:'none', borderRadius:11, fontSize:13, fontWeight:500, cursor:disabled?'not-allowed':'pointer', opacity:disabled?.5:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontFamily:'DM Sans,sans-serif' }}>{children}</button>
  );
}
function BtnSecondary({ onClick, children }) {
  return (
    <button onClick={onClick} style={{ flex:1, padding:'10px 0', background:'var(--cream-deep)', color:'var(--ink-mid)', border:'1px solid var(--border)', borderRadius:11, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>{children}</button>
  );
}
function Pagination({ page, setPage, rowsPerPage, setRowsPerPage, totalPages, totalElements }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderTop:'1px solid var(--border-light)', background:'var(--cream-deep)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--ink-faint)', fontWeight:300 }}>
        <span>Rows:</span>
        {[10,20,50].map(n => (
          <button key={n} onClick={() => { setRowsPerPage(n); setPage(1); }} style={{ padding:'2px 9px', borderRadius:7, fontSize:11, fontWeight:500, cursor:'pointer',
            background: rowsPerPage === n ? 'var(--blue)' : 'var(--card)', color: rowsPerPage === n ? '#fff' : 'var(--ink-faint)',
            border:`1px solid ${rowsPerPage === n ? 'var(--blue)' : 'var(--border)'}` }}>{n}</button>
        ))}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, color:'var(--ink-faint)', fontWeight:300 }}>
        <span>{totalElements === 0 ? 0 : (page-1)*rowsPerPage+1}–{Math.min(page*rowsPerPage, totalElements)} / {totalElements}</span>
        {[{Icon:ChevronLeft, action:() => setPage(p => Math.max(1,p-1)), disabled: page===1},
          {Icon:ChevronRight, action:() => setPage(p => Math.min(totalPages,p+1)), disabled: page===totalPages}].map(({Icon,action,disabled},i) => (
          <button key={i} onClick={action} disabled={disabled} style={{ width:26, height:26, borderRadius:7, border:'1px solid var(--border)', background:'var(--card)', color:'var(--ink-light)', cursor:disabled?'not-allowed':'pointer', opacity:disabled?.35:1, display:'flex', alignItems:'center', justifyContent:'center' }}><Icon size={13} /></button>
        ))}
      </div>
    </div>
  );
}

const STATUS_STYLE = {
  DRAFT:               { bg: 'var(--cream-deep)', fg: 'var(--ink-light)', label: 'Draft' },
  ORDERED:             { bg: 'var(--blue-bg)',     fg: 'var(--blue)',      label: 'Ordered' },
  PARTIALLY_RECEIVED:  { bg: 'var(--amber-bg)',    fg: 'var(--amber)',     label: 'Partially Received' },
  RECEIVED:            { bg: 'var(--green-bg)',    fg: 'var(--green)',     label: 'Received' },
  CANCELLED:           { bg: 'var(--red-bg)',      fg: 'var(--red-text)',  label: 'Cancelled' },
};
function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.DRAFT;
  return <span style={{ display:'inline-flex', fontSize:11, fontWeight:600, padding:'2px 9px', borderRadius:20, background:s.bg, color:s.fg }}>{s.label}</span>;
}

function fmt(n) { return (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

export default function PurchaseOrders({ dark, user }) {
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';
  const ownBranchId = user?.branch?.id || '';

  useEffect(() => {
    const id = 'abk-po-css';
    let tag = document.getElementById(id);
    if (!tag) { tag = document.createElement('style'); tag.id = id; document.head.appendChild(tag); }
    tag.innerHTML = PO_CSS;
    return () => { const el = document.getElementById(id); if (el) el.remove(); };
  }, []);

  const [branches, setBranches] = useState([]);
  const [branchFilter, setBranchFilter] = useState(isAdmin ? '' : ownBranchId);
  const [statusFilter, setStatusFilter] = useState('');
  const [rows, setRows] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showNew, setShowNew] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  function showSuccess(msg) { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3200); }

  useEffect(() => { getActiveBranches().then(setBranches).catch(() => setBranches([])); }, []);

  async function load() {
    try {
      setLoading(true);
      const res = await getPurchaseOrdersPage({ page: page - 1, size: rowsPerPage, branchId: branchFilter || undefined, status: statusFilter || undefined });
      setRows(res.content ?? []);
      setTotalElements(res.totalElements ?? 0);
      setTotalPages(Math.max(1, res.totalPages ?? 1));
    } catch { setRows([]); setTotalElements(0); setTotalPages(1); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [page, rowsPerPage, branchFilter, statusFilter]);

  return (
    <div className={`abk-po abk-texture${dark ? ' abk-dark' : ''}`} style={{ background:'var(--cream)', minHeight:'100vh', position:'relative', transition:'background .3s' }}>
      {successMsg && (
        <div className="abk-toast" style={{ position:'fixed', top:20, right:20, zIndex:100, display:'inline-flex', alignItems:'center', gap:8, background:'var(--blue)', color:'#fff', padding:'10px 18px', borderRadius:12, fontSize:13, fontWeight:500, boxShadow:'0 4px 20px rgba(24,95,165,.35)' }}>
          <CheckCircle size={15} /> {successMsg}
        </div>
      )}

      <div className="abk-po-pad" style={{ position:'relative', zIndex:1, padding:'1.5rem 1.5rem 3rem' }}>
        <div className="abk-anim-fade-up" style={{ padding:'0.5rem 0 1.4rem', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
          <div>
            <div style={{ fontSize:10.5, fontWeight:500, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--ink-light)', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ display:'inline-block', width:18, height:1.5, background:'var(--blue)', borderRadius:1 }} />
              Purchasing
            </div>
            <div className="abk-serif" style={{ fontSize:28, fontWeight:500, color:'var(--ink)', letterSpacing:-0.5, lineHeight:1.1 }}>Purchase Orders</div>
            <div style={{ fontSize:12, color:'var(--ink-faint)', marginTop:4, fontWeight:300 }}>Draft → Ordered → Received. Receiving a line creates its batch automatically.</div>
          </div>
          <button onClick={() => setShowNew(true)} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', background:'var(--blue)', color:'#fff', border:'none', borderRadius:11, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'DM Sans,sans-serif', boxShadow:'0 2px 8px rgba(24,95,165,.3)', whiteSpace:'nowrap' }}>
            <Plus size={14} /> New Order
          </button>
        </div>

        <div className="abk-anim-fade-in abk-po-filter" style={{ display:'flex', gap:8, marginBottom:'1rem' }}>
          {isAdmin && (
            <select value={branchFilter} onChange={e => { setBranchFilter(e.target.value); setPage(1); }} className="abk-input" style={{ maxWidth:220 }}>
              <option value="">All branches</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.location?.name ? `${b.location.name} — ${b.name}` : b.name}</option>)}
            </select>
          )}
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="abk-input" style={{ maxWidth:200 }}>
            <option value="">All statuses</option>
            {Object.entries(STATUS_STYLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        <div className="abk-anim-scale-in" style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:16, width:'100%', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,.06)' }}>
          <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border-light)', background:'var(--cream-deep)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div className="abk-serif" style={{ fontSize:14, fontWeight:500, color:'var(--ink)' }}>Orders</div>
            <span style={{ fontSize:11, color:'var(--ink-faint)', fontWeight:300 }}>{totalElements} orders</span>
          </div>

          <div className="abk-po-table-wrap" style={{ overflowX:'auto', width:'100%' }}>
            <table style={{ width:'100%', minWidth:'max-content', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'var(--cream-deep)', borderBottom:'1px solid var(--border)' }}>
                  {['Order #', ...(isAdmin ? ['Branch'] : []), 'Supplier', 'Status', 'Order Date', 'Expected', ''].map(h => (
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:600, letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--ink-light)', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={isAdmin?7:6} style={{ textAlign:'center', padding:'3.5rem 0' }}>
                    <div style={{ width:24, height:24, border:'3px solid var(--border)', borderTopColor:'var(--blue)', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto' }} />
                  </td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={isAdmin?7:6} style={{ textAlign:'center', padding:'3.5rem 0' }}>
                    <ClipboardList size={34} style={{ color:'var(--border)', margin:'0 auto 10px', display:'block' }} />
                    <p style={{ color:'var(--ink-faint)', fontSize:13, fontWeight:300 }}>No purchase orders yet</p>
                  </td></tr>
                ) : rows.map(po => (
                  <tr key={po.id} className="abk-row-hover" style={{ borderBottom:'1px solid var(--border-light)', cursor:'pointer' }} onClick={() => setViewTarget(po)}>
                    <td style={{ padding:'11px 14px', fontSize:13, fontWeight:500, color:'var(--ink)' }}>{po.orderNumber || `#${po.id}`}</td>
                    {isAdmin && <td style={{ padding:'11px 14px', fontSize:12, color:'var(--ink-mid)' }}>{po.branch?.name}</td>}
                    <td style={{ padding:'11px 14px', fontSize:12, color:'var(--ink-mid)' }}>{po.supplier?.name}</td>
                    <td style={{ padding:'11px 14px' }}><StatusBadge status={po.status} /></td>
                    <td style={{ padding:'11px 14px', fontSize:12, color:'var(--ink-light)', fontWeight:300 }}>{po.orderDate}</td>
                    <td style={{ padding:'11px 14px', fontSize:12, color:'var(--ink-light)', fontWeight:300 }}>{po.expectedDate || '—'}</td>
                    <td style={{ padding:'11px 14px' }}><ArrowRight size={14} style={{ color:'var(--ink-faint)' }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} setPage={setPage} rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage} totalPages={totalPages} totalElements={totalElements} />
        </div>
      </div>

      {showNew && (
        <NewOrderModal
          user={user} isAdmin={isAdmin} ownBranchId={ownBranchId}
          onClose={() => setShowNew(false)}
          onDone={() => { setShowNew(false); showSuccess('Purchase order created'); load(); }}
        />
      )}

      {viewTarget && (
        <OrderDetailModal
          po={viewTarget} user={user}
          onClose={() => setViewTarget(null)}
          onChanged={(updated) => { setViewTarget(updated); load(); }}
        />
      )}
    </div>
  );
}

/* ── New order: branch + supplier + dynamic product lines ───────────────── */
function NewOrderModal({ user, isAdmin, ownBranchId, onClose, onDone }) {
  const [branches, setBranches] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [branchId, setBranchId] = useState(ownBranchId);
  const [supplierId, setSupplierId] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState([{ productId: '', orderedQuantity: '', costPerUnit: '', notes: '' }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getActiveBranches().catch(() => []), getActiveSuppliers().catch(() => []), getProducts().catch(() => [])])
      .then(([b, s, p]) => { setBranches(b); setSuppliers(s); setProducts(p); });
  }, []);

  function addLine() { setLines(ls => [...ls, { productId: '', orderedQuantity: '', costPerUnit: '', notes: '' }]); }
  function removeLine(i) { setLines(ls => ls.filter((_, idx) => idx !== i)); }
  function updateLine(i, field, value) { setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [field]: value } : l)); }

  async function handleSubmit() {
    if (!branchId) { alert('Select a branch.'); return; }
    if (!supplierId) { alert('Select a supplier.'); return; }
    const validLines = lines.filter(l => l.productId && l.orderedQuantity && l.costPerUnit !== '');
    if (validLines.length === 0) { alert('Add at least one product line with quantity and cost.'); return; }
    setSaving(true);
    try {
      await createPurchaseOrder({
        branchId: parseInt(branchId),
        supplierId: parseInt(supplierId),
        expectedDate: expectedDate || null,
        notes: notes.trim() || null,
        createdBy: user?.name || 'Staff',
        lines: validLines.map(l => ({
          productId: parseInt(l.productId),
          orderedQuantity: parseInt(l.orderedQuantity),
          costPerUnit: parseFloat(l.costPerUnit),
          notes: l.notes.trim() || null,
        })),
      });
      onDone();
    } catch (e) { alert(e?.response?.data?.error || e.message || 'Failed to create purchase order.'); }
    finally { setSaving(false); }
  }

  return (
    <Modal onClose={onClose} maxWidth={620}>
      <ModalHeader title="New Purchase Order" subtitle="Draft — nothing is sent or received yet" onClose={onClose} accent="var(--blue)" />
      <div style={{ padding:'1.2rem 1.4rem', display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ display:'grid', gridTemplateColumns: isAdmin ? '1fr 1fr' : '1fr', gap:12 }}>
          {isAdmin && (
            <div>
              <label className="abk-label">Branch *</label>
              <select value={branchId} onChange={e => setBranchId(e.target.value)} className="abk-input">
                <option value="">Select a branch…</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.location?.name ? `${b.location.name} — ${b.name}` : b.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="abk-label">Supplier *</label>
            <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="abk-input">
              <option value="">Select a supplier…</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="abk-label">Expected Date (optional)</label>
          <input type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} className="abk-input" />
        </div>

        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <label className="abk-label" style={{ marginBottom:0 }}>Product Lines *</label>
            <button onClick={addLine} style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11.5, fontWeight:500, color:'var(--blue)', background:'var(--blue-bg)', border:'none', borderRadius:8, padding:'4px 10px', cursor:'pointer' }}>
              <Plus size={12} /> Add Line
            </button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {lines.map((l, i) => (
              <div key={i} style={{ display:'flex', gap:6, alignItems:'flex-start', padding:8, background:'var(--cream-deep)', borderRadius:10, border:'1px solid var(--border)' }}>
                <select value={l.productId} onChange={e => updateLine(i, 'productId', e.target.value)} className="abk-input" style={{ flex:2 }}>
                  <option value="">Product…</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input type="number" min="1" placeholder="Qty" value={l.orderedQuantity} onChange={e => updateLine(i, 'orderedQuantity', e.target.value)} className="abk-input" style={{ flex:1 }} />
                <input type="number" min="0" step="0.01" placeholder="Cost/unit" value={l.costPerUnit} onChange={e => updateLine(i, 'costPerUnit', e.target.value)} className="abk-input" style={{ flex:1 }} />
                <button onClick={() => removeLine(i)} disabled={lines.length === 1} style={{
                  width:34, height:34, flexShrink:0, borderRadius:8, border:'1px solid var(--red-border)', background:'var(--red-bg)', color:'var(--red-text)',
                  cursor: lines.length === 1 ? 'not-allowed' : 'pointer', opacity: lines.length === 1 ? .4 : 1, display:'flex', alignItems:'center', justifyContent:'center',
                }}><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="abk-label">Notes</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" className="abk-input" />
        </div>
      </div>
      <ModalFooter>
        <BtnSecondary onClick={onClose}>Cancel</BtnSecondary>
        <BtnPrimary onClick={handleSubmit} disabled={saving}>
          {saving ? <><RefreshCw size={13} style={{ animation:'spin 1s linear infinite' }} /> Creating…</> : <><CheckCircle size={13} /> Create Order</>}
        </BtnPrimary>
      </ModalFooter>
    </Modal>
  );
}

/* ── Order detail: lines, receive progress, status actions ──────────────── */
function OrderDetailModal({ po, user, onClose, onChanged }) {
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [receiveTarget, setReceiveTarget] = useState(null); // line being received against
  const [receiveQty, setReceiveQty] = useState('');
  const [receiveBatchNumber, setReceiveBatchNumber] = useState('');

  async function loadLines() {
    setLoading(true);
    try { setLines(await getPurchaseOrderLines(po.id)); }
    catch { setLines([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadLines(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [po.id]);

  async function handleMarkOrdered() {
    setBusy(true);
    try { onChanged(await markPurchaseOrderOrdered(po.id)); }
    catch (e) { alert(e?.response?.data?.error || e.message || 'Failed to update order.'); }
    finally { setBusy(false); }
  }

  async function handleCancel() {
    if (!confirm('Cancel this purchase order?')) return;
    setBusy(true);
    try { onChanged(await cancelPurchaseOrder(po.id)); }
    catch (e) { alert(e?.response?.data?.error || e.message || 'Failed to cancel order.'); }
    finally { setBusy(false); }
  }

  function openReceive(line) {
    setReceiveTarget(line);
    setReceiveQty(String(line.orderedQuantity - line.receivedQuantity));
    setReceiveBatchNumber('');
  }

  async function handleReceive() {
    const qty = parseInt(receiveQty);
    if (!qty || qty <= 0) { alert('Enter a valid quantity.'); return; }
    setBusy(true);
    try {
      await receivePurchaseOrderLine(po.id, receiveTarget.id, {
        quantity: qty,
        batchNumber: receiveBatchNumber.trim() || null,
        receivedDate: null,
        recordedBy: user?.name || 'Staff',
      });
      setReceiveTarget(null);
      await loadLines();
      // Status may have changed (e.g. now RECEIVED) — refetch the order shell via lines reload is enough for the modal,
      // but let the parent know something changed so its list re-fetches too.
      onChanged({ ...po });
    } catch (e) { alert(e?.response?.data?.error || e.message || 'Failed to receive stock.'); }
    finally { setBusy(false); }
  }

  const canReceive = po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED';

  return (
    <Modal onClose={onClose} maxWidth={620}>
      <ModalHeader
        title={po.orderNumber || `Order #${po.id}`}
        subtitle={`${po.branch?.name || ''} · ${po.supplier?.name || ''}`}
        onClose={onClose}
        accent="var(--purple)"
      />
      <div style={{ padding:'1.2rem 1.4rem', display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <StatusBadge status={po.status} />
          <span style={{ fontSize:11.5, color:'var(--ink-faint)' }}>Ordered {po.orderDate}{po.expectedDate ? ` · Expected ${po.expectedDate}` : ''}</span>
        </div>

        {po.notes && <div style={{ fontSize:12, color:'var(--ink-mid)', fontStyle:'italic' }}>{po.notes}</div>}

        <div>
          <div style={{ fontSize:10.5, fontWeight:600, color:'var(--ink-light)', textTransform:'uppercase', letterSpacing:'0.10em', marginBottom:8 }}>Lines</div>
          {loading ? (
            <div style={{ textAlign:'center', padding:'1.5rem 0' }}>
              <div style={{ width:22, height:22, border:'3px solid var(--border)', borderTopColor:'var(--purple)', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto' }} />
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {lines.map(l => {
                const remaining = l.orderedQuantity - l.receivedQuantity;
                const done = remaining <= 0;
                return (
                  <div key={l.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px', borderRadius:10, border:'1px solid var(--border)', background:'var(--cream-deep)' }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:500, color:'var(--ink)' }}>{l.product?.name}</div>
                      <div style={{ fontSize:11, color:'var(--ink-faint)', fontWeight:300 }}>
                        {l.receivedQuantity} / {l.orderedQuantity} received @ {fmt(l.costPerUnit)}
                      </div>
                    </div>
                    {canReceive && !done ? (
                      <button onClick={() => openReceive(l)} style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11.5, fontWeight:500, color:'var(--blue)', background:'var(--blue-bg)', border:'none', borderRadius:8, padding:'6px 11px', cursor:'pointer' }}>
                        <PackageCheck size={12} /> Receive
                      </button>
                    ) : done ? (
                      <span style={{ fontSize:11, fontWeight:600, color:'var(--green)' }}>Complete</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {receiveTarget && (
          <div style={{ padding:12, borderRadius:10, border:'1px solid var(--blue)', background:'var(--blue-bg)', display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ fontSize:12.5, fontWeight:500, color:'var(--ink)' }}>Receive — {receiveTarget.product?.name}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <div>
                <label className="abk-label">Quantity</label>
                <input type="number" min="1" max={receiveTarget.orderedQuantity - receiveTarget.receivedQuantity} value={receiveQty} onChange={e => setReceiveQty(e.target.value)} className="abk-input" />
              </div>
              <div>
                <label className="abk-label">Batch # (optional)</label>
                <input value={receiveBatchNumber} onChange={e => setReceiveBatchNumber(e.target.value)} placeholder="Auto-generated if blank" className="abk-input" />
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <BtnSecondary onClick={() => setReceiveTarget(null)}>Cancel</BtnSecondary>
              <BtnPrimary onClick={handleReceive} disabled={busy} color="var(--blue)">
                {busy ? 'Receiving…' : 'Confirm Receipt'}
              </BtnPrimary>
            </div>
          </div>
        )}
      </div>
      <ModalFooter>
        <BtnSecondary onClick={onClose}>Close</BtnSecondary>
        {po.status === 'DRAFT' && (
          <BtnPrimary onClick={handleMarkOrdered} disabled={busy} color="var(--blue)">Mark as Ordered</BtnPrimary>
        )}
        {(po.status === 'DRAFT' || po.status === 'ORDERED') && (
          <BtnPrimary onClick={handleCancel} disabled={busy} color="#c53030">
            <Ban size={13} /> Cancel Order
          </BtnPrimary>
        )}
      </ModalFooter>
    </Modal>
  );
}
