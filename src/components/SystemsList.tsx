import React, { useState } from 'react';
import { Search, Brain, Activity, Stethoscope, Eye, Heart, Zap, AlertTriangle } from 'lucide-react';

interface MedicalSystem {
  id: string;
  name: string;
  description: string;
  category: string;
  accuracy: number;
  lastUsed: string;
  status: 'active' | 'maintenance' | 'offline';
  icon: React.ComponentType<any>;
  color: string;
}

const mockSystems: MedicalSystem[] = [
  {
    id: '1',
    name: 'CardioPredict AI',
    description: 'Advanced cardiovascular disease prediction using ECG analysis and patient history',
    category: 'Cardiology',
    accuracy: 94.2,
    lastUsed: '2 hours ago',
    status: 'active',
    icon: Heart,
    color: 'red'
  },
  {
    id: '2',
    name: 'NeuroScan Diagnostics',
    description: 'Neurological disorder detection through brain imaging and symptom analysis',
    category: 'Neurology',
    accuracy: 91.8,
    lastUsed: '4 hours ago',
    status: 'active',
    icon: Brain,
    color: 'purple'
  },
  {
    id: '3',
    name: 'PulmoAnalyzer',
    description: 'Respiratory disease prediction using chest X-rays and breathing patterns',
    category: 'Pulmonology',
    accuracy: 89.5,
    lastUsed: '1 hour ago',
    status: 'active',
    icon: Activity,
    color: 'blue'
  },
  {
    id: '4',
    name: 'OptiVision AI',
    description: 'Eye disease detection and vision problem prediction system',
    category: 'Ophthalmology',
    accuracy: 96.1,
    lastUsed: '30 min ago',
    status: 'active',
    icon: Eye,
    color: 'green'
  },
  {
    id: '5',
    name: 'DiagnosticAssist Pro',
    description: 'General symptom analysis and preliminary diagnosis suggestions',
    category: 'General Medicine',
    accuracy: 87.3,
    lastUsed: '15 min ago',
    status: 'maintenance',
    icon: Stethoscope,
    color: 'orange'
  },
  {
    id: '6',
    name: 'Emergency Triage AI',
    description: 'Critical condition assessment and emergency priority classification',
    category: 'Emergency Medicine',
    accuracy: 92.7,
    lastUsed: '5 min ago',
    status: 'active',
    icon: Zap,
    color: 'yellow'
  }
];

interface SystemsListProps {
  onSystemSelect: (system: MedicalSystem) => void;
  selectedSystem: MedicalSystem | null;
}

export default function SystemsList({ onSystemSelect, selectedSystem }: SystemsListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSystems = mockSystems.filter(system =>
    system.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    system.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    system.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'offline': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 95) return 'text-green-600';
    if (accuracy >= 90) return 'text-blue-600';
    if (accuracy >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="w-96 border-r border-gray-200 bg-white h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">AI Medical Systems</h2>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-600 font-medium">Systems Online</span>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <Brain className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Active Systems</span>
            </div>
            <p className="text-lg font-bold text-blue-900">{mockSystems.filter(s => s.status === 'active').length}</p>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">Avg Accuracy</span>
            </div>
            <p className="text-lg font-bold text-green-900">
              {(mockSystems.reduce((sum, s) => sum + s.accuracy, 0) / mockSystems.length).toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search medical systems..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Systems List */}
      <div className="flex-1 overflow-y-auto">
        {filteredSystems.map((system) => (
          <div
            key={system.id}
            onClick={() => onSystemSelect(system)}
            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
              selectedSystem?.id === system.id ? 'bg-blue-50 border-r-2 border-r-blue-500' : ''
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className={`w-12 h-12 bg-${system.color}-100 rounded-lg flex items-center justify-center`}>
                <system.icon className={`w-6 h-6 text-${system.color}-600`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{system.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(system.status)}`}>
                    {system.status}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">{system.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {system.category}
                  </span>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${getAccuracyColor(system.accuracy)}`}>
                      {system.accuracy}%
                    </div>
                    <div className="text-xs text-gray-500">{system.lastUsed}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">System Health</span>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-medium text-green-700">Optimal</span>
          </div>
        </div>
      </div>
    </div>
  );
}