import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

function toJapaneseResetError(messages: string[]): string {
  const joined = messages.join(' ').toLowerCase();

  if (joined.includes('reset password token') || joined.includes('token is invalid')) {
    return '再設定トークンが無効です。再度、パスワード再設定メールを送信してください。';
  }

  if (joined.includes('password') && joined.includes('too short')) {
    return 'パスワードが短すぎます。6文字以上で入力してください。';
  }

  if (joined.includes('password confirmation') || joined.includes("doesn't match")) {
    return '確認用パスワードが一致しません。';
  }

  return '再設定に失敗しました。入力内容を確認して再度お試しください。';
}

export default function PasswordResetPage(): JSX.Element {
  const token = useMemo(() => {
    const SearchParams = globalThis.URLSearchParams;
    const params = new SearchParams(window.location.search);
    return params.get('token') || '';
  }, []);

  const [password, setPassword] = useState<string>('');
  const [passwordConfirmation, setPasswordConfirmation] = useState<string>('');
  const [tokenChecking, setTokenChecking] = useState<boolean>(true);
  const [tokenValid, setTokenValid] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setTokenChecking(false);
      setError('再設定トークンが無効です。再度メールを送信してください。');
      return;
    }

    axios
      .post('/api/v1/auth/password/validate_token', { token })
      .then((res) => {
        if (res.data?.success) {
          setTokenValid(true);
          setError('');
        } else {
          setTokenValid(false);
          setError('再設定トークンが古いため無効です。再度メールを送信してください。');
        }
      })
      .catch((e) => {
        setTokenValid(false);
        if (axios.isAxiosError(e)) {
          setError(
            e.response?.data?.message ||
              '再設定トークンが古いため無効です。再度メールを送信してください。'
          );
        } else {
          setError('再設定トークンが古いため無効です。再度メールを送信してください。');
        }
      })
      .finally(() => {
        setTokenChecking(false);
      });
  }, [token]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!tokenValid) {
      setError('再設定トークンが無効です。再度メールを送信してください。');
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
        setMessage('パスワードを再設定しました。ログイン画面へ移動します。');
        globalThis.setTimeout(() => {
          globalThis.location.href = '/?open=login&reset=success';
        }, 600);
      } else {
        setError('再設定に失敗しました');
      }
    } catch (e) {
      if (axios.isAxiosError(e)) {
        const messages = e.response?.data?.errors;
        if (Array.isArray(messages) && messages.length > 0) {
          setError(toJapaneseResetError(messages));
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

        {tokenChecking && (
          <p className="mb-3 text-sm text-slate-600">再設定トークンを確認中です...</p>
        )}

        {tokenValid && !tokenChecking && (
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
        )}
      </div>
    </div>
  );
}
