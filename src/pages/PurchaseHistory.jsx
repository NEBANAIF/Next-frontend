/**
 * PurchaseHistory.jsx — read-only log of every purchase order that has had
 * something received against it (PARTIALLY_RECEIVED or RECEIVED), newest
 * first. For editing / receiving in progress orders, see Purchases.jsx.
 */
import { useState, useEffect } from 'react';
import { ClipboardList, PackageCheck, PackagePlus } from 'lucide-react';
import { getPurchaseHistory } from '../services/api';

export default function PurchaseHistory({ dark }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPurchaseHistory().then(setRows).catch(() => setRows([])).finally(() => setLoading(false));
  }, []);

  const cream = dark ? '#0D1117' : '#F0F7E2';
  const card  = dark ? '#131A22' : '#FFFFFF';
  const ink   = dark ? '#E6EDF3' : '#0F1F04';
  const faint = dark ? '#5A7A96' : '#A8C080';
  const border = dark ? '#1F2B36' : '#D0E4B0';

  return (
    <div style={{ background: cream, minHeight: '100vh', padding: '1.5rem', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 500, color: ink, marginBottom: 4 }}>
        Purchase History
      </div>
      <div style={{ fontSize: 12, color: faint, marginBottom: '1.25rem', fontWeight: 300 }}>
        Every order that's had stock received against it, fully or partially.
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div style={{ width: 24, height: 24, border: `3px solid ${border}`, borderTopColor: '#1D9E75', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        </div>
      ) : rows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <ClipboardList size={34} style={{ color: border, margin: '0 auto 10px', display: 'block' }} />
          <p style={{ color: faint, fontSize: 13, fontWeight: 300 }}>Nothing received yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map(po => (
            <div key={po.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: ink }}>{po.poNumber} — {po.supplier?.name}</div>
                <div style={{ fontSize: 11.5, color: faint, marginTop: 2 }}>
                  {po.branch?.name} · {po.items?.length || 0} line{po.items?.length === 1 ? '' : 's'} · updated {po.updatedAt ? new Date(po.updatedAt).toLocaleDateString() : '—'}
                </div>
              </div>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                background: po.status === 'RECEIVED' ? (dark ? 'rgba(61,214,140,.12)' : '#E1F5EE') : (dark ? 'rgba(240,167,66,.12)' : '#FFF3D6'),
                color: po.status === 'RECEIVED' ? (dark ? '#3DD68C' : '#1D9E75') : (dark ? '#F0A742' : '#8A5A00'),
              }}>
                {po.status === 'RECEIVED' ? <PackageCheck size={11} /> : <PackagePlus size={11} />}
                {po.status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
