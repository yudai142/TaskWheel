import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HomeIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  CogIcon,
  Bars3Icon,
  XMarkIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import type { WorksheetSummary } from '../types';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.ComponentProps<'svg'>>;
}

interface Notification {
  message: string;
  type: 'success' | 'error';
}

interface LayoutProps {
  children: React.ReactNode;
  currentUserName: string;
  onLogout: () => Promise<void>;
  worksheets: WorksheetSummary[];
  activeWorksheetId: number | null;
  onWorksheetSelect: (id: number) => void;
  onEditWorksheet: (worksheet: WorksheetSummary) => void;
  showWorksheetModal: boolean;
  newWorksheetName: string;
  onShowWorksheetModal: (show: boolean) => void;
  onNewWorksheetNameChange: (name: string) => void;
  onCreateWorksheet: () => Promise<void>;
  worksheetNotification: Notification | null;
  onWorksheetNotificationDismiss: () => void;
  isDemoUser?: boolean;
}

export default function Layout({
  children,
  currentUserName,
  onLogout,
  worksheets,
  activeWorksheetId,
  onWorksheetSelect,
  onEditWorksheet,
  showWorksheetModal,
  newWorksheetName,
  onShowWorksheetModal,
  onNewWorksheetNameChange,
  onCreateWorksheet,
  worksheetNotification,
  onWorksheetNotificationDismiss,
  isDemoUser = false,
}: LayoutProps): JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  const navigation: NavItem[] = [
    { name: 'ダッシュボード', href: '/', icon: HomeIcon },
    { name: 'メンバー', href: '/members', icon: UserGroupIcon },
    { name: 'タスク', href: '/works', icon: ClipboardDocumentListIcon },
    { name: '履歴', href: '/history', icon: CalendarIcon },
    { name: '設定', href: '/settings', icon: CogIcon },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white shadow transition-all duration-300 flex flex-col`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className={`font-bold text-lg ${!sidebarOpen && 'hidden'} text-primary-600`}>
            TaskWheel
          </h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {sidebarOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-primary-50 group transition-colors"
            >
              <item.icon className="w-6 h-6" />
              {sidebarOpen && <span className="ml-3">{item.name}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t space-y-2">
          {sidebarOpen && <p className="text-xs text-gray-500 text-center">{currentUserName}</p>}
          <button
            onClick={() => {
              void onLogout();
            }}
            className={`w-full rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors ${
              !sidebarOpen && 'p-2 text-center'
            }`}
          >
            {sidebarOpen ? 'ログアウト' : '出'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Notification Popup */}
        {worksheetNotification && (
          <div className="fixed top-6 right-6 z-50 max-w-sm w-full animate-fade-in">
            <div
              className={`rounded-xl shadow-lg p-4 flex items-start gap-3 border ${
                worksheetNotification.type === 'success'
                  ? 'bg-green-50 border-green-300 text-green-900'
                  : 'bg-red-50 border-red-300 text-red-900'
              }`}
            >
              <div className="flex-1 whitespace-pre-wrap text-sm font-medium">
                {worksheetNotification.message}
              </div>
              <button
                onClick={onWorksheetNotificationDismiss}
                aria-label="通知を閉じる"
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Worksheet Modal */}
        {showWorksheetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">新しいワークシートを作成</h3>
                <button
                  onClick={() => onShowWorksheetModal(false)}
                  aria-label="モーダルを閉じる"
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="ワークシート名"
                  value={newWorksheetName}
                  onChange={(e) => onNewWorksheetNameChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      void onCreateWorksheet();
                    }
                  }}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => onShowWorksheetModal(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={() => void onCreateWorksheet()}
                    className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                  >
                    作成
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="bg-white shadow">
          <div className="px-6 py-3 border-b border-gray-200">
            {/* Worksheet Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {worksheets.map((worksheet: WorksheetSummary) => (
                <div key={worksheet.id} className="relative">
                  <button
                    key={`${worksheet.id}-select`}
                    role="tab"
                    onClick={() =>
                      activeWorksheetId === worksheet.id
                        ? onEditWorksheet(worksheet)
                        : onWorksheetSelect(worksheet.id)
                    }
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                      activeWorksheetId === worksheet.id
                        ? 'bg-primary-600 text-white border border-primary-600 hover:bg-primary-700'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    title={
                      activeWorksheetId === worksheet.id ? 'クリックで編集' : 'クリックで切り替え'
                    }
                  >
                    {worksheet.name}
                  </button>
                </div>
              ))}
              <button
                onClick={() =>
                  isDemoUser
                    ? alert('デモアカウントではワークシートを作成できません')
                    : onShowWorksheetModal(true)
                }
                className="flex items-center gap-1 px-3 py-2 rounded-lg border-2 border-primary-200 text-primary-600 hover:bg-primary-50 transition-colors whitespace-nowrap"
                title="新しいワークシートを作成"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Area */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
