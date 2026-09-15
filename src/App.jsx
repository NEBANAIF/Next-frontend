/**
 * ─────────────────────────────────────────────────────────────────────────
 *  App.jsx — Root component with role-based page access
 *
 *  ROLES:
 *    ADMIN  → full access: dashboard, products, sales, finance, analytics,
 *             stock history, user management
 *    WORKER → restricted access: products (view only), sales (today only,
 *             no delete, can record new sale)
 *             All other pages redirect to "sales" automatically
 *
 *  The `user` object (from localStorage / login response) is passed to every
 *  page and sidebar so they can adapt their UI accordingly.
 * ─────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect, lazy, Suspense } from 'react';
import Login  from './pages/Login';
import Layout from './components/Layout';

/**
 * Route-based code splitting.
 *
 * WHY: all 9 pages used to be imported eagerly here, which meant every one
 * of them — including Analytics (which pulls in the whole chart.js library)
 * and every admin-only page — got bundled into a single ~793KB JS chunk
 * (228KB gzipped) that shipped on first load to EVERY user, including
 * WORKERs who by WORKER_ALLOWED_PAGES below can only ever reach
 * products/sales/loans. `React.lazy()` makes Vite split each page into its
 * own chunk, fetched only the first time that page is actually rendered —
 * so a Worker's initial bundle no longer includes Finance, Analytics,
 * StockHistory, or UserAccess at all.
 *
 * Login is kept as a static import since it's needed immediately on first
 * paint for anyone who isn't logged in yet — lazy-loading it would just add
 * a network round-trip before the login screen can even appear.
 */
const Dashboard    = lazy(() => import('./pages/Dashboard'));
const Products     = lazy(() => import('./pages/Products'));
const Sales        = lazy(() => import('./pages/Sales'));
const Finance      = lazy(() => import('./pages/Finance'));
const Analytics    = lazy(() => import('./pages/Analytics'));
const StockHistory = lazy(() => import('./pages/StockHistory'));
const UserAccess   = lazy(() => import('./pages/UserAccess'));
const Loans        = lazy(() => import('./pages/Loans'));
const Payments     = lazy(() => import('./pages/Payments'));
const Branches     = lazy(() => import('./pages/Branches'));
const Batches      = lazy(() => import('./pages/Batches'));
const Transfers    = lazy(() => import('./pages/Transfers'));
const Settings     = lazy(() => import('./pages/Settings'));
const Customers    = lazy(() => import('./pages/Customers'));
const Returns      = lazy(() => import('./pages/Returns'));
const Suppliers    = lazy(() => import('./pages/Suppliers'));
const PurchaseOrders = lazy(() => import('./pages/PurchaseOrders'));

const BACKEND = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://ousman-backend.onrender.com';

/**
 * Pages that a non-ADMIN role (WORKER, and the location-scoped
 * WAREHOUSE_MANAGER / STORE_MANAGER / STAFF) is allowed to navigate to.
 * Any other page key will be redirected to 'sales'.
 */
const WORKER_ALLOWED_PAGES = [
  'sales', 'pos', 'products', 'categories', 'stock', 'loans', 'customers', 'returns',
  'batches', 'transfers', 'suppliers', 'purchases', 'settings',
];

/** Simple placeholder for a nav destination whose dedicated page isn't built yet. */
function ComingSoon({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 18, fontWeight: 500, color: '#3A5220' }}>{label}</div>
      <div style={{ fontSize: 13, color: '#6A8A4A' }}>This page is coming soon.</div>
    </div>
  );
}

