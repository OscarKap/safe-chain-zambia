import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RequireAuth } from './components/RequireAuth';
import { Login } from './pages/Login';
import DashboardLayout from './pages/DashboardLayout';
import CasesPage from './pages/CasesPage';
import RespondersPage from './pages/RespondersPage';
import CaseDetailPage from './pages/CaseDetailPage';

const App = () => (
  <AuthProvider>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Navigate to="cases" replace />} />
          <Route path="cases" element={<CasesPage />} />
          <Route path="cases/:id" element={<CaseDetailPage />} />
          <Route path="responders" element={<RespondersPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </AuthProvider>
);

export default App;
