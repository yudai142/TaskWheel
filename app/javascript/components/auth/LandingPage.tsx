import React from 'react';

interface LandingPageProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onDemoLogin?: () => void;
}

function csrfToken(): string {
  const doc = globalThis.document;
  if (!doc) {
    return '';
  }

  const meta = doc.querySelector('meta[name="csrf-token"]');
  return meta?.getAttribute('content') || '';
}

export default function LandingPage({
  onOpenLogin,
  onOpenRegister,
  onDemoLogin,
}: LandingPageProps): JSX.Element {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-teal-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-4xl font-black text-slate-900">TaskWheel</h1>
        <p className="mb-8 text-slate-700">タスクの割り当てを楽に管理にするアプリ</p>

        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <h2 className="mb-4 text-xl font-bold text-slate-900">はじめる</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onOpenRegister}
              className="rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700"
            >
              新規登録
            </button>
            <button
              type="button"
              onClick={onOpenLogin}
              className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-900 hover:bg-slate-50"
            >
              ログイン
            </button>
            <button
              type="button"
              onClick={onDemoLogin}
              className="rounded-lg border border-slate-300 bg-slate-100 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-200"
            >
              デモでログイン
            </button>
            <form action="/users/auth/google_oauth2" method="post" className="contents">
              <input type="hidden" name="authenticity_token" value={csrfToken()} />
              <button
                type="submit"
                className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-center font-semibold text-slate-900 hover:bg-slate-50"
              >
                Googleでログイン
              </button>
            </form>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <h2 className="mb-4 text-xl font-bold text-slate-900">アプリの使い方（ざっくり）</h2>
          <ol className="list-decimal space-y-2 pl-5 text-slate-700">
            <li>ワークシートを作成して、運用単位ごとに管理します。</li>
            <li>メンバーとタスクを登録します。</li>
            <li>固定・除外設定を必要に応じて設定します。</li>
            <li>ダッシュボードで日付を選び、シャッフル実行で割り当てます。</li>
            <li>履歴画面で過去の割り当てを確認します。</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
