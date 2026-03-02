import { Link } from 'react-router-dom'
import Layout from '../components/Layout'

const statCards = [
    { label: 'Açık Teklif Talepleri', color: '#1d4ed8' },
    { label: 'Bekleyen Siparişler', color: '#b45309' },
    { label: 'Toplam Firma Sayısı', color: '#15803d' },
]

export default function Dashboard() {
    return (
        <Layout>
            {/* Page header */}
            <div style={{ marginBottom: '1.75rem', borderBottom: '2px solid #d1d5db', paddingBottom: '1rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.6rem', color: '#111827' }}>Genel Durum</h1>
                <p style={{ margin: '0.4rem 0 0', fontSize: '1rem', color: '#374151' }}>
                    Sistemdeki güncel istatistiklere genel bakış.
                </p>
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                {statCards.map((card) => (
                    <div
                        key={card.label}
                        style={{
                            background: '#ffffff',
                            border: '1px solid #d1d5db',
                            borderLeft: `5px solid ${card.color}`,
                            borderRadius: '6px',
                            padding: '1.4rem 1.5rem',
                        }}
                    >
                        <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#374151' }}>{card.label}</p>
                        <p style={{ margin: '0.5rem 0 0', fontSize: '2rem', fontWeight: 800, color: card.color }}>—</p>
                    </div>
                ))}
            </div>

            {/* Quick links */}
            <div
                style={{
                    background: '#ffffff',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    padding: '1.5rem',
                }}
            >
                <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', color: '#111827' }}>Hızlı İşlemler</h2>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <LinkBtn to="/rfqs" label="Teklif Taleplerini Gör" primary />
                    <LinkBtn to="/orders" label="Siparişleri Gör" />
                </div>
            </div>
        </Layout>
    )
}

function LinkBtn({ to, label, primary }) {
    return (
        <Link
            to={to}
            style={{
                display: 'inline-block',
                padding: '0.65rem 1.5rem',
                background: primary ? '#1d4ed8' : '#ffffff',
                color: primary ? '#ffffff' : '#1d4ed8',
                border: primary ? 'none' : '2px solid #1d4ed8',
                borderRadius: '4px',
                fontSize: '1rem',
                fontWeight: 700,
                textDecoration: 'none',
                minHeight: '44px',
                lineHeight: '1.4',
            }}
        >
            {label}
        </Link>
    )
}
