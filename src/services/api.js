/**
 * ─────────────────────────────────────────────────────────────────────────
 *  api.js — Central Axios service with JWT auth and role-aware endpoints
 *
 *  Key additions for role-based auth:
 *    - getSalesToday() → calls /api/sales/today (worker + admin)
 *    - getSales()      → calls /api/sales (admin only; 403 for workers)
 *
 *  The frontend decides which to call based on user.role stored in localStorage.
 * ─────────────────────────────────────────────────────────────────────────
 */
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://ousman-backend.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── Attach JWT + session-health management (request + response interceptors below) ──
//
// WHY the debounce:
//   The backend runs on Render free tier and cold-starts after ~15 min idle.
//   Right after login, several requests fire at once (Dashboard, Sales, etc.).
//   If the backend isn't fully up yet, those requests can return 401 before the
//   token is ever invalid — causing an immediate logout loop.
//
//   The debounce waits 4 s before actually wiping the session. If the backend
//   wakes up within that window the subsequent retries will succeed and the
//   timer gets cancelled. A genuinely expired / invalid token will still
//   produce a consistent 401 on every request, so the logout fires after 4 s.
//
let _logoutTimer = null;

function scheduleLogout() {
  if (_logoutTimer) return; // already scheduled
  _logoutTimer = setTimeout(() => {
    _logoutTimer = null;
    // Double-check: if token is still present it means no successful request
    // cancelled the timer → session really is invalid → log out.
    if (localStorage.getItem('ousman_token')) {
      localStorage.removeItem('ousman_token');
      localStorage.removeItem('ousman_user');
      if (!window.location.pathname.includes('login')) window.location.href = '/';
    }
  }, 4000);
}

function cancelLogout() {
  if (_logoutTimer) {
    clearTimeout(_logoutTimer);
    _logoutTimer = null;
  }
}

api.interceptors.request.use(config => {
  const token = localStorage.getItem('ousman_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    cancelLogout(); // a new request with a valid token means session is alive
  }
  return config;
});

api.interceptors.response.use(
  res => {
    cancelLogout(); // successful response → session is fine, cancel any pending logout
    return res;
  },
  err => {
    if (err.response?.status === 401) {
      scheduleLogout(); // debounced — won't fire immediately
    }
    // Extract the best error message from response body
    const data = err.response?.data;
    const msg = (data && typeof data === 'object' && data.error) ? data.error
      : typeof data === 'string' ? data
      : err.message || 'Error';
    return Promise.reject(new Error(typeof msg === 'string' ? msg : JSON.stringify(msg)));
  }
);

// ── AUTH ───────────────────────────────────────────────────────────────────
export const login  = (email, password) =>
  api.post('/auth/login', { email, password }).then(r => r.data);
export const getMe  = () => api.get('/auth/me').then(r => r.data);

// ── USERS (ADMIN only — returns 403 for WORKER) ───────────────────────────
export const getUsers    = ()         => api.get('/users').then(r => r.data);
export const createUser  = (data)     => api.post('/users', data).then(r => r.data);
export const updateUser  = (id, data) => api.put(`/users/${id}`, data).then(r => r.data);
export const deleteUser  = (id)       => api.delete(`/users/${id}`).then(r => r.data);

// ── PRODUCTS ───────────────────────────────────────────────────────────────
// GET endpoints are allowed for both ADMIN and WORKER
// POST/PUT/DELETE endpoints return 403 for WORKER
export const getProducts    = ()           => api.get('/products').then(r => r.data);
export const getProductById = (id)         => api.get(`/products/${id}`).then(r => r.data);
export const searchProducts = (keyword)    => api.get(`/products/search?keyword=${encodeURIComponent(keyword)}`).then(r => r.data);
export const getLowStock    = ()           => api.get('/products/low-stock').then(r => r.data);
export const getOutOfStock  = ()           => api.get('/products/out-of-stock').then(r => r.data);
export const createProduct  = (data)       => api.post('/products', data).then(r => r.data);
export const updateProduct  = (id, data)   => api.put(`/products/${id}`, data).then(r => r.data);
export const deleteProduct  = (id)         => api.delete(`/products/${id}`).then(r => r.data);
export const adjustStock    = (id, qty, reason = 'Stock adjustment', user = 'Admin') =>
  api.post(`/products/${id}/adjust-stock`, null, { params: { quantity: qty, reason, user } }).then(r => r.data);
export const addStock = adjustStock;

// ── SALES ──────────────────────────────────────────────────────────────────
// getSales()      → ADMIN only (all historical sales)
// getSalesToday() → ADMIN + WORKER (today's sales only)
// recordSale()    → ADMIN + WORKER (create new sale)
// deleteSale()    → ADMIN only (returns 403 for WORKER)
export const getSales      = ()     => api.get('/sales').then(r => r.data);

