import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const S = {
    page: {
        minHeight: '100vh',
        background: '#f0f2f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
    },
    box: {
        width: '100%',
        maxWidth: '440px',
    },
    logo: {
        textAlign: 'center',
        marginBottom: '2rem',
    },
    logoText: {
        fontSize: '1.75rem',
        fontWeight: 800,
        color: '#1e3a5f',
        margin: 0,
    },
    logoSub: {
        fontSize: '1rem',
        color: '#374151',
        marginTop: '0.25rem',
    },
    card: {
        background: '#ffffff',
        border: '1px solid #d1d5db',
        borderTop: '4px solid #1d4ed8',
        borderRadius: '6px',
        padding: '2rem',
    },
    cardTitle: {
        fontSize: '1.2rem',
        fontWeight: 700,
        color: '#111827',
        marginBottom: '1.5rem',
        marginTop: 0,
    },
    errorBox: {
        background: '#fef2f2',
        border: '1px solid #fca5a5',
        borderRadius: '4px',
        color: '#b91c1c',
        fontSize: '1rem',
        fontWeight: 600,
        padding: '0.75rem 1rem',
        marginBottom: '1.25rem',
    },
    label: {
        display: 'block',
        fontSize: '1rem',
        fontWeight: 600,
        color: '#111827',
        marginBottom: '0.4rem',
    },
    input: {
        width: '100%',
        padding: '0.65rem 0.9rem',
        border: '1.5px solid #9ca3af',
        borderRadius: '4px',
        fontSize: '1rem',
        color: '#111827',
        background: '#ffffff',
        outline: 'none',
        marginBottom: '1.25rem',
    },
    btn: {
        width: '100%',
        padding: '0.75rem',
        background: '#1d4ed8',
        color: '#ffffff',
        border: 'none',
        borderRadius: '4px',
        fontSize: '1.05rem',
        fontWeight: 700,
        cursor: 'pointer',
        marginTop: '0.5rem',
        minHeight: '44px',
    },
    btnDisabled: {
        background: '#93c5fd',
        cursor: 'not-allowed',
    },
}

export default function Login() {
    const navigate = useNavigate()
    const [form, setForm] = useState({ email: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    function handleChange(e) {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const res = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(form),
            })
            if (res.ok) {
                navigate('/dashboard')
            } else {
                const data = await res.json().catch(() => ({}))
                setError(data.message || 'E-posta veya şifre hatalı. Lütfen tekrar deneyin.')
            }
        } catch {
            setError('Sunucuya ulaşılamıyor. Lütfen tekrar deneyin.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={S.page}>
            <div style={S.box}>
                <div style={S.logo}>
                    <h1 style={S.logoText}>Demir Piyasa</h1>
                    <p style={S.logoSub}>Teklif ve Sipariş Yönetimi</p>
                </div>

                <div style={S.card}>
                    <h2 style={S.cardTitle}>Hesabınıza Giriş Yapın</h2>

                    {error && <div style={S.errorBox}>{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <label htmlFor="email" style={S.label}>E-posta</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={form.email}
                            onChange={handleChange}
                            placeholder="siz@firma.com"
                            style={S.input}
                        />

                        <label htmlFor="password" style={S.label}>Şifre</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={form.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            style={S.input}
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            style={{ ...S.btn, ...(loading ? S.btnDisabled : {}) }}
                        >
                            {loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
