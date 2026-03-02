import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
            padding: '0.3rem 0.85rem',
            borderRadius: '3px',
            border: `1px solid ${d.border}`,
            background: d.bg,
            color: d.color,
            fontWeight: 700,
            fontSize: '0.9rem',
        }}>
            {d.label}
        </span>
    )
}

function DetayKutu({ label, value }) {
    return (
        <div style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            padding: '0.85rem 1.1rem',
        }}>
            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {label}
            </p>
            <p style={{ margin: '0.35rem 0 0', fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>
                {value}
            </p>
        </div>
    )
}

export default function RFQDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [rfq, setRfq] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [actionMsg, setActionMsg] = useState('')
    const [offerStatuses, setOfferStatuses] = useState({})

    useEffect(() => {
        fetch(`/api/rfqs/${id}`, { credentials: 'include' })
            .then((res) => {
                if (!res.ok) throw new Error()
                return res.json()
            })
            .then((data) => { setRfq(data); setLoading(false) })
            .catch(() => { setError('Teklif talebi bilgileri yüklenemedi.'); setLoading(false) })
    }, [id])

    async function handleAccept(offerId) {
        setActionMsg('')
        try {
            const res = await fetch(`/api/offers/${offerId}/accept`, {
                method: 'POST',
                credentials: 'include',
            })
            if (res.ok) {
                setOfferStatuses((prev) => ({ ...prev, [offerId]: 'AWARDED' }))
                setActionMsg('Teklif kabul edildi.')
            } else {
                const data = await res.json().catch(() => ({}))
                setActionMsg(data.message || 'İşlem başarısız oldu.')
            }
        } catch {
            setActionMsg('Sunucuya ulaşılamıyor.')
        }
    }

    async function handleReject(offerId) {
        setActionMsg('')
        try {
            const res = await fetch(`/api/offers/${offerId}/reject`, {
                method: 'POST',
                credentials: 'include',
            })
            if (res.ok) {
                setOfferStatuses((prev) => ({ ...prev, [offerId]: 'REJECTED' }))
                setActionMsg('Teklif reddedildi.')
            } else {
                const data = await res.json().catch(() => ({}))
                setActionMsg(data.message || 'İşlem başarısız oldu.')
            }
        } catch {
            setActionMsg('Sunucuya ulaşılamıyor.')
        }
    }

    return (
        <Layout>
            {/* Back */}
            <button
                onClick={() => navigate('/rfqs')}
                style={{
                    marginBottom: '1.5rem',
                    background: 'transparent',
                    border: 'none',
                    color: '#1d4ed8',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                }}
            >
                ← Teklif Taleplerine Dön
            </button>

            {loading ? (
                <p style={{ fontSize: '1rem', color: '#374151' }}>Yükleniyor…</p>
            ) : error ? (
                <p style={{ fontSize: '1rem', color: '#b91c1c', fontWeight: 600 }}>{error}</p>
            ) : rfq ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Header */}
                    <div style={{ marginBottom: '0.25rem', borderBottom: '2px solid #d1d5db', paddingBottom: '1rem' }}>
                        <h1 style={{ margin: 0, fontSize: '1.6rem', color: '#111827' }}>Teklif Talebi Detayı</h1>
                    </div>

                    {/* Info card */}
                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #d1d5db',
                        borderTop: '4px solid #1d4ed8',
                        borderRadius: '6px',
                        padding: '1.75rem',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#111827' }}>{rfq.title}</h2>
                                {rfq.description && (
                                    <p style={{ margin: '0.5rem 0 0', fontSize: '1rem', color: '#374151' }}>{rfq.description}</p>
                                )}
                            </div>
                            <Durum status={rfq.status} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                            <DetayKutu label="Miktar" value={rfq.quantity ?? '—'} />
                            <DetayKutu label="Son Tarih" value={rfq.deadline ? new Date(rfq.deadline).toLocaleDateString('tr-TR') : '—'} />
                            <DetayKutu label="Firma" value={rfq.company?.name ?? '—'} />
                            <DetayKutu label="Ürün" value={rfq.product?.name ?? rfq.productName ?? '—'} />
                        </div>
                    </div>

                    {/* Action feedback message */}
                    {actionMsg && (
                        <div style={{
                            padding: '0.85rem 1.25rem',
                            background: actionMsg.includes('edildi') ? '#dcfce7' : '#fee2e2',
                            border: `1px solid ${actionMsg.includes('edildi') ? '#86efac' : '#fca5a5'}`,
                            borderRadius: '4px',
                            fontSize: '1rem',
                            fontWeight: 700,
                            color: actionMsg.includes('edildi') ? '#15803d' : '#b91c1c',
                        }}>
                            {actionMsg}
                        </div>
                    )}

                    {/* Offers section */}
                    {rfq.offers && rfq.offers.length > 0 ? (
                        <div style={{ background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '6px', overflow: 'hidden' }}>
                            {/* Section header */}
                            <div style={{
                                padding: '1rem 1.5rem',
                                borderBottom: '2px solid #d1d5db',
                                background: '#f9fafb',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                            }}>
                                <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#111827' }}>
                                    Gelen Teklifler
                                </h2>
                                <span style={{
                                    background: '#1d4ed8',
                                    color: '#fff',
                                    borderRadius: '3px',
                                    padding: '0.1rem 0.55rem',
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                }}>
                                    {rfq.offers.length}
                                </span>
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
                                <thead>
                                    <tr style={{ background: '#f0f2f5', borderBottom: '2px solid #d1d5db' }}>
                                        {['Tedarikçi', 'Fiyat', 'Durum', 'İşlem'].map((h) => (
                                            <th key={h} style={{
                                                textAlign: 'left',
                                                padding: '0.85rem 1.25rem',
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
                                    {rfq.offers.map((offer, i) => {
                                        const currentStatus = offerStatuses[offer.id] ?? offer.status
                                        const isSettled = currentStatus === 'AWARDED' || currentStatus === 'REJECTED'
                                        return (
                                            <tr
                                                key={offer.id}
                                                style={{ borderBottom: '1px solid #e5e7eb', background: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}
                                            >
                                                <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#111827' }}>
                                                    {offer.sellerCompany?.name ?? offer.seller?.name ?? '—'}
                                                </td>
                                                <td style={{ padding: '0.85rem 1.25rem', color: '#111827', fontWeight: 600 }}>
                                                    {offer.price != null ? `${offer.price} TL` : '—'}
                                                </td>
                                                <td style={{ padding: '0.85rem 1.25rem' }}>
                                                    <Durum status={currentStatus} />
                                                </td>
                                                <td style={{ padding: '0.85rem 1.25rem' }}>
                                                    {isSettled ? (
                                                        <span style={{ fontSize: '0.95rem', color: '#6b7280', fontStyle: 'italic' }}>İşleme alındı</span>
                                                    ) : (
                                                        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                                                            <button
                                                                onClick={() => handleAccept(offer.id)}
                                                                style={{
                                                                    background: '#15803d',
                                                                    color: '#ffffff',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    padding: '0.5rem 1.1rem',
                                                                    fontSize: '0.95rem',
                                                                    fontWeight: 700,
                                                                    cursor: 'pointer',
                                                                    minHeight: '40px',
                                                                    whiteSpace: 'nowrap',
                                                                }}
                                                            >
                                                                ✓ Teklifi Kabul Et
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(offer.id)}
                                                                style={{
                                                                    background: '#b91c1c',
                                                                    color: '#ffffff',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    padding: '0.5rem 1.1rem',
                                                                    fontSize: '0.95rem',
                                                                    fontWeight: 700,
                                                                    cursor: 'pointer',
                                                                    minHeight: '40px',
                                                                    whiteSpace: 'nowrap',
                                                                }}
                                                            >
                                                                ✕ Teklifi Reddet
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{
                            background: '#ffffff',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            padding: '2.5rem',
                            textAlign: 'center',
                        }}>
                            <p style={{ margin: 0, fontSize: '1rem', color: '#374151' }}>
                                Bu teklif talebine henüz teklif gelmedi.
                            </p>
                        </div>
                    )}
                </div>
            ) : null}
        </Layout>
    )
}
