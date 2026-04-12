import React, { useState } from 'react';
import axios from 'axios';

type Mode = 'login' | 'register' | 'forgot';

interface AuthModalProps {
  mode: Mode;
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ) => Promise<void>;
}

export default function AuthModal({
  mode,
  onClose,
  onLogin,
  onRegister,
}: AuthModalProps): JSX.Element {
  const [currentMode, setCurrentMode] = useState<Mode>(mode);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordConfirmation, setPasswordConfirmation] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const title =
    currentMode === 'login'
      ? 'ログイン'
      : currentMode === 'register'
        ? '新規登録'
        : 'パスワード再設定';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (currentMode === 'login') {
        await onLogin(email, password);
        onClose();
      } else if (currentMode === 'register') {
        await onRegister(name, email, password, passwordConfirmation);
        onClose();
      } else {
        const res = await axios.post('/api/v1/auth/password/forgot', { email });
        if (res.data?.success) {
          setMessage('再設定メールを送信しました。メール内のリンクから再設定してください。');
        } else {
          setError(res.data?.message || 'メール送信に失敗しました');
        }
      }
    } catch (e) {
      if (axios.isAxiosError(e)) {
        // エラーメッセージの詳細抽出
        const errorData = e.response?.data as Record<string, unknown> | undefined;
        let errorMessage = '認証に失敗しました';

        if (errorData?.message) {
          errorMessage = String(errorData.message);
        } else if (errorData?.errors) {
          const errors = errorData.errors as Record<string, unknown>;
          const errorMessages = Object.entries(errors)
            .map(([field, msgs]) => {
              if (Array.isArray(msgs)) {
                return `${field}: ${msgs.join(', ')}`;
              }
              return `${field}: ${String(msgs)}`;
            })
            .join('\n');
          errorMessage = errorMessages || '認証に失敗しました';
        } else if (errorData?.error) {
          errorMessage = String(errorData.error);
        }

        setError(errorMessage);
      } else {
        setError(e instanceof Error ? e.message : '認証に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-gray-500 hover:bg-gray-100"
          >
            閉じる
          </button>
        </div>

        {error && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        {message && (
          <p className="mb-3 rounded bg-emerald-50 p-2 text-sm text-emerald-700">{message}</p>
        )}

        <form className="space-y-3" onSubmit={handleSubmit}>
          {currentMode === 'register' && (
            <div>
              <label htmlFor="auth-name" className="mb-1 block text-sm text-gray-700">
                名前
              </label>
              <input
                id="auth-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="mb-1 block text-sm text-gray-700">
              メールアドレス
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>

          {currentMode !== 'forgot' && (
            <div>
              <label htmlFor="auth-password" className="mb-1 block text-sm text-gray-700">
                パスワード
              </label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>
          )}

          {currentMode === 'register' && (
            <div>
              <label
                htmlFor="auth-password-confirmation"
                className="mb-1 block text-sm text-gray-700"
              >
                パスワード（確認）
              </label>
              <input
                id="auth-password-confirmation"
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-slate-800 px-4 py-2 font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {loading ? '処理中...' : currentMode === 'forgot' ? '再設定メールを送信' : title}
          </button>

          <div className="flex items-center justify-between pt-1 text-sm">
            {currentMode !== 'forgot' ? (
              <button
                type="button"
                onClick={() => {
                  setCurrentMode('forgot');
                  setError('');
                  setMessage('');
                  setPassword('');
                  setPasswordConfirmation('');
                }}
                className="text-slate-600 underline hover:text-slate-900"
              >
                パスワードを忘れた場合
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setCurrentMode('login');
                  setError('');
                  setMessage('');
                }}
                className="text-slate-600 underline hover:text-slate-900"
              >
                ログインに戻る
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
