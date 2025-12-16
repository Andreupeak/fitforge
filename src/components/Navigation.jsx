import { NavLink } from 'react-router-dom';

function Navigation() {
    const navItems = [
        { path: '/', icon: '🏋️', label: 'Workout' },
        { path: '/library', icon: '📚', label: 'Library' },
        { path: '/progress', icon: '📊', label: 'Progress' },
        { path: '/coach', icon: '🤖', label: 'Coach' },
        { path: '/profile', icon: '👤', label: 'Profile' }
    ];

    return (
        <nav className="bottom-nav">
            {navItems.map(item => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                </NavLink>
            ))}

            <style>{`
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: var(--nav-height);
          padding-bottom: var(--safe-area-bottom);
          background: rgba(15, 15, 35, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid var(--border-color);
          display: flex;
          justify-content: space-around;
          align-items: center;
          z-index: 100;
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 8px 12px;
          text-decoration: none;
          color: var(--text-muted);
          transition: all var(--transition-fast);
          border-radius: 12px;
        }

        .nav-item:hover {
          color: var(--text-secondary);
        }

        .nav-item.active {
          color: var(--accent-primary);
        }

        .nav-item.active .nav-icon {
          transform: scale(1.1);
        }

        .nav-icon {
          font-size: 24px;
          transition: transform var(--transition-fast);
        }

        .nav-label {
          font-size: 10px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      `}</style>
        </nav>
    );
}

export default Navigation;
