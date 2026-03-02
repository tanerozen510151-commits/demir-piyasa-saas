import { useEffect, useState } from 'react'
import Layout from '../components/Layout'

const DURUM = {
    PENDING: { label: 'Beklemede', bg: '#fef9c3', color: '#b45309', border: '#fde047' },
    CONFIRMED: { label: 'Onaylandı', bg: '#dcfce7', color: '#15803d', border: '#86efac' },
    SHIPPED: { label: 'Kargoya Verildi', bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd' },
    DELIVERED: { label: 'Teslim Edildi', bg: '#f0fdf4', color: '#15803d', border: '#86efac' },
    CANCELLED: { label: 'İptal Edildi', bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' },
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

export default function Orders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        fetch('/api/orders', { credentials: 'include' })
            .then((res) => {
                if (!res.ok) throw new Error()
                return res.json()
            })
            .then((data) => {
                setOrders(Array.isArray(data) ? data : data.orders ?? [])
                setLoading(false)
            })
            .catch(() => {
                // endpoint may not exist yet — show empty state
                setOrders([])
                setLoading(false)
                setError('')
            })
    }, [])

    return (
        <Layout>
            {/* Header */}
            <div style={{ marginBottom: '1.75rem', borderBottom: '2px solid #d1d5db', paddingBottom: '1rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.6rem', color: '#111827' }}>Siparişler</h1>
                <p style={{ margin: '0.4rem 0 0', fontSize: '1rem', color: '#374151' }}>
                    Satın alma siparişlerinizi buradan takip edebilirsiniz.
                </p>
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
                ) : orders.length === 0 ? (
                    <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            background: '#f0f2f5',
                            border: '2px solid #d1d5db',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.25rem',
                        }}>
                            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#374151" strokeWidth={1.75}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>
                            Henüz sipariş bulunmuyor
                        </p>
                        <p style={{ margin: '0.5rem 0 0', fontSize: '1rem', color: '#374151' }}>
                            Kabul edilen teklifler buraya sipariş olarak düşecektir.
                        </p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
                        <thead>
                            <tr style={{ background: '#f0f2f5', borderBottom: '2px solid #d1d5db' }}>
                                {['Sipariş No', 'Firma', 'Ürün', 'Miktar', 'Tutar', 'Durum'].map((h) => (
                                    <th key={h} style={{
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
                            {orders.map((order, i) => (
                                <tr
                                    key={order.id}
                                    style={{ borderBottom: '1px solid #e5e7eb', background: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}
                                >
                                    <td style={{ padding: '0.9rem 1.25rem', fontWeight: 700, color: '#111827' }}>
                                        #{order.id}
                                    </td>
                                    <td style={{ padding: '0.9rem 1.25rem', color: '#111827' }}>
                                        {order.company?.name ?? order.sellerCompany?.name ?? '—'}
                                    </td>
                                    <td style={{ padding: '0.9rem 1.25rem', color: '#111827' }}>
                                        {order.product?.name ?? order.productName ?? '—'}
                                    </td>
                                    <td style={{ padding: '0.9rem 1.25rem', color: '#111827' }}>
                                        {order.quantity ?? '—'}
                                    </td>
                                    <td style={{ padding: '0.9rem 1.25rem', fontWeight: 700, color: '#111827' }}>
                                        {order.totalPrice != null ? `${order.totalPrice} TL` : '—'}
                                    </td>
                                    <td style={{ padding: '0.9rem 1.25rem' }}>
                                        <Durum status={order.status} />
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
