/**
 * Placeholder.jsx — stand-in for sidebar destinations that are wired into
 * navigation but don't have a full page implementation yet (Customers,
 * Returns, Categories, Suppliers, Purchases, Sales Reports, Inventory
 * Reports, Roles & Permissions, Settings, POS, Stock levels). Swap each of
 * these out for a real page as it's built — the sidebar and routing
 * already point at the right key.
 */
export default function Placeholder({ title, description, dark }) {
  return (
    <div style={{ padding: '32px 28px', maxWidth: 620 }}>
      <div style={{
        border: `1px dashed var(--abk-border)`,
        borderRadius: 16,
        padding: '32px 28px',
        background: 'var(--abk-card)',
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--abk-green)', marginBottom: 8,
        }}>
          Coming soon
        </div>
        <h2 style={{
          fontFamily: 'var(--abk-font-serif)', fontSize: 22, fontWeight: 500,
          color: 'var(--abk-ink)', marginBottom: 10,
        }}>{title}</h2>
        <p style={{ fontSize: 13.5, color: 'var(--abk-ink-light)', lineHeight: 1.6 }}>
          {description || 'This section is wired into navigation and ready for its page to be built.'}
        </p>
      </div>
    </div>
  );
}
