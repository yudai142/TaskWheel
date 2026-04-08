import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Works from './pages/Works';
import History from './pages/History';
import Settings from './pages/Settings';
import LandingPage from './auth/LandingPage';
import AuthModal from './auth/AuthModal';
import PasswordResetPage from './auth/PasswordResetPage';
import type { AuthResponse, AuthUser, WorksheetSummary } from '../types';

export default function App(): JSX.Element {
  const [loading, setLoading] = useState<boolean>(true);
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [currentWorksheet, setCurrentWorksheet] = useState<WorksheetSummary | null>(null);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | null>(null);

  useEffect(() => {
    axios
      .get<AuthResponse>('/api/v1/auth/me')
      .then((res) => {
        setAuthenticated(res.data.authenticated);
        setCurrentUser(res.data.user);
        setCurrentWorksheet(res.data.current_worksheet);
      })
      .catch(() => {
        setAuthenticated(false);
        setCurrentUser(null);
        setCurrentWorksheet(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const res = await axios.post<AuthResponse>('/api/v1/auth/login', { email, password });
    setAuthenticated(res.data.authenticated);
    setCurrentUser(res.data.user);
    setCurrentWorksheet(res.data.current_worksheet);
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ): Promise<void> => {
    const res = await axios.post<AuthResponse>('/api/v1/auth/register', {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    });
    setAuthenticated(res.data.authenticated);
    setCurrentUser(res.data.user);
    setCurrentWorksheet(res.data.current_worksheet);
  };

  const logout = async (): Promise<void> => {
    await axios.post('/api/v1/auth/logout');
    setAuthenticated(false);
    setCurrentUser(null);
    setCurrentWorksheet(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">読み込み中...</div>;
  }

  if (!authenticated) {
    return (
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/password-reset" element={<PasswordResetPage />} />
          <Route
            path="*"
            element={
              <>
                <LandingPage
                  onOpenLogin={() => setAuthModalMode('login')}
                  onOpenRegister={() => setAuthModalMode('register')}
                />
                {authModalMode && (
                  <AuthModal
                    mode={authModalMode}
                    onClose={() => setAuthModalMode(null)}
                    onLogin={login}
                    onRegister={register}
                  />
                )}
              </>
            }
          />
        </Routes>
      </Router>
    );
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Layout
        currentUserName={currentUser?.name || currentUser?.email || ''}
        currentWorksheetName={currentWorksheet?.name || 'ワークシート'}
        onLogout={logout}
      >
        <Routes>
          <Route path="/password-reset" element={<PasswordResetPage />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/members" element={<Members />} />
          <Route path="/works" element={<Works />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
}
