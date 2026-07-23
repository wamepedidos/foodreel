import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import OrderApp from './OrderApp';
import { CommunityPage } from './components/experience/CommunityPage';
import { CreateExperiencePage } from './components/experience/CreateExperiencePage';
import { ExperienceDetailPage } from './components/experience/ExperienceDetailPage';
import { MomentosMockupPage } from './components/experience/MomentosMockupPage';
import { StaffPreviewOrdersPage } from './components/StaffPreviewOrdersPage';
import { AppLayout } from './components/AppLayout';
import { ToastProvider } from './components/Toast';
import { restaurantConfig } from './config/restaurant';
import { ThemeProvider } from './theme/ThemeProvider';
import { AdminLayout } from './admin/components/AdminLayout';
import { AdminDashboardPage } from './admin/pages/AdminDashboardPage';
import { AdminPlaceholderPage } from './admin/pages/AdminPlaceholderPage';
import { DishFormPage } from './admin/pages/DishFormPage';
import { EmployeesPage } from './admin/pages/EmployeesPage';
import { MenuManagementPage } from './admin/pages/MenuManagementPage';
import './styles.css';

if (import.meta.env.DEV) {
  void navigator.serviceWorker?.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => void registration.unregister());
  });
} else {
  registerSW({ immediate: true });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<Navigate to="/menu" replace />} />
          <Route path="/menu" element={<App />} />
          <Route path="/pedido" element={<OrderApp />} />
          <Route
            path="/comunidad"
            element={
              <ToastProvider>
                <AppLayout restaurant={restaurantConfig}>
                  <CommunityPage />
                </AppLayout>
              </ToastProvider>
            }
          />
          <Route
            path="/comunidad/mockup"
            element={
              <ToastProvider>
                <AppLayout restaurant={restaurantConfig}>
                  <MomentosMockupPage />
                </AppLayout>
              </ToastProvider>
            }
          />
          <Route
            path="/experience/new"
            element={
              <ToastProvider>
                <AppLayout restaurant={restaurantConfig}>
                  <CreateExperiencePage />
                </AppLayout>
              </ToastProvider>
            }
          />
          <Route
            path="/experience/:experienceId"
            element={
              <ToastProvider>
                <AppLayout restaurant={restaurantConfig}>
                  <ExperienceDetailPage />
                </AppLayout>
              </ToastProvider>
            }
          />
          <Route path="/staff-preview/orders" element={<StaffPreviewOrdersPage />} />
          <Route
            path="/admin"
            element={
              <ToastProvider>
                <AdminLayout />
              </ToastProvider>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="menu" element={<MenuManagementPage />} />
            <Route path="menu/new" element={<DishFormPage />} />
            <Route path="menu/:dishId/edit" element={<DishFormPage />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="categories" element={<AdminPlaceholderPage title="Categorias" />} />
            <Route path="publications" element={<AdminPlaceholderPage title="Publicaciones" />} />
            <Route path="comments" element={<AdminPlaceholderPage title="Comentarios" />} />
            <Route path="settings" element={<AdminPlaceholderPage title="Configuracion" />} />
          </Route>
          <Route path="*" element={<Navigate to="/menu" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
