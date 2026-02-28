import React, { useState } from 'react';
import { Search, Phone, Mail, MessageSquare, Bot } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  status: 'online' | 'offline';
  avatar: string;
}

const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '+1 (555) 123-4567',
    lastMessage: 'Thank you for the appointment reminder',
    timestamp: '2 min ago',
    unread: 2,
    status: 'online',
    avatar: 'SJ'
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael.chen@email.com',
    phone: '+1 (555) 234-5678',
    lastMessage: 'When is my next check-up?',
    timestamp: '15 min ago',
    unread: 0,
    status: 'offline',
    avatar: 'MC'
  },
  {
    id: '3',
    name: 'Emma Wilson',
    email: 'emma.w@email.com',
    phone: '+1 (555) 345-6789',
    lastMessage: 'The treatment was excellent',
    timestamp: '1 hour ago',
    unread: 1,
    status: 'online',
    avatar: 'EW'
  },
  {
    id: '4',
    name: 'John Doe',
    email: 'john.doe@email.com',
    phone: '+1 (555) 456-7890',
    lastMessage: 'Need to reschedule appointment',
    timestamp: '2 hours ago',
    unread: 0,
    status: 'offline',
    avatar: 'JD'
  },
  {
    id: '5',
    name: 'Lisa Rodriguez',
    email: 'lisa.r@email.com',
    phone: '+1 (555) 567-8901',
    lastMessage: 'Insurance questions',
    timestamp: '3 hours ago',
    unread: 3,
    status: 'online',
    avatar: 'LR'
  }
];

interface CustomerListProps {
  onCustomerSelect: (customer: Customer) => void;
  selectedCustomer: Customer | null;
}

export default function CustomerList({ onCustomerSelect, selectedCustomer }: CustomerListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = mockCustomers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-80 border-r border-gray-200 bg-white h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Patients</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Customer List */}
      <div className="flex-1 overflow-y-auto">
        {filteredCustomers.map((customer) => (
          <div
            key={customer.id}
            onClick={() => onCustomerSelect(customer)}
            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
              selectedCustomer?.id === customer.id ? 'bg-blue-50 border-r-2 border-r-blue-500' : ''
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                  {customer.avatar}
                </div>
                {customer.status === 'online' && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-medium text-gray-900 truncate">{customer.name}</h3>
                  <span className="text-xs text-gray-500">{customer.timestamp}</span>
                </div>
                <p className="text-sm text-gray-600 truncate">{customer.lastMessage}</p>
                <p className="text-xs text-gray-500 mt-1">{customer.email}</p>
              </div>
              {customer.unread > 0 && (
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-medium">{customer.unread}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}