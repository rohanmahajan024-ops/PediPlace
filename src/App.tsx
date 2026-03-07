import React, { useState } from 'react';
import LoginPage from './components/LoginPage';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SystemsList from './components/SystemsList';
import SystemInterface from './components/SystemInterface';
import SponsorList from './components/SponsorList';
import SponsorChatInterface from './components/SponsorChatInterface';

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

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedSystem, setSelectedSystem] = useState<MedicalSystem | null>(null);
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab !== 'systems') {
      setSelectedSystem(null);
    }
    if (tab !== 'sponsors') {
      setSelectedSponsor(null);
    }
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'systems':
        return (
          <div className="flex h-full">
            <SystemsList
              onSystemSelect={setSelectedSystem}
              selectedSystem={selectedSystem}
            />
            {selectedSystem ? (
              <SystemInterface system={selectedSystem} />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🧠</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select an AI System</h3>
                  <p className="text-gray-500">Choose a medical AI system to start disease prediction and analysis</p>
                </div>
              </div>
            )}
          </div>
        );
      case 'sponsors':
        return (
          <div className="flex h-full">
            <SponsorList
              onSponsorSelect={setSelectedSponsor}
              selectedSponsor={selectedSponsor}
            />
            {selectedSponsor ? (
              <SponsorChatInterface sponsor={selectedSponsor} />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-white to-purple-50">
                <div className="text-center">
                  <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🤝</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Sponsor</h3>
                  <p className="text-gray-500">Choose a sponsor to manage partnership communications</p>
                </div>
              </div>
            )}
          </div>
        );
      case 'settings':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Settings</h1>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">System Configuration</h2>
              <p className="text-gray-600">Settings panel will be implemented in the next iteration.</p>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="h-screen flex bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;