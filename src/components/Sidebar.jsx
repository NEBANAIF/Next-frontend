/**
 * ─────────────────────────────────────────────────────────────────────────
 *  Sidebar.jsx — Premium grouped navigation sidebar
 *
 *  Organized into collapsible sections:
 *    Main           — Dashboard, Branches
 *    Sales          — POS, Sales, Customers, Loans, Returns
 *    Inventory      — Products, Categories, Batches, Stock, Transfers,
 *                     Stock History
 *    Purchasing     — Suppliers, Purchases
 *    Reports        — Sales Reports, Inventory Reports
 *    Administration — Users, Roles & Permissions, Settings
 *
 *  ADMIN sees every item. Every other role (WORKER, and the location-scoped
 *  WAREHOUSE_MANAGER / STORE_MANAGER / STAFF) sees only the non-adminOnly
 *  items — the same operational set WORKER always had, now shared by all
 *  branch-scoped roles. Branch-level data restriction happens server-side
 *  and in the pickers themselves, not by hiding whole pages here.
 *
 *  The branch pill under the brand header is informational: it shows the
 *  signed-in user's own branch (branch users have exactly one, assigned at
 *  account creation) or "All Branches" for ADMIN. Switching *which*
 *  branch's data an admin is viewing happens on the Dashboard's own filter,
 *  not here — this pill just answers "whose data am I looking at right now".
 * ─────────────────────────────────────────────────────────────────────────
 */
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Package, ShoppingCart, ShoppingBag, DollarSign,
  TrendingUp, Clock, Users, LogOut, ChevronRight, ChevronDown, Moon, Sun, Languages,
  Shield, Briefcase, Landmark, Receipt, Building2, Layers, ArrowLeftRight,
  Contact, Undo2, Tags, Boxes, Truck, ClipboardList, BarChart3, Settings as SettingsIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Grouped nav — each group has a label and its own items. Each item has an
 * optional `adminOnly` flag; if true, it's hidden from every non-ADMIN role.
 */
const NAV_GROUPS = [
  {
    key: 'main', label: 'Main', items: [
      { key: 'dashboard', i18n: 'nav.dashboard', icon: LayoutDashboard, adminOnly: true },
      { key: 'branches',  i18n: 'nav.branches',  icon: Building2,       adminOnly: true },
    ],
  },
  {
    key: 'sales', label: 'Sales', items: [
      { key: 'pos',       i18n: 'nav.pos',       icon: ShoppingBag, adminOnly: false },
      { key: 'sales',     i18n: 'nav.sales',     icon: ShoppingCart, adminOnly: false },
      { key: 'customers', i18n: 'nav.customers', icon: Contact,     adminOnly: false },
      { key: 'loans',     i18n: 'nav.loans',     icon: Landmark,    adminOnly: false },
      { key: 'returns',   i18n: 'nav.returns',   icon: Undo2,       adminOnly: false },
    ],
  },
  {
    key: 'inventory', label: 'Inventory', items: [
      { key: 'products',     i18n: 'nav.products',     icon: Package,        adminOnly: false },
      { key: 'categories',   i18n: 'nav.categories',   icon: Tags,           adminOnly: false },
      { key: 'batches',      i18n: 'nav.batches',      icon: Layers,         adminOnly: false },
      { key: 'stock',        i18n: 'nav.stock',        icon: Boxes,          adminOnly: false },
      { key: 'transfers',    i18n: 'nav.transfers',    icon: ArrowLeftRight, adminOnly: false },
      { key: 'stockhistory', i18n: 'nav.stockHistory', icon: Clock,          adminOnly: true  },
    ],
  },
  {
    key: 'purchasing', label: 'Purchasing', items: [
      { key: 'suppliers', i18n: 'nav.suppliers', icon: Truck,          adminOnly: false },
      { key: 'purchases', i18n: 'nav.purchases', icon: ClipboardList, adminOnly: false },
    ],
  },
  {
    key: 'reports', label: 'Reports', items: [
      { key: 'salesReports',     i18n: 'nav.salesReports',     icon: TrendingUp, adminOnly: true },
      { key: 'inventoryReports', i18n: 'nav.inventoryReports', icon: BarChart3,  adminOnly: true },
    ],
  },
  {
    key: 'admin', label: 'Administration', items: [
      { key: 'users',    i18n: 'nav.users',           icon: Users,       adminOnly: true  },
      { key: 'roles',    i18n: 'nav.rolesPermissions', icon: Shield,      adminOnly: true  },
      { key: 'settings', i18n: 'nav.settings',         icon: SettingsIcon, adminOnly: false },
    ],
  },
];

