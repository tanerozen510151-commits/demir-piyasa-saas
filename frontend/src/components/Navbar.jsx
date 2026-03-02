import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navLinks = [
    { href: '/dashboard', label: 'Ana Sayfa' },
    { href: '/rfqs', label: 'Teklif Talepleri' },
    { href: '/orders', label: 'Siparişler' },
]

export default function Navbar() {
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const { user } = useAuth()

    async function handleLogout() {
        await fetch('/logout', { method: 'POST', credentials: 'include' })
        navigate('/')
    }

    return (
        <nav
            style={{
                background: '#1e3a5f',
                borderBottom: '3px solid #1d4ed8',
                padding: '0 2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '64px',
                position: 'sticky',
                top: 0,
                zIndex: 100,
            }}
        >
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
                <Link
                    to="/dashboard"
                    style={{
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '1.2rem',
                        textDecoration: 'none',
                        letterSpacing: '-0.01em',
                        whiteSpace: 'nowrap',
                    }}
                >
                    Demir Piyasa
                </Link>

                {/* Nav links */}
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
                        return (
                            <Link
                                key={link.href}
                                to={link.href}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                    fontWeight: isActive ? 700 : 500,
                                    textDecoration: 'none',
                                    color: isActive ? '#ffffff' : '#93c5fd',
                                    background: isActive ? '#1d4ed8' : 'transparent',
                                    transition: 'background 0.15s, color 0.15s',
                                }}
                            >
                                {link.label}
                            </Link>
                        )
                    })}
                    {user?.role === 'SUPER_ADMIN' && (
                        <Link
                            to="/admin/dashboard"
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                fontWeight: pathname.startsWith('/admin') ? 700 : 500,
                                textDecoration: 'none',
                                color: pathname.startsWith('/admin') ? '#ffffff' : '#93c5fd',
                                background: pathname.startsWith('/admin') ? '#1d4ed8' : 'transparent',
                                transition: 'background 0.15s, color 0.15s',
                                marginLeft: '1rem',
                                borderLeft: '1px solid #1d4ed8',
                            }}
                        >
                            Admin Panel
                        </Link>
                    )}
                </div>
            </div>

            {/* Sign out */}
            <button
                onClick={handleLogout}
                style={{
                    background: 'transparent',
                    border: '1px solid #93c5fd',
                    color: '#93c5fd',
                    padding: '0.45rem 1.1rem',
                    borderRadius: '4px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                }}
            >
                Çıkış Yap
            </button>
        </nav>
    )
}
