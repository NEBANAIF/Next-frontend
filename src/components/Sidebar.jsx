/**
 * ─────────────────────────────────────────────────────────────────────────
 *  Sidebar.jsx — Premium multi-branch navigation sidebar
 *
 *  Structure (per the multi-branch redesign):
 *    Main:           Dashboard, Branches
 *    Sales:          POS, Sales, Customers, Loans, Returns
 *    Inventory:      Products, Categories, Batches, Stock, Transfers, Stock History
 *    Purchasing:     Suppliers, Purchases
 *    Reports:        Sales Reports, Inventory Reports
 *    Administration: Users, Roles & Permissions, Settings
 *
 *  ADMIN sees every section and every branch (plus an "All Branches" option
 *  in the branch selector). Branch-scoped roles (WAREHOUSE_MANAGER,
 *  STORE_MANAGER, STAFF) and the legacy WORKER role only see operational
 *  sections (Sales, Inventory, Purchasing) — Reports and Administration are
 *  hidden outright, and the branch selector only lists branches they've
 *  been explicitly granted access to.
 *
 *  Sections are individually collapsible (state persisted to localStorage)
 *  so the sidebar stays scannable even with ~20 nav items.
 * ─────────────────────────────────────────────────────────────────────────
 */
import { useEffect, useMemo, useState, useRef } from 'react';
import {
  LayoutDashboard, Building2, ShoppingCart, Receipt, UserRound, Landmark,
  RotateCcw, Package, Tags, Layers, Boxes, ArrowLeftRight, History, Truck,
  ShoppingBag, ClipboardList, BarChart3, PieChart, Users, ShieldCheck, Settings,
  ChevronDown, ChevronRight, LogOut, Moon, Sun, Languages, MapPin,
  ChevronsUpDown, Check, Warehouse, Store,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getActiveBranches } from '../services/api';

/**
 * Full navigation structure, grouped into sections.
 * `adminOnly` → hidden from every non-ADMIN role.
 */
const SECTIONS = [
  {
    key: 'main', i18n: 'navGroup.main',
    items: [
      { key: 'dashboard', i18n: 'nav.dashboard', icon: LayoutDashboard, adminOnly: false },
      { key: 'branches',  i18n: 'nav.branches',  icon: Building2,       adminOnly: true  },
    ],
  },
  {
    key: 'sales', i18n: 'navGroup.sales',
    items: [
      { key: 'pos',       i18n: 'nav.pos',       icon: ShoppingCart, adminOnly: false },
      { key: 'sales',     i18n: 'nav.sales',     icon: Receipt,      adminOnly: false },
      { key: 'customers', i18n: 'nav.customers', icon: UserRound,    adminOnly: false },
      { key: 'loans',     i18n: 'nav.loans',     icon: Landmark,     adminOnly: false },
      { key: 'returns',   i18n: 'nav.returns',   icon: RotateCcw,    adminOnly: false },
    ],
  },
  {
    key: 'inventory', i18n: 'navGroup.inventory',
    items: [
      { key: 'products',     i18n: 'nav.products',     icon: Package,        adminOnly: false },
      { key: 'categories',   i18n: 'nav.categories',   icon: Tags,           adminOnly: false },
      { key: 'batches',      i18n: 'nav.batches',      icon: Layers,         adminOnly: false },
      { key: 'stock',        i18n: 'nav.stockLevels',  icon: Boxes,          adminOnly: false },
      { key: 'transfers',    i18n: 'nav.transfers',    icon: ArrowLeftRight, adminOnly: false },
      { key: 'stockHistory', i18n: 'nav.stockHistory', icon: History,        adminOnly: false },
    ],
  },
  {
    key: 'purchasing', i18n: 'navGroup.purchasing',
    items: [
      { key: 'suppliers',       i18n: 'nav.suppliers',       icon: Truck,          adminOnly: false },
      { key: 'purchases',       i18n: 'nav.purchases',       icon: ShoppingBag,    adminOnly: false },
      { key: 'purchaseHistory', i18n: 'nav.purchaseHistory', icon: ClipboardList,  adminOnly: false },
    ],
  },
  {
    key: 'reports', i18n: 'navGroup.reports',
    items: [
      { key: 'salesReports',     i18n: 'nav.salesReports',     icon: BarChart3, adminOnly: true },
      { key: 'inventoryReports', i18n: 'nav.inventoryReports', icon: PieChart,  adminOnly: true },
    ],
  },
  {
    key: 'administration', i18n: 'navGroup.administration',
    items: [
      { key: 'users',    i18n: 'nav.users',    icon: Users,       adminOnly: true },
      { key: 'roles',    i18n: 'nav.roles',    icon: ShieldCheck, adminOnly: true },
      { key: 'settings', i18n: 'nav.settings', icon: Settings,    adminOnly: true },
    ],
  },
];

