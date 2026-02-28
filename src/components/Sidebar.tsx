import React from 'react';
import { BarChart3, Users, HandHeart, Guitar as Hospital, Settings } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'customers', label: 'Patients', icon: Users },
  { id: 'sponsors', label: 'Sponsors', icon: HandHeart },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Hospital className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">PediPlace</h2>
            <p className="text-sm text-gray-500">Healthcare Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 px-3 py-2">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-green-700">AD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
            <p className="text-xs text-gray-500 truncate">admin@pediplace.org</p>
          </div>
        </div>
      </div>
    </div>
  );
}