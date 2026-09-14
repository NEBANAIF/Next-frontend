/**
 * ─────────────────────────────────────────────────────────────────────────
 *  Purchases.jsx — Purchase Order → Receive → Batch workflow
 *
 *  Creating an order records intent only — no stock moves yet. Receiving a
 *  line item (fully or partially) is the moment stock actually appears: it
 *  creates a real ProductBatch at that line's cost, through the exact same
 *  path a manual batch receipt uses (see BatchService.receive on the
 *  backend) — so Product.stock, Stock History, and dashboards all stay
 *  consistent automatically.
 * ─────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect } from 'react';
import {
  Plus, Trash2, X, RefreshCw, CheckCircle, ChevronLeft, ChevronRight,
  ShoppingBag, PackageCheck, Ban, Clock, PackagePlus,
} from 'lucide-react';
import {
  getProducts, getActiveBranches, getActiveSuppliers,
  getPurchasesPage, createPurchase, receivePurchaseItem, receivePurchaseAll, cancelPurchase,
} from '../services/api';

const PU_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  .abk-purchase {
    --cream:#F0F7E2; --cream-deep:#E4F0CF; --ink:#0F1F04; --ink-mid:#3A5220;
    --ink-light:#6A8A4A; --ink-faint:#A8C080; --border:#D0E4B0; --border-light:#E2EFC8;
    --card:#FFFFFF; --card-hover:#F3FAE6; --green:#1D9E75; --green-bg:#E1F5EE;
    --blue:#185FA5; --blue-bg:#E6F1FB; --amber:#8A5A00; --amber-bg:#FFF3D6;
    --purple:#5B4FCF; --purple-bg:#EEECFB;
    --red-bg:#FCEBEB; --red-border:#F7C1C1; --red-text:#791F1F;
  }
  .abk-purchase.abk-dark {
    --cream:#0D1117; --cream-deep:#131A22; --ink:#E6EDF3; --ink-mid:#C9D4DD;
    --ink-light:#8FA3B3; --ink-faint:#5A7A96; --border:#1F2B36; --border-light:#182028;
    --card:#131A22; --card-hover:#182028; --green:#3DD68C; --green-bg:rgba(61,214,140,.12);
    --blue:#58A6FF; --blue-bg:rgba(88,166,255,.12); --amber:#F0A742; --amber-bg:rgba(240,167,66,.12);
    --purple:#A78BFA; --purple-bg:rgba(167,139,250,.12);
    --red-bg:rgba(239,83,80,.12); --red-border:rgba(239,83,80,.3); --red-text:#EF9A9A;
  }
  .abk-purchase, .abk-purchase * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
  .abk-purchase .abk-serif { font-family: 'Playfair Display', Georgia, serif !important; }
  .abk-pu-input {
    width: 100%; padding: 9px 12px; border: 1px solid var(--border); border-radius: 10px;
    font-size: 13px; background: var(--card); color: var(--ink); outline: none;
  }
  .abk-pu-input:focus { border-color: var(--green); }
  .abk-row-hover:hover { background: var(--card-hover); }
`;

function IconBtn({ children, onClick, title, danger }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 26, height: 26, borderRadius: 7, border: '1px solid var(--border)',
      background: danger ? 'var(--red-bg)' : 'var(--cream-deep)',
      color: danger ? 'var(--red-text)' : 'var(--ink-mid)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    }}>{children}</button>
  );
}

function StatusBadge({ status }) {
  const map = {
    DRAFT:              { bg: 'var(--cream-deep)', fg: 'var(--ink-light)', Icon: Clock },
    ORDERED:            { bg: 'var(--blue-bg)',    fg: 'var(--blue)',      Icon: ShoppingBag },
    PARTIALLY_RECEIVED: { bg: 'var(--amber-bg)',   fg: 'var(--amber)',     Icon: PackagePlus },
    RECEIVED:           { bg: 'var(--green-bg)',   fg: 'var(--green)',     Icon: PackageCheck },
    CANCELLED:          { bg: 'var(--red-bg)',     fg: 'var(--red-text)',  Icon: Ban },
  };
  const c = map[status] || map.DRAFT;
  const { Icon } = c;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600,
      padding: '2px 9px', borderRadius: 20, background: c.bg, color: c.fg,
    }}><Icon size={10} /> {status.replace('_', ' ')}</span>
  );
}

export default function Purchases({ dark, user }) {
  const actor = user?.name || user?.email || 'Admin';

  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [detail, setDetail] = useState(null); // the PO being viewed/received
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    getProducts().then(setProducts).catch(() => setProducts([]));
    getActiveBranches().then(setBranches).catch(() => setBranches([]));
    getActiveSuppliers().then(setSuppliers).catch(() => setSuppliers([]));
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await getPurchasesPage({ page, size: 10, status });
      setRows(res.content || []);
      setTotalPages(res.totalPages || 0);
      setTotalElements(res.totalElements || 0);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [page, status]);

  function showSuccess(msg) { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); }
  function showError(msg)   { setErrorMsg(msg);   setTimeout(() => setErrorMsg(''), 4000); }

  async function handleCancel(po) {
    if (!window.confirm(`Cancel purchase order ${po.poNumber}?`)) return;
    try { await cancelPurchase(po.id, actor); showSuccess('Purchase order cancelled'); load(); }
    catch (e) { showError(e?.response?.data?.error || e.message || 'Failed to cancel order.'); }
  }
  async function handleReceiveAll(po) {
    if (!window.confirm(`Receive everything remaining on ${po.poNumber}? This creates batches now.`)) return;
    try { await receivePurchaseAll(po.id, actor); showSuccess('Order received — batches created'); load(); setDetail(null); }
    catch (e) { showError(e?.response?.data?.error || e.message || 'Failed to receive order.'); }
  }

  return (
    <div className={`abk-purchase${dark ? ' abk-dark' : ''}`} style={{ background: 'var(--cream)', minHeight: '100vh', padding: '1.5rem' }}>
      <style>{PU_CSS}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: '1.25rem' }}>
        <div>
          <div className="abk-serif" style={{ fontSize: 28, fontWeight: 500, color: 'var(--ink)', letterSpacing: -0.5 }}>Purchases</div>
          <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 4, fontWeight: 300 }}>
            Order from a supplier, then receive it in to create batches.
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px',
          background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 11,
          fontSize: 13, fontWeight: 500, cursor: 'pointer', boxShadow: '0 2px 8px rgba(29,158,117,.3)',
        }}><Plus size={14} /> New Purchase Order</button>
      </div>

      {(successMsg || errorMsg) && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 10, marginBottom: 12,
          background: successMsg ? 'var(--green-bg)' : 'var(--red-bg)',
          color: successMsg ? 'var(--green)' : 'var(--red-text)', fontSize: 12.5,
        }}>
          <CheckCircle size={13} /> {successMsg || errorMsg}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <select value={status} onChange={e => { setPage(0); setStatus(e.target.value); }} className="abk-pu-input" style={{ maxWidth: 220 }}>
          <option value="">All statuses</option>
          <option value="ORDERED">Ordered</option>
          <option value="PARTIALLY_RECEIVED">Partially Received</option>
          <option value="RECEIVED">Received</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 'max-content', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--cream-deep)', borderBottom: '1px solid var(--border)' }}>
                {['PO #', 'Supplier', 'Branch', 'Items', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--ink-light)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem 0' }}>
                  <div style={{ width: 24, height: 24, border: '3px solid var(--border)', borderTopColor: 'var(--green)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                </td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem 0' }}>
                  <ShoppingBag size={34} style={{ color: 'var(--border)', margin: '0 auto 10px', display: 'block' }} />
                  <p style={{ color: 'var(--ink-faint)', fontSize: 13, fontWeight: 300 }}>No purchase orders yet</p>
                </td></tr>
              ) : rows.map(po => (
                <tr key={po.id} className="abk-row-hover" style={{ borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }} onClick={() => setDetail(po)}>
                  <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{po.poNumber}</td>
                  <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--ink-mid)' }}>{po.supplier?.name || '—'}</td>
                  <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--ink-mid)' }}>{po.branch?.name || '—'}</td>
                  <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--ink-mid)' }}>{po.items?.length || 0} line{po.items?.length === 1 ? '' : 's'}</td>
                  <td style={{ padding: '11px 14px' }}><StatusBadge status={po.status} /></td>
                  <td style={{ padding: '11px 14px' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {(po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED') && (
                        <IconBtn onClick={() => handleReceiveAll(po)} title="Receive everything remaining"><PackageCheck size={12} /></IconBtn>
                      )}
                      {po.status === 'ORDERED' && (
                        <IconBtn onClick={() => handleCancel(po)} title="Cancel" danger><Ban size={12} /></IconBtn>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderTop: '1px solid var(--border-light)', background: 'var(--cream-deep)' }}>
          <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{totalElements} order{totalElements === 1 ? '' : 's'}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconBtn onClick={() => setPage(p => Math.max(0, p - 1))} title="Previous"><ChevronLeft size={13} /></IconBtn>
            <span style={{ fontSize: 11.5, color: 'var(--ink-mid)' }}>{page + 1} / {Math.max(1, totalPages)}</span>
            <IconBtn onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} title="Next"><ChevronRight size={13} /></IconBtn>
          </div>
        </div>
      </div>

      {showCreate && (
        <CreateOrderModal
          products={products} branches={branches} suppliers={suppliers} actor={actor}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); showSuccess('Purchase order created'); load(); }}
          onError={showError}
        />
      )}

      {detail && (
        <DetailModal
          po={detail} actor={actor}
          onClose={() => setDetail(null)}
          onChanged={(updated) => { setDetail(updated); load(); }}
          onError={showError}
          onSuccess={showSuccess}
        />
      )}
    </div>
  );
}

// ── Create order modal — pick supplier, branch, and build line items ──────
function CreateOrderModal({ products, branches, suppliers, actor, onClose, onCreated, onError }) {
  const [supplierId, setSupplierId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState([{ productId: '', quantity: '', unitCost: '' }]);
  const [saving, setSaving] = useState(false);

  function updateLine(idx, field, value) {
    setLines(ls => ls.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  }
  function addLine() { setLines(ls => [...ls, { productId: '', quantity: '', unitCost: '' }]); }
  function removeLine(idx) { setLines(ls => ls.filter((_, i) => i !== idx)); }

  async function handleSubmit() {
    if (!supplierId) { onError('Select a supplier.'); return; }
    if (!branchId)   { onError('Select a destination branch.'); return; }
    const items = lines
      .filter(l => l.productId && l.quantity)
      .map(l => ({ productId: Number(l.productId), quantity: Number(l.quantity), unitCost: Number(l.unitCost || 0) }));
    if (items.length === 0) { onError('Add at least one line item.'); return; }

    setSaving(true);
    try {
      await createPurchase({ supplierId: Number(supplierId), branchId: Number(branchId), items, notes, orderedBy: actor });
      onCreated();
    } catch (e) {
      onError(e?.response?.data?.error || e.message || 'Failed to create purchase order.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--card)', borderRadius: 16, padding: 22, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="abk-serif" style={{ fontSize: 18, fontWeight: 500, color: 'var(--ink)' }}>New Purchase Order</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)' }}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-light)', display: 'block', marginBottom: 4 }}>Supplier *</label>
            <select className="abk-pu-input" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
              <option value="">Select a supplier</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-light)', display: 'block', marginBottom: 4 }}>Destination Branch *</label>
            <select className="abk-pu-input" value={branchId} onChange={e => setBranchId(e.target.value)}>
              <option value="">Select a branch</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.location?.name ? `${b.location.name} — ${b.name}` : b.name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 8, fontSize: 11, fontWeight: 600, color: 'var(--ink-light)' }}>Line Items *</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
          {lines.map((line, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <select className="abk-pu-input" style={{ flex: 3 }} value={line.productId} onChange={e => updateLine(idx, 'productId', e.target.value)}>
                <option value="">Product…</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input className="abk-pu-input" style={{ flex: 1 }} type="number" min="1" placeholder="Qty"
                value={line.quantity} onChange={e => updateLine(idx, 'quantity', e.target.value)} />
              <input className="abk-pu-input" style={{ flex: 1 }} type="number" min="0" step="0.01" placeholder="Cost/unit"
                value={line.unitCost} onChange={e => updateLine(idx, 'unitCost', e.target.value)} />
              <IconBtn onClick={() => removeLine(idx)} title="Remove line" danger><Trash2 size={12} /></IconBtn>
            </div>
          ))}
        </div>
        <button onClick={addLine} style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--green)',
          background: 'none', border: 'none', cursor: 'pointer', marginBottom: 14, padding: 0,
        }}><Plus size={13} /> Add another line</button>

        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-light)', display: 'block', marginBottom: 4 }}>Notes</label>
          <textarea className="abk-pu-input" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--cream-deep)', color: 'var(--ink-mid)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'var(--green)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? <RefreshCw size={13} className="abk-spin" /> : 'Create Order'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail modal — see line items, receive individually or all at once ────
function DetailModal({ po, actor, onClose, onChanged, onError, onSuccess }) {
  const [receiveQty, setReceiveQty] = useState({});

  async function handleReceiveLine(item) {
    const qty = Number(receiveQty[item.id] || 0);
    const remaining = item.quantityOrdered - item.quantityReceived;
    if (qty <= 0 || qty > remaining) { onError(`Enter a quantity between 1 and ${remaining}.`); return; }
    try {
      const updated = await receivePurchaseItem(po.id, { itemId: item.id, quantity: qty, receivedBy: actor });
      onSuccess('Batch created — stock updated');
      onChanged(updated);
    } catch (e) {
      onError(e?.response?.data?.error || e.message || 'Failed to receive line item.');
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--card)', borderRadius: 16, padding: 22, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div className="abk-serif" style={{ fontSize: 18, fontWeight: 500, color: 'var(--ink)' }}>{po.poNumber}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)' }}><X size={18} /></button>
        </div>
        <div style={{ marginBottom: 14 }}><StatusBadge status={po.status} /></div>

        <div style={{ fontSize: 12, color: 'var(--ink-mid)', marginBottom: 14 }}>
          <strong>{po.supplier?.name}</strong> → {po.branch?.name}
          {po.notes && <div style={{ marginTop: 4, color: 'var(--ink-faint)', fontStyle: 'italic' }}>{po.notes}</div>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(po.items || []).map(item => {
            const remaining = item.quantityOrdered - item.quantityReceived;
            const done = remaining <= 0;
            return (
              <div key={item.id} style={{ border: '1px solid var(--border-light)', borderRadius: 10, padding: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{item.product?.name}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>${item.unitCost}/unit</span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-mid)', marginBottom: done ? 0 : 8 }}>
                  {item.quantityReceived} / {item.quantityOrdered} received
                  {done && <span style={{ color: 'var(--green)', marginLeft: 6 }}>✓ complete</span>}
                </div>
                {!done && (po.status !== 'CANCELLED') && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="number" min="1" max={remaining} placeholder={`Up to ${remaining}`}
                      className="abk-pu-input" style={{ flex: 1 }}
                      value={receiveQty[item.id] || ''}
                      onChange={e => setReceiveQty(q => ({ ...q, [item.id]: e.target.value }))}
                    />
                    <button onClick={() => handleReceiveLine(item)} style={{
                      padding: '0 14px', borderRadius: 8, border: 'none', background: 'var(--green)',
                      color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    }}>Receive</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
