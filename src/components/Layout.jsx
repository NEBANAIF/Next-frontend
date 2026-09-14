import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Menu, X } from 'lucide-react';

export default function Layout({ current, setCurrent, children, user, onLogout, dark, onDarkToggle }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [current]);

  // Close sidebar on resize to desktop
  useEffect(() => {
    function onResize() {
      if (window.innerWidth > 767) setSidebarOpen(false);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  return (
    <div className={`abk-app${dark ? ' abk-dark' : ''}`}>

      {/* Mobile menu toggle */}
      <button
        className="abk-menu-toggle"
        onClick={() => setSidebarOpen(o => !o)}
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile overlay */}
      <div
        className={`abk-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <Sidebar
        current={current}
        setCurrent={setCurrent}
        user={user}
        onLogout={onLogout}
        dark={dark}
        onDarkToggle={onDarkToggle}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <main className="abk-main">
        {children}
      </main>
    </div>
  );
}
