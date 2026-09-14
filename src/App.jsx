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
const Branches        = lazy(() => import('./pages/Branches'));
const Batches         = lazy(() => import('./pages/Batches'));
const Transfers       = lazy(() => import('./pages/Transfers'));
const Customers       = lazy(() => import('./pages/Customers'));
const Suppliers       = lazy(() => import('./pages/Suppliers'));
const Purchases       = lazy(() => import('./pages/Purchases'));
const PurchaseHistory = lazy(() => import('./pages/PurchaseHistory'));
const Placeholder     = lazy(() => import('./pages/Placeholder'));

const BACKEND = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://ousman-backend.onrender.com';

/**
 * Pages that a non-ADMIN role (WORKER, and the location-scoped
 * WAREHOUSE_MANAGER / STORE_MANAGER / STAFF) is allowed to navigate to.
 * Any other page key will be redirected to 'sales'.
 */
const WORKER_ALLOWED_PAGES = [
  'sales', 'products', 'loans', 'batches', 'transfers',
  // ── New sidebar sections, branch-scoped operational pages ─────────────
  'pos', 'customers', 'returns', 'categories', 'stock', 'suppliers', 'purchases', 'purchaseHistory',
];

// The three location-scoped roles get everything WORKER gets, plus their
// own branch's Dashboard and Stock History — unlike the legacy WORKER
// role, which never had access to either. Reports/Users/Settings/etc.
// stay ADMIN-only regardless.
const SCOPED_ROLES = ['WAREHOUSE_MANAGER', 'STORE_MANAGER', 'STAFF'];
const SCOPED_ALLOWED_PAGES = [...WORKER_ALLOWED_PAGES, 'dashboard', 'stockHistory'];

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

  // ── When user role changes, redirect workers to their allowed landing ──
  useEffect(() => {
    if (user) {
      const isWorker = user.role?.toUpperCase() === 'WORKER';
      if (isWorker) {
        // Workers always start on and are redirected back to 'sales'
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
    const role = user?.role?.toUpperCase();
    if (role === 'ADMIN') { setCurrent(pageKey); return; }
    const allowed = SCOPED_ROLES.includes(role) ? SCOPED_ALLOWED_PAGES : WORKER_ALLOWED_PAGES;
    if (!allowed.includes(pageKey)) {
      setCurrent('sales'); // silently redirect
      return;
    }
    setCurrent(pageKey);
  }

  // ── Login handler ─────────────────────────────────────────────────────
  function handleLogin(data) {
    const u = { id: data.id, name: data.name, email: data.email, role: data.role };
    setUser(u);
    localStorage.setItem('ousman_user', JSON.stringify(u));
    localStorage.setItem('ousman_token', data.token);

    // Redirect workers to sales immediately after login
    const isWorker = data.role?.toUpperCase() === 'WORKER';
    setCurrent(isWorker ? 'sales' : 'dashboard');
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

  const isWorker = user.role?.toUpperCase() === 'WORKER';
  const isAdmin  = user.role?.toUpperCase() === 'ADMIN';

  /**
   * Page map — pass user down to every page.
   * Pages use `user` prop to show/hide buttons and apply restrictions.
   *
   * Workers only see 'products' and 'sales'.
   * Admin sees everything.
   */
  const isScoped = SCOPED_ROLES.includes(user.role?.toUpperCase());

  const pages = {
    // ── Every operational role — branch-scoped operational pages ─────────
    products:  <Products  dark={dark} user={user} />,
    sales:     <Sales     dark={dark} user={user} />,
    loans:     <Loans     dark={dark} user={user} />,
    batches:   <Batches   dark={dark} user={user} />,
    transfers: <Transfers dark={dark} user={user} />,

    // ── New sidebar items awaiting a dedicated page — wired so nothing 404s ──
    pos:             <Placeholder dark={dark} title="Point of Sale" description="A dedicated fast-checkout POS screen goes here — for now, use Sales to record transactions." />,
    customers:       <Customers   dark={dark} user={user} />,
    returns:         <Placeholder dark={dark} title="Returns" description="Record and track product returns per branch, crediting the exact batch(es) the returned units came from." />,
    categories:      <Placeholder dark={dark} title="Categories" description="Manage the category list each branch's products are organized under." />,
    stock:           <Placeholder dark={dark} title="Stock" description="Live per-branch stock levels computed from batch quantity-remaining, with low-stock flags." />,
    suppliers:       <Suppliers   dark={dark} user={user} />,
    purchases:       <Purchases   dark={dark} user={user} />,
    purchaseHistory: <PurchaseHistory dark={dark} user={user} />,

    // ── ADMIN + the three location-scoped roles (own-branch view) ────────
    ...((isAdmin || isScoped) && {
      dashboard:    <Dashboard    dark={dark} user={user} />,
      stockHistory: <StockHistory dark={dark} user={user} />,
    }),

    // ── Admin only ──────────────────────────────────────────────────────
    ...(isAdmin && {
      finance:          <Finance      dark={dark} user={user} />,
      analytics:        <Analytics    dark={dark} user={user} />,
      users:            <UserAccess   dark={dark} user={user} />,
      payments:         <Payments     dark={dark} user={user} />,
      branches:         <Branches     dark={dark} user={user} />,
      salesReports:     <Placeholder dark={dark} title="Sales Reports" description="Company-wide and per-branch sales reporting with Store/Warehouse/Branch filters." />,
      inventoryReports: <Placeholder dark={dark} title="Inventory Reports" description="Stock valuation, aging, and movement reports across all branches." />,
      roles:            <Placeholder dark={dark} title="Roles & Permissions" description="Define what each role (Admin, Warehouse Manager, Store Manager, Staff) can see and do." />,
      settings:         <Placeholder dark={dark} title="Settings" description="Company profile, preferences, and system configuration." />,
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
