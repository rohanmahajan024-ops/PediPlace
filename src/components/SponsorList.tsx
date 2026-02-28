import React, { useState } from 'react';
import { Search, Building, DollarSign, TrendingUp, Award } from 'lucide-react';

interface Sponsor {
  id: string;
  name: string;
  company: string;
  email: string;
  contribution: number;
  status: 'active' | 'pending' | 'inactive';
  lastContact: string;
  category: string;
  avatar: string;
}

const mockSponsors: Sponsor[] = [
  {
    id: '1',
    name: 'Dr. Robert Smith',
    company: 'MedTech Corporation',
    email: 'r.smith@medtech.com',
    contribution: 50000,
    status: 'active',
    lastContact: '2 days ago',
    category: 'Equipment',
    avatar: 'MT'
  },
  {
    id: '2',
    name: 'Maria Garcia',
    company: 'Healthcare Plus Foundation',
    email: 'm.garcia@hcplus.org',
    contribution: 25000,
    status: 'active',
    lastContact: '1 week ago',
    category: 'Research',
    avatar: 'HP'
  },
  {
    id: '3',
    name: 'James Wilson',
    company: 'Children\'s Health Initiative',
    email: 'j.wilson@childrenshealth.org',
    contribution: 35000,
    status: 'pending',
    lastContact: '3 days ago',
    category: 'Programs',
    avatar: 'CH'
  },
  {
    id: '4',
    name: 'Sarah Johnson',
    company: 'Wellness Partners',
    email: 's.johnson@wellness.com',
    contribution: 15000,
    status: 'active',
    lastContact: '5 days ago',
    category: 'Training',
    avatar: 'WP'
  }
];

interface SponsorListProps {
  onSponsorSelect: (sponsor: Sponsor) => void;
  selectedSponsor: Sponsor | null;
}

export default function SponsorList({ onSponsorSelect, selectedSponsor }: SponsorListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSponsors = mockSponsors.filter(sponsor =>
    sponsor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sponsor.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalContributions = mockSponsors.reduce((sum, sponsor) => sum + sponsor.contribution, 0);

  return (
    <div className="w-96 border-r border-gray-200 bg-white h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Sponsors</h2>
          <div className="flex items-center space-x-2 text-sm text-green-600 font-medium">
            <TrendingUp className="w-4 h-4" />
            <span>+12% this month</span>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <Building className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Total Sponsors</span>
            </div>
            <p className="text-lg font-bold text-blue-900">{mockSponsors.length}</p>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">Total Funding</span>
            </div>
            <p className="text-lg font-bold text-green-900">${totalContributions.toLocaleString()}</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search sponsors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Sponsor List */}
      <div className="flex-1 overflow-y-auto">
        {filteredSponsors.map((sponsor) => (
          <div
            key={sponsor.id}
            onClick={() => onSponsorSelect(sponsor)}
            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
              selectedSponsor?.id === sponsor.id ? 'bg-blue-50 border-r-2 border-r-blue-500' : ''
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                {sponsor.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{sponsor.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sponsor.status)}`}>
                    {sponsor.status}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-700 truncate">{sponsor.company}</p>
                <p className="text-xs text-gray-500 mb-2">{sponsor.category}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-3 h-3 text-green-500" />
                    <span className="text-sm font-medium text-green-600">
                      ${sponsor.contribution.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{sponsor.lastContact}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Active Partnerships</span>
          <div className="flex items-center space-x-1">
            <Award className="w-4 h-4 text-yellow-500" />
            <span className="font-medium text-gray-900">{mockSponsors.filter(s => s.status === 'active').length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}