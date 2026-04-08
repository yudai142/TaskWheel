import React, { useMemo, useState } from 'react';
import axios from 'axios';

export default function PasswordResetPage(): JSX.Element {
  const token = useMemo(() => {
    const SearchParams = globalThis.URLSearchParams;
    const params = new SearchParams(window.location.search);
    return params.get('token') || '';
  }, []);

  const [password, setPassword] = useState<string>('');
  const [passwordConfirmation, setPasswordConfirmation] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!token) {
      setError('トークンが無効です');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await axios.post('/api/v1/auth/password/reset', {
        token,
        password,
        password_confirmation: passwordConfirmation,
      });

      if (res.data?.success) {
        setMessage('パスワードを再設定しました。ログイン画面からログインしてください。');
      } else {
        setError('再設定に失敗しました');
      }
    } catch (e) {
      if (axios.isAxiosError(e)) {
        const messages = e.response?.data?.errors;
        if (Array.isArray(messages) && messages.length > 0) {
          setError(messages.join('、'));
        } else {
          setError('再設定に失敗しました');
        }
      } else {
        setError('再設定に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="mx-auto mt-20 w-full max-w-md rounded-xl bg-white p-6 shadow">
        <h1 className="mb-4 text-2xl font-bold text-slate-900">パスワード再設定</h1>

        {message && (
          <p className="mb-3 rounded bg-emerald-50 p-2 text-sm text-emerald-700">{message}</p>
        )}
        {error && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="reset-password" className="mb-1 block text-sm text-slate-700">
              新しいパスワード
            </label>
            <input
              id="reset-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </div>

          <div>
            <label
              htmlFor="reset-password-confirmation"
              className="mb-1 block text-sm text-slate-700"
            >
              新しいパスワード（確認）
            </label>
            <input
              id="reset-password-confirmation"
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {loading ? '再設定中...' : 'パスワードを再設定'}
          </button>
        </form>
      </div>
    </div>
  );
}
