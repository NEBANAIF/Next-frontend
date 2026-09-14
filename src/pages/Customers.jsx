/**
 * ─────────────────────────────────────────────────────────────────────────
 *  Customers.jsx — Branch-scoped customer directory
 *
 *  Every customer belongs to exactly one branch. ADMIN sees everyone;
 *  scoped-role users only ever see their own branch's customers (enforced
 *  server-side — this page just calls the endpoints and shows what comes
 *  back). Not yet linked to Sale by a foreign key — Sale.customerName
 *  stays free text for now; this is a standalone directory.
 * ─────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect } from 'react';
import {
  Search, Plus, Trash2, Edit2, UserRound, ChevronLeft, ChevronRight,
  X, RefreshCw, CheckCircle, Phone, Mail, MapPin,
} from 'lucide-react';
import {
  getActiveBranches, getCustomersPage, createCustomer, updateCustomer, deleteCustomer,
} from '../services/api';

/* Reuses the same design tokens as Branches.jsx / Batches.jsx / Payments.jsx */
const CU_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  .abk-customer {
    --cream:#F0F7E2; --cream-deep:#E4F0CF; --ink:#0F1F04; --ink-mid:#3A5220;
    --ink-light:#6A8A4A; --ink-faint:#A8C080; --border:#D0E4B0; --border-light:#E2EFC8;
    --card:#FFFFFF; --card-hover:#F3FAE6; --green:#1D9E75; --green-bg:#E1F5EE;
    --blue:#185FA5; --blue-bg:#E6F1FB; --red-bg:#FCEBEB; --red-border:#F7C1C1; --red-text:#791F1F;
  }
  .abk-customer.abk-dark {
    --cream:#0D1117; --cream-deep:#131A22; --ink:#E6EDF3; --ink-mid:#C9D4DD;
    --ink-light:#8FA3B3; --ink-faint:#5A7A96; --border:#1F2B36; --border-light:#182028;
    --card:#131A22; --card-hover:#182028; --green:#3DD68C; --green-bg:rgba(61,214,140,.12);
    --blue:#58A6FF; --blue-bg:rgba(88,166,255,.12); --red-bg:rgba(239,83,80,.12);
    --red-border:rgba(239,83,80,.3); --red-text:#EF9A9A;
  }
  .abk-customer, .abk-customer * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
  .abk-customer .abk-serif { font-family: 'Playfair Display', Georgia, serif !important; }
  .abk-cu-input {
    width: 100%; padding: 9px 12px; border: 1px solid var(--border); border-radius: 10px;
    font-size: 13px; background: var(--card); color: var(--ink); outline: none;
  }
  .abk-cu-input:focus { border-color: var(--green); }
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

