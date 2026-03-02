import Navbar from './Navbar'

export default function Layout({ children }) {
    return (
        <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
                {children}
            </main>
        </div>
    )
}