const ROLE_LABELS = {
  ADMIN: 'Admin', WORKER: 'Worker', WAREHOUSE_MANAGER: 'Warehouse Manager',
  STORE_MANAGER: 'Store Manager', STAFF: 'Staff',
};

export default function Sidebar({ current, setCurrent, user, onLogout, dark, onDarkToggle, open }) {
  const { t, i18n } = useTranslation();

  function toggleLang() {
    const next = i18n.language === 'am' ? 'en' : 'am';
    void i18n.changeLanguage(next);
    try { localStorage.setItem('ousman_lang', next); } catch {}
  }

  const roleKey  = user?.role?.toUpperCase() || 'WORKER';
  const isAdmin  = roleKey === 'ADMIN';
  const headerBg = dark ? '#090D14' : '#0F1F04';

  // Every group collapsed/expanded independently; all start open.
  const [collapsedGroups, setCollapsedGroups] = useState({});
  function toggleGroup(key) { setCollapsedGroups(g => ({ ...g, [key]: !g[key] })); }

  // Visible groups: drop adminOnly items for non-admins, and drop any
  // group left with zero items as a result.
  const visibleGroups = NAV_GROUPS
    .map(group => ({ ...group, items: group.items.filter(i => isAdmin || !i.adminOnly) }))
    .filter(group => group.items.length > 0);

  return (
    <aside className={`abk-sidebar${dark ? ' abk-dark' : ''}${open ? ' open' : ''}`}>

      {/* ── Brand header ── */}
      <div style={{
        padding: '20px 18px 16px',
        borderBottom: '1px solid var(--abk-border)',
        position: 'relative', zIndex: 1,
        background: headerBg,
        transition: 'background .3s',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: dark ? 'rgba(88,166,255,.12)' : 'rgba(255,255,255,.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: dark ? '1px solid rgba(61,214,140,.25)' : '1px solid rgba(255,255,255,.12)',
          }}>
            <span style={{
              fontFamily: "'Playfair Display', serif",
              color: dark ? '#58A6FF' : '#F0F7E2',
              fontWeight: 600, fontSize: 18, fontStyle: 'italic',
            }}>N</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 16.5, fontWeight: 500,
              color: dark ? '#E6EDF3' : '#F0F7E2',
              letterSpacing: -0.3, lineHeight: 1.2,
            }}>Ousman ERP</div>
            <div style={{
              fontSize: 10.5, fontWeight: 300, marginTop: 2,
              color: dark ? '#5A7A96' : '#A8C080',
            }}>
              {i18n.language === 'am' ? 'የችርቻሮ ሥርዓት' : 'Multi-branch operations'}
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

        {/* Current Branch / Location pill */}
        <div className="abk-branch-pill">
          <div style={{
            width: 26, height: 26, borderRadius: 7, flexShrink: 0,
            background: dark ? 'rgba(61,214,140,.14)' : 'rgba(255,255,255,.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Building2 size={13} color={dark ? '#3DD68C' : '#F0F7E2'} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 9.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: dark ? '#5A7A96' : '#A8C080',
            }}>{isAdmin ? 'Viewing' : 'Your branch'}</div>
            <div style={{
              fontSize: 12, fontWeight: 500, color: dark ? '#E6EDF3' : '#F0F7E2',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {isAdmin ? 'All Branches' : (user?.branch?.name || 'No branch assigned')}
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav style={{
        flex: 1, padding: '12px 10px', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 4,
        position: 'relative', zIndex: 1,
      }}>
        {visibleGroups.map((group, gIdx) => {
          const isCollapsed = !!collapsedGroups[group.key];
          return (
            <div key={group.key} style={{ marginBottom: 2 }}>
              <button className="abk-nav-section-btn" onClick={() => toggleGroup(group.key)}>
                <span>{group.label}</span>
                <ChevronDown size={12} className={`abk-nav-section-chevron${isCollapsed ? ' collapsed' : ''}`} />
              </button>

              {!isCollapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
                  {group.items.map(({ key, i18n: ns, icon: Icon }, idx) => {
                    const active = current === key;
                    return (
                      <button
                        key={key}
                        className={`abk-nav-btn abk-anim-slide-in${active ? ' active' : ''}`}
                        style={{ animationDelay: `${0.04 + (gIdx * 3 + idx) * 0.025}s` }}
                        onClick={() => setCurrent(key)}
                      >
                        <div style={{
                          width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: active
                            ? (dark ? 'rgba(61,214,140,.12)' : 'rgba(29,158,117,.12)')
                            : 'transparent',
                          transition: 'background .2s',
                        }}>
                          <Icon size={15} color={active ? (dark ? '#3DD68C' : '#1D9E75') : 'var(--abk-nav-idle-fg)'} />
                        </div>
                        <span style={{ flex: 1 }}>{t(ns, ns.split('.')[1])}</span>
                        {active && <ChevronRight size={13} style={{ opacity: .5, color: 'var(--abk-nav-active-fg)' }} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Branch-user access note */}
        {!isAdmin && (
          <div style={{
            marginTop: 10, padding: '11px 13px', borderRadius: 10,
            background: dark ? 'rgba(251,191,36,.06)' : 'rgba(0,0,0,.04)',
            border: dark ? '1px solid rgba(251,191,36,.15)' : '1px solid rgba(0,0,0,.07)',
          }}>
            <div style={{
              fontSize: 9.5, fontWeight: 600, letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: dark ? '#FBBf24' : '#A07A10',
              marginBottom: 4,
            }}>
              {ROLE_LABELS[roleKey] || 'Worker'} Access
            </div>
            <div style={{ fontSize: 10, color: 'var(--abk-ink-faint)', lineHeight: 1.5 }}>
              {roleKey === 'WORKER' ? (
                <>
                  • View products (read only)<br />
                  • View &amp; record today's sales<br />
                  • Cannot delete sales
                </>
              ) : (
                <>
                  • Limited to your assigned branch<br />
                  • Can receive stock, sell, and transfer<br />
                  • Cannot manage users or locations
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ── Footer ── */}
      <div style={{
        padding: '12px 12px 16px',
        borderTop: '1px solid var(--abk-border)',
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', gap: 5,
        flexShrink: 0,
      }}>
        <button className="abk-util-btn" onClick={toggleLang}>
          <Languages size={14} color="var(--abk-ink-faint)" />
          <span>{i18n.language === 'am' ? t('ui.english') : t('ui.amharic')}</span>
        </button>

        {/* User card */}
        <div style={{
          background: 'var(--abk-cream-deep)',
          border: '1px solid var(--abk-border)',
          borderRadius: 11, padding: '10px 12px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'var(--abk-ticker-bg)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: dark ? '1px solid rgba(61,214,140,.2)' : 'none',
          }}>
            <span style={{
              fontFamily: "'Playfair Display', serif",
              color: 'var(--abk-ticker-fg)',
              fontWeight: 600, fontSize: 14, fontStyle: 'italic',
            }}>
              {(user?.name || 'A')[0].toUpperCase()}
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 500, color: 'var(--abk-ink)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{user?.name || 'Admin'}</div>
            <div style={{
              fontSize: 10.5, color: 'var(--abk-ink-faint)', fontWeight: 300,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{user?.email}</div>
            <span style={{
              display: 'inline-block', fontSize: 9.5, fontWeight: 600,
              letterSpacing: '0.06em', padding: '1px 7px', borderRadius: 20,
              textTransform: 'uppercase', marginTop: 3,
              background: isAdmin
                ? (dark ? 'rgba(61,214,140,.15)' : '#D4EDDA')
                : (dark ? 'rgba(251,191,36,.15)'  : '#FFF3CD'),
              color: isAdmin
                ? (dark ? '#3DD68C' : '#155724')
                : (dark ? '#FBBf24' : '#856404'),
            }}>
              {ROLE_LABELS[roleKey] || roleKey}
            </span>
          </div>
        </div>

        <div className="abk-divider" />

        <button className="abk-util-btn danger" onClick={() => onLogout?.()}>
          <LogOut size={14} />
          <span>{t('ui.signOut')}</span>
        </button>

        <div style={{
          fontSize: 9.5, color: 'var(--abk-ink-faint)', fontWeight: 300,
          textAlign: 'center', paddingTop: 4, letterSpacing: '0.04em',
        }}>
          {t('settings.version')}
        </div>
      </div>
    </aside>
  );
}
