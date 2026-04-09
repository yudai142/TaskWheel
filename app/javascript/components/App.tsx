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

interface Notification {
  message: string;
  type: 'success' | 'error';
}

function queryParam(name: string): string | null {
  const SearchParams = globalThis.URLSearchParams;
  const params = new SearchParams(globalThis.location.search);
  return params.get(name);
}

export default function App(): JSX.Element {
  const [loading, setLoading] = useState<boolean>(true);
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [currentWorksheet, setCurrentWorksheet] = useState<WorksheetSummary | null>(null);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | null>(
    queryParam('open') === 'login' ? 'login' : null
  );
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(
    queryParam('reset') === 'success'
      ? 'パスワードを再設定しました。新しいパスワードでログインしてください。'
      : null
  );
  const [worksheets, setWorksheets] = useState<WorksheetSummary[]>([]);
  const [activeWorksheetId, setActiveWorksheetId] = useState<number | null>(null);
  const [showWorksheetModal, setShowWorksheetModal] = useState<boolean>(false);
  const [newWorksheetName, setNewWorksheetName] = useState<string>('');
  const [worksheetNotification, setWorksheetNotification] = useState<Notification | null>(null);

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

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (currentWorksheet) {
      setActiveWorksheetId(currentWorksheet.id);
    }
  }, [currentWorksheet]);

  useEffect(() => {
    const fetchWorksheets = async (): Promise<void> => {
      if (!authenticated) return;
      try {
        const res = await axios.get<WorksheetSummary[]>('/api/v1/worksheets');
        setWorksheets(res.data);
      } catch {
        // Error fetching worksheets
      }
    };
    void fetchWorksheets();
  }, [authenticated]);

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

  const handleCreateWorksheet = async (): Promise<void> => {
    if (!newWorksheetName.trim()) return;

    try {
      const res = await axios.post<WorksheetSummary>('/api/v1/worksheets', {
        name: newWorksheetName,
      });
      setWorksheets([...worksheets, res.data]);
      setNewWorksheetName('');
      setShowWorksheetModal(false);
      setWorksheetNotification({ message: 'ワークシートを作成しました', type: 'success' });
      window.setTimeout(() => setWorksheetNotification(null), 4000);
    } catch (error) {
      const axiosError = error as { response?: { data?: { error?: string; errors?: string[] } } };
      const msg =
        axiosError.response?.data?.errors?.join(', ') ||
        axiosError.response?.data?.error ||
        'ワークシート作成に失敗しました';
      setWorksheetNotification({ message: msg, type: 'error' });
      window.setTimeout(() => setWorksheetNotification(null), 4000);
    }
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
                {resetSuccessMessage && (
                  <div className="fixed left-1/2 top-6 z-50 w-[min(92vw,640px)] -translate-x-1/2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow">
                    <div className="flex items-start justify-between gap-3">
                      <p>{resetSuccessMessage}</p>
                      <button
                        type="button"
                        className="text-emerald-700 hover:text-emerald-900"
                        onClick={() => setResetSuccessMessage(null)}
                      >
                        閉じる
                      </button>
                    </div>
                  </div>
                )}
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
        worksheets={worksheets}
        activeWorksheetId={activeWorksheetId}
        onWorksheetSelect={setActiveWorksheetId}
        showWorksheetModal={showWorksheetModal}
        newWorksheetName={newWorksheetName}
        onShowWorksheetModal={setShowWorksheetModal}
        onNewWorksheetNameChange={setNewWorksheetName}
        onCreateWorksheet={handleCreateWorksheet}
        worksheetNotification={worksheetNotification}
        onWorksheetNotificationDismiss={() => setWorksheetNotification(null)}
      >
        <Routes>
          <Route path="/password-reset" element={<PasswordResetPage />} />
          <Route path="/" element={<Dashboard worksheetId={activeWorksheetId} />} />
          <Route path="/members" element={<Members worksheetId={activeWorksheetId} />} />
          <Route path="/works" element={<Works worksheetId={activeWorksheetId} />} />
          <Route path="/history" element={<History worksheetId={activeWorksheetId} />} />
          <Route path="/settings" element={<Settings worksheetId={activeWorksheetId} />} />
        </Routes>
      </Layout>
    </Router>
  );
}