// Paginated + searchable sales list — powers the Sales page table.
// Only fetches one page of rows at a time instead of the whole sales
// history, so it stays fast regardless of how large the table gets.
// Returns Spring's Page shape: { content, totalElements, totalPages, number, size, ... }
export const getSalesPage = ({ page = 0, size = 20, search = '', date = '' } = {}) => {
  const params = { page, size };
  if (search) params.search = search;
  if (date) params.date = date;
  return api.get('/sales/page', { params }).then(r => r.data);
};

export const getSalesToday = ()     => api.get('/sales/today').then(r => r.data);
export const getSaleById   = (id)   => api.get(`/sales/${id}`).then(r => r.data);
export const recordSale    = (data) => api.post('/sales', data).then(r => r.data);
// extra is optional: { paymentMethod, bankId, transactionRef, notes } — when
// supplied, the newly-collected portion of a loan repayment is logged as a
// linked Payment record.
export const updateSalePayment = (id, paidAmount, extra = {}) =>
  api.put(`/sales/${id}/payment`, { paidAmount, ...extra }).then(r => r.data);
export const deleteSale    = (id)   => api.delete(`/sales/${id}`).then(r => r.data);

// ── BANKS ──────────────────────────────────────────────────────────────────
// GET endpoints: ADMIN + WORKER (workers need the list to pick a bank on the
// Sales form). POST/PUT/DELETE: ADMIN only (403 for WORKER).
export const getBanks       = (search = '') => api.get('/banks', { params: search ? { search } : {} }).then(r => r.data);
export const getActiveBanks = ()            => api.get('/banks/active').then(r => r.data);
export const getBankById    = (id)          => api.get(`/banks/${id}`).then(r => r.data);
export const createBank     = (data)        => api.post('/banks', data).then(r => r.data);
export const updateBank     = (id, data)    => api.put(`/banks/${id}`, data).then(r => r.data);
export const deleteBank     = (id)          => api.delete(`/banks/${id}`).then(r => r.data);

// Paginated + searchable bank list — powers the Banks tab on the Payments page.
export const getBanksPage = ({ page = 0, size = 20, search = '' } = {}) => {
  const params = { page, size };
  if (search) params.search = search;
  return api.get('/banks/page', { params }).then(r => r.data);
};

// ── LOCATIONS ────────────────────────────────────────────────────────────
// A Location is a Store or a Warehouse. Creating one auto-creates its
// "Main" branch on the backend — see createLocation.
// GET: all authenticated roles. POST/PUT/DELETE: ADMIN only.
export const getLocations       = (search = '') => api.get('/locations', { params: search ? { search } : {} }).then(r => r.data);
export const getActiveLocations = (type = '')   => api.get('/locations/active', { params: type ? { type } : {} }).then(r => r.data);
export const getLocationById    = (id)          => api.get(`/locations/${id}`).then(r => r.data);
export const createLocation     = (data)        => api.post('/locations', data).then(r => r.data);
export const updateLocation     = (id, data)    => api.put(`/locations/${id}`, data).then(r => r.data);
export const deleteLocation     = (id)          => api.delete(`/locations/${id}`).then(r => r.data);

export const getLocationsPage = ({ page = 0, size = 20, search = '' } = {}) => {
  const params = { page, size };
  if (search) params.search = search;
  return api.get('/locations/page', { params }).then(r => r.data);
};

// ── BRANCHES ─────────────────────────────────────────────────────────────
// Every branch belongs to exactly one Location. Stock always lives on a
// branch — never on the Location itself. `getActiveBranches` is already
// scoped server-side: WAREHOUSE_MANAGER / STORE_MANAGER / STAFF only see
// branches assigned to them; ADMIN and (legacy) WORKER see every branch.
// GET: all authenticated roles. POST/PUT/DELETE: ADMIN only.
export const getBranches         = (locationId, search = '') => api.get('/branches', { params: { ...(locationId ? { locationId } : {}), ...(search ? { search } : {}) } }).then(r => r.data);
export const getActiveBranches   = ()             => api.get('/branches/active').then(r => r.data);
export const getBranchesByLocation = (locationId) => api.get(`/branches/by-location/${locationId}`).then(r => r.data);
export const getBranchById       = (id)           => api.get(`/branches/${id}`).then(r => r.data);
export const createBranch        = (data)         => api.post('/branches', data).then(r => r.data);
export const updateBranch        = (id, data)     => api.put(`/branches/${id}`, data).then(r => r.data);
export const deleteBranch        = (id)           => api.delete(`/branches/${id}`).then(r => r.data);

