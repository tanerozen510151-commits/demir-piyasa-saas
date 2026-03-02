import { useEffect, useState } from 'react'
import Layout from '../components/Layout'

function StatKutu({ label, value, color }) {
    return (
        <div style={{
            background: '#ffffff',
            border: '1px solid #d1d5db',
            borderLeft: `5px solid ${color}`,
            borderRadius: '6px',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
        }}>
            <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {label}
            </h3>
            <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: 700, color: '#111827' }}>
                {value}
            </p>
        </div>
    )
}

export default function AdminDashboard() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        fetch('/api/admin/dashboard', { credentials: 'include' })
            .then((res) => {
                if (!res.ok) throw new Error()
                return res.json()
            })
            .then((json) => {
                setData(json)
                setLoading(false)
            })
            .catch(() => {
                setError('Admin verileri yüklenemedi. Yetkiniz olmayabilir.')
                setLoading(false)
            })
    }, [])

    return (
        <Layout>
            <div style={{ marginBottom: '1.75rem', borderBottom: '2px solid #d1d5db', paddingBottom: '1rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.6rem', color: '#111827' }}>Admin Panel - Genel Durum</h1>
                <p style={{ margin: '0.4rem 0 0', fontSize: '1rem', color: '#374151' }}>
                    Platform üzerindeki temel istatistikler ve üyelik analizleri.
                </p>
            </div>

            {loading ? (
                <p style={{ fontSize: '1rem', color: '#374151' }}>Yükleniyor…</p>
            ) : error ? (
                <p style={{ fontSize: '1rem', color: '#b91c1c', fontWeight: 600 }}>{error}</p>
            ) : data ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                        <StatKutu label="Bugünkü RFQ" value={data.stats.todayRFQs} color="#1d4ed8" />
                        <StatKutu label="Haftalık Teklif" value={data.stats.weeklyOffers} color="#f59e0b" />
                        <StatKutu label="Aylık Ciro" value={`${data.totals.monthlyRevenue} TL`} color="#059669" />
                        <StatKutu label="Aktif Firma" value={data.stats.activeCompanies} color="#4338ca" />
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 300px', background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '6px', padding: '1.5rem' }}>
                            <h2 style={{ margin: '0 0 1rem', fontSize: '1.2rem', color: '#111827' }}>Üyelik Dağılımı</h2>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '1rem' }}>
                                <li style={{ padding: '0.6rem 0', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Basic:</span> <strong style={{ color: '#111827' }}>{data.membershipDistribution.basic || 0}</strong>
                                </li>
                                <li style={{ padding: '0.6rem 0', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Gold:</span> <strong style={{ color: '#111827' }}>{data.membershipDistribution.gold || 0}</strong>
                                </li>
                                <li style={{ padding: '0.6rem 0', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Premium:</span> <strong style={{ color: '#111827' }}>{data.membershipDistribution.premium || 0}</strong>
                                </li>
                            </ul>
                        </div>

                        <div style={{ flex: '1 1 300px', background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '6px', padding: '1.5rem' }}>
                            <h2 style={{ margin: '0 0 1rem', fontSize: '1.2rem', color: '#111827' }}>Sistem Toplamları</h2>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '1rem' }}>
                                <li style={{ padding: '0.6rem 0', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Toplam Kullanıcı:</span> <strong style={{ color: '#111827' }}>{data.totals.totalUsers}</strong>
                                </li>
                                <li style={{ padding: '0.6rem 0', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Toplam Firma:</span> <strong style={{ color: '#111827' }}>{data.totals.totalCompanies}</strong>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            ) : null}
        </Layout>
    )
}
