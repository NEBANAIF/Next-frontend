/**
 * ─────────────────────────────────────────────────────────────────────────
 *  Suppliers.jsx — Vendor management
 *
 *  Suppliers are company-wide, not branch-scoped — the same vendor list is
 *  used by every branch's purchase orders. GET: every operational role
 *  (needed to pick a supplier when creating a PO or receiving a manual
 *  batch). POST/PUT/DELETE: ADMIN only.
 * ─────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect } from 'react';
import {
  Search, Plus, Trash2, Edit2, Truck, ChevronLeft, ChevronRight,
  X, RefreshCw, CheckCircle, Ban, CheckCircle2,
} from 'lucide-react';
import {
  getSuppliersPage, createSupplier, updateSupplier, deleteSupplier,
} from '../services/api';

const SUP_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  .abk-sup {
    --cream:#F0F7E2; --cream-deep:#E4F0CF; --ink:#0F1F04; --ink-mid:#3A5220;
    --ink-light:#6A8A4A; --ink-faint:#A8C080; --border:#D0E4B0; --border-light:#E2EFC8;
    --card:#FFFFFF; --card-hover:#F3FAE6; --green:#1D9E75; --green-bg:#E1F5EE;
    --blue:#185FA5; --blue-bg:#E6F1FB; --red-bg:#FCEBEB; --red-border:#F7C1C1; --red-text:#791F1F;
    --texture-col:#C8DCA8;
  }
  .abk-sup.abk-dark {
    --cream:#0D1117; --cream-deep:#161B22; --ink:#E6EDF3; --ink-mid:#B8C9DB;
    --ink-light:#8BA4BE; --ink-faint:#5A7A96; --border:#21303F; --border-light:#1A2535;
    --card:#13192A; --card-hover:#1C2540; --green:#3DD68C; --green-bg:#0D2B1F;
    --blue:#58A6FF; --blue-bg:#0D1F35; --red-bg:#1F0D0D; --red-border:#3D1515; --red-text:#FF8080;
    --texture-col:#1A2535;
  }
  .abk-sup, .abk-sup * { font-family:'DM Sans',sans-serif; box-sizing:border-box; }
  .abk-sup .abk-serif { font-family:'Playfair Display',Georgia,serif !important; }
  .abk-sup.abk-texture::before {
    content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
    background-image: linear-gradient(var(--texture-col) 1px, transparent 1px), linear-gradient(90deg, var(--texture-col) 1px, transparent 1px);
    background-size:48px 48px; opacity:.25;
  }
  .abk-sup.abk-dark.abk-texture::before { opacity:.18; }
  @keyframes abkSFadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes abkSFadeIn{from{opacity:0}to{opacity:1}}
  @keyframes abkSScaleIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
  @keyframes abkSToast{0%{opacity:0;transform:translateY(-12px)}10%{opacity:1;transform:translateY(0)}85%{opacity:1}100%{opacity:0}}
  .abk-sup .abk-anim-fade-up{opacity:0;animation:abkSFadeUp .45s ease both;}
  .abk-sup .abk-anim-fade-in{opacity:0;animation:abkSFadeIn .45s ease both;}
  .abk-sup .abk-anim-scale-in{opacity:0;animation:abkSScaleIn .45s ease both;}
  .abk-sup .abk-toast{animation:abkSToast 3.2s ease forwards;}
  .abk-sup .abk-row-hover{transition:background .15s;}
  .abk-sup .abk-row-hover:hover{background:var(--card-hover) !important;}
  .abk-sup .abk-input{width:100%;border:1px solid var(--border);border-radius:10px;padding:9px 12px;font-size:13px;color:var(--ink);background:var(--card);outline:none;transition:border-color .15s,box-shadow .15s;font-family:'DM Sans',sans-serif;}
  .abk-sup .abk-input:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(24,95,165,.12);}
  .abk-sup .abk-input::placeholder{color:var(--ink-faint);}
  .abk-sup.abk-dark .abk-input{background:var(--cream-deep);}
  .abk-sup .abk-label{display:block;font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--ink-light);margin-bottom:6px;}
  @media (max-width:767px) {
    .abk-sup-pad{padding:1rem .75rem 3rem !important;}
    .abk-sup-filter{flex-direction:column !important;}
    .abk-sup-filter>*{width:100% !important;}
    .abk-sup-modal-grid{grid-template-columns:1fr !important;}
    .abk-sup-table-wrap{overflow-x:auto !important;}
    .abk-sup-table-wrap table{min-width:600px !important;}
    input,select,textarea{font-size:16px !important;}
  }
`;

function Modal({ onClose, children, maxWidth = 460 }) {
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
function StatusBadge({ active }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, padding:'2px 9px', borderRadius:20,
      background: active !== false ? 'var(--green-bg)' : 'var(--red-bg)', color: active !== false ? 'var(--green)' : 'var(--red-text)',
      border:`1px solid ${active !== false ? 'rgba(29,158,117,.25)' : 'var(--red-border)'}` }}>
      {active !== false ? <CheckCircle2 size={10} /> : <Ban size={10} />} {active !== false ? 'Active' : 'Inactive'}
    </span>
  );
}
function IconBtn({ onClick, title, danger, children }) {
  return (
    <button onClick={onClick} title={title} style={{ width:28, height:28, borderRadius:8, border:`1px solid ${danger ? 'var(--red-border)' : 'var(--border)'}`, background: danger ? 'var(--red-bg)' : 'var(--cream-deep)', color: danger ? 'var(--red-text)' : 'var(--ink-mid)', display:'inline-flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>{children}</button>
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

function emptyForm() { return { name:'', contactName:'', phone:'', email:'', address:'', notes:'', active:true }; }

export default function Suppliers({ dark, user }) {
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

  useEffect(() => {
    const id = 'abk-sup-css';
    let tag = document.getElementById(id);
    if (!tag) { tag = document.createElement('style'); tag.id = id; document.head.appendChild(tag); }
    tag.innerHTML = SUP_CSS;
    return () => { const el = document.getElementById(id); if (el) el.remove(); };
  }, []);

  const [rows, setRows] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  function showSuccess(msg) { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3200); }

  async function load() {
    try {
      setLoading(true);
      const res = await getSuppliersPage({ page: page - 1, size: rowsPerPage, search });
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
  }, [page, rowsPerPage, search]);

  function openCreate() { setEditingId(null); setForm(emptyForm()); setShowModal(true); }
  function openEdit(s) {
    setEditingId(s.id);
    setForm({ name: s.name || '', contactName: s.contactName || '', phone: s.phone || '', email: s.email || '', address: s.address || '', notes: s.notes || '', active: s.active !== false });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { alert('Supplier name is required.'); return; }
    setSaving(true);
    try {
      if (editingId) await updateSupplier(editingId, form);
      else await createSupplier(form);
      setShowModal(false);
      showSuccess(editingId ? 'Supplier updated' : 'Supplier added');
      await load();
    } catch (e) { alert(e?.response?.data?.error || e.message || 'Failed to save supplier.'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    try {
      await deleteSupplier(id);
      setDeleteConfirm(null);
      showSuccess('Supplier deleted');
      await load();
    } catch (e) { alert(e?.response?.data?.error || e.message || 'Failed to delete supplier.'); }
  }

  async function handleToggleActive(s) {
    try {
      await updateSupplier(s.id, { ...s, active: !s.active });
      showSuccess(s.active ? 'Supplier deactivated' : 'Supplier activated');
      await load();
    } catch (e) { alert(e?.response?.data?.error || e.message || 'Failed to update supplier.'); }
  }

  return (
    <div className={`abk-sup abk-texture${dark ? ' abk-dark' : ''}`} style={{ background:'var(--cream)', minHeight:'100vh', position:'relative', transition:'background .3s' }}>
      {successMsg && (
        <div className="abk-toast" style={{ position:'fixed', top:20, right:20, zIndex:100, display:'inline-flex', alignItems:'center', gap:8, background:'var(--blue)', color:'#fff', padding:'10px 18px', borderRadius:12, fontSize:13, fontWeight:500, boxShadow:'0 4px 20px rgba(24,95,165,.35)' }}>
          <CheckCircle size={15} /> {successMsg}
        </div>
      )}

      <div className="abk-sup-pad" style={{ position:'relative', zIndex:1, padding:'1.5rem 1.5rem 3rem' }}>
        <div className="abk-anim-fade-up" style={{ padding:'0.5rem 0 1.4rem', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
          <div>
            <div style={{ fontSize:10.5, fontWeight:500, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--ink-light)', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ display:'inline-block', width:18, height:1.5, background:'var(--blue)', borderRadius:1 }} />
              Purchasing
            </div>
            <div className="abk-serif" style={{ fontSize:28, fontWeight:500, color:'var(--ink)', letterSpacing:-0.5, lineHeight:1.1 }}>Suppliers</div>
            <div style={{ fontSize:12, color:'var(--ink-faint)', marginTop:4, fontWeight:300 }}>The company-wide vendor list every branch's purchase orders draw from.</div>
          </div>
        </div>

        <div className="abk-anim-fade-in abk-sup-filter" style={{ display:'flex', gap:8, marginBottom:'1rem' }}>
          <div style={{ flex:1, position:'relative' }}>
            <Search size={14} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--ink-faint)', pointerEvents:'none' }} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search supplier name, contact, phone…" className="abk-input" style={{ paddingLeft:34 }} />
          </div>
          {isAdmin && (
            <button onClick={openCreate} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', background:'var(--blue)', color:'#fff', border:'none', borderRadius:11, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'DM Sans,sans-serif', boxShadow:'0 2px 8px rgba(24,95,165,.3)', whiteSpace:'nowrap' }}>
              <Plus size={14} /> Add Supplier
            </button>
          )}
        </div>

        <div className="abk-anim-scale-in" style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:16, width:'100%', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,.06)' }}>
          <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border-light)', background:'var(--cream-deep)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div className="abk-serif" style={{ fontSize:14, fontWeight:500, color:'var(--ink)' }}>Vendors</div>
            <span style={{ fontSize:11, color:'var(--ink-faint)', fontWeight:300 }}>{totalElements} suppliers</span>
          </div>

          <div className="abk-sup-table-wrap" style={{ overflowX:'auto', width:'100%' }}>
            <table style={{ width:'100%', minWidth:'max-content', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'var(--cream-deep)', borderBottom:'1px solid var(--border)' }}>
                  {['Supplier','Contact','Phone','Email','Status',...(isAdmin?['Actions']:[])].map(h => (
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:600, letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--ink-light)', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={isAdmin?6:5} style={{ textAlign:'center', padding:'3.5rem 0' }}>
                    <div style={{ width:24, height:24, border:'3px solid var(--border)', borderTopColor:'var(--blue)', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto' }} />
                  </td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={isAdmin?6:5} style={{ textAlign:'center', padding:'3.5rem 0' }}>
                    <Truck size={34} style={{ color:'var(--border)', margin:'0 auto 10px', display:'block' }} />
                    <p style={{ color:'var(--ink-faint)', fontSize:13, fontWeight:300 }}>{search ? 'No suppliers match your search' : (isAdmin ? 'No suppliers yet — add your first one' : 'No suppliers registered yet')}</p>
                  </td></tr>
                ) : rows.map(s => (
                  <tr key={s.id} className="abk-row-hover" style={{ borderBottom:'1px solid var(--border-light)' }}>
                    <td style={{ padding:'11px 14px', fontSize:13, fontWeight:500, color:'var(--ink)' }}>{s.name}</td>
                    <td style={{ padding:'11px 14px', fontSize:12, color:'var(--ink-mid)' }}>{s.contactName || '—'}</td>
                    <td style={{ padding:'11px 14px', fontSize:12, color:'var(--ink-light)', fontWeight:300 }}>{s.phone || '—'}</td>
                    <td style={{ padding:'11px 14px', fontSize:12, color:'var(--ink-light)', fontWeight:300 }}>{s.email || '—'}</td>
                    <td style={{ padding:'11px 14px' }}><StatusBadge active={s.active} /></td>
                    {isAdmin && (
                      <td style={{ padding:'11px 14px' }}>
                        <div style={{ display:'flex', gap:6 }}>
                          <IconBtn onClick={() => handleToggleActive(s)} title={s.active !== false ? 'Deactivate' : 'Activate'}>
                            {s.active !== false ? <Ban size={12} /> : <CheckCircle2 size={12} />}
                          </IconBtn>
                          <IconBtn onClick={() => openEdit(s)} title="Edit"><Edit2 size={12} /></IconBtn>
                          <IconBtn onClick={() => setDeleteConfirm(s)} title="Delete" danger><Trash2 size={12} /></IconBtn>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} setPage={setPage} rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage} totalPages={totalPages} totalElements={totalElements} />
        </div>
      </div>

      {showModal && (
        <Modal onClose={() => setShowModal(false)} maxWidth={460}>
          <ModalHeader title={editingId ? 'Edit Supplier' : 'Add Supplier'} subtitle="Vendor details" onClose={() => setShowModal(false)} accent="var(--blue)" />
          <div style={{ padding:'1.2rem 1.4rem', display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label className="abk-label">Supplier Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name:e.target.value }))} placeholder="e.g. Addis Distributors PLC" className="abk-input" />
            </div>
            <div className="abk-sup-modal-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label className="abk-label">Contact Name</label>
                <input value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName:e.target.value }))} placeholder="Optional" className="abk-input" />
              </div>
              <div>
                <label className="abk-label">Phone</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone:e.target.value }))} placeholder="Optional" className="abk-input" />
              </div>
            </div>
            <div className="abk-sup-modal-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label className="abk-label">Email</label>
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email:e.target.value }))} placeholder="Optional" className="abk-input" />
              </div>
              <div>
                <label className="abk-label">Address</label>
                <input value={form.address} onChange={e => setForm(f => ({ ...f, address:e.target.value }))} placeholder="Optional" className="abk-input" />
              </div>
            </div>
            <div>
              <label className="abk-label">Notes</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes:e.target.value }))} placeholder="Optional" className="abk-input" />
            </div>
            <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:12.5, color:'var(--ink-mid)', cursor:'pointer' }}>
              <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active:e.target.checked }))} />
              Active (visible in supplier pickers)
            </label>
          </div>
          <ModalFooter>
            <BtnSecondary onClick={() => setShowModal(false)}>Cancel</BtnSecondary>
            <BtnPrimary onClick={handleSave} disabled={saving}>
              {saving ? <><RefreshCw size={13} style={{ animation:'spin 1s linear infinite' }} /> Saving…</> : <><CheckCircle size={13} /> Save</>}
            </BtnPrimary>
          </ModalFooter>
        </Modal>
      )}

      {deleteConfirm && (
        <Modal onClose={() => setDeleteConfirm(null)} maxWidth={360}>
          <div style={{ padding:'2rem 1.6rem 1.4rem', textAlign:'center' }}>
            <div style={{ width:52, height:52, borderRadius:'50%', background:'var(--red-bg)', border:'2px solid var(--red-border)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
              <Trash2 size={22} style={{ color:'var(--red-text)' }} />
            </div>
            <div className="abk-serif" style={{ fontSize:17, fontWeight:500, color:'var(--ink)', marginBottom:6 }}>Delete Supplier</div>
            <p style={{ fontSize:13, color:'var(--ink-light)', marginBottom:4, fontWeight:300 }}>
              Remove <strong style={{ color:'var(--ink)', fontWeight:500 }}>{deleteConfirm.name}</strong>?
            </p>
            <p style={{ fontSize:11, color:'var(--ink-faint)', marginBottom:20, fontWeight:300 }}>
              Suppliers with purchase orders on record can't be deleted — deactivate instead.
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
