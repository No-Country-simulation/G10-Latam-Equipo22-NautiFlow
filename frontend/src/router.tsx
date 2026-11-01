import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { DashboardRedirect } from './auth/DashboardRedirect';
import { RoleDashboardPage } from './pages/RoleDashboardPage';
import { AppLayout } from './layouts/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { StatusPage } from './pages/StatusPage';
import { OwnerRegistrationPage } from './pages/OwnerRegistrationPage';
import { RegistrationConfirmationPage } from './pages/RegistrationConfirmationPage';
import { OwnerRequestPage } from './pages/OwnerRequestPage';
import { AdminRequestsPage } from './pages/AdminRequestsPage';
import { AdminTripsPage } from './pages/AdminTripsPage';
import { PublicReviewPage } from './pages/PublicReviewPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/registro/lanchero', element: <OwnerRegistrationPage /> },
  { path: '/registro/confirmacion', element: <RegistrationConfirmationPage /> },
  { path: '/reviews/:token', element: <PublicReviewPage /> },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      {
        path: 'owner/solicitud',
        element: (
          <ProtectedRoute role="OWNER">
            <OwnerRequestPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/solicitudes',
        element: (
          <ProtectedRoute role="ADMIN">
            <AdminRequestsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/viajes',
        element: (
          <ProtectedRoute role="ADMIN">
            <AdminTripsPage />
          </ProtectedRoute>
        ),
      },
      { path: 'dashboard', element: <DashboardRedirect /> },
      {
        path: 'owner/dashboard',
        element: (
          <ProtectedRoute role="OWNER">
            <RoleDashboardPage role="OWNER" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/dashboard',
        element: (
          <ProtectedRoute role="ADMIN">
            <RoleDashboardPage role="ADMIN" />
          </ProtectedRoute>
        ),
      },
      { path: 'estado', element: <StatusPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
