import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children }) {
    const [status, setStatus] = useState('checking') // 'checking' | 'ok' | 'unauthorized'

    useEffect(() => {
        fetch('/api/rfqs', { credentials: 'include' })
            .then((res) => {
                if (res.status === 401) {
                    setStatus('unauthorized')
                } else {
                    setStatus('ok')
                }
            })
            .catch(() => setStatus('unauthorized'))
    }, [])

    if (status === 'checking') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (status === 'unauthorized') {
        return <Navigate to="/" replace />
    }

    return children
}
