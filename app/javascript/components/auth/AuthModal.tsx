import React, { useState } from 'react';

type Mode = 'login' | 'register';

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
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordConfirmation, setPasswordConfirmation] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const title = mode === 'login' ? 'ログイン' : '新規登録';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        await onLogin(email, password);
      } else {
        await onRegister(name, email, password, passwordConfirmation);
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : '認証に失敗しました');
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

        <form className="space-y-3" onSubmit={handleSubmit}>
          {mode === 'register' && (
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

          {mode === 'register' && (
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
            {loading ? '処理中...' : title}
          </button>
        </form>
      </div>
    </div>
  );
}
