import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AdminRoute, GuestRoute, ProtectedRoute } from './components/RouteGuards';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { UpdatePasswordPage } from './pages/UpdatePasswordPage';
import { DreamScriptPage } from './pages/DreamScriptPage';
import { ThemesLibraryPage } from './pages/ThemesLibraryPage';
import { HistoryPage } from './pages/HistoryPage';
import { DevicePage } from './pages/DevicePage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Página inicial institucional / apresentação do produto */}
          <Route path="/" element={<LandingPage />} />

          {/* Páginas públicas / autenticação */}
          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route path="/cadastro" element={<RegisterPage />} />
          <Route path="/redefinir-senha" element={<ForgotPasswordPage />} />
          <Route path="/atualizar-senha" element={<UpdatePasswordPage />} />

          {/* Área interna do usuário autenticado */}
          <Route
            path="/roteiro-do-sonho"
            element={
              <ProtectedRoute>
                <DreamScriptPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/temas"
            element={
              <ProtectedRoute>
                <ThemesLibraryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/historico"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dispositivo"
            element={
              <ProtectedRoute>
                <DevicePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Página de Administrador (RF04 / CT-04 — acesso estrito) */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
          <Route path="/administrador" element={<Navigate to="/admin" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