export default function App() {
  // ── Restore user from localStorage on first render ───────────────────
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('ousman_user');
      const token  = localStorage.getItem('ousman_token');
      return stored && token ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  // ── Default page depends on role ─────────────────────────────────────
  const [current, setCurrent] = useState('dashboard');

  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('ousman_theme') === 'dark'; } catch { return false; }
  });

  // ── Apply dark class to <html> ────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('ousman_theme', dark ? 'dark' : 'light'); } catch {}
  }, [dark]);

  // ── Keep-alive ping every 4 minutes to prevent Render cold starts ──────
  //
  // WHY no `mode: 'no-cors'`:
  //   `no-cors` silently swallows the response, so the browser never actually
  //   opens a real HTTP connection to the backend — Render never sees it and
  //   the service still goes to sleep. A plain fetch() sends a real request
  //   that Render counts as activity. We silence errors so a sleeping backend
  //   doesn't surface anything to the user.
  //
  // WHY 4 minutes (not 2):
  //   Render free tier sleeps after 15 minutes of inactivity. 4-minute pings
  //   keep it warm with plenty of margin and reduce unnecessary requests.
  //
  useEffect(() => {
    const ping = () => fetch(`${BACKEND}/actuator/health`).catch(() => {});
    ping(); // immediate ping on mount so backend is warm before first real request
    const id = setInterval(ping, 4 * 60_000);
    return () => clearInterval(id);
  }, []);

  // ── When user role changes, redirect non-admins to their allowed landing ──
  useEffect(() => {
    if (user) {
      const nonAdmin = user.role?.toUpperCase() !== 'ADMIN';
      if (nonAdmin) {
        // Branch users always start on and are redirected back to 'sales'
        setCurrent('sales');
      }
    }
  }, [user]);

  /**
   * Smart page setter — enforces WORKER restrictions.
   * If a WORKER tries to navigate to a forbidden page, silently redirect
   * them back to 'sales' instead.
   */
  function setCurrentGuarded(pageKey) {
    if (user?.role?.toUpperCase() !== 'ADMIN') {
      if (!WORKER_ALLOWED_PAGES.includes(pageKey)) {
        setCurrent('sales'); // silently redirect
        return;
      }
    }
    setCurrent(pageKey);
  }

  // ── Login handler ─────────────────────────────────────────────────────
  function handleLogin(data) {
    const u = { id: data.id, name: data.name, email: data.email, role: data.role, branch: data.branch };
    setUser(u);
    localStorage.setItem('ousman_user', JSON.stringify(u));
    localStorage.setItem('ousman_token', data.token);

    // Redirect non-admins to sales immediately after login
    const nonAdmin = data.role?.toUpperCase() !== 'ADMIN';
    setCurrent(nonAdmin ? 'sales' : 'dashboard');
  }

  // ── Logout handler ────────────────────────────────────────────────────
  function handleLogout() {
    localStorage.removeItem('ousman_token');
    localStorage.removeItem('ousman_user');
    setUser(null);
    setCurrent('dashboard');
    window.location.href = '/';
  }

  // ── Not logged in → show Login page ──────────────────────────────────
  if (!user) return <Login onLogin={handleLogin} />;

  const isWorker = user.role?.toUpperCase() !== 'ADMIN'; // any non-admin, operational role
  const isAdmin  = user.role?.toUpperCase() === 'ADMIN';

  /**
   * Page map — pass user down to every page.
   * Pages use `user` prop to show/hide buttons and apply restrictions.
   *
   * Workers only see 'products' and 'sales'.
   * Admin sees everything.
   */
  const pages = {
    // ── Every operational role ──────────────────────────────────────────
    products:  <Products  dark={dark} user={user} />,
    sales:     <Sales     dark={dark} user={user} />,
    // POS reuses the Sales flow for now — a dedicated checkout screen is a future addition
    pos:       <Sales     dark={dark} user={user} />,
    loans:     <Loans     dark={dark} user={user} />,
    batches:   <Batches   dark={dark} user={user} />,
    transfers: <Transfers dark={dark} user={user} />,
    // Current stock-per-product view — reuses Products until a dedicated Stock page exists
    stock:     <Products  dark={dark} user={user} />,
    // Category browsing already lives inside Products
    categories: <Products dark={dark} user={user} />,
    settings:  <Settings  dark={dark} onDarkToggle={() => setDark(d => !d)} user={user} />,
    customers: <Customers dark={dark} user={user} />,
    returns:   <Returns   dark={dark} user={user} />,
    suppliers: <Suppliers dark={dark} user={user} />,
    purchases: <PurchaseOrders dark={dark} user={user} />,

    // ── Admin only ──────────────────────────────────────────────────────
    ...(isAdmin && {
      dashboard:    <Dashboard    dark={dark} user={user} />,
      finance:      <Finance      dark={dark} user={user} />,
      analytics:    <Analytics    dark={dark} user={user} />,
      salesReports: <Analytics    dark={dark} user={user} />,
      inventoryReports: <Analytics dark={dark} user={user} />,
      stockhistory: <StockHistory dark={dark} user={user} />,
      users:        <UserAccess   dark={dark} user={user} />,
      roles:        <UserAccess   dark={dark} user={user} initialTab="roles" />,
      payments:     <Payments     dark={dark} user={user} />,
      branches:     <Branches     dark={dark} user={user} />,
    }),
  };

  return (
    <Layout
      current={current}
      setCurrent={setCurrentGuarded}   // ← guarded version prevents WORKER from accessing admin pages
      user={user}
      onLogout={handleLogout}
      dark={dark}
      onDarkToggle={() => setDark(d => !d)}
    >
      {/* Suspense fallback covers the brief moment a page's own chunk is
          being fetched — only happens once per page per session, since the
          browser caches the chunk after that. */}
      <Suspense fallback={<PageLoadingFallback dark={dark} />}>
        {/* Render page — fallback to Sales for workers, Dashboard for admins */}
        {pages[current] || (isWorker ? <Sales dark={dark} user={user} /> : <Dashboard dark={dark} user={user} />)}
      </Suspense>
    </Layout>
  );
}

function PageLoadingFallback({ dark }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', color: dark ? '#9CA3AF' : '#6B7280', fontSize: 13,
    }}>
      Loading…
    </div>
  );
}
