import { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ErrorBoundary } from '../components/feedback/ErrorBoundary'
import { PageSkeleton } from '../components/feedback/Skeleton'
import { AppShell } from '../components/layout/AppShell'
import { ProtectedRoute } from '../features/auth/ProtectedRoute'
import { lazyWithRetry } from '../lib/lazy'

const LoginRoute = lazyWithRetry(() => import('../routes/login').then((m) => ({ default: m.LoginRoute })))
const ForgotPasswordRoute = lazyWithRetry(() => import('../routes/forgot-password').then((m) => ({ default: m.ForgotPasswordRoute })))
const SetPasswordRoute = lazyWithRetry(() => import('../routes/set-password').then((m) => ({ default: m.SetPasswordRoute })))
const DashboardRoute = lazyWithRetry(() => import('../routes/dashboard').then((m) => ({ default: m.DashboardRoute })))
const CustomersRoute = lazyWithRetry(() => import('../routes/customers').then((m) => ({ default: m.CustomersRoute })))
const CustomerDetailRoute = lazyWithRetry(() => import('../routes/customer-detail').then((m) => ({ default: m.CustomerDetailRoute })))
const RenewalsRoute = lazyWithRetry(() => import('../routes/renewals').then((m) => ({ default: m.RenewalsRoute })))
const DocumentsRoute = lazyWithRetry(() => import('../routes/documents').then((m) => ({ default: m.DocumentsRoute })))
const ContractsRoute = lazyWithRetry(() => import('../routes/contracts').then((m) => ({ default: m.ContractsRoute })))
const SettingsRoute = lazyWithRetry(() => import('../routes/settings').then((m) => ({ default: m.SettingsRoute })))
const IncidentsRoute = lazyWithRetry(() => import('../routes/incidents').then((m) => ({ default: m.IncidentsRoute })))
const AgendaRoute = lazyWithRetry(() => import('../routes/agenda').then((m) => ({ default: m.AgendaRoute })))


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
        path="/forgot-password"
        element={
          <Suspense fallback={<PageSkeleton kpis={0} tableRows={0} />}>
            <ForgotPasswordRoute />
          </Suspense>
        }
      />
      <Route
        path="/set-password"
        element={
          <Suspense fallback={<PageSkeleton kpis={0} tableRows={0} />}>
            <SetPasswordRoute />
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
        <Route path="/contracts" element={<Suspense fallback={routeFallback}><ErrorBoundary level="page"><ContractsRoute /></ErrorBoundary></Suspense>} />
        <Route path="/renewals" element={<Suspense fallback={routeFallback}><ErrorBoundary level="page"><RenewalsRoute /></ErrorBoundary></Suspense>} />
        <Route path="/documents" element={<Suspense fallback={routeFallback}><ErrorBoundary level="page"><DocumentsRoute /></ErrorBoundary></Suspense>} />
        <Route path="/incidents" element={<Suspense fallback={routeFallback}><ErrorBoundary level="page"><IncidentsRoute /></ErrorBoundary></Suspense>} />
        <Route path="/agenda" element={<Suspense fallback={<PageSkeleton kpis={0} tableRows={0} />}><ErrorBoundary level="page"><AgendaRoute /></ErrorBoundary></Suspense>} />

        <Route path="/settings" element={<Navigate to="/settings/appearance" replace />} />
        <Route path="/settings/:tab" element={<Suspense fallback={<PageSkeleton kpis={0} tableRows={4} />}><ErrorBoundary level="page"><SettingsRoute /></ErrorBoundary></Suspense>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
