import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { ProtectedRoute } from '../features/auth/ProtectedRoute'
import { CustomerDetailRoute } from '../routes/customer-detail'
import { CustomersRoute } from '../routes/customers'
import { DashboardRoute } from '../routes/dashboard'
import { DocumentsRoute } from '../routes/documents'
import { LoginRoute } from '../routes/login'
import { RenewalsRoute } from '../routes/renewals'
import { SettingsRoute } from '../routes/settings'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardRoute />} />
        <Route path="/customers" element={<CustomersRoute />} />
        <Route path="/customers/:id" element={<CustomerDetailRoute />} />
        <Route path="/renewals" element={<RenewalsRoute />} />
        <Route path="/documents" element={<DocumentsRoute />} />
        <Route path="/settings" element={<SettingsRoute />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
