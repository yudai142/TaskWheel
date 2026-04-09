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
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.ComponentProps<'svg'>>;
}

interface LayoutProps {
  children: React.ReactNode;
  currentUserName: string;
  currentWorksheetName: string;
  onLogout: () => Promise<void>;
}

export default function Layout({
  children,
  currentUserName,
  currentWorksheetName,
  onLogout,
}: LayoutProps): JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  const navigation: NavItem[] = [
    { name: 'ダッシュボード', href: '/', icon: HomeIcon },
    { name: 'メンバー', href: '/members', icon: UserGroupIcon },
    { name: '当番', href: '/works', icon: ClipboardDocumentListIcon },
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
          {sidebarOpen && <p className="text-xs text-gray-500 text-center">2026 TaskWheel</p>}
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
        {/* Header */}
        <header className="bg-white shadow">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="text-right text-sm text-gray-600">
              <p>{currentWorksheetName}</p>
              <p className="text-xs text-gray-500">{currentUserName}</p>
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
