import React from 'react';
import { BarChart3, HandHeart, Settings, LogOut, Sun, Moon, Bot, Heart } from 'lucide-react';
import { AuthUser } from './LoginPage';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: AuthUser;
  onLogout: () => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

const menuItems = [
  { id: 'dashboard',  label: 'Dashboard',                   icon: BarChart3  },
  { id: 'donor_bot',  label: 'Pediplace Interest Checker',  icon: Bot        },
  { id: 'sponsors',   label: 'Donors',                      icon: HandHeart  },
  { id: 'settings',   label: 'Settings',                    icon: Settings   },
];

export default function Sidebar({ activeTab, onTabChange, user, onLogout, darkMode, onToggleDark }: SidebarProps) {
  const initials = `${user.firstName[0]}${user.lastName[0]}`;

  return (
    <div className="w-64 bg-white dark:bg-slate-900 border-r border-pedi-100 dark:border-slate-800 h-full flex flex-col transition-colors duration-200">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-pedi-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <img
                src="/pediplace-logo.png"
                alt="PediPlace"
                className="h-9 w-auto object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                  (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex';
                }}
              />
              <div className="hidden h-9 w-9 rounded-xl bg-gradient-to-br from-pedi-400 to-pedi-600 items-center justify-center shadow-md shadow-pedi-500/20">
                <Heart className="w-5 h-5 text-white" fill="white" />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-pedi-700 dark:text-pedi-400 leading-tight">PediPlace</p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 leading-tight">Healthcare Portal</p>
            </div>
          </div>
          {/* Dark mode toggle */}
          <button
            onClick={onToggleDark}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 dark:text-slate-500 hover:text-pedi-600 dark:hover:text-pedi-400 hover:bg-pedi-50 dark:hover:bg-slate-800 transition-all"
          >
            {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <p className="text-[10px] font-bold text-gray-400 dark:text-slate-700 uppercase tracking-widest px-3 py-2 mt-1 mb-0.5">
          Navigation
        </p>
        <ul className="space-y-0.5">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-sm font-medium group ${
                    isActive
                      ? 'bg-pedi-50 dark:bg-pedi-500/10 text-pedi-700 dark:text-pedi-400 border border-pedi-200 dark:border-pedi-500/20'
                      : 'text-gray-600 dark:text-slate-400 hover:text-pedi-700 dark:hover:text-pedi-300 hover:bg-pedi-50/60 dark:hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <item.icon
                    className={`flex-shrink-0 transition-colors ${
                      isActive
                        ? 'text-pedi-600 dark:text-pedi-400'
                        : 'text-gray-400 dark:text-slate-500 group-hover:text-pedi-500 dark:group-hover:text-pedi-400'
                    }`}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span className="flex-1">{item.label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 bg-pedi-500 dark:bg-pedi-400 rounded-full flex-shrink-0" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mission tagline */}
      <div className="mx-3 mb-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-pedi-500 to-pedi-600 text-white text-center">
        <p className="text-[10px] font-medium text-pedi-100 leading-tight">Care at Every Milestone</p>
      </div>

      {/* User footer */}
      <div className="p-3 border-t border-pedi-100 dark:border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-pedi-50 dark:hover:bg-slate-800/50 transition-all group cursor-default">
          <div className="w-8 h-8 bg-gradient-to-br from-pedi-400 to-pedi-600 dark:from-pedi-500/20 dark:to-pedi-700/20 border-0 dark:border dark:border-pedi-500/25 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-[11px] font-bold text-white dark:text-pedi-400">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate leading-tight">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-[11px] text-gray-400 dark:text-slate-600 truncate">{user.email}</p>
          </div>
          <button
            onClick={onLogout}
            title="Sign out"
            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            <LogOut style={{ width: '14px', height: '14px' }} />
          </button>
        </div>
      </div>
    </div>
  );
}
