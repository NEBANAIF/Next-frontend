/**
 * ─────────────────────────────────────────────────────────────────────────
 *  Settings.jsx — Appearance, language, and account info
 *
 *  Consolidates the dark-mode/language toggles that used to live only in
 *  the sidebar footer into a real settings screen, plus a read-only view
 *  of the signed-in user's own account (name, email, role, and branch —
 *  branch users are shown which single branch they're scoped to).
 * ─────────────────────────────────────────────────────────────────────────
 */
import { useEffect } from 'react';
import { Moon, Sun, Languages, User as UserIcon, Building2, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ST_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  .abk-settings {
    --cream: #F0F7E2; --cream-deep: #E4F0CF; --ink: #0F1F04; --ink-mid: #3A5220;
    --ink-light: #6A8A4A; --ink-faint: #A8C080; --border: #D0E4B0; --border-light: #E2EFC8;
    --card: #FFFFFF; --blue: #185FA5; --blue-bg: #E6F1FB; --green: #1D9E75; --green-bg: #E1F5EE;
    --purple: #534AB7; --purple-bg: #EEEDFE; --texture-col: #C8DCA8;
  }
  .abk-settings.abk-dark {
    --cream: #0D1117; --cream-deep: #161B22; --ink: #E6EDF3; --ink-mid: #B8C9DB;
    --ink-light: #8BA4BE; --ink-faint: #5A7A96; --border: #21303F; --border-light: #1A2535;
    --card: #13192A; --blue: #58A6FF; --blue-bg: #0D1F35; --green: #3DD68C; --green-bg: #0D2B1F;
    --purple: #A78BFA; --purple-bg: #1A1535; --texture-col: #1A2535;
  }
  .abk-settings, .abk-settings * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
  .abk-settings .abk-serif { font-family: 'Playfair Display', Georgia, serif !important; }
  .abk-settings.abk-texture::before {
    content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image: linear-gradient(var(--texture-col) 1px, transparent 1px), linear-gradient(90deg, var(--texture-col) 1px, transparent 1px);
    background-size: 48px 48px; opacity: .25;
  }
  .abk-settings.abk-dark.abk-texture::before { opacity: .18; }
  @keyframes abkSFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  .abk-settings .abk-anim-fade-up { opacity:0; animation:abkSFadeUp .4s ease both; }
`;

function SettingRow({ icon: Icon, label, description, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      padding: '14px 18px', borderBottom: '1px solid var(--border-light)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, background: 'var(--cream-deep)',
          border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={16} style={{ color: 'var(--ink-mid)' }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)' }}>{label}</div>
          {description && <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', fontWeight: 300, marginTop: 1 }}>{description}</div>}
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function ToggleSwitch({ on, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 44, height: 25, borderRadius: 20, border: 'none', cursor: 'pointer',
      background: on ? 'var(--green)' : 'var(--border)', position: 'relative', transition: 'background .2s',
    }}>
      <span style={{
        position: 'absolute', top: 2, left: on ? 21 : 2, width: 21, height: 21, borderRadius: '50%',
        background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.3)',
      }} />
    </button>
  );
}

function RoleBadge({ role }) {
  const map = {
    ADMIN: { bg: 'var(--purple-bg)', fg: 'var(--purple)' },
    WAREHOUSE_MANAGER: { bg: 'var(--blue-bg)', fg: 'var(--blue)' },
    STORE_MANAGER: { bg: 'var(--green-bg)', fg: 'var(--green)' },
  };
  const c = map[role] || { bg: 'var(--blue-bg)', fg: 'var(--blue)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600,
      padding: '2px 9px', borderRadius: 20, background: c.bg, color: c.fg,
    }}><Shield size={10} /> {role}</span>
  );
}

export default function Settings({ dark, onDarkToggle, user }) {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const id = 'abk-settings-css';
    let tag = document.getElementById(id);
    if (!tag) { tag = document.createElement('style'); tag.id = id; document.head.appendChild(tag); }
    tag.innerHTML = ST_CSS;
    return () => { const el = document.getElementById(id); if (el) el.remove(); };
  }, []);

  function toggleLang() {
    const next = i18n.language === 'am' ? 'en' : 'am';
    void i18n.changeLanguage(next);
    try { localStorage.setItem('ousman_lang', next); } catch {}
  }

  return (
    <div className={`abk-settings abk-texture${dark ? ' abk-dark' : ''}`}
      style={{ background: 'var(--cream)', minHeight: '100vh', position: 'relative' }}>
      <div style={{ position: 'relative', zIndex: 1, padding: '1.5rem 1.5rem 3rem', maxWidth: 640 }}>

        <div className="abk-anim-fade-up" style={{ padding: '0.5rem 0 1.4rem' }}>
          <div style={{ fontSize: 10.5, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-light)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 18, height: 1.5, background: 'var(--blue)', borderRadius: 1 }} />
            Preferences
          </div>
          <div className="abk-serif" style={{ fontSize: 28, fontWeight: 500, color: 'var(--ink)', letterSpacing: -0.5 }}>Settings</div>
        </div>

        {/* Account */}
        <div className="abk-anim-fade-up" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-light)', background: 'var(--cream-deep)' }}>
            <div className="abk-serif" style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>Account</div>
          </div>
          <SettingRow icon={UserIcon} label={user?.name || '—'} description={user?.email}>
            <RoleBadge role={user?.role} />
          </SettingRow>
          {user?.role !== 'ADMIN' && (
            <SettingRow icon={Building2} label={user?.branch?.name || 'No branch assigned'} description={user?.branch?.location?.name}>
              <span style={{ fontSize: 11, color: 'var(--ink-faint)', fontWeight: 300 }}>Your branch</span>
            </SettingRow>
          )}
        </div>

        {/* Appearance */}
        <div className="abk-anim-fade-up" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-light)', background: 'var(--cream-deep)' }}>
            <div className="abk-serif" style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>Appearance</div>
          </div>
          <SettingRow icon={dark ? Sun : Moon} label="Dark mode" description="Switch between light and dark themes">
            <ToggleSwitch on={dark} onClick={onDarkToggle} />
          </SettingRow>
          <SettingRow icon={Languages} label="Language" description={i18n.language === 'am' ? 'አማርኛ' : 'English'}>
            <button onClick={toggleLang} style={{
              padding: '6px 14px', borderRadius: 9, border: '1px solid var(--border)',
              background: 'var(--cream-deep)', color: 'var(--ink-mid)', fontSize: 12.5,
              fontWeight: 500, cursor: 'pointer',
            }}>{i18n.language === 'am' ? t('ui.english') : t('ui.amharic')}</button>
          </SettingRow>
        </div>

        <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontWeight: 300, textAlign: 'center' }}>
          {t('settings.version')}
        </div>
      </div>
    </div>
  );
}
