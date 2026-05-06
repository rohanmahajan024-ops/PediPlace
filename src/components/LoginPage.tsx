import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Sun, Moon, ArrowLeft, Heart } from 'lucide-react';

export interface AuthUser {
  email: string;
  firstName: string;
  lastName: string;
}

interface AllowedUser extends AuthUser {
  password?: string;
}

const DEFAULT_ACCESS_PASSWORD = '123';
const ADMIN_ACCESS_PASSWORD = 'Healthy2026!';

const ALLOWED_USERS: AllowedUser[] = [
  { email: 'emily.lai@utdallas.edu', firstName: 'Emily', lastName: 'Lai' },
  { email: 'rohanshaileshkumar.mahajan@utdallas.edu', firstName: 'Rohan', lastName: 'Mahajan' },
  { email: 'maanasakeertana.malladi@utdallas.edu', firstName: 'Maanasa', lastName: 'Malladi' },
  { email: 'saivishnu.malladi@utdallas.edu', firstName: 'Sai', lastName: 'Malladi' },
  { email: 'meharkaur.matta@utdallas.edu', firstName: 'Mehar', lastName: 'Matta' },
  { email: 'info@pediplace.org', firstName: 'PediPlace', lastName: 'Admin', password: ADMIN_ACCESS_PASSWORD },
  { email: 'angelica.olvera@pediplace.org', firstName: 'Angelica', lastName: 'Olvera', password: ADMIN_ACCESS_PASSWORD },
];

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
  darkMode: boolean;
  onToggleDark: () => void;
  onBack?: () => void;
}

export default function LoginPage({ onLogin, darkMode, onToggleDark, onBack }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const matched = ALLOWED_USERS.find(
      (u) => u.email === email.toLowerCase().trim()
    );

    const expectedPassword = matched?.password ?? DEFAULT_ACCESS_PASSWORD;

    if (!matched || password !== expectedPassword) {
      setError('Access denied. Invalid credentials or unauthorized email.');
      return;
    }

    setIsLoading(true);
    const { password: _pw, ...user } = matched;
    void _pw;
    setTimeout(() => {
      setIsLoading(false);
      onLogin(user);
    }, 900);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pedi-50 via-white to-pedi-100 dark:bg-none dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-200">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-pedi-200/40 dark:bg-pedi-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-pedi-orange-100/50 dark:bg-pedi-orange-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-pedi-100/30 dark:bg-pedi-700/5 rounded-full blur-3xl pointer-events-none" />

      {/* Dark mode subtle grid */}
      <div
        className="absolute inset-0 opacity-0 dark:opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-5 left-5 flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-pedi-600 dark:hover:text-pedi-400 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-3 py-2 rounded-xl shadow-sm transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Donor Discovery
        </button>
      )}

      {/* Dark mode toggle */}
      <button
        onClick={onToggleDark}
        className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:text-pedi-600 dark:hover:text-pedi-400 shadow-sm transition-all"
      >
        {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          {/* Logo / Icon */}
          <div className="flex justify-center mb-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pedi-400 to-pedi-600 flex items-center justify-center shadow-xl shadow-pedi-500/30">
                <img
                  src="/pediplace-logo.png"
                  alt="PediPlace"
                  className="h-10 w-auto object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                    (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex';
                  }}
                />
                <div className="hidden items-center justify-center">
                  <Heart className="w-8 h-8 text-white" fill="white" />
                </div>
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-pedi-orange-400 rounded-full border-2 border-white dark:border-slate-950 flex items-center justify-center">
                <span className="text-white text-[8px] font-bold">+</span>
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">PediPlace</h1>
          <p className="text-pedi-600 dark:text-pedi-400 mt-1 text-sm font-medium">
            Making healthcare a reality for every kid
          </p>
          <p className="text-gray-400 dark:text-slate-500 mt-0.5 text-xs">Staff Portal · UTDallas</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900/70 dark:backdrop-blur-2xl border border-pedi-100 dark:border-slate-700/40 rounded-2xl p-8 shadow-xl shadow-pedi-500/10 dark:shadow-black/60 transition-colors duration-200">
          {/* Subtle top accent bar */}
          <div className="absolute top-0 left-8 right-8 h-0.5 bg-gradient-to-r from-pedi-400 to-pedi-500 rounded-full -translate-y-px opacity-0" />

          <p className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-6">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-600 w-4 h-4" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/60 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-600 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-pedi-400 dark:focus:border-pedi-500/60 focus:ring-2 focus:ring-pedi-100 dark:focus:ring-pedi-500/15 transition-all text-sm"
                  placeholder="name@UTDallas.edu"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-600 w-4 h-4" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/60 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-600 pl-10 pr-12 py-3 rounded-xl focus:outline-none focus:border-pedi-400 dark:focus:border-pedi-500/60 focus:ring-2 focus:ring-pedi-100 dark:focus:ring-pedi-500/15 transition-all text-sm"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-600 hover:text-pedi-500 dark:hover:text-pedi-400 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 text-sm">
                <span className="w-1.5 h-1.5 bg-red-500 dark:bg-red-400 rounded-full flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-gradient-to-r from-pedi-500 to-pedi-600 dark:from-pedi-500 dark:to-pedi-700 hover:from-pedi-400 hover:to-pedi-600 dark:hover:from-pedi-400 dark:hover:to-pedi-600 text-white py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-pedi-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Access Portal</span>
                  <span className="opacity-70 text-base">→</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Mission tagline */}
        <div className="mt-5 text-center space-y-1">
          <p className="text-xs text-gray-400 dark:text-slate-600">
            Restricted access — UTDallas Healthcare Team only
          </p>
          <p className="text-xs text-pedi-500/70 dark:text-pedi-700 italic">
            "Care at Every Milestone"
          </p>
        </div>
      </div>
    </div>
  );
}
