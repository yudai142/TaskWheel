import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  HomeIcon,
  UsersIcon,
  ClipboardListIcon,
  CalendarIcon,
  CogIcon,
  MenuIcon,
  XIcon,
} from '@heroicons/react/outline'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const navigation = [
    { name: 'ダッシュボード', href: '/', icon: HomeIcon },
    { name: 'メンバー', href: '/members', icon: UsersIcon },
    { name: '当番', href: '/works', icon: ClipboardListIcon },
    { name: '履歴', href: '/history', icon: CalendarIcon },
    { name: '設定', href: '/settings', icon: CogIcon },
  ]

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
            DutyShuffle
          </h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {sidebarOpen ? (
              <XIcon className="w-5 h-5" />
            ) : (
              <MenuIcon className="w-5 h-5" />
            )}
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

        <div className="p-4 border-t text-xs text-gray-500 text-center">
          {sidebarOpen && <p>? 2026 DutyShuffle</p>}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="px-6 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">掃除当番管理</h2>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <span className="w-6 h-6">?</span>
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
  )
}