export const getBranchesPage = ({ page = 0, size = 20, locationId, search = '' } = {}) => {
  const params = { page, size };
  if (locationId) params.locationId = locationId;
  if (search) params.search = search;
  return api.get('/branches/page', { params }).then(r => r.data);
};

// ── CUSTOMERS ────────────────────────────────────────────────────────────
// Branch-scoped customer directory. ADMIN sees everyone (optionally
// filtered to one branch via branchId); scoped roles only ever see their
// own branch's customers regardless of what's passed here.
export const getCustomers       = (branchId) => api.get('/customers', { params: branchId ? { branchId } : {} }).then(r => r.data);
export const getCustomersPage   = ({ page = 0, size = 20, search = '' } = {}) =>
  api.get('/customers/page', { params: { page, size, ...(search ? { search } : {}) } }).then(r => r.data);
export const getCustomerById    = (id)       => api.get(`/customers/${id}`).then(r => r.data);
export const createCustomer     = (data)     => api.post('/customers', data).then(r => r.data);
export const updateCustomer     = (id, data) => api.put(`/customers/${id}`, data).then(r => r.data);
export const deleteCustomer     = (id)       => api.delete(`/customers/${id}`).then(r => r.data);

// ── SUPPLIERS ────────────────────────────────────────────────────────────
// Global directory (like the product catalog) — not branch-scoped.
export const getSuppliers       = ()         => api.get('/suppliers').then(r => r.data);
export const getActiveSuppliers = ()         => api.get('/suppliers/active').then(r => r.data);
export const getSuppliersPage   = ({ page = 0, size = 20, search = '' } = {}) =>
  api.get('/suppliers/page', { params: { page, size, ...(search ? { search } : {}) } }).then(r => r.data);
export const getSupplierById    = (id)       => api.get(`/suppliers/${id}`).then(r => r.data);
export const createSupplier     = (data)     => api.post('/suppliers', data).then(r => r.data);
export const updateSupplier     = (id, data) => api.put(`/suppliers/${id}`, data).then(r => r.data);
export const deleteSupplier     = (id)       => api.delete(`/suppliers/${id}`).then(r => r.data);

// ── PURCHASES (Purchase Orders) ────────────────────────────────────────────
// Always targets one destination branch. Receiving a line item (fully or
// partially) creates a real ProductBatch via the same path a manual batch
// receipt uses — see PurchaseService.receiveItem/receiveAll on the backend.
export const getPurchasesPage = ({ page = 0, size = 20, status = '' } = {}) =>
  api.get('/purchases', { params: { page, size, ...(status ? { status } : {}) } }).then(r => r.data);
export const getPurchaseHistory   = ()             => api.get('/purchases/history').then(r => r.data);
export const getPurchaseById      = (id)           => api.get(`/purchases/${id}`).then(r => r.data);
export const createPurchase       = (data)         => api.post('/purchases', data).then(r => r.data);
export const receivePurchaseItem  = (id, data)     => api.post(`/purchases/${id}/receive-item`, data).then(r => r.data);
export const receivePurchaseAll   = (id, actor)    => api.post(`/purchases/${id}/receive-all`, { actor }).then(r => r.data);
export const cancelPurchase       = (id, actor)    => api.post(`/purchases/${id}/cancel`, { actor }).then(r => r.data);


// ── PRODUCT BATCHES ──────────────────────────────────────────────────────
// A batch is a received lot of a product at a specific branch, at its own
// cost. Sales and transfers draw down batches automatically (FIFO) or from
// one manually chosen batch — see recordSale's / requestTransfer's `batchId`.
export const getAvailableBatches = (productId, branchId) =>
  api.get('/batches', { params: { productId, branchId } }).then(r => r.data);
export const getAllBatchesFor = (productId, branchId) =>
  api.get('/batches/all', { params: { productId, branchId } }).then(r => r.data);
export const getBranchStock = (productId, branchId) =>
  api.get('/batches/branch-stock', { params: { productId, branchId } }).then(r => r.data);
export const getBatchById = (id) => api.get(`/batches/${id}`).then(r => r.data);
export const receiveBatch  = (data) => api.post('/batches', data).then(r => r.data);
export const updateBatch   = (id, data) => api.put(`/batches/${id}`, data).then(r => r.data);
export const deleteBatch   = (id) => api.delete(`/batches/${id}`).then(r => r.data);

export const getBatchesPage = ({ page = 0, size = 20, search = '', productId, branchId } = {}) => {
  const params = { page, size };
  if (search) params.search = search;
  if (productId) params.productId = productId;
  if (branchId) params.branchId = branchId;
  return api.get('/batches/page', { params }).then(r => r.data);
};