const COLLAPSE_KEY = 'ousman_sidebar_collapsed_sections';
const ACTIVE_BRANCH_KEY = 'ousman_active_branch_id';

export default function Sidebar({ current, setCurrent, user, onLogout, dark, onDarkToggle, open }) {
  const { t, i18n } = useTranslation();

  const roleKey  = user?.role?.toUpperCase() || 'WORKER';
  const isAdmin  = roleKey === 'ADMIN';
  const headerBg = dark ? '#090D14' : '#0F1F04';

  // ── Collapsible sections, persisted ──────────────────────────────────
  const [collapsed, setCollapsed] = useState(() => {
    try { return JSON.parse(localStorage.getItem(COLLAPSE_KEY)) || {}; } catch { return {}; }
  });
  function toggleSection(key) {
    setCollapsed(prev => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem(COLLAPSE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  // ── Branch / location selector ───────────────────────────────────────
  const [branches, setBranches] = useState([]);
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const [activeBranchId, setActiveBranchId] = useState(() => {
    try { return localStorage.getItem(ACTIVE_BRANCH_KEY) || 'all'; } catch { return 'all'; }
  });
  const branchMenuRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getActiveBranches()
      .then(list => { if (!cancelled) setBranches(Array.isArray(list) ? list : []); })
      .catch(() => { if (!cancelled) setBranches([]); });
    return () => { cancelled = true; };
  }, []);

  // Close branch dropdown on outside click
  useEffect(() => {
    function onDocClick(e) {
      if (branchMenuRef.current && !branchMenuRef.current.contains(e.target)) {
        setBranchMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function selectBranch(id) {
    setActiveBranchId(id);
    setBranchMenuOpen(false);
    try { localStorage.setItem(ACTIVE_BRANCH_KEY, id); } catch {}
    // Broadcast so pages listening for branch changes can refetch.
    window.dispatchEvent(new CustomEvent('ousman:branch-changed', { detail: { branchId: id } }));
  }

  const activeBranch = useMemo(
    () => branches.find(b => String(b.id) === String(activeBranchId)),
    [branches, activeBranchId]
  );

  function toggleLang() {
    const next = i18n.language === 'am' ? 'en' : 'am';
    void i18n.changeLanguage(next);
    try { localStorage.setItem('ousman_lang', next); } catch {}
  }

  // ── Visible sections/items for this role ─────────────────────────────
  const visibleSections = useMemo(() => {
    return SECTIONS
      .map(section => ({
        ...section,
        items: section.items.filter(item => isAdmin || !item.adminOnly),
      }))
      .filter(section => section.items.length > 0);
  }, [isAdmin]);

  // ── User profile menu ─────────────────────────────────────────────────
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  useEffect(() => {
    function onDocClick(e) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <aside className={`abk-sidebar abk-sidebar-v2${dark ? ' abk-dark' : ''}${open ? ' open' : ''}`}>

      {/* ── Brand header ── */}
      <div style={{
        padding: '22px 18px 16px',
        borderBottom: '1px solid var(--abk-border)',
        position: 'relative', zIndex: 1,
        background: headerBg,
        transition: 'background .3s',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 11, flexShrink: 0,
            background: dark ? 'rgba(88,166,255,.12)' : 'rgba(255,255,255,.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: dark ? '1px solid rgba(61,214,140,.25)' : '1px solid rgba(255,255,255,.12)',
          }}>
            <span style={{
              fontFamily: "'Playfair Display', serif",
              color: dark ? '#58A6FF' : '#F0F7E2',
              fontWeight: 600, fontSize: 19, fontStyle: 'italic',
            }}>N</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 17, fontWeight: 500,
              color: dark ? '#E6EDF3' : '#F0F7E2',
              letterSpacing: -0.3, lineHeight: 1.2,
            }}>Ousman ERP</div>
            <div style={{
              fontSize: 10.5, fontWeight: 300, marginTop: 2,
              color: dark ? '#5A7A96' : '#A8C080',
            }}>
              {i18n.language === 'am' ? 'የብዙ-ቅርንጫፍ ሥርዓት' : 'Multi-branch operations'}
            </div>
          </div>

          <button
            onClick={onDarkToggle}
            style={{
              width: 30, height: 30, borderRadius: 8, border: 'none',
              background: dark ? 'rgba(88,166,255,.12)' : 'rgba(255,255,255,.08)',
              color: dark ? '#58A6FF' : '#A8C080',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
              transition: 'background .2s',
            }}
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>

        {/* ── Branch / Location selector ── */}
        <div ref={branchMenuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setBranchMenuOpen(o => !o)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 9,
              padding: '9px 11px', borderRadius: 10,
              background: dark ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.09)',
              border: dark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(255,255,255,.14)',
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div style={{
              width: 26, height: 26, borderRadius: 7, flexShrink: 0,
              background: dark ? 'rgba(61,214,140,.15)' : 'rgba(255,255,255,.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {activeBranch?.location?.type === 'WAREHOUSE'
                ? <Warehouse size={13} color={dark ? '#3DD68C' : '#F0F7E2'} />
                : activeBranchId === 'all'
                  ? <MapPin size={13} color={dark ? '#3DD68C' : '#F0F7E2'} />
                  : <Store size={13} color={dark ? '#3DD68C' : '#F0F7E2'} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: dark ? '#5A7A96' : '#A8C080',
              }}>
                {isAdmin ? (i18n.language === 'am' ? 'ቅርንጫፍ' : 'Branch') : (i18n.language === 'am' ? 'የእርስዎ ቅርንጫፍ' : 'Your branch')}
              </div>
              <div style={{
                fontSize: 12.5, fontWeight: 500, color: dark ? '#E6EDF3' : '#F0F7E2',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {activeBranchId === 'all'
                  ? (i18n.language === 'am' ? 'ሁሉም ቅርንጫፎች' : 'All Branches')
                  : (activeBranch?.name || (i18n.language === 'am' ? 'ቅርንጫፍ ይምረጡ' : 'Select branch'))}
              </div>
            </div>
            <ChevronsUpDown size={13} color={dark ? '#5A7A96' : '#A8C080'} style={{ flexShrink: 0 }} />
          </button>

          {branchMenuOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 20,
              background: dark ? '#111826' : '#FFFFFF',
              border: '1px solid var(--abk-border)',
              borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,.22)',
              padding: 6, maxHeight: 280, overflowY: 'auto',
            }}>
              {isAdmin && (
                <button
                  onClick={() => selectBranch('all')}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: activeBranchId === 'all' ? 'var(--abk-nav-hover-bg)' : 'transparent',
                    color: 'var(--abk-ink)', fontSize: 12.5, textAlign: 'left',
                  }}
                >
                  <MapPin size={13} />
                  <span style={{ flex: 1 }}>{i18n.language === 'am' ? 'ሁሉም ቅርንጫፎች' : 'All Branches'}</span>
                  {activeBranchId === 'all' && <Check size={13} />}
                </button>
              )}
              {branches.map(b => (
                <button
                  key={b.id}
                  onClick={() => selectBranch(b.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: String(activeBranchId) === String(b.id) ? 'var(--abk-nav-hover-bg)' : 'transparent',
                    color: 'var(--abk-ink)', fontSize: 12.5, textAlign: 'left',
                  }}
                >
                  {b.location?.type === 'WAREHOUSE' ? <Warehouse size={13} /> : <Store size={13} />}
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.name}{b.location?.name ? ` · ${b.location.name}` : ''}
                  </span>
                  {String(activeBranchId) === String(b.id) && <Check size={13} />}
                </button>
              ))}
              {branches.length === 0 && (
                <div style={{ padding: '10px', fontSize: 11.5, color: 'var(--abk-ink-faint)' }}>
                  {i18n.language === 'am' ? 'ምንም ቅርንጫፍ አልተገኘም' : 'No branches assigned yet'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav style={{
        flex: 1, padding: '14px 12px', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 4,
        position: 'relative', zIndex: 1,
      }}>
        {visibleSections.map((section, sIdx) => {
          const isCollapsed = !!collapsed[section.key];
          return (
            <div key={section.key} style={{ marginBottom: 6 }}>
              <button
                onClick={() => toggleSection(section.key)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 10px 6px', background: 'transparent', border: 'none', cursor: 'pointer',
                }}
              >
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.13em',
                  textTransform: 'uppercase', color: 'var(--abk-ink-faint)',
                }}>
                  {t(section.i18n)}
                </span>
                {isCollapsed
                  ? <ChevronRight size={13} style={{ color: 'var(--abk-ink-faint)' }} />
                  : <ChevronDown size={13} style={{ color: 'var(--abk-ink-faint)' }} />}
              </button>

              {!isCollapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {section.items.map(({ key, i18n: ns, icon: Icon }, idx) => {
                    const active = current === key;
                    return (
                      <button
                        key={key}
                        className={`abk-nav-btn abk-nav-btn-v2 abk-anim-slide-in${active ? ' active' : ''}`}
                        style={{ animationDelay: `${0.04 + (sIdx * 3 + idx) * 0.03}s` }}
                        onClick={() => setCurrent(key)}
                      >
                        <div style={{
                          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: active
                            ? (dark ? 'rgba(61,214,140,.14)' : 'rgba(29,158,117,.12)')
                            : 'transparent',
                          transition: 'background .2s',
                        }}>
                          <Icon size={16} color={active ? (dark ? '#3DD68C' : '#1D9E75') : 'var(--abk-nav-idle-fg)'} />
                        </div>
                        <span style={{ flex: 1 }}>{t(ns)}</span>
                        {active && <ChevronRight size={13} style={{ opacity: .5, color: 'var(--abk-nav-active-fg)' }} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Footer: language, user profile, logout ── */}
      <div style={{
        padding: '14px 14px 18px',
        borderTop: '1px solid var(--abk-border)',
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', gap: 8,
        flexShrink: 0,
      }}>
        <button className="abk-util-btn" onClick={toggleLang}>
          <Languages size={14} color="var(--abk-ink-faint)" />
          <span>{i18n.language === 'am' ? t('ui.english') : t('ui.amharic')}</span>
        </button>

        {/* User profile card with dropdown */}
        <div ref={profileMenuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setProfileMenuOpen(o => !o)}
            style={{
              width: '100%', background: 'var(--abk-cream-deep)',
              border: '1px solid var(--abk-border)',
              borderRadius: 12, padding: '11px 13px',
              display: 'flex', alignItems: 'center', gap: 10,
              cursor: 'pointer',
            }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'var(--abk-ticker-bg)', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: dark ? '1px solid rgba(61,214,140,.2)' : 'none',
            }}>
              <span style={{
                fontFamily: "'Playfair Display', serif",
                color: 'var(--abk-ticker-fg)',
                fontWeight: 600, fontSize: 15, fontStyle: 'italic',
              }}>
                {(user?.name || 'A')[0].toUpperCase()}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div style={{
                fontSize: 13, fontWeight: 500, color: 'var(--abk-ink)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{user?.name || 'Admin'}</div>
              <div style={{
                fontSize: 10.5, color: 'var(--abk-ink-faint)', fontWeight: 300,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{user?.email}</div>
            </div>
            <ChevronsUpDown size={14} color="var(--abk-ink-faint)" style={{ flexShrink: 0 }} />
          </button>

          {profileMenuOpen && (
            <div style={{
              position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 20,
              background: dark ? '#111826' : '#FFFFFF',
              border: '1px solid var(--abk-border)',
              borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,.22)',
              padding: 6,
            }}>
              <div style={{ padding: '8px 10px 6px' }}>
                <span style={{
                  display: 'inline-block', fontSize: 9.5, fontWeight: 700,
                  letterSpacing: '0.08em', padding: '2px 8px', borderRadius: 20,
                  textTransform: 'uppercase',
                  background: isAdmin
                    ? (dark ? 'rgba(61,214,140,.15)' : '#D4EDDA')
                    : (dark ? 'rgba(251,191,36,.15)' : '#FFF3CD'),
                  color: isAdmin
                    ? (dark ? '#3DD68C' : '#155724')
                    : (dark ? '#FBBf24' : '#856404'),
                }}>
                  {roleKey.replace('_', ' ')}
                </span>
              </div>
              <button
                className="abk-util-btn"
                onClick={() => { setProfileMenuOpen(false); setCurrent('settings'); }}
              >
                <Settings size={14} color="var(--abk-ink-faint)" />
                <span>{t('nav.settings')}</span>
              </button>
              <button className="abk-util-btn danger" onClick={() => onLogout?.()}>
                <LogOut size={14} />
                <span>{t('ui.signOut')}</span>
              </button>
            </div>
          )}
        </div>

        <div style={{
          fontSize: 9.5, color: 'var(--abk-ink-faint)', fontWeight: 300,
          textAlign: 'center', paddingTop: 2, letterSpacing: '0.04em',
        }}>
          {t('settings.version')}
        </div>
      </div>
    </aside>
  );
}
