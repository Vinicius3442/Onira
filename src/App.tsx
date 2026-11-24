import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AdminRoute, GuestRoute, ProtectedRoute } from './components/RouteGuards';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { UpdatePasswordPage } from './pages/UpdatePasswordPage';
import { DreamScriptPage } from './pages/DreamScriptPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

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

          {/* Página de Funcionalidade (RF05 / CT-05) */}
          <Route
            path="/roteiro-do-sonho"
            element={
              <ProtectedRoute>
                <DreamScriptPage />
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
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
