import { useEffect, useState } from 'react'
import Layout from '../components/Layout'

export default function AdminCompanies() {
    const [companies, setCompanies] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const fetchCompanies = () => {
        fetch('/api/admin/companies', { credentials: 'include' })
            .then((res) => {
                if (!res.ok) throw new Error()
                return res.json()
            })
            .then((data) => {
                setCompanies(Array.isArray(data) ? data : [])
                setLoading(false)
            })
            .catch(() => {
                setError('Firmalar yüklenemedi. Yetkiniz olmayabilir.')
                setLoading(false)
            })
    }

    useEffect(() => {
        fetchCompanies()
    }, [])

    const handleMembershipChange = async (id, newType) => {
        try {
            const res = await fetch(`/api/admin/companies/${id}/membership`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ membershipType: newType })
            })

            if (res.ok) {
                fetchCompanies()
            } else {
                alert('Üyelik güncellenemedi.')
            }
        } catch {
            alert('Sunucu hatası.')
        }
    }

    const handleStatusToggle = async (id, currentStatus) => {
        try {
            const res = await fetch(`/api/admin/companies/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ isActive: !currentStatus })
            })

            if (res.ok) {
                fetchCompanies()
            } else {
                alert('Durum güncellenemedi.')
            }
        } catch {
            alert('Sunucu hatası.')
        }
    }

    return (
        <Layout>
            <div style={{ marginBottom: '1.75rem', borderBottom: '2px solid #d1d5db', paddingBottom: '1rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.6rem', color: '#111827' }}>Firma Yönetimi</h1>
                <p style={{ margin: '0.4rem 0 0', fontSize: '1rem', color: '#374151' }}>
                    Sistemdeki firmaların üyelik ve durum ayarlarını yönetin.
                </p>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '6px', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center', fontSize: '1rem', color: '#374151' }}>
                        Yükleniyor…
                    </div>
                ) : error ? (
                    <div style={{ padding: '2rem', textAlign: 'center', fontSize: '1rem', color: '#b91c1c', fontWeight: 600 }}>
                        {error}
                    </div>
                ) : companies.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', fontSize: '1rem', color: '#374151' }}>
                        Listelenecek firma bulunmuyor.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
                            <thead>
                                <tr style={{ background: '#f0f2f5', borderBottom: '2px solid #d1d5db' }}>
                                    {['Firma Adı', 'Rol', 'Üyelik', 'Durum', 'Kayıt Tarihi', 'İşlem'].map((h, i) => (
                                        <th key={i} style={{
                                            textAlign: 'left',
                                            padding: '0.9rem 1.25rem',
                                            fontSize: '0.9rem',
                                            fontWeight: 700,
                                            color: '#374151',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.04em',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {companies.map((c, i) => (
                                    <tr
                                        key={c.id}
                                        style={{
                                            borderBottom: '1px solid #e5e7eb',
                                            background: i % 2 === 0 ? '#ffffff' : '#f9fafb',
                                        }}
                                    >
                                        <td style={{ padding: '0.9rem 1.25rem', fontWeight: 600, color: '#111827' }}>
                                            {c.name}
                                        </td>
                                        <td style={{ padding: '0.9rem 1.25rem', color: '#374151' }}>
                                            {c.role}
                                        </td>
                                        <td style={{ padding: '0.9rem 1.25rem' }}>
                                            <select
                                                value={c.membershipType || 'BASIC'}
                                                onChange={(e) => handleMembershipChange(c.id, e.target.value)}
                                                style={{
                                                    padding: '0.35rem 0.6rem',
                                                    fontSize: '0.95rem',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '4px',
                                                    background: '#fff',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <option value="BASIC">Basic</option>
                                                <option value="GOLD">Gold</option>
                                                <option value="PREMIUM">Premium</option>
                                            </select>
                                        </td>
                                        <td style={{ padding: '0.9rem 1.25rem' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: '3px',
                                                background: c.isActive ? '#dcfce7' : '#fee2e2',
                                                color: c.isActive ? '#15803d' : '#b91c1c',
                                                border: `1px solid ${c.isActive ? '#86efac' : '#fca5a5'}`,
                                                fontWeight: 700,
                                                fontSize: '0.85rem'
                                            }}>
                                                {c.isActive ? 'Aktif' : 'Pasif'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.9rem 1.25rem', color: '#374151' }}>
                                            {new Date(c.createdAt).toLocaleDateString('tr-TR')}
                                        </td>
                                        <td style={{ padding: '0.9rem 1.25rem' }}>
                                            <button
                                                onClick={() => handleStatusToggle(c.id, c.isActive)}
                                                style={{
                                                    background: c.isActive ? '#f3f4f6' : '#15803d',
                                                    color: c.isActive ? '#374151' : '#ffffff',
                                                    border: `1px solid ${c.isActive ? '#d1d5db' : '#15803d'}`,
                                                    borderRadius: '4px',
                                                    padding: '0.4rem 0.8rem',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                {c.isActive ? 'Pasife Al' : 'Aktifleştir'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Layout>
    )
}
