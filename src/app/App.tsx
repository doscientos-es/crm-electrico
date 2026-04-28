import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ErrorBoundary } from '../components/feedback/ErrorBoundary'
import { PageSkeleton } from '../components/feedback/Skeleton'
import { AppShell } from '../components/layout/AppShell'
import { ProtectedRoute } from '../features/auth/ProtectedRoute'

const LoginRoute = lazy(() => import('../routes/login').then((m) => ({ default: m.LoginRoute })))
const DashboardRoute = lazy(() => import('../routes/dashboard').then((m) => ({ default: m.DashboardRoute })))
const CustomersRoute = lazy(() => import('../routes/customers').then((m) => ({ default: m.CustomersRoute })))
const CustomerDetailRoute = lazy(() => import('../routes/customer-detail').then((m) => ({ default: m.CustomerDetailRoute })))
const RenewalsRoute = lazy(() => import('../routes/renewals').then((m) => ({ default: m.RenewalsRoute })))
const DocumentsRoute = lazy(() => import('../routes/documents').then((m) => ({ default: m.DocumentsRoute })))
const SettingsRoute = lazy(() => import('../routes/settings').then((m) => ({ default: m.SettingsRoute })))

const routeFallback = <PageSkeleton kpis={0} tableRows={8} />

export function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <Suspense fallback={<PageSkeleton kpis={0} tableRows={0} />}>
            <LoginRoute />
          </Suspense>
        }
      />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Suspense fallback={<PageSkeleton kpis={4} tableRows={6} />}><ErrorBoundary level="page"><DashboardRoute /></ErrorBoundary></Suspense>} />
        <Route path="/customers" element={<Suspense fallback={routeFallback}><ErrorBoundary level="page"><CustomersRoute /></ErrorBoundary></Suspense>} />
        <Route path="/customers/:id" element={<Suspense fallback={<PageSkeleton kpis={4} tableRows={4} tableCols={3} />}><ErrorBoundary level="page"><CustomerDetailRoute /></ErrorBoundary></Suspense>} />
        <Route path="/renewals" element={<Suspense fallback={routeFallback}><ErrorBoundary level="page"><RenewalsRoute /></ErrorBoundary></Suspense>} />
        <Route path="/documents" element={<Suspense fallback={routeFallback}><ErrorBoundary level="page"><DocumentsRoute /></ErrorBoundary></Suspense>} />
        <Route path="/settings" element={<Suspense fallback={<PageSkeleton kpis={0} tableRows={4} />}><ErrorBoundary level="page"><SettingsRoute /></ErrorBoundary></Suspense>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
