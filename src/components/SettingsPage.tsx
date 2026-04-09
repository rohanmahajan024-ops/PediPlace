import React, { useState } from 'react';
import {
  User, Bell, Brain, HandHeart, ShieldCheck, Download,
  Sun, Moon, Info, ChevronRight, Check, Mail,
  Stethoscope, ToggleLeft, ToggleRight, AlertTriangle,
  FileDown, Trash2, Clock, Globe, Lock,
} from 'lucide-react';
import { AuthUser } from './LoginPage';
import { allSponsors } from '../data/sponsorData';

interface SettingsPageProps {
  user: AuthUser;
  darkMode: boolean;
  onToggleDark: () => void;
}

type Section = 'profile' | 'appearance' | 'notifications' | 'ai' | 'sponsors' | 'security' | 'data' | 'about';

const NAV_ITEMS: { id: Section; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'profile',       label: 'Profile',             icon: User,         description: 'Your account info' },
  { id: 'appearance',    label: 'Appearance',           icon: Sun,          description: 'Theme & display' },
  { id: 'notifications', label: 'Notifications',        icon: Bell,         description: 'Alerts & emails' },
  { id: 'ai',            label: 'AI Symptom Checker',   icon: Brain,        description: 'AI behavior & accuracy' },
  { id: 'sponsors',      label: 'Sponsor Management',   icon: HandHeart,    description: 'Outreach & templates' },
  { id: 'security',      label: 'Security',             icon: ShieldCheck,  description: 'Access & sessions' },
  { id: 'data',          label: 'Data & Export',        icon: Download,     description: 'Export or clear data' },
  { id: 'about',         label: 'About',                icon: Info,         description: 'Version & system info' },
];

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        enabled ? 'bg-blue-500 dark:bg-cyan-500' : 'bg-gray-200 dark:bg-slate-700'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
        <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200">{title}</h3>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-slate-800">
        {children}
      </div>
    </div>
  );
}

