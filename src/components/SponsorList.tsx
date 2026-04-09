import React, { useState } from 'react';
import { Search, Building, DollarSign, TrendingUp, Award, MapPin, ChevronDown } from 'lucide-react';
import { Sponsor } from '../types/sponsor';
import { allSponsors } from '../data/sponsorData';

export { allSponsors };

const CATEGORY_OPTIONS = [
  'All',
  'Grant',
  'Special Events',
  'Direct Support',
  'Uninsured Children',
  'Access to Care',
  'Mental Health',
  'Endowment',
  'Reach Out and Read',
  'Indirect Support',
  'Services',
];

interface SponsorListProps {
  onSponsorSelect: (sponsor: Sponsor) => void;
  selectedSponsor: Sponsor | null;
}

export default function SponsorList({ onSponsorSelect, selectedSponsor }: SponsorListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'inactive'>('all');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  const filteredSponsors = allSponsors.filter((sponsor) => {
    const matchesSearch =
      sponsor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sponsor.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sponsor.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sponsor.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sponsor.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || sponsor.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
      case 'pending':
        return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400';
      case 'inactive':
        return 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-500';
      default:
        return 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-500';
    }
  };

  const getAvatarGradient = (id: string) => {
    const gradients = [
      'from-violet-500 to-pink-500',
      'from-blue-500 to-cyan-500',
      'from-emerald-500 to-teal-500',
      'from-orange-500 to-amber-500',
      'from-rose-500 to-pink-500',
      'from-indigo-500 to-purple-500',
    ];
    return gradients[parseInt(id) % gradients.length];
  };

  const totalContributions = allSponsors.reduce((sum, s) => sum + s.contribution, 0);
  const activeCount = allSponsors.filter((s) => s.status === 'active').length;
  const pendingCount = allSponsors.filter((s) => s.status === 'pending').length;

  return (
    <div className="w-96 border-r border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 h-full flex flex-col transition-colors duration-200">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Sponsors</h2>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg">
            <TrendingUp className="w-3 h-3" />
            <span>2023 – 2026</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 p-2.5 rounded-xl">
            <div className="flex items-center gap-1.5 mb-1">
              <Building className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              <span className="text-[10px] font-medium text-blue-700 dark:text-blue-400">Total</span>
            </div>
            <p className="text-lg font-bold text-blue-900 dark:text-blue-300">{allSponsors.length}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 p-2.5 rounded-xl">
            <div className="flex items-center gap-1.5 mb-1">
              <Award className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">Active</span>
            </div>
            <p className="text-lg font-bold text-emerald-900 dark:text-emerald-300">{activeCount}</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 p-2.5 rounded-xl">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400">Pending</span>
            </div>
            <p className="text-lg font-bold text-amber-900 dark:text-amber-300">{pendingCount}</p>
          </div>
        </div>

        {/* Total Funding */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-3 mb-4">
          <p className="text-[10px] font-medium text-blue-100 mb-0.5">Total Donations Received</p>
          <p className="text-xl font-bold text-white">${(totalContributions / 1000).toFixed(1)}K</p>
          <p className="text-[10px] text-blue-200">${totalContributions.toLocaleString()} total contributions</p>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-600 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, city, category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-600 pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-400 dark:focus:border-cyan-500/60 focus:ring-2 focus:ring-blue-100 dark:focus:ring-cyan-500/15 transition-all"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl mb-3">
          {(['all', 'active', 'pending', 'inactive'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all ${
                statusFilter === s
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-cyan-400 shadow-sm'
                  : 'text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'
              }`}
            >
              {s === 'all' ? `All (${allSponsors.length})` : s}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="relative">
          <button
            onClick={() => setShowCategoryMenu(!showCategoryMenu)}
            className="w-full flex items-center justify-between bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 px-3 py-2 rounded-xl text-sm transition-all hover:border-blue-300 dark:hover:border-slate-600"
          >
            <span className="text-xs font-medium">Fund: {categoryFilter}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCategoryMenu ? 'rotate-180' : ''}`} />
          </button>
          {showCategoryMenu && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg z-10 py-1 max-h-48 overflow-y-auto">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setCategoryFilter(cat); setShowCategoryMenu(false); }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                    categoryFilter === cat
                      ? 'text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-cyan-500/10'
                      : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/60'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sponsor List */}
      <div className="flex-1 overflow-y-auto" onClick={() => setShowCategoryMenu(false)}>
        {filteredSponsors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <Search className="w-8 h-8 text-gray-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400">No sponsors found</p>
            <p className="text-xs text-gray-400 dark:text-slate-600 mt-0.5">Try adjusting your filters</p>
          </div>
        ) : (
          filteredSponsors.map((sponsor) => (
            <div
              key={sponsor.id}
              onClick={() => onSponsorSelect(sponsor)}
              className={`p-4 border-b border-gray-50 dark:border-slate-800/60 cursor-pointer transition-colors ${
                selectedSponsor?.id === sponsor.id
                  ? 'bg-blue-50 dark:bg-cyan-500/5 border-r-2 border-r-blue-500 dark:border-r-cyan-500'
                  : 'hover:bg-gray-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${getAvatarGradient(sponsor.id)} rounded-xl flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0 shadow-sm`}>
                  {sponsor.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">
                      {sponsor.name}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ml-2 ${getStatusStyle(sponsor.status)}`}>
                      {sponsor.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {sponsor.city ? (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 text-gray-400 dark:text-slate-600" />
                        <span className="text-[11px] text-gray-400 dark:text-slate-600">{sponsor.city}, {sponsor.state}</span>
                      </div>
                    ) : null}
                    <span className="text-[10px] text-gray-300 dark:text-slate-700">•</span>
                    <span className="text-[11px] text-gray-400 dark:text-slate-600">{sponsor.type}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-emerald-500" />
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        ${sponsor.contribution.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-500 px-1.5 py-0.5 rounded-md font-medium">{sponsor.category}</span>
                      <span className="text-[10px] text-gray-400 dark:text-slate-600">{sponsor.lastContact}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-slate-500 text-xs">
            Showing {filteredSponsors.length} of {allSponsors.length}
          </span>
          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-gray-800 dark:text-slate-200 text-sm">{activeCount} Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
