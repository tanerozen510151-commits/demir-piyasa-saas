import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

const DURUM = {
    OPEN: { label: 'Açık', bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd' },
    CLOSED: { label: 'Kapalı', bg: '#f3f4f6', color: '#374151', border: '#d1d5db' },
    AWARDED: { label: 'Kabul Edildi', bg: '#dcfce7', color: '#15803d', border: '#86efac' },
    REJECTED: { label: 'Reddedildi', bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' },
}

function Durum({ status }) {
    const d = DURUM[status] ?? { label: status ?? '—', bg: '#f3f4f6', color: '#374151', border: '#d1d5db' }
    return (
        <span style={{
            display: 'inline-block',
            padding: '0.25rem 0.75rem',
            borderRadius: '3px',
            border: `1px solid ${d.border}`,
            background: d.bg,
            color: d.color,
            fontWeight: 700,
            fontSize: '0.9rem',
            whiteSpace: 'nowrap',
        }}>
            {d.label}
        </span>
    )
}

export default function RFQList() {
    const [rfqs, setRfqs] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        fetch('/api/rfqs', { credentials: 'include' })
            .then((res) => res.json())
            .then((data) => {
                setRfqs(Array.isArray(data) ? data : data.rfqs ?? [])
                setLoading(false)
            })
            .catch(() => {
                setError('Teklif talepleri yüklenemedi. Lütfen sayfayı yenileyin.')
                setLoading(false)
            })
    }, [])

    return (
        <Layout>
            {/* Header */}
            <div style={{
                marginBottom: '1.75rem',
                borderBottom: '2px solid #d1d5db',
                paddingBottom: '1rem',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap',
            }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.6rem', color: '#111827' }}>Teklif Talepleri</h1>
                    <p style={{ margin: '0.4rem 0 0', fontSize: '1rem', color: '#374151' }}>
                        Tüm aktif ve geçmiş teklif talepleriniz.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/rfqs/yeni')}
                    style={{
                        background: '#15803d',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '0.65rem 1.4rem',
                        fontSize: '1rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        minHeight: '44px',
                        whiteSpace: 'nowrap',
                    }}
                >
                    + Yeni Teklif Talebi Oluştur
                </button>
            </div>

            {/* Table card */}
            <div style={{ background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '6px', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center', fontSize: '1rem', color: '#374151' }}>
                        Yükleniyor…
                    </div>
                ) : error ? (
                    <div style={{ padding: '2rem', textAlign: 'center', fontSize: '1rem', color: '#b91c1c', fontWeight: 600 }}>
                        {error}
                    </div>
                ) : rfqs.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', fontSize: '1rem', color: '#374151' }}>
                        Henüz teklif talebi bulunmuyor.
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
                        <thead>
                            <tr style={{ background: '#f0f2f5', borderBottom: '2px solid #d1d5db' }}>
                                {['Başlık', 'Miktar', 'Durum', ''].map((h, i) => (
                                    <th key={i} style={{
                                        textAlign: 'left',
                                        padding: '0.9rem 1.25rem',
                                        fontSize: '0.9rem',
                                        fontWeight: 700,
                                        color: '#374151',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.04em',
                                    }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rfqs.map((rfq, i) => (
                                <tr
                                    key={rfq.id}
                                    style={{
                                        borderBottom: '1px solid #e5e7eb',
                                        background: i % 2 === 0 ? '#ffffff' : '#f9fafb',
                                    }}
                                >
                                    <td style={{ padding: '0.9rem 1.25rem', fontWeight: 600, color: '#111827' }}>
                                        {rfq.title}
                                    </td>
                                    <td style={{ padding: '0.9rem 1.25rem', color: '#111827' }}>
                                        {rfq.quantity != null ? rfq.quantity : '—'}
                                    </td>
                                    <td style={{ padding: '0.9rem 1.25rem' }}>
                                        <Durum status={rfq.status} />
                                    </td>
                                    <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>
                                        <button
                                            onClick={() => navigate(`/rfqs/${rfq.id}`)}
                                            style={{
                                                background: '#1d4ed8',
                                                color: '#ffffff',
                                                border: 'none',
                                                borderRadius: '4px',
                                                padding: '0.45rem 1rem',
                                                fontSize: '0.95rem',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                minHeight: '36px',
                                            }}
                                        >
                                            Detay
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </Layout>
    )
}
