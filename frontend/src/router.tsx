import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { DashboardRedirect } from './auth/DashboardRedirect';
import { AppLayout } from './layouts/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { Suspended } from './components/RouteFallback';

const RoleDashboardPage = lazy(() =>
  import('./pages/RoleDashboardPage').then((m) => ({ default: m.RoleDashboardPage })),
);
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);
const StatusPage = lazy(() =>
  import('./pages/StatusPage').then((m) => ({ default: m.StatusPage })),
);
const OwnerRegistrationPage = lazy(() =>
  import('./pages/OwnerRegistrationPage').then((m) => ({
    default: m.OwnerRegistrationPage,
  })),
);
const RegistrationConfirmationPage = lazy(() =>
  import('./pages/RegistrationConfirmationPage').then((m) => ({
    default: m.RegistrationConfirmationPage,
  })),
);
const OwnerRequestPage = lazy(() =>
  import('./pages/OwnerRequestPage').then((m) => ({ default: m.OwnerRequestPage })),
);
const AdminRequestsPage = lazy(() =>
  import('./pages/AdminRequestsPage').then((m) => ({ default: m.AdminRequestsPage })),
);
const AdminVerificationPage = lazy(() =>
  import('./pages/AdminVerificationPage').then((m) => ({ default: m.AdminVerificationPage })),
);
const AdminFleetPage = lazy(() =>
  import('./pages/AdminFleetPage').then((m) => ({ default: m.AdminFleetPage })),
);
const AdminBoatSearchPage = lazy(() =>
  import('./pages/AdminBoatSearchPage').then((m) => ({ default: m.AdminBoatSearchPage })),
);
const AdminEmptyLegsPage = lazy(() =>
  import('./pages/AdminEmptyLegsPage').then((m) => ({ default: m.AdminEmptyLegsPage })),
);
const AdminReviewsPage = lazy(() =>
  import('./pages/AdminReviewsPage').then((m) => ({ default: m.AdminReviewsPage })),
);
const AdminTripsPage = lazy(() =>
  import('./pages/AdminTripsPage').then((m) => ({ default: m.AdminTripsPage })),
);
const PublicReviewPage = lazy(() =>
  import('./pages/PublicReviewPage').then((m) => ({ default: m.PublicReviewPage })),
);
const OwnerFlotaPage = lazy(() =>
  import('./pages/OwnerFlotaPage').then((m) => ({ default: m.OwnerFlotaPage })),
);
const OwnerRetornosPage = lazy(() =>
  import('./pages/OwnerRetornosPage').then((m) => ({ default: m.OwnerRetornosPage })),
);
const OwnerSalidasPage = lazy(() =>
  import('./pages/OwnerSalidasPage').then((m) => ({ default: m.OwnerSalidasPage })),
);
const OwnerProfilePage = lazy(() =>
  import('./pages/OwnerProfilePage').then((m) => ({ default: m.OwnerProfilePage })),
);
const OwnerReviewsPage = lazy(() =>
  import('./pages/OwnerReviewsPage').then((m) => ({ default: m.OwnerReviewsPage })),
);

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspended>
        <LoginPage />
      </Suspended>
    ),
  },
  {
    path: '/registro/lanchero',
    element: (
      <Suspended>
        <OwnerRegistrationPage />
      </Suspended>
    ),
  },
  {
    path: '/registro/confirmacion',
    element: (
      <Suspended>
        <RegistrationConfirmationPage />
      </Suspended>
    ),
  },
  {
    path: '/reviews/:token',
    element: (
      <Suspended>
        <PublicReviewPage />
      </Suspended>
    ),
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      {
        path: 'owner/solicitud',
        element: (
          <ProtectedRoute role="OWNER">
            <Suspended>
              <OwnerRequestPage />
            </Suspended>
          </ProtectedRoute>
        ),
      },
      {
        path: 'owner/flota',
        element: (
          <ProtectedRoute role="OWNER">
            <Suspended>
              <OwnerFlotaPage />
            </Suspended>
          </ProtectedRoute>
        ),
      },
      {
        path: 'owner/retornos',
        element: (
          <ProtectedRoute role="OWNER">
            <Suspended>
              <OwnerRetornosPage />
            </Suspended>
          </ProtectedRoute>
        ),
      },
      {
        path: 'owner/salidas',
        element: (
          <ProtectedRoute role="OWNER">
            <Suspended>
              <OwnerSalidasPage />
            </Suspended>
          </ProtectedRoute>
        ),
      },
      {
        path: 'owner/perfil',
        element: (
          <ProtectedRoute role="OWNER">
            <Suspended>
              <OwnerProfilePage />
            </Suspended>
          </ProtectedRoute>
        ),
      },
      {
        path: 'owner/resenas',
        element: (
          <ProtectedRoute role="OWNER">
            <Suspended>
              <OwnerReviewsPage />
            </Suspended>
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/solicitudes',
        element: (
          <ProtectedRoute role="ADMIN">
            <Suspended>
              <AdminRequestsPage />
            </Suspended>
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/verificacion',
        element: (
          <ProtectedRoute role="ADMIN">
            <Suspended>
              <AdminVerificationPage />
            </Suspended>
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/flota',
        element: (
          <ProtectedRoute role="ADMIN">
            <Suspended>
              <AdminFleetPage />
            </Suspended>
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/busqueda',
        element: (
          <ProtectedRoute role="ADMIN">
            <Suspended>
              <AdminBoatSearchPage />
            </Suspended>
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/viajes',
        element: (
          <ProtectedRoute role="ADMIN">
            <Suspended>
              <AdminTripsPage />
            </Suspended>
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/retornos',
        element: (
          <ProtectedRoute role="ADMIN">
            <Suspended>
              <AdminEmptyLegsPage />
            </Suspended>
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/resenas',
        element: (
          <ProtectedRoute role="ADMIN">
            <Suspended>
              <AdminReviewsPage />
            </Suspended>
          </ProtectedRoute>
        ),
      },
      { path: 'dashboard', element: <DashboardRedirect /> },
      {
        path: 'owner/dashboard',
        element: (
          <ProtectedRoute role="OWNER">
            <Suspended>
              <RoleDashboardPage role="OWNER" />
            </Suspended>
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/dashboard',
        element: (
          <ProtectedRoute role="ADMIN">
            <Suspended>
              <RoleDashboardPage role="ADMIN" />
            </Suspended>
          </ProtectedRoute>
        ),
      },
      {
        path: 'estado',
        element: (
          <Suspended>
            <StatusPage />
          </Suspended>
        ),
      },
      {
        path: '*',
        element: (
          <Suspended>
            <NotFoundPage />
          </Suspended>
        ),
      },
    ],
  },
]);
