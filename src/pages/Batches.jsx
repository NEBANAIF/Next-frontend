/**
 * ─────────────────────────────────────────────────────────────────────────
 *  Batches.jsx — Product batch management (Phase 2 of multi-location)
 *
 *  Every "Receive Stock" here creates a ProductBatch — a lot of a product
 *  at a specific branch, at its own cost — instead of just bumping a
 *  flat stock number. Sales (see Sales.jsx) draw down these batches
 *  automatically (oldest first) or from one manually chosen batch, so the
 *  same product can carry a different cost on every purchase.
 *
 *  Both roles can receive stock (same access WORKER already has for plain
 *  stock additions on Products). Only ADMIN can correct a batch's details
 *  or delete an untouched one.
 * ─────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect } from 'react';
import {
  Search, Plus, Trash2, Edit2, Layers, ChevronLeft, ChevronRight,
  X, RefreshCw, CheckCircle, PackagePlus,
} from 'lucide-react';
import {
  getProducts, getActiveBranches,
  getBatchesPage, receiveBatch, updateBatch, deleteBatch,
} from '../services/api';

/* Reuses the same design tokens as Branches.jsx / Payments.jsx */
const BA_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  .abk-batch {
    --cream:#F0F7E2; --cream-deep:#E4F0CF; --ink:#0F1F04; --ink-mid:#3A5220;
    --ink-light:#6A8A4A; --ink-faint:#A8C080; --border:#D0E4B0; --border-light:#E2EFC8;
    --card:#FFFFFF; --card-hover:#F3FAE6; --green:#1D9E75; --green-bg:#E1F5EE;
    --blue:#185FA5; --blue-bg:#E6F1FB; --purple:#534AB7; --purple-bg:#EEEDFE;
    --amber:#854F0B; --amber-bg:#FAEEDA; --red-bg:#FCEBEB; --red-border:#F7C1C1;
    --red-text:#791F1F; --texture-col:#C8DCA8;
  }
  .abk-batch.abk-dark {
    --cream:#0D1117; --cream-deep:#161B22; --ink:#E6EDF3; --ink-mid:#B8C9DB;
    --ink-light:#8BA4BE; --ink-faint:#5A7A96; --border:#21303F; --border-light:#1A2535;
    --card:#13192A; --card-hover:#1C2540; --green:#3DD68C; --green-bg:#0D2B1F;
    --blue:#58A6FF; --blue-bg:#0D1F35; --purple:#A78BFA; --purple-bg:#1A1535;
    --amber:#F0A742; --amber-bg:#2A1C06; --red-bg:#1F0D0D; --red-border:#3D1515;
    --red-text:#FF8080; --texture-col:#1A2535;
  }
  .abk-batch, .abk-batch * { font-family:'DM Sans',sans-serif; box-sizing:border-box; }
  .abk-batch .abk-serif { font-family:'Playfair Display',Georgia,serif !important; }
  .abk-batch.abk-texture::before {
    content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
    background-image: linear-gradient(var(--texture-col) 1px, transparent 1px), linear-gradient(90deg, var(--texture-col) 1px, transparent 1px);
    background-size:48px 48px; opacity:.25;
  }
  .abk-batch.abk-dark.abk-texture::before { opacity:.18; }
  @keyframes abkBaFadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes abkBaFadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes abkBaScaleIn { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
  @keyframes abkBaToast   { 0%{opacity:0;transform:translateY(-12px)} 10%{opacity:1;transform:translateY(0)} 85%{opacity:1} 100%{opacity:0} }
  .abk-batch .abk-anim-fade-up  { opacity:0; animation:abkBaFadeUp  .45s ease both; }
  .abk-batch .abk-anim-fade-in  { opacity:0; animation:abkBaFadeIn  .45s ease both; }
  .abk-batch .abk-anim-scale-in { opacity:0; animation:abkBaScaleIn .45s ease both; }
  .abk-batch .abk-toast         { animation:abkBaToast 3.2s ease forwards; }
  .abk-batch .abk-row-hover { transition:background .15s; }
  .abk-batch .abk-row-hover:hover { background:var(--card-hover) !important; }
  .abk-batch .abk-input {
    width:100%; border:1px solid var(--border); border-radius:10px; padding:9px 12px;
    font-size:13px; color:var(--ink); background:var(--card); outline:none;
    transition:border-color .15s, box-shadow .15s; font-family:'DM Sans',sans-serif;
  }
  .abk-batch .abk-input:focus { border-color:var(--blue); box-shadow:0 0 0 3px rgba(24,95,165,.12); }
  .abk-batch .abk-input::placeholder { color:var(--ink-faint); }
  .abk-batch.abk-dark .abk-input { background:var(--cream-deep); }
  .abk-batch select.abk-input { cursor:pointer; }
  .abk-batch .abk-label {
    display:block; font-size:10.5px; font-weight:600; text-transform:uppercase;
    letter-spacing:.09em; color:var(--ink-light); margin-bottom:6px;
  }
  .abk-batch ::-webkit-scrollbar { width:5px; }
  .abk-batch ::-webkit-scrollbar-track { background:transparent; }
  .abk-batch ::-webkit-scrollbar-thumb { background:var(--border); border-radius:4px; }
  @media (max-width:1023px) { .abk-batch-filter { flex-wrap: wrap !important; } .abk-batch-filter > * { min-width: 140px !important; } }
  @media (max-width:767px) {
    .abk-batch-pad { padding: 1rem 0.75rem 3rem !important; }
    .abk-batch-filter { flex-direction: column !important; } .abk-batch-filter > * { width: 100% !important; }
    .abk-batch-header { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; } .abk-batch-header > * { width: 100% !important; }
    .abk-batch-modal-grid { grid-template-columns: 1fr !important; }
    .abk-batch-table-wrap { overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; }
    .abk-batch-table-wrap table { min-width: 820px !important; table-layout: auto !important; }
    input, select, textarea { font-size: 16px !important; }
  }
`;

function Modal({ onClose, children, maxWidth = 480 }) {
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
function BtnPrimary({ onClick, disabled, children, color = 'var(--green)' }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      flex:1, padding:'10px 0', background:color, color:'#fff', border:'none', borderRadius:11,
      fontSize:13, fontWeight:500, cursor:disabled?'not-allowed':'pointer', opacity:disabled?.5:1,
      display:'flex', alignItems:'center', justifyContent:'center', gap:6, transition:'filter .15s', fontFamily:'DM Sans,sans-serif',
    }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.filter='brightness(1.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.filter='none'; }}
    >{children}</button>
  );
}
function BtnSecondary({ onClick, children }) {
  return (
    <button onClick={onClick} style={{ flex:1, padding:'10px 0', background:'var(--cream-deep)', color:'var(--ink-mid)', border:'1px solid var(--border)', borderRadius:11, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}
      onMouseEnter={e => e.currentTarget.style.background='var(--border)'}
      onMouseLeave={e => e.currentTarget.style.background='var(--cream-deep)'}
    >{children}</button>
  );
}
function IconBtn({ onClick, title, danger, children }) {
  return (
    <button onClick={onClick} title={title} style={{
      width:28, height:28, borderRadius:8, border:`1px solid ${danger?'var(--red-border)':'var(--border)'}`,
      background:danger?'var(--red-bg)':'var(--cream-deep)', color:danger?'var(--red-text)':'var(--ink-mid)',
      display:'inline-flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
    }}>{children}</button>
  );
}
function fmt(n) { return (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

function emptyReceiveForm() {
  return { productId: '', branchId: '', quantity: '', costPerUnit: '', batchNumber: '', receivedDate: '', expiryDate: '', supplier: '', notes: '' };
}

export default function Batches({ dark, user }) {
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

  useEffect(() => {
    const id = 'abk-batch-css';
    let tag = document.getElementById(id);
    if (!tag) { tag = document.createElement('style'); tag.id = id; document.head.appendChild(tag); }
    tag.innerHTML = BA_CSS;
    return () => { const el = document.getElementById(id); if (el) el.remove(); };
  }, []);

  const [products,      setProducts]      = useState([]);
  const [branches,    setBranches]    = useState([]);
  const [rows,          setRows]          = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages,    setTotalPages]    = useState(1);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [page,          setPage]          = useState(1);
  const [rowsPerPage,   setRowsPerPage]   = useState(10);
  const [showReceive,   setShowReceive]   = useState(false);
  const [receiveForm,   setReceiveForm]   = useState(emptyReceiveForm());
  const [saving,        setSaving]        = useState(false);
  const [editTarget,    setEditTarget]    = useState(null);
  const [editForm,      setEditForm]      = useState({ costPerUnit: '', batchNumber: '', expiryDate: '', supplier: '', notes: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [successMsg,    setSuccessMsg]    = useState('');

  function showSuccess(msg) { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3200); }

  useEffect(() => {
    Promise.all([getProducts().catch(() => []), getActiveBranches().catch(() => [])])
      .then(([p, w]) => { setProducts(p); setBranches(w); });
  }, []);

  async function load() {
    try {
      setLoading(true);
      const res = await getBatchesPage({
        page: page - 1, size: rowsPerPage, search,
        productId: filterProduct || undefined, branchId: filterBranch || undefined,
      });
      setRows(res.content ?? []);
      setTotalElements(res.totalElements ?? 0);
      setTotalPages(Math.max(1, res.totalPages ?? 1));
    } catch { setRows([]); setTotalElements(0); setTotalPages(1); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, search, filterProduct, filterBranch]);

  function openReceive() { setReceiveForm(emptyReceiveForm()); setShowReceive(true); }

  async function handleReceive() {
    const { productId, branchId, quantity, costPerUnit } = receiveForm;
    if (!productId || !branchId) { alert('Product and branch are required.'); return; }
    if (!quantity || parseInt(quantity) <= 0) { alert('Quantity must be greater than zero.'); return; }
    if (costPerUnit === '' || parseFloat(costPerUnit) < 0) { alert('Cost per unit is required.'); return; }
    setSaving(true);
    try {
      await receiveBatch({
        productId: parseInt(productId), branchId: parseInt(branchId),
        quantity: parseInt(quantity), costPerUnit: parseFloat(costPerUnit),
        batchNumber: receiveForm.batchNumber.trim() || null,
        receivedDate: receiveForm.receivedDate || null,
        expiryDate: receiveForm.expiryDate || null,
        supplier: receiveForm.supplier.trim() || null,
        notes: receiveForm.notes.trim() || null,
        recordedBy: user?.name || 'Staff',
      });
      setShowReceive(false);
      showSuccess('Stock received into new batch');
      await load();
    } catch (e) { alert(e?.response?.data?.error || e.message || 'Failed to receive stock.'); }
    finally { setSaving(false); }
  }

  function openEdit(b) {
    setEditTarget(b);
    setEditForm({
      costPerUnit: b.costPerUnit ?? '', batchNumber: b.batchNumber || '',
      expiryDate: b.expiryDate || '', supplier: b.supplier || '', notes: b.notes || '',
    });
  }

  async function handleSaveEdit() {
    setSaving(true);
    try {
      await updateBatch(editTarget.id, {
        costPerUnit: editForm.costPerUnit === '' ? null : parseFloat(editForm.costPerUnit),
        batchNumber: editForm.batchNumber.trim() || null,
        expiryDate: editForm.expiryDate || null,
        supplier: editForm.supplier.trim() || null,
        notes: editForm.notes.trim() || null,
      });
      setEditTarget(null);
      showSuccess('Batch updated');
      await load();
    } catch (e) { alert(e?.response?.data?.error || e.message || 'Failed to update batch.'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    try {
      await deleteBatch(id);
      setDeleteConfirm(null);
      showSuccess('Batch deleted');
      await load();
    } catch (e) { alert(e?.response?.data?.error || e.message || 'Failed to delete batch.'); }
  }

  return (
    <div className={`abk-batch abk-texture${dark ? ' abk-dark' : ''}`} style={{ background:'var(--cream)', minHeight:'100vh', position:'relative', transition:'background .3s' }}>
      {successMsg && (
        <div className="abk-toast" style={{ position:'fixed', top:20, right:20, zIndex:100, display:'inline-flex', alignItems:'center', gap:8, background:'var(--green)', color:'#fff', padding:'10px 18px', borderRadius:12, fontSize:13, fontWeight:500, boxShadow:'0 4px 20px rgba(29,158,117,.35)' }}>
          <CheckCircle size={15} /> {successMsg}
        </div>
      )}

      <div className="abk-batch-pad" style={{ position:'relative', zIndex:1, padding:'1.5rem 1.5rem 3rem' }}>
        <div className="abk-anim-fade-up abk-batch-header" style={{ padding:'0.5rem 0 1.4rem', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
          <div>
            <div style={{ fontSize:10.5, fontWeight:500, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--ink-light)', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ display:'inline-block', width:18, height:1.5, background:'var(--green)', borderRadius:1 }} />
              Inventory
            </div>
            <div className="abk-serif" style={{ fontSize:28, fontWeight:500, color:'var(--ink)', letterSpacing:-0.5, lineHeight:1.1 }}>Batches</div>
            <div style={{ fontSize:12, color:'var(--ink-faint)', marginTop:4, fontWeight:300 }}>
              Every lot received, per branch, at its own cost.
            </div>
          </div>
          <button onClick={openReceive} style={{
            display:'inline-flex', alignItems:'center', gap:6, padding:'10px 18px', background:'var(--green)', color:'#fff',
            border:'none', borderRadius:11, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'DM Sans,sans-serif',
            boxShadow:'0 2px 8px rgba(29,158,117,.3)', whiteSpace:'nowrap',
          }}><PackagePlus size={15} /> Receive Stock</button>
        </div>

        {/* Filters */}
        <div className="abk-anim-fade-in abk-batch-filter" style={{ display:'flex', gap:8, marginBottom:'1rem' }}>
          <div style={{ flex:1, position:'relative' }}>
            <Search size={14} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--ink-faint)', pointerEvents:'none' }} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search product, batch #, supplier…" className="abk-input" style={{ paddingLeft:34 }} />
          </div>
          <select value={filterProduct} onChange={e => { setFilterProduct(e.target.value); setPage(1); }} className="abk-input" style={{ maxWidth:200 }}>
            <option value="">All products</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={filterBranch} onChange={e => { setFilterBranch(e.target.value); setPage(1); }} className="abk-input" style={{ maxWidth:200 }}>
            <option value="">All branches</option>
            {branches.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="abk-anim-scale-in" style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:16, width:'100%', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,.06)' }}>
          <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border-light)', background:'var(--cream-deep)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div className="abk-serif" style={{ fontSize:14, fontWeight:500, color:'var(--ink)' }}>Batch History</div>
            <span style={{ fontSize:11, color:'var(--ink-faint)', fontWeight:300 }}>{totalElements} batches</span>
          </div>
          <div className="abk-batch-table-wrap" style={{ overflowX:'auto', width:'100%' }}>
            <table style={{ width:'100%', minWidth:'max-content', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'var(--cream-deep)', borderBottom:'1px solid var(--border)' }}>
                  {['Batch #', 'Product', 'Branch', 'Cost/Unit', 'Received', 'Remaining', 'Received On', 'Actions'].map(h => (
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:600, letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--ink-light)', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ textAlign:'center', padding:'3.5rem 0' }}>
                    <div style={{ width:24, height:24, border:'3px solid var(--border)', borderTopColor:'var(--green)', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto' }} />
                  </td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign:'center', padding:'3.5rem 0' }}>
                    <Layers size={34} style={{ color:'var(--border)', margin:'0 auto 10px', display:'block' }} />
                    <p style={{ color:'var(--ink-faint)', fontSize:13, fontWeight:300 }}>
                      {search || filterProduct || filterBranch ? 'No batches match your filters' : 'No batches yet — receive stock to create one'}
                    </p>
                  </td></tr>
                ) : rows.map(b => {
                  const depleted = (b.quantityRemaining ?? 0) <= 0;
                  return (
                    <tr key={b.id} className="abk-row-hover" style={{ borderBottom:'1px solid var(--border-light)' }}>
                      <td style={{ padding:'11px 14px', fontSize:12.5, fontFamily:'monospace', color:'var(--ink-mid)' }}>{b.batchNumber || `#${b.id}`}</td>
                      <td style={{ padding:'11px 14px', fontSize:13, fontWeight:500, color:'var(--ink)' }}>{b.product?.name}</td>
                      <td style={{ padding:'11px 14px', fontSize:12, color:'var(--ink-light)', fontWeight:300 }}>{b.branch?.name}</td>
                      <td style={{ padding:'11px 14px', fontSize:12.5, color:'var(--ink-mid)' }}>{fmt(b.costPerUnit)}</td>
                      <td style={{ padding:'11px 14px', fontSize:12.5, color:'var(--ink-mid)' }}>{b.quantityReceived}</td>
                      <td style={{ padding:'11px 14px' }}>
                        <span style={{ display:'inline-flex', alignItems:'center', fontSize:11, fontWeight:600, padding:'2px 9px', borderRadius:20, background: depleted ? 'var(--red-bg)' : 'var(--green-bg)', color: depleted ? 'var(--red-text)' : 'var(--green)' }}>
                          {b.quantityRemaining} left
                        </span>
                      </td>
                      <td style={{ padding:'11px 14px', fontSize:11.5, color:'var(--ink-faint)', fontWeight:300 }}>{b.receivedDate || '—'}</td>
                      <td style={{ padding:'11px 14px' }}>
                        {isAdmin && (
                          <div style={{ display:'flex', gap:6 }}>
                            <IconBtn onClick={() => openEdit(b)} title="Edit"><Edit2 size={12} /></IconBtn>
                            <IconBtn onClick={() => setDeleteConfirm(b)} title="Delete" danger><Trash2 size={12} /></IconBtn>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderTop:'1px solid var(--border-light)', background:'var(--cream-deep)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--ink-faint)', fontWeight:300 }}>
              <span>Rows:</span>
              {[10, 20, 50].map(n => (
                <button key={n} onClick={() => { setRowsPerPage(n); setPage(1); }} style={{ padding:'2px 9px', borderRadius:7, fontSize:11, fontWeight:500, cursor:'pointer', background: rowsPerPage===n ? 'var(--green)' : 'var(--card)', color: rowsPerPage===n ? '#fff' : 'var(--ink-faint)', border:`1px solid ${rowsPerPage===n ? 'var(--green)' : 'var(--border)'}` }}>{n}</button>
              ))}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, color:'var(--ink-faint)', fontWeight:300 }}>
              <span>{totalElements === 0 ? 0 : (page-1)*rowsPerPage+1}–{Math.min(page*rowsPerPage, totalElements)} / {totalElements}</span>
              {[
                { Icon: ChevronLeft, action: () => setPage(p => Math.max(1, p-1)), disabled: page===1 },
                { Icon: ChevronRight, action: () => setPage(p => Math.min(totalPages, p+1)), disabled: page===totalPages },
              ].map(({ Icon, action, disabled }, i) => (
                <button key={i} onClick={action} disabled={disabled} style={{ width:26, height:26, borderRadius:7, border:'1px solid var(--border)', background:'var(--card)', color:'var(--ink-light)', cursor:disabled?'not-allowed':'pointer', opacity:disabled?.35:1, display:'flex', alignItems:'center', justifyContent:'center' }}><Icon size={13} /></button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Receive Stock modal */}
      {showReceive && (
        <Modal onClose={() => setShowReceive(false)} maxWidth={480}>
          <ModalHeader title="Receive Stock" subtitle="Creates a new batch at its own cost" onClose={() => setShowReceive(false)} accent="var(--green)" />
          <div style={{ padding:'1.2rem 1.4rem', display:'flex', flexDirection:'column', gap:14 }}>
            <div className="abk-batch-modal-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label className="abk-label">Product *</label>
                <select value={receiveForm.productId} onChange={e => setReceiveForm(f => ({ ...f, productId: e.target.value }))} className="abk-input">
                  <option value="">Select…</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="abk-label">Branch *</label>
                <select value={receiveForm.branchId} onChange={e => setReceiveForm(f => ({ ...f, branchId: e.target.value }))} className="abk-input">
                  <option value="">Select…</option>
                  {branches.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                {branches.length === 0 && (
                  <div style={{ fontSize:11, color:'var(--red-text)', marginTop:4 }}>No branches yet — add one on the Locations &amp; Branches page first.</div>
                )}
              </div>
            </div>
            <div className="abk-batch-modal-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label className="abk-label">Quantity *</label>
                <input type="number" min="1" value={receiveForm.quantity} onChange={e => setReceiveForm(f => ({ ...f, quantity: e.target.value }))} placeholder="0" className="abk-input" />
              </div>
              <div>
                <label className="abk-label">Cost / Unit *</label>
                <input type="number" min="0" step="0.01" value={receiveForm.costPerUnit} onChange={e => setReceiveForm(f => ({ ...f, costPerUnit: e.target.value }))} placeholder="0.00" className="abk-input" />
              </div>
            </div>
            <div className="abk-batch-modal-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label className="abk-label">Batch # (optional)</label>
                <input value={receiveForm.batchNumber} onChange={e => setReceiveForm(f => ({ ...f, batchNumber: e.target.value }))} placeholder="Auto-generated if blank" className="abk-input" />
              </div>
              <div>
                <label className="abk-label">Received Date</label>
                <input type="date" value={receiveForm.receivedDate} onChange={e => setReceiveForm(f => ({ ...f, receivedDate: e.target.value }))} className="abk-input" />
              </div>
            </div>
            <div className="abk-batch-modal-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label className="abk-label">Expiry Date (optional)</label>
                <input type="date" value={receiveForm.expiryDate} onChange={e => setReceiveForm(f => ({ ...f, expiryDate: e.target.value }))} className="abk-input" />
              </div>
              <div>
                <label className="abk-label">Supplier (optional)</label>
                <input value={receiveForm.supplier} onChange={e => setReceiveForm(f => ({ ...f, supplier: e.target.value }))} placeholder="Optional" className="abk-input" />
              </div>
            </div>
            <div>
              <label className="abk-label">Notes</label>
              <input value={receiveForm.notes} onChange={e => setReceiveForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" className="abk-input" />
            </div>
          </div>
          <ModalFooter>
            <BtnSecondary onClick={() => setShowReceive(false)}>Cancel</BtnSecondary>
            <BtnPrimary onClick={handleReceive} disabled={saving}>
              {saving ? <><RefreshCw size={13} style={{ animation:'spin 1s linear infinite' }} /> Receiving…</> : <><CheckCircle size={13} /> Receive</>}
            </BtnPrimary>
          </ModalFooter>
        </Modal>
      )}

      {/* Edit modal */}
      {editTarget && (
        <Modal onClose={() => setEditTarget(null)} maxWidth={440}>
          <ModalHeader title={`Edit Batch — ${editTarget.batchNumber || '#' + editTarget.id}`} subtitle="Only cost/notes/expiry can be corrected here" onClose={() => setEditTarget(null)} accent="var(--blue)" />
          <div style={{ padding:'1.2rem 1.4rem', display:'flex', flexDirection:'column', gap:14 }}>
            <div className="abk-batch-modal-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label className="abk-label">Cost / Unit</label>
                <input type="number" min="0" step="0.01" value={editForm.costPerUnit} onChange={e => setEditForm(f => ({ ...f, costPerUnit: e.target.value }))} className="abk-input" />
              </div>
              <div>
                <label className="abk-label">Batch #</label>
                <input value={editForm.batchNumber} onChange={e => setEditForm(f => ({ ...f, batchNumber: e.target.value }))} className="abk-input" />
              </div>
            </div>
            <div className="abk-batch-modal-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label className="abk-label">Expiry Date</label>
                <input type="date" value={editForm.expiryDate} onChange={e => setEditForm(f => ({ ...f, expiryDate: e.target.value }))} className="abk-input" />
              </div>
              <div>
                <label className="abk-label">Supplier</label>
                <input value={editForm.supplier} onChange={e => setEditForm(f => ({ ...f, supplier: e.target.value }))} className="abk-input" />
              </div>
            </div>
            <div>
              <label className="abk-label">Notes</label>
              <input value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} className="abk-input" />
            </div>
          </div>
          <ModalFooter>
            <BtnSecondary onClick={() => setEditTarget(null)}>Cancel</BtnSecondary>
            <BtnPrimary onClick={handleSaveEdit} disabled={saving} color="var(--blue)">
              {saving ? <><RefreshCw size={13} style={{ animation:'spin 1s linear infinite' }} /> Saving…</> : <><CheckCircle size={13} /> Save</>}
            </BtnPrimary>
          </ModalFooter>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <Modal onClose={() => setDeleteConfirm(null)} maxWidth={360}>
          <div style={{ padding:'2rem 1.6rem 1.4rem', textAlign:'center' }}>
            <div style={{ width:52, height:52, borderRadius:'50%', background:'var(--red-bg)', border:'2px solid var(--red-border)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
              <Trash2 size={22} style={{ color:'var(--red-text)' }} />
            </div>
            <div className="abk-serif" style={{ fontSize:17, fontWeight:500, color:'var(--ink)', marginBottom:6 }}>Delete Batch</div>
            <p style={{ fontSize:13, color:'var(--ink-light)', marginBottom:4, fontWeight:300 }}>
              Remove <strong style={{ color:'var(--ink)', fontWeight:500 }}>{deleteConfirm.batchNumber || `#${deleteConfirm.id}`}</strong>?
            </p>
            <p style={{ fontSize:11, color:'var(--ink-faint)', marginBottom:20, fontWeight:300 }}>
              Only an untouched batch (nothing sold from it yet) can be deleted — this also reverses the stock it added.
            </p>
            <div style={{ display:'flex', gap:10 }}>
              <BtnSecondary onClick={() => setDeleteConfirm(null)}>Cancel</BtnSecondary>
              <BtnPrimary onClick={() => handleDelete(deleteConfirm.id)} color="#c53030">Delete</BtnPrimary>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
