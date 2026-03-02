import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import RFQList from './pages/RFQList'
import RFQDetail from './pages/RFQDetail'
import Orders from './pages/Orders'
import AdminDashboard from './pages/AdminDashboard'
import AdminCompanies from './pages/AdminCompanies'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rfqs"
          element={
            <ProtectedRoute>
              <RFQList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rfqs/:id"
          element={
            <ProtectedRoute>
              <RFQDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedUserRoles={['SUPER_ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/companies"
          element={
            <ProtectedRoute allowedUserRoles={['SUPER_ADMIN']}>
              <AdminCompanies />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
