import { useState } from 'react';
import LoginPage, { AuthUser } from './components/LoginPage';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SponsorList from './components/SponsorList';
import SponsorChatInterface from './components/SponsorChatInterface';
import SettingsPage from './components/SettingsPage';
import DonorDiscovery from './components/DonorDiscovery';
import BotLeadsPage from './components/BotLeadsPage';
import { HandHeart } from 'lucide-react';
import { Sponsor } from './types/sponsor';

function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  const handleLogin = (u: AuthUser) => {
    setUser(u);
    setShowLogin(false);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('dashboard');
    setSelectedSponsor(null);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab !== 'sponsors') setSelectedSponsor(null);
  };

  /* ── Public Donor Discovery (default, no login required) ── */
  if (!user && !showLogin) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <DonorDiscovery
          publicMode
          darkMode={darkMode}
          onToggleDark={() => setDarkMode(!darkMode)}
          onLoginClick={() => setShowLogin(true)}
        />
      </div>
    );
  }

  /* ── Login page ── */
  if (!user && showLogin) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <LoginPage
          onLogin={handleLogin}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode(!darkMode)}
          onBack={() => setShowLogin(false)}
        />
      </div>
    );
  }

  /* ── Admin portal (logged in) ── */
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;

      case 'donor_bot':
        return (
          <div className="flex-1 overflow-y-auto">
            <DonorDiscovery darkMode={darkMode} onToggleDark={() => setDarkMode(!darkMode)} />
          </div>
        );

      case 'sponsors':
        return (
          <div className="flex h-full">
            <SponsorList onSponsorSelect={setSelectedSponsor} selectedSponsor={selectedSponsor} />
            {selectedSponsor ? (
              <SponsorChatInterface sponsor={selectedSponsor} />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-slate-950">
                <div className="text-center">
                  <div className="w-16 h-16 bg-pedi-50 dark:bg-slate-800 border border-pedi-100 dark:border-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <HandHeart className="w-7 h-7 text-pedi-500 dark:text-pedi-400" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-800 dark:text-slate-200 mb-1.5">No sponsor selected</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-500 max-w-xs">
                    Choose a sponsor from the list to manage partnership communications
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case 'bot_leads':
        return <BotLeadsPage />;

      case 'settings':
        return (
          <SettingsPage
            user={user!}
            darkMode={darkMode}
            onToggleDark={() => setDarkMode(!darkMode)}
          />
        );

      default:
        return <Dashboard />;
    }
  };

  return (
    <div className={`${darkMode ? 'dark' : ''} h-screen flex`}>
      <div className="h-full flex w-full bg-gray-50 dark:bg-slate-950 transition-colors duration-200">
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          user={user!}
          onLogout={handleLogout}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode(!darkMode)}
        />
        <div className="flex-1 flex flex-col overflow-hidden">{renderContent()}</div>
      </div>
    </div>
  );
}

export default App;