function RowItem({
  label, description, children,
}: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="flex-1 min-w-0 mr-4">
        <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{label}</p>
        {description && <p className="text-xs text-gray-400 dark:text-slate-600 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage({ user, darkMode, onToggleDark }: SettingsPageProps) {
  const [activeSection, setActiveSection] = useState<Section>('profile');

  /* ── Notification toggles ── */
  const [notifUrgentAI, setNotifUrgentAI] = useState(true);
  const [notifNewSponsor, setNotifNewSponsor] = useState(true);
  const [notifWeeklySummary, setNotifWeeklySummary] = useState(false);
  const [notifPendingFollowUp, setNotifPendingFollowUp] = useState(true);
  const [notifEmail, setNotifEmail] = useState(false);

  /* ── AI Symptom Checker settings ── */
  const [aiAutoSave, setAiAutoSave] = useState(true);
  const [aiShowUrgency, setAiShowUrgency] = useState(true);
  const [aiMaxConditions, setAiMaxConditions] = useState('5');
  const [aiUrgencyThreshold, setAiUrgencyThreshold] = useState('moderate');
  const [aiImageAnalysis, setAiImageAnalysis] = useState(true);
  const [aiDisclaimer, setAiDisclaimer] = useState(true);

  /* ── Sponsor settings ── */
  const [sponsorAutoReminder, setSponsorAutoReminder] = useState(true);
  const [sponsorReminderDays, setSponsorReminderDays] = useState('14');
  const [sponsorEmailTemplate, setSponsorEmailTemplate] = useState(
    'Dear {name},\n\nThank you for your continued support of PediPlace. Your contribution helps us provide quality pediatric care to children in need.\n\nWarm regards,\nPediPlace Team'
  );

  /* ── Security ── */
  const [sessionTimeout, setSessionTimeout] = useState('60');
  const [twoFactor, setTwoFactor] = useState(false);

  /* ── Export / Data ── */
  const [exportStatus, setExportStatus] = useState('');

  const exportSponsorsCSV = () => {
    const headers = ['Name', 'Phone', 'City', 'State', 'Contribution', 'Status', 'Category', 'Type', 'Last Contact'];
    const rows = allSponsors.map((s) => [
      `"${s.name}"`, s.phone, s.city, s.state,
      s.contribution, s.status, s.category, s.type, `"${s.lastContact}"`,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pediplace_sponsors.csv';
    a.click();
    URL.revokeObjectURL(url);
    setExportStatus('Exported successfully!');
    setTimeout(() => setExportStatus(''), 3000);
  };

  const activeNav = NAV_ITEMS.find((n) => n.id === activeSection)!;

  /* ────────────────── Section renderers ────────────────── */

  const renderProfile = () => (
    <div className="space-y-4">
      {/* Avatar + name */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg flex-shrink-0">
          {user.firstName[0]}{user.lastName[0]}
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{user.firstName} {user.lastName}</p>
          <p className="text-sm text-gray-500 dark:text-slate-500">{user.email}</p>
          <span className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-semibold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3 h-3" /> UTDallas Healthcare Team
          </span>
        </div>
      </div>

      <SectionCard title="Account Details">
        <RowItem label="First Name" description="Display name across the portal">
          <input
            defaultValue={user.firstName}
            className="w-36 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-blue-400 dark:focus:border-cyan-500/60 focus:ring-1 focus:ring-blue-100"
          />
        </RowItem>
        <RowItem label="Last Name">
          <input
            defaultValue={user.lastName}
            className="w-36 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-blue-400 dark:focus:border-cyan-500/60 focus:ring-1 focus:ring-blue-100"
          />
        </RowItem>
        <RowItem label="Email Address" description="Linked to your UTDallas account">
          <span className="text-sm text-gray-500 dark:text-slate-500 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> {user.email}
          </span>
        </RowItem>
        <RowItem label="Organization">
          <span className="text-sm text-gray-600 dark:text-slate-400">PediPlace · UTDallas</span>
        </RowItem>
        <RowItem label="Role" description="Assigned access level">
          <span className="text-sm font-medium text-blue-600 dark:text-cyan-400">Admin</span>
        </RowItem>
      </SectionCard>
    </div>
  );

  const renderAppearance = () => (
    <SectionCard title="Display Preferences">
      <RowItem label="Dark Mode" description="Switch between light and dark interface">
        <div className="flex items-center gap-2">
          <Sun className="w-4 h-4 text-amber-500" />
          <Toggle enabled={darkMode} onToggle={onToggleDark} />
          <Moon className="w-4 h-4 text-slate-400" />
        </div>
      </RowItem>
      <RowItem label="Current Theme" description="Active color scheme">
        <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
          {darkMode ? '🌙 Dark' : '☀️ Light'}
        </span>
      </RowItem>
      <RowItem label="Accent Color" description="Primary UI highlight color">
        <div className="flex items-center gap-2">
          {[
            { color: 'bg-blue-500', label: 'Blue' },
            { color: 'bg-violet-500', label: 'Violet' },
            { color: 'bg-emerald-500', label: 'Green' },
            { color: 'bg-cyan-500', label: 'Cyan' },
          ].map((c) => (
            <button
              key={c.label}
              title={c.label}
              className={`w-6 h-6 rounded-full ${c.color} ${c.label === 'Blue' ? 'ring-2 ring-offset-2 ring-blue-400' : ''} transition-transform hover:scale-110`}
            />
          ))}
        </div>
      </RowItem>
      <RowItem label="Sidebar Width" description="Compact or default navigation">
        <select className="text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none">
          <option>Default</option>
          <option>Compact</option>
        </select>
      </RowItem>
      <RowItem label="Date Format" description="How dates appear across the portal">
        <select className="text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none">
          <option>MM/DD/YYYY</option>
          <option>DD/MM/YYYY</option>
          <option>YYYY-MM-DD</option>
        </select>
      </RowItem>
    </SectionCard>
  );

  const renderNotifications = () => (
    <div className="space-y-4">
      <SectionCard title="In-App Alerts">
        <RowItem label="Urgent AI Cases" description="Alert when AI flags a high-urgency symptom check">
          <Toggle enabled={notifUrgentAI} onToggle={() => setNotifUrgentAI(!notifUrgentAI)} />
        </RowItem>
        <RowItem label="New Sponsor Activity" description="Notify when a new donation or pledge is received">
          <Toggle enabled={notifNewSponsor} onToggle={() => setNotifNewSponsor(!notifNewSponsor)} />
        </RowItem>
        <RowItem label="Pending Follow-Ups" description="Remind when sponsors haven't been contacted recently">
          <Toggle enabled={notifPendingFollowUp} onToggle={() => setNotifPendingFollowUp(!notifPendingFollowUp)} />
        </RowItem>
        <RowItem label="Weekly Summary" description="Receive a weekly digest of activity">
          <Toggle enabled={notifWeeklySummary} onToggle={() => setNotifWeeklySummary(!notifWeeklySummary)} />
        </RowItem>
      </SectionCard>

      <SectionCard title="Email Notifications">
        <RowItem label="Email Alerts" description={`Send alerts to ${user.email}`}>
          <Toggle enabled={notifEmail} onToggle={() => setNotifEmail(!notifEmail)} />
        </RowItem>
        <RowItem label="Email Address" description="Where alerts are delivered">
          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-500">
            <Mail className="w-3.5 h-3.5" />
            {user.email}
          </div>
        </RowItem>
      </SectionCard>
    </div>
  );

  const renderAI = () => (
    <div className="space-y-4">
      <SectionCard title="Analysis Behavior">
        <RowItem label="Auto-Save History" description="Automatically save symptom check sessions to local storage">
          <Toggle enabled={aiAutoSave} onToggle={() => setAiAutoSave(!aiAutoSave)} />
        </RowItem>
        <RowItem label="Show Urgency Level" description="Display urgency badge on symptom results">
          <Toggle enabled={aiShowUrgency} onToggle={() => setAiShowUrgency(!aiShowUrgency)} />
        </RowItem>
        <RowItem label="Image Analysis" description="Allow AI to analyze uploaded images (photos, PDFs)">
          <Toggle enabled={aiImageAnalysis} onToggle={() => setAiImageAnalysis(!aiImageAnalysis)} />
        </RowItem>
        <RowItem label="Show Medical Disclaimer" description="Display disclaimer banner on all AI results">
          <Toggle enabled={aiDisclaimer} onToggle={() => setAiDisclaimer(!aiDisclaimer)} />
        </RowItem>
      </SectionCard>

      <SectionCard title="Output Configuration">
        <RowItem label="Max Conditions Shown" description="Number of possible diagnoses displayed per check">
          <select
            value={aiMaxConditions}
            onChange={(e) => setAiMaxConditions(e.target.value)}
            className="text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none"
          >
            {['3','5','8','10'].map((v) => <option key={v}>{v}</option>)}
          </select>
        </RowItem>
        <RowItem label="Urgency Threshold" description="Minimum severity level to trigger an urgent alert">
          <select
            value={aiUrgencyThreshold}
            onChange={(e) => setAiUrgencyThreshold(e.target.value)}
            className="text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none"
          >
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
            <option value="critical">Critical Only</option>
          </select>
        </RowItem>
      </SectionCard>

      <div className="bg-amber-50 dark:bg-amber-500/8 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">Medical Disclaimer</p>
          <p className="text-xs text-amber-700 dark:text-amber-500 mt-0.5 leading-relaxed">
            PediPlace AI Symptom Checker is for informational purposes only. It does not replace professional medical advice, diagnosis, or treatment. Always consult a licensed healthcare provider.
          </p>
        </div>
      </div>
    </div>
  );

  const renderSponsors = () => (
    <div className="space-y-4">
      <SectionCard title="Follow-Up Reminders">
        <RowItem label="Auto Reminders" description="Alert when a sponsor hasn't been contacted recently">
          <Toggle enabled={sponsorAutoReminder} onToggle={() => setSponsorAutoReminder(!sponsorAutoReminder)} />
        </RowItem>
        <RowItem label="Reminder Interval" description="Days before a pending sponsor triggers a reminder">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={sponsorReminderDays}
              onChange={(e) => setSponsorReminderDays(e.target.value)}
              disabled={!sponsorAutoReminder}
              className="w-16 text-sm text-center bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 px-2 py-1.5 rounded-lg focus:outline-none disabled:opacity-40"
            />
            <span className="text-xs text-gray-400">days</span>
          </div>
        </RowItem>
      </SectionCard>

      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200">Default Outreach Email Template</h3>
          <p className="text-xs text-gray-400 dark:text-slate-600 mt-0.5">
            Used as starting point when composing sponsor emails. Use <code className="bg-gray-100 dark:bg-slate-800 px-1 rounded">{'{name}'}</code> as placeholder.
          </p>
        </div>
        <div className="p-6">
          <textarea
            value={sponsorEmailTemplate}
            onChange={(e) => setSponsorEmailTemplate(e.target.value)}
            rows={7}
            className="w-full text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 px-4 py-3 rounded-xl resize-none focus:outline-none focus:border-blue-400 dark:focus:border-cyan-500/60 focus:ring-1 focus:ring-blue-100"
          />
          <div className="flex justify-end mt-3">
            <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
              <Check className="w-4 h-4" /> Save Template
            </button>
          </div>
        </div>
      </div>

      <SectionCard title="Donor Summary">
        <RowItem label="Total Sponsors in Database">
          <span className="text-sm font-bold text-gray-800 dark:text-slate-200">{allSponsors.length}</span>
        </RowItem>
        <RowItem label="Active Donors">
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {allSponsors.filter((s) => s.status === 'active').length}
          </span>
        </RowItem>
        <RowItem label="Pending Follow-Up">
          <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
            {allSponsors.filter((s) => s.status === 'pending').length}
          </span>
        </RowItem>
        <RowItem label="Total Raised">
          <span className="text-sm font-bold text-blue-600 dark:text-cyan-400">
            ${allSponsors.reduce((s, d) => s + d.contribution, 0).toLocaleString()}
          </span>
        </RowItem>
      </SectionCard>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-4">
      <SectionCard title="Access Control">
        <RowItem label="Two-Factor Authentication" description="Adds an extra verification step on login">
          <Toggle enabled={twoFactor} onToggle={() => setTwoFactor(!twoFactor)} />
        </RowItem>
        <RowItem label="Session Timeout" description="Auto-logout after inactivity">
          <div className="flex items-center gap-2">
            <select
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(e.target.value)}
              className="text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none"
            >
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
              <option value="0">Never</option>
            </select>
          </div>
        </RowItem>
        <RowItem label="Authorized Users" description="Only these UTDallas emails may log in">
          <span className="text-sm text-gray-500 dark:text-slate-500">5 users</span>
        </RowItem>
      </SectionCard>

      <SectionCard title="Current Session">
        <RowItem label="Signed In As">
          <span className="text-sm text-gray-700 dark:text-slate-300">{user.firstName} {user.lastName}</span>
        </RowItem>
        <RowItem label="Account Email">
          <span className="text-sm text-gray-500 dark:text-slate-500">{user.email}</span>
        </RowItem>
        <RowItem label="Session Started">
          <span className="text-sm text-gray-500 dark:text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </RowItem>
        <RowItem label="Portal Access">
          <span className="text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full">
            Active
          </span>
        </RowItem>
      </SectionCard>
    </div>
  );

  const renderData = () => (
    <div className="space-y-4">
      <SectionCard title="Export Data">
        <RowItem
          label="Export Sponsor List (CSV)"
          description={`Download all ${allSponsors.length} donors with contribution data`}
        >
          <button
            onClick={exportSponsorsCSV}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" />
            {exportStatus || 'Download CSV'}
          </button>
        </RowItem>
        <RowItem
          label="Export AI Symptom History"
          description="Download all saved symptom check sessions"
        >
          <button className="flex items-center gap-2 bg-violet-500 hover:bg-violet-600 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
            <FileDown className="w-3.5 h-3.5" /> Download JSON
          </button>
        </RowItem>
      </SectionCard>

      <SectionCard title="Clear Data">
        <RowItem
          label="Clear AI Symptom History"
          description="Permanently removes all saved symptom check sessions from local storage"
        >
          <button className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold px-3 py-2 rounded-xl transition-colors border border-red-200 dark:border-red-500/20">
            <Trash2 className="w-3.5 h-3.5" /> Clear History
          </button>
        </RowItem>
        <RowItem
          label="Reset All Settings"
          description="Restore all settings to their default values"
        >
          <button className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-400 text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Reset Defaults
          </button>
        </RowItem>
      </SectionCard>
    </div>
  );

  const renderAbout = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
            <Stethoscope className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">PediPlace</h2>
            <p className="text-blue-200 text-sm">Denton Pediatric Healthcare Portal</p>
          </div>
        </div>
        <p className="text-blue-100 text-xs leading-relaxed">
          A pediatric health management platform combining AI-powered symptom analysis with sponsor relationship management — built by the UTDallas Healthcare Team.
        </p>
      </div>

      <SectionCard title="System Information">
        <RowItem label="Version">
          <span className="text-sm font-mono text-gray-600 dark:text-slate-400">v1.2.0</span>
        </RowItem>
        <RowItem label="Build">
          <span className="text-sm font-mono text-gray-600 dark:text-slate-400">2026.03</span>
        </RowItem>
        <RowItem label="AI Engine">
          <span className="text-sm text-gray-600 dark:text-slate-400">Azure OpenAI GPT-4o</span>
        </RowItem>
        <RowItem label="Frontend">
          <span className="text-sm text-gray-600 dark:text-slate-400">React 18 · Vite · Tailwind CSS</span>
        </RowItem>
        <RowItem label="Sponsor Records">
          <span className="text-sm font-semibold text-gray-800 dark:text-slate-200">{allSponsors.length} unique donors</span>
        </RowItem>
        <RowItem label="Data Range">
          <span className="text-sm text-gray-600 dark:text-slate-400">2023 – 2026</span>
        </RowItem>
      </SectionCard>

      <SectionCard title="API Status">
        {[
          { name: 'Azure OpenAI', status: 'Operational', color: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
          { name: 'Symptom Analysis Engine', status: 'Operational', color: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
          { name: 'Sponsor Data Storage', status: 'Local (offline)', color: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
          { name: 'Email Service', status: 'Not configured', color: 'text-gray-500 dark:text-slate-500', dot: 'bg-gray-400' },
        ].map((s) => (
          <RowItem key={s.name} label={s.name}>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${s.dot}`} />
              <span className={`text-xs font-medium ${s.color}`}>{s.status}</span>
            </div>
          </RowItem>
        ))}
      </SectionCard>

      <SectionCard title="Team">
        {[
          { name: 'Emily Lai', email: 'emily.lai@utdallas.edu' },
          { name: 'Rohan Mahajan', email: 'rohanshaileshkumar.mahajan@utdallas.edu' },
          { name: 'Maanasa Malladi', email: 'maanasakeertana.malladi@utdallas.edu' },
          { name: 'Sai Malladi', email: 'saivishnu.malladi@utdallas.edu' },
          { name: 'Mehar Matta', email: 'meharkaur.matta@utdallas.edu' },
        ].map((m) => (
          <RowItem key={m.email} label={m.name} description={m.email}>
            <Globe className="w-3.5 h-3.5 text-gray-300 dark:text-slate-700" />
          </RowItem>
        ))}
      </SectionCard>
    </div>
  );

  const sectionContent: Record<Section, React.ReactNode> = {
    profile: renderProfile(),
    appearance: renderAppearance(),
    notifications: renderNotifications(),
    ai: renderAI(),
    sponsors: renderSponsors(),
    security: renderSecurity(),
    data: renderData(),
    about: renderAbout(),
  };

  return (
    <div className="h-full flex bg-gray-50 dark:bg-slate-950 overflow-hidden transition-colors duration-200">

      {/* ── Left Nav ── */}
      <div className="w-64 flex-shrink-0 border-r border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto">
        <div className="p-5 border-b border-gray-100 dark:border-slate-800">
          <h1 className="text-base font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-xs text-gray-400 dark:text-slate-600 mt-0.5">Portal configuration</p>
        </div>
        <nav className="p-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors mb-0.5 ${
                activeSection === item.id
                  ? 'bg-blue-50 dark:bg-cyan-500/10 text-blue-600 dark:text-cyan-400'
                  : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{item.label}</p>
                <p className="text-[10px] opacity-70 truncate">{item.description}</p>
              </div>
              {activeSection === item.id && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-2xl">
          {/* Section header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center">
              <activeNav.icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{activeNav.label}</h2>
              <p className="text-xs text-gray-400 dark:text-slate-600">{activeNav.description}</p>
            </div>
          </div>

          {sectionContent[activeSection]}
        </div>
      </div>
    </div>
  );
}
