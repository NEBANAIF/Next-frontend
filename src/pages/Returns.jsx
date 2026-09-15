/**
 * ─────────────────────────────────────────────────────────────────────────
 *  Returns.jsx — Returns against a past sale
 *
 *  A return is always tied to a specific past sale — find it first (by
 *  customer or product name), then say how many units and whether they go
 *  back to sellable stock (restock=true credits the exact batch(es) that
 *  sale drew from) or not (damaged/defective — refund/reporting only, no
 *  stock movement). Branch users only see/return their own branch's sales;
 *  ADMIN can filter by branch or see everything.
 * ─────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect } from 'react';
import {
  Search, Undo2, ChevronLeft, ChevronRight, X, RefreshCw, CheckCircle,
  PackageCheck, PackageX, Plus,
} from 'lucide-react';
import {
  getSalesPage, getReturnsPage, getReturnsForSale, createReturn,
} from '../services/api';

const RET_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');
  .abk-ret {
    --cream:#F0F7E2; --cream-deep:#E4F0CF; --ink:#0F1F04; --ink-mid:#3A5220;
    --ink-light:#6A8A4A; --ink-faint:#A8C080; --border:#D0E4B0; --border-light:#E2EFC8;
    --card:#FFFFFF; --card-hover:#F3FAE6; --green:#1D9E75; --green-bg:#E1F5EE;
    --blue:#185FA5; --blue-bg:#E6F1FB; --amber:#854F0B; --amber-bg:#FAEEDA;
    --red-bg:#FCEBEB; --red-border:#F7C1C1; --red-text:#791F1F; --texture-col:#C8DCA8;
  }
  .abk-ret.abk-dark {
    --cream:#0D1117; --cream-deep:#161B22; --ink:#E6EDF3; --ink-mid:#B8C9DB;
    --ink-light:#8BA4BE; --ink-faint:#5A7A96; --border:#21303F; --border-light:#1A2535;
    --card:#13192A; --card-hover:#1C2540; --green:#3DD68C; --green-bg:#0D2B1F;
    --blue:#58A6FF; --blue-bg:#0D1F35; --amber:#F0A742; --amber-bg:#2A1C06;
    --red-bg:#1F0D0D; --red-border:#3D1515; --red-text:#FF8080; --texture-col:#1A2535;
  }
  .abk-ret, .abk-ret * { font-family:'DM Sans',sans-serif; box-sizing:border-box; }
  .abk-ret .abk-serif { font-family:'Playfair Display',Georgia,serif !important; }
  .abk-ret.abk-texture::before {
    content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
    background-image: linear-gradient(var(--texture-col) 1px, transparent 1px), linear-gradient(90deg, var(--texture-col) 1px, transparent 1px);
    background-size:48px 48px; opacity:.25;
  }
  .abk-ret.abk-dark.abk-texture::before { opacity:.18; }
  @keyframes abkRFadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes abkRFadeIn{from{opacity:0}to{opacity:1}}
  @keyframes abkRScaleIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
  @keyframes abkRToast{0%{opacity:0;transform:translateY(-12px)}10%{opacity:1;transform:translateY(0)}85%{opacity:1}100%{opacity:0}}
  .abk-ret .abk-anim-fade-up{opacity:0;animation:abkRFadeUp .45s ease both;}
  .abk-ret .abk-anim-fade-in{opacity:0;animation:abkRFadeIn .45s ease both;}
  .abk-ret .abk-anim-scale-in{opacity:0;animation:abkRScaleIn .45s ease both;}
  .abk-ret .abk-toast{animation:abkRToast 3.2s ease forwards;}
  .abk-ret .abk-row-hover{transition:background .15s;}
  .abk-ret .abk-row-hover:hover{background:var(--card-hover) !important;}
  .abk-ret .abk-input{width:100%;border:1px solid var(--border);border-radius:10px;padding:9px 12px;font-size:13px;color:var(--ink);background:var(--card);outline:none;transition:border-color .15s,box-shadow .15s;font-family:'DM Sans',sans-serif;}
  .abk-ret .abk-input:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(24,95,165,.12);}
  .abk-ret .abk-input::placeholder{color:var(--ink-faint);}
  .abk-ret.abk-dark .abk-input{background:var(--cream-deep);}
  .abk-ret .abk-label{display:block;font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--ink-light);margin-bottom:6px;}
  @media (max-width:767px) {
    .abk-ret-pad{padding:1rem .75rem 3rem !important;}
    .abk-ret-filter{flex-direction:column !important;}
    .abk-ret-filter>*{width:100% !important;}
    .abk-ret-table-wrap{overflow-x:auto !important;}
    .abk-ret-table-wrap table{min-width:650px !important;}
    input,select,textarea{font-size:16px !important;}
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

function fmt(n) { return (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

export default function Returns({ dark, user }) {
  useEffect(() => {
    const id = 'abk-ret-css';
    let tag = document.getElementById(id);
    if (!tag) { tag = document.createElement('style'); tag.id = id; document.head.appendChild(tag); }
    tag.innerHTML = RET_CSS;
    return () => { const el = document.getElementById(id); if (el) el.remove(); };
  }, []);

  const [rows, setRows] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [successMsg, setSuccessMsg] = useState('');
  const [showNew, setShowNew] = useState(false);

  function showSuccess(msg) { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3200); }

  async function load() {
    try {
      setLoading(true);
      const res = await getReturnsPage({ page: page - 1, size: rowsPerPage });
      setRows(res.content ?? []);
      setTotalElements(res.totalElements ?? 0);
      setTotalPages(Math.max(1, res.totalPages ?? 1));
    } catch { setRows([]); setTotalElements(0); setTotalPages(1); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [page, rowsPerPage]);

  return (
    <div className={`abk-ret abk-texture${dark ? ' abk-dark' : ''}`} style={{ background:'var(--cream)', minHeight:'100vh', position:'relative', transition:'background .3s' }}>
      {successMsg && (
        <div className="abk-toast" style={{ position:'fixed', top:20, right:20, zIndex:100, display:'inline-flex', alignItems:'center', gap:8, background:'var(--blue)', color:'#fff', padding:'10px 18px', borderRadius:12, fontSize:13, fontWeight:500, boxShadow:'0 4px 20px rgba(24,95,165,.35)' }}>
          <CheckCircle size={15} /> {successMsg}
        </div>
      )}

      <div className="abk-ret-pad" style={{ position:'relative', zIndex:1, padding:'1.5rem 1.5rem 3rem' }}>
        <div className="abk-anim-fade-up" style={{ padding:'0.5rem 0 1.4rem', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
          <div>
            <div style={{ fontSize:10.5, fontWeight:500, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--ink-light)', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ display:'inline-block', width:18, height:1.5, background:'var(--blue)', borderRadius:1 }} />
              Sales
            </div>
            <div className="abk-serif" style={{ fontSize:28, fontWeight:500, color:'var(--ink)', letterSpacing:-0.5, lineHeight:1.1 }}>Returns</div>
            <div style={{ fontSize:12, color:'var(--ink-faint)', marginTop:4, fontWeight:300 }}>Returns against a past sale — restocked or written off.</div>
          </div>
          <button onClick={() => setShowNew(true)} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', background:'var(--blue)', color:'#fff', border:'none', borderRadius:11, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'DM Sans,sans-serif', boxShadow:'0 2px 8px rgba(24,95,165,.3)', whiteSpace:'nowrap' }}>
            <Plus size={14} /> New Return
          </button>
        </div>

        <div className="abk-anim-scale-in" style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:16, width:'100%', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,.06)' }}>
          <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border-light)', background:'var(--cream-deep)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div className="abk-serif" style={{ fontSize:14, fontWeight:500, color:'var(--ink)' }}>Return History</div>
            <span style={{ fontSize:11, color:'var(--ink-faint)', fontWeight:300 }}>{totalElements} returns</span>
          </div>

          <div className="abk-ret-table-wrap" style={{ overflowX:'auto', width:'100%' }}>
            <table style={{ width:'100%', minWidth:'max-content', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'var(--cream-deep)', borderBottom:'1px solid var(--border)' }}>
                  {['Sale #','Product','Qty','Reason','Restocked','Refund','Processed By'].map(h => (
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:600, letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--ink-light)', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign:'center', padding:'3.5rem 0' }}>
                    <div style={{ width:24, height:24, border:'3px solid var(--border)', borderTopColor:'var(--blue)', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto' }} />
                  </td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign:'center', padding:'3.5rem 0' }}>
                    <Undo2 size={34} style={{ color:'var(--border)', margin:'0 auto 10px', display:'block' }} />
                    <p style={{ color:'var(--ink-faint)', fontSize:13, fontWeight:300 }}>No returns recorded yet</p>
                  </td></tr>
                ) : rows.map(r => (
                  <tr key={r.id} className="abk-row-hover" style={{ borderBottom:'1px solid var(--border-light)' }}>
                    <td style={{ padding:'11px 14px', fontSize:12, color:'var(--ink-mid)' }}>#{r.sale?.id}</td>
                    <td style={{ padding:'11px 14px', fontSize:13, fontWeight:500, color:'var(--ink)' }}>{r.product?.name}</td>
                    <td style={{ padding:'11px 14px', fontSize:12, color:'var(--ink-mid)' }}>{r.quantity}</td>
                    <td style={{ padding:'11px 14px', fontSize:12, color:'var(--ink-light)', fontWeight:300 }}>{r.reason || '—'}</td>
                    <td style={{ padding:'11px 14px' }}>
                      {r.restock ? (
                        <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, padding:'2px 9px', borderRadius:20, background:'var(--green-bg)', color:'var(--green)' }}>
                          <PackageCheck size={10} /> Restocked
                        </span>
                      ) : (
                        <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, padding:'2px 9px', borderRadius:20, background:'var(--amber-bg)', color:'var(--amber)' }}>
                          <PackageX size={10} /> Written off
                        </span>
                      )}
                    </td>
                    <td style={{ padding:'11px 14px', fontSize:12, color:'var(--ink-mid)' }}>{r.refundAmount != null ? fmt(r.refundAmount) : '—'}</td>
                    <td style={{ padding:'11px 14px', fontSize:12, color:'var(--ink-light)', fontWeight:300 }}>{r.processedBy || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} setPage={setPage} rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage} totalPages={totalPages} totalElements={totalElements} />
        </div>
      </div>

      {showNew && (
        <NewReturnModal
          user={user}
          onClose={() => setShowNew(false)}
          onDone={() => { setShowNew(false); showSuccess('Return recorded'); load(); }}
        />
      )}
    </div>
  );
}

/* ── New Return flow: find a sale, then fill out the return ─────────────── */
function NewReturnModal({ user, onClose, onDone }) {
  const [step, setStep] = useState('find'); // 'find' | 'form'
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [alreadyReturned, setAlreadyReturned] = useState(0);
  const [form, setForm] = useState({ quantity: '', reason: '', restock: true, refundAmount: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(() => {
      getSalesPage({ search: query.trim(), size: 8 })
        .then(res => setResults(res.content ?? []))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  async function pickSale(sale) {
    setSelectedSale(sale);
    try {
      const existing = await getReturnsForSale(sale.id);
      const already = (existing || []).reduce((sum, r) => sum + (r.quantity || 0), 0);
      setAlreadyReturned(already);
    } catch { setAlreadyReturned(0); }
    setForm({ quantity: '', reason: '', restock: true, refundAmount: '' });
    setStep('form');
  }

  const stillReturnable = selectedSale ? selectedSale.quantity - alreadyReturned : 0;

  async function handleSubmit() {
    const qty = parseInt(form.quantity);
    if (!qty || qty <= 0) { alert('Enter a valid quantity.'); return; }
    if (qty > stillReturnable) { alert(`Only ${stillReturnable} unit(s) of this sale can still be returned.`); return; }
    setSaving(true);
    try {
      await createReturn({
        saleId: selectedSale.id,
        quantity: qty,
        reason: form.reason.trim() || null,
        restock: form.restock,
        refundAmount: form.refundAmount === '' ? null : parseFloat(form.refundAmount),
        processedBy: user?.name || 'Staff',
      });
      onDone();
    } catch (e) { alert(e?.response?.data?.error || e.message || 'Failed to record return.'); }
    finally { setSaving(false); }
  }

  return (
    <Modal onClose={onClose} maxWidth={480}>
      <ModalHeader
        title={step === 'find' ? 'Find the Sale' : 'Record Return'}
        subtitle={step === 'find' ? 'Search by customer or product name' : `Sale #${selectedSale?.id} — ${selectedSale?.product?.name}`}
        onClose={onClose}
        accent="var(--blue)"
      />
      {step === 'find' ? (
        <div style={{ padding:'1.2rem 1.4rem', display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ position:'relative' }}>
            <Search size={14} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--ink-faint)', pointerEvents:'none' }} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Customer or product name…" className="abk-input" style={{ paddingLeft:34 }} autoFocus />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:280, overflowY:'auto' }}>
            {searching ? (
              <div style={{ textAlign:'center', padding:'1.5rem 0' }}>
                <div style={{ width:20, height:20, border:'3px solid var(--border)', borderTopColor:'var(--blue)', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto' }} />
              </div>
            ) : results.length === 0 ? (
              query.trim() && <div style={{ fontSize:12, color:'var(--ink-faint)', fontWeight:300, textAlign:'center', padding:'0.5rem 0' }}>No matching sales found.</div>
            ) : results.map(s => (
              <button key={s.id} onClick={() => pickSale(s)} style={{
                display:'flex', alignItems:'center', justifyContent:'space-between', textAlign:'left',
                padding:'9px 12px', borderRadius:10, border:'1px solid var(--border)', background:'var(--cream-deep)', cursor:'pointer',
              }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:500, color:'var(--ink)' }}>{s.product?.name}</div>
                  <div style={{ fontSize:11, color:'var(--ink-faint)', fontWeight:300 }}>{s.customerName} · Qty {s.quantity} · {s.saleDate}</div>
                </div>
                <div style={{ fontSize:12, color:'var(--ink-mid)', fontWeight:500 }}>#{s.id}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding:'1.2rem 1.4rem', display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ fontSize:11.5, color:'var(--ink-faint)', fontWeight:300 }}>
            Sold {selectedSale.quantity} — {stillReturnable} unit(s) still returnable.
          </div>
          <div>
            <label className="abk-label">Quantity to Return *</label>
            <input type="number" min="1" max={stillReturnable} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} className="abk-input" />
          </div>
          <div>
            <label className="abk-label">Reason</label>
            <input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Optional" className="abk-input" />
          </div>
          <div>
            <label className="abk-label">Refund Amount</label>
            <input type="number" min="0" step="0.01" value={form.refundAmount} onChange={e => setForm(f => ({ ...f, refundAmount: e.target.value }))} placeholder="Optional" className="abk-input" />
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setForm(f => ({ ...f, restock: true }))} style={{
              flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'10px 0', borderRadius:10, cursor:'pointer', fontSize:12.5, fontWeight:500,
              border: form.restock ? '1px solid var(--green)' : '1px solid var(--border)',
              background: form.restock ? 'var(--green-bg)' : 'var(--cream-deep)', color: form.restock ? 'var(--green)' : 'var(--ink-mid)',
            }}><PackageCheck size={14} /> Restock (item is fine)</button>
            <button onClick={() => setForm(f => ({ ...f, restock: false }))} style={{
              flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'10px 0', borderRadius:10, cursor:'pointer', fontSize:12.5, fontWeight:500,
              border: !form.restock ? '1px solid var(--amber)' : '1px solid var(--border)',
              background: !form.restock ? 'var(--amber-bg)' : 'var(--cream-deep)', color: !form.restock ? 'var(--amber)' : 'var(--ink-mid)',
            }}><PackageX size={14} /> Write off (damaged)</button>
          </div>
        </div>
      )}
      <ModalFooter>
        {step === 'form' && <BtnSecondary onClick={() => setStep('find')}>Back</BtnSecondary>}
        <BtnSecondary onClick={onClose}>Cancel</BtnSecondary>
        {step === 'form' && (
          <BtnPrimary onClick={handleSubmit} disabled={saving}>
            {saving ? <><RefreshCw size={13} style={{ animation:'spin 1s linear infinite' }} /> Saving…</> : <><CheckCircle size={13} /> Record Return</>}
          </BtnPrimary>
        )}
      </ModalFooter>
    </Modal>
  );
}