// ── STOCK TRANSFERS ──────────────────────────────────────────────────────
// Request → Approve → Complete. Any operational role can request a
// transfer between branches they can see. Approving/rejecting requires
// access to the SOURCE branch (releasing stock); completing requires
// access to the DESTINATION branch (confirming receipt). ADMIN can do all
// of the above regardless of branch.
export const getPendingTransfers = () => api.get('/transfers/pending').then(r => r.data);
export const searchTransfers = (status = '', branchId) =>
  api.get('/transfers', { params: { ...(status ? { status } : {}), ...(branchId ? { branchId } : {}) } }).then(r => r.data);
export const getTransferById = (id) => api.get(`/transfers/${id}`).then(r => r.data);
export const requestTransfer = (data) => api.post('/transfers', data).then(r => r.data);
export const approveTransfer = (id, actor) => api.post(`/transfers/${id}/approve`, { actor }).then(r => r.data);
export const rejectTransfer  = (id, actor, reason) => api.post(`/transfers/${id}/reject`, { actor, reason }).then(r => r.data);
export const cancelTransfer  = (id, actor, reason) => api.post(`/transfers/${id}/cancel`, { actor, reason }).then(r => r.data);
export const markTransferInTransit = (id, actor) => api.post(`/transfers/${id}/in-transit`, { actor }).then(r => r.data);
export const completeTransfer = (id, actor) => api.post(`/transfers/${id}/complete`, { actor }).then(r => r.data);

export const getTransfersPage = ({ page = 0, size = 20, status = '', branchId } = {}) => {
  const params = { page, size };
  if (status) params.status = status;
  if (branchId) params.branchId = branchId;
  return api.get('/transfers/page', { params }).then(r => r.data);
};

// ── USER BRANCH ACCESS ───────────────────────────────────────────────────
// Which branches a WAREHOUSE_MANAGER / STORE_MANAGER / STAFF user can see
// and act on. Meaningless for ADMIN/WORKER, who stay unscoped. ADMIN only.
export const getUserBranchAccess = (userId) => api.get(`/users/${userId}/branches`).then(r => r.data);
export const assignUserBranch    = (userId, branchId) => api.post(`/users/${userId}/branches/${branchId}`).then(r => r.data);
export const unassignUserBranch  = (userId, branchId) => api.delete(`/users/${userId}/branches/${branchId}`).then(r => r.data);


// ── PAYMENTS ───────────────────────────────────────────────────────────────
// Payments are never created directly — they're generated automatically by
// the backend when a sale is recorded or a loan repayment is posted.
// GET: ADMIN + WORKER. PUT (edit notes/ref) & DELETE: ADMIN only.
//
// Returns Spring's Page shape: { content, totalElements, totalPages, ... }
export const getPaymentsPage = ({
  page = 0, size = 20, search = '', method = '', bankId = '',
  from = '', to = '', sortBy = 'date', sortDir = 'desc',
} = {}) => {
  const params = { page, size, sortBy, sortDir };
  if (search) params.search = search;
  if (method) params.method = method;
  if (bankId) params.bankId = bankId;
  if (from)   params.from   = from;
  if (to)     params.to     = to;
  return api.get('/payments/page', { params }).then(r => r.data);
};
export const getPaymentByCode = (code)              => api.get(`/payments/${code}`).then(r => r.data);
export const updatePaymentNotes = (code, data)      => api.put(`/payments/${code}`, data).then(r => r.data);
export const deletePayment      = (code)            => api.delete(`/payments/${code}`).then(r => r.data);

// ── ANALYTICS (ADMIN only — returns 403 for WORKER) ───────────────────────
export const getAnalyticsDashboard = (params) =>
  api.get('/analytics/dashboard', { params }).then(r => r.data);

// ── EXPENSES / FINANCE (ADMIN only — returns 403 for WORKER) ──────────────
export const getExpenses   = ()         => api.get('/expenses').then(r => r.data);
export const createExpense = (data)     => api.post('/expenses', data).then(r => r.data);
export const updateExpense = (id, data) => api.put(`/expenses/${id}`, data).then(r => r.data);
export const deleteExpense = (id)       => api.delete(`/expenses/${id}`).then(r => r.data);

// ── STOCK HISTORY (ADMIN only — returns 403 for WORKER) ───────────────────
export const getStockHistory          = ()   => api.get('/stock-history').then(r => r.data);
export const getStockHistoryByProduct = (id) => api.get(`/stock-history/product/${id}`).then(r => r.data);
export const deleteStockHistory       = (id) => api.delete(`/stock-history/${id}`).then(r => r.data);

export const stockHistoryAPI = {
  getAll:  getStockHistory,
  delete:  deleteStockHistory,
};

export default api;