export default function Customers({ dark, user }) {
  const [rows, setRows] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', notes: '', branchId: '' });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isAdmin = (user?.role || '').toUpperCase() === 'ADMIN';

  useEffect(() => { getActiveBranches().then(setBranches).catch(() => setBranches([])); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await getCustomersPage({ page, size: rowsPerPage, search });
      setRows(res.content || []);
      setTotalPages(res.totalPages || 0);
      setTotalElements(res.totalElements || 0);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [page, rowsPerPage, search]);

  function showSuccess(msg) { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); }
  function showError(msg)   { setErrorMsg(msg);   setTimeout(() => setErrorMsg(''), 4000); }

  function openCreate() {
    setEditCustomer(null);
    setForm({ name: '', phone: '', email: '', address: '', notes: '', branchId: branches[0]?.id || '' });
    setShowModal(true);
  }
  function openEdit(c) {
    setEditCustomer(c);
    setForm({
      name: c.name || '', phone: c.phone || '', email: c.email || '',
      address: c.address || '', notes: c.notes || '', branchId: c.branch?.id || '',
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim())    { showError('Customer name is required.'); return; }
    if (!form.branchId)       { showError('A branch is required.'); return; }
    setSaving(true);
    const payload = {
      name: form.name.trim(), phone: form.phone, email: form.email,
      address: form.address, notes: form.notes, branch: { id: form.branchId },
    };
    try {
      if (editCustomer) await updateCustomer(editCustomer.id, payload);
      else               await createCustomer(payload);
      setShowModal(false);
      showSuccess(editCustomer ? 'Customer updated' : 'Customer added');
      load();
    } catch (e) {
      showError(e?.response?.data?.error || e.message || 'Failed to save customer.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c) {
    if (!window.confirm(`Delete customer "${c.name}"? This can't be undone.`)) return;
    try { await deleteCustomer(c.id); showSuccess('Customer deleted'); load(); }
    catch (e) { showError(e?.response?.data?.error || e.message || 'Failed to delete customer.'); }
  }

  return (
    <div className={`abk-customer${dark ? ' abk-dark' : ''}`} style={{ background: 'var(--cream)', minHeight: '100vh', padding: '1.5rem' }}>
      <style>{CU_CSS}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: '1.25rem' }}>
        <div>
          <div className="abk-serif" style={{ fontSize: 28, fontWeight: 500, color: 'var(--ink)', letterSpacing: -0.5 }}>
            Customers
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 4, fontWeight: 300 }}>
            {isAdmin ? 'Every branch\u2019s customer directory.' : 'Your branch\u2019s customer directory.'}
          </div>
        </div>
        <button onClick={openCreate} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px',
          background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 11,
          fontSize: 13, fontWeight: 500, cursor: 'pointer', boxShadow: '0 2px 8px rgba(29,158,117,.3)',
        }}><Plus size={14} /> Add Customer</button>
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

      <div style={{ position: 'relative', maxWidth: 320, marginBottom: 14 }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }} />
        <input
          value={search}
          onChange={e => { setPage(0); setSearch(e.target.value); }}
          placeholder="Search name, phone, email…"
          className="abk-cu-input"
          style={{ paddingLeft: 34 }}
        />
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 'max-content', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--cream-deep)', borderBottom: '1px solid var(--border)' }}>
                {['Name', 'Contact', 'Branch', 'Notes', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--ink-light)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3.5rem 0' }}>
                  <div style={{ width: 24, height: 24, border: '3px solid var(--border)', borderTopColor: 'var(--green)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                </td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3.5rem 0' }}>
                  <UserRound size={34} style={{ color: 'var(--border)', margin: '0 auto 10px', display: 'block' }} />
                  <p style={{ color: 'var(--ink-faint)', fontSize: 13, fontWeight: 300 }}>No customers yet</p>
                </td></tr>
              ) : rows.map(c => (
                <tr key={c.id} className="abk-row-hover" style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{c.name}</td>
                  <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--ink-mid)' }}>
                    {c.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Phone size={11} />{c.phone}</div>}
                    {c.email && <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}><Mail size={11} />{c.email}</div>}
                    {!c.phone && !c.email && '—'}
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--ink-mid)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><MapPin size={11} />{c.branch?.name || '—'}</span>
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: 11.5, color: 'var(--ink-faint)', fontWeight: 300, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.notes || '—'}
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <IconBtn onClick={() => openEdit(c)} title="Edit"><Edit2 size={12} /></IconBtn>
                      <IconBtn onClick={() => handleDelete(c)} title="Delete" danger><Trash2 size={12} /></IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderTop: '1px solid var(--border-light)', background: 'var(--cream-deep)' }}>
          <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{totalElements} customer{totalElements === 1 ? '' : 's'}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconBtn onClick={() => setPage(p => Math.max(0, p - 1))} title="Previous"><ChevronLeft size={13} /></IconBtn>
            <span style={{ fontSize: 11.5, color: 'var(--ink-mid)' }}>{page + 1} / {Math.max(1, totalPages)}</span>
            <IconBtn onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} title="Next"><ChevronRight size={13} /></IconBtn>
          </div>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}
          onClick={() => setShowModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--card)', borderRadius: 16, padding: 22, width: '100%', maxWidth: 420, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="abk-serif" style={{ fontSize: 18, fontWeight: 500, color: 'var(--ink)' }}>
                {editCustomer ? 'Edit Customer' : 'Add Customer'}
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)' }}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-light)', display: 'block', marginBottom: 4 }}>Name *</label>
                <input className="abk-cu-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-light)', display: 'block', marginBottom: 4 }}>Branch *</label>
                <select className="abk-cu-input" value={form.branchId} onChange={e => setForm(f => ({ ...f, branchId: e.target.value }))}>
                  <option value="">Select a branch</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.location?.name ? `${b.location.name} — ${b.name}` : b.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-light)', display: 'block', marginBottom: 4 }}>Phone</label>
                  <input className="abk-cu-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-light)', display: 'block', marginBottom: 4 }}>Email</label>
                  <input className="abk-cu-input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-light)', display: 'block', marginBottom: 4 }}>Address</label>
                <input className="abk-cu-input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-light)', display: 'block', marginBottom: 4 }}>Notes</label>
                <textarea className="abk-cu-input" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--cream-deep)', color: 'var(--ink-mid)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'var(--green)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? <RefreshCw size={13} className="abk-spin" /> : (editCustomer ? 'Save Changes' : 'Add Customer')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
