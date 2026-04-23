import React from 'react';
import {
  TrendingUp, HandHeart, DollarSign, Users, Target, MapPin, Bot, Trash2,
} from 'lucide-react';
import { allSponsors } from '../data/sponsorData';
import { getStoredLeads, BotLead } from './DonorDiscovery';

/* ── Real sponsor metrics ── */
const totalFunding = allSponsors.reduce((sum, s) => sum + s.contribution, 0);
const activeSponsors = allSponsors.filter((s) => s.status === 'active');
const pendingSponsors = allSponsors.filter((s) => s.status === 'pending');
const topDonors = [...allSponsors].sort((a, b) => b.contribution - a.contribution).slice(0, 8);
const maxContrib = topDonors[0]?.contribution ?? 1;

const categoryTotals = allSponsors.reduce<Record<string, number>>((acc, s) => {
  acc[s.category] = (acc[s.category] || 0) + s.contribution;
  return acc;
}, {});
const categorySorted = Object.entries(categoryTotals)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 8);
const maxCat = categorySorted[0]?.[1] ?? 1;

/* Recent donations (sponsors sorted by lastContact recency proxy: active first, then by id desc) */
const recentDonors = [...allSponsors]
  .filter((s) => s.status === 'active')
  .slice(0, 5);

const CATEGORY_COLORS: Record<string, string> = {
  Grant: 'bg-pedi-500',
  Endowment: 'bg-pedi-700',
  'Uninsured Children': 'bg-pedi-orange-500',
  'Special Events': 'bg-pedi-orange-400',
  'Access to Care': 'bg-pedi-400',
  'Mental Health': 'bg-pink-500',
  'Direct Support': 'bg-pedi-600',
  'Reach Out and Read': 'bg-amber-500',
  'Indirect Support': 'bg-slate-400',
  Services: 'bg-pedi-300',
};
const CATEGORY_BADGE: Record<string, string> = {
  Grant: 'bg-pedi-50 dark:bg-pedi-500/10 text-pedi-700 dark:text-pedi-400',
  Endowment: 'bg-pedi-100 dark:bg-pedi-700/10 text-pedi-800 dark:text-pedi-300',
  'Uninsured Children': 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400',
  'Special Events': 'bg-pedi-orange-50 dark:bg-pedi-orange-500/10 text-pedi-orange-700 dark:text-pedi-orange-400',
  'Access to Care': 'bg-pedi-50 dark:bg-pedi-400/10 text-pedi-600 dark:text-pedi-300',
  'Mental Health': 'bg-pink-50 dark:bg-pink-500/10 text-pink-700 dark:text-pink-400',
  'Direct Support': 'bg-pedi-50 dark:bg-pedi-600/10 text-pedi-700 dark:text-pedi-400',
  'Reach Out and Read': 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
};

const getAvatarGradient = (id: string) => {
  const g = [
    'from-pedi-400 to-pedi-600',
    'from-pedi-500 to-pedi-700',
    'from-pedi-orange-400 to-pedi-orange-600',
    'from-pedi-300 to-pedi-500',
    'from-pedi-600 to-pedi-800',
    'from-pedi-orange-300 to-pedi-500',
  ];
  const numeric = Number.parseInt(id, 10);
  const idx = Number.isNaN(numeric) ? 0 : numeric % g.length;
  return g[idx];
};

export default function Dashboard() {
  const [botLeads, setBotLeads] = React.useState<BotLead[]>([]);

  React.useEffect(() => {
    const loadLeads = () => setBotLeads(getStoredLeads());
    loadLeads();
    const interval = setInterval(loadLeads, 10000);
    return () => clearInterval(interval);
  }, []);

  const newLeads = botLeads.filter((l) => {
    const age = Date.now() - new Date(l.timestamp).getTime();
    return age < 7 * 24 * 60 * 60 * 1000;
  });
  const donationLeads = botLeads.filter((l) => l.donationAmount);
  const totalPotential = donationLeads.reduce((sum, l) => sum + (Number(l.donationAmount) || 0), 0);
  const totalRaisedWithBot = totalFunding + totalPotential;
  const donorCountWithBot = allSponsors.length + donationLeads.length;
  const activeCountWithBot = activeSponsors.length + donationLeads.length;

  const categoryWithBot = React.useMemo(() => {
    const base = { ...categoryTotals };
    if (totalPotential > 0) {
      base['Bot Pledges'] = (base['Bot Pledges'] || 0) + totalPotential;
    }
    return Object.entries(base).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [totalPotential]);
  const maxCatWithBot = categoryWithBot[0]?.[1] ?? 1;

  const topBotDonors = React.useMemo(
    () =>
      donationLeads
        .filter((l) => Number(l.donationAmount) > 0)
        .map((l, idx) => ({
          id: `bot-${l.id}`,
          name: l.name || l.email || `Bot Donor ${idx + 1}`,
          contribution: Number(l.donationAmount),
          city: '',
          state: '',
          avatar: (l.name || l.email || 'BD')
            .split(' ')
            .filter(Boolean)
            .map((part) => part[0])
            .join('')
            .slice(0, 3)
            .toUpperCase(),
          category: 'Bot Pledge',
          lastContact: new Date(l.timestamp).toLocaleDateString(),
        })),
    [donationLeads],
  );
  const combinedTopDonors = React.useMemo(
    () =>
      [...topDonors, ...topBotDonors]
        .sort((a, b) => b.contribution - a.contribution)
        .slice(0, 8),
    [topBotDonors],
  );
  const maxContribCombined = combinedTopDonors[0]?.contribution ?? 1;

  const handleResetLeads = () => {
    if (!window.confirm('Reset all Donor Bot Leads? This cannot be undone.')) return;
    localStorage.removeItem('pediplace_bot_leads');
    setBotLeads([]);
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-slate-950 h-full overflow-y-auto transition-colors duration-200 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-pedi-600/70 dark:text-pedi-400/70 mt-0.5">
            Sponsor overview and donor bot pipeline activity
          </p>
        </div>
        {newLeads.length > 0 && (
          <div className="flex items-center gap-2 bg-pedi-50 dark:bg-pedi-500/10 border border-pedi-200 dark:border-pedi-500/20 px-3 py-2 rounded-xl">
            <div className="w-2 h-2 bg-pedi-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-pedi-700 dark:text-pedi-400">{newLeads.length} new bot lead{newLeads.length !== 1 ? 's' : ''} this week</span>
          </div>
        )}
      </div>

      {/* ── Bot Leads Panel ── */}
      {botLeads.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-pedi-50 dark:bg-pedi-500/10 rounded-xl flex items-center justify-center">
                <Bot className="w-4 h-4 text-pedi-600 dark:text-pedi-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800 dark:text-slate-200">Donor Bot Leads</h2>
                <p className="text-xs text-gray-400 dark:text-slate-600">Auto-updated from public PediBot conversations</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-lg font-bold text-pedi-600 dark:text-pedi-400">{botLeads.length}</p>
                <p className="text-[10px] text-gray-400 dark:text-slate-600 uppercase tracking-wider">Total</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-pedi-orange-600 dark:text-pedi-orange-400">${totalPotential.toLocaleString()}</p>
                <p className="text-[10px] text-gray-400 dark:text-slate-600 uppercase tracking-wider">Pipeline $</p>
              </div>
              <button
                onClick={handleResetLeads}
                className="flex items-center gap-1.5 text-xs font-semibold bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-3 py-2 rounded-xl border border-red-100 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Reset Leads
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-800">
                  {['Name', 'Interest', 'Program', 'Amount', 'Timeline', 'Date'].map((h) => (
                    <th key={h} className="text-left text-[11px] font-bold text-gray-400 dark:text-slate-600 uppercase tracking-wider pb-2 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {botLeads.slice(0, 8).map((lead) => (
                  <tr key={lead.id} className="border-b border-gray-50 dark:border-slate-800/60 last:border-b-0">
                    <td className="py-2.5 pr-4 font-semibold text-gray-800 dark:text-slate-200">{lead.name || '—'}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        lead.interest === 'donation' ? 'bg-pedi-50 dark:bg-pedi-500/10 text-pedi-700 dark:text-pedi-400' :
                        lead.interest === 'corporate' ? 'bg-pedi-100 dark:bg-pedi-600/10 text-pedi-800 dark:text-pedi-300' :
                        lead.interest === 'volunteer' ? 'bg-pedi-orange-50 dark:bg-pedi-orange-500/10 text-pedi-orange-700 dark:text-pedi-orange-400' :
                        'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                      }`}>{lead.interest || '—'}</span>
                    </td>
                    <td className="py-2.5 pr-4 text-gray-600 dark:text-slate-400">{lead.program || '—'}</td>
                    <td className="py-2.5 pr-4 font-semibold text-pedi-orange-600 dark:text-pedi-orange-400">{lead.donationAmount ? `$${Number(lead.donationAmount).toLocaleString()}` : '—'}</td>
                    <td className="py-2.5 pr-4 text-gray-500 dark:text-slate-500">{lead.timeline || '—'}</td>
                    <td className="py-2.5 text-gray-400 dark:text-slate-600">{new Date(lead.timestamp).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Section: Sponsors ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 bg-pedi-orange-50 dark:bg-pedi-orange-500/10 rounded-lg flex items-center justify-center">
            <HandHeart className="w-4 h-4 text-pedi-orange-600 dark:text-pedi-orange-400" />
          </div>
          <h2 className="text-sm font-bold text-gray-800 dark:text-slate-200">Sponsors &amp; Donations</h2>
          <span className="text-xs text-gray-400 dark:text-slate-600">(2023 – 2026 · Real Data)</span>
        </div>

        {/* Sponsor stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {[
            { title: 'Total Donors', value: String(donorCountWithBot), change: `${allSponsors.length} sponsors + ${donationLeads.length} bot`, trend: 'up', icon: Users, iconBg: 'bg-pedi-50 dark:bg-pedi-500/10', iconColor: 'text-pedi-600 dark:text-pedi-400' },
            { title: 'Active Donors', value: String(activeCountWithBot), change: `${Math.round((activeCountWithBot / Math.max(donorCountWithBot, 1)) * 100)}% of total`, trend: 'up', icon: TrendingUp, iconBg: 'bg-pedi-100 dark:bg-pedi-600/10', iconColor: 'text-pedi-700 dark:text-pedi-300' },
            { title: 'Total Raised', value: `$${(totalRaisedWithBot / 1000).toFixed(0)}K`, change: `$${totalRaisedWithBot.toLocaleString()}`, trend: 'up', icon: DollarSign, iconBg: 'bg-pedi-orange-50 dark:bg-pedi-orange-500/10', iconColor: 'text-pedi-orange-600 dark:text-pedi-orange-400' },
            { title: 'Pending Donors', value: String(pendingSponsors.length), change: 'Needs follow-up', trend: 'up', icon: Target, iconBg: 'bg-amber-50 dark:bg-amber-500/10', iconColor: 'text-amber-600 dark:text-amber-400' },
          ].map((stat) => (
            <div key={stat.title} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 hover:shadow-md dark:hover:shadow-black/20 transition-all">
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 ${stat.iconBg} rounded-xl flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
                <span className="text-xs font-medium text-gray-400 dark:text-slate-600 text-right max-w-[80px] leading-tight">{stat.change}</span>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-gray-500 dark:text-slate-500 mt-0.5">{stat.title}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Two-column: Top Donors + Fund Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Top Donors */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Top Donors</h3>
              <p className="text-xs text-gray-400 dark:text-slate-600 mt-0.5">Ranked by total contribution</p>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-slate-800/60">
              {combinedTopDonors.map((s, idx) => (
                <div key={s.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                  <span className="text-xs font-bold text-gray-400 dark:text-slate-600 w-4 text-center">{idx + 1}</span>
                  <div className={`w-8 h-8 bg-gradient-to-br ${getAvatarGradient(s.id)} rounded-lg flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0`}>
                    {s.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate">{s.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {s.city ? (
                        <div className="flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5 text-gray-400" />
                          <span className="text-[10px] text-gray-400 dark:text-slate-600">{s.city}, {s.state}</span>
                        </div>
                      ) : null}
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${CATEGORY_BADGE[s.category] ?? 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-500'}`}>
                        {s.category}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-pedi-600 dark:text-pedi-400">
                      ${s.contribution.toLocaleString()}
                    </p>
                    <div className="w-20 h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="h-full bg-pedi-400 rounded-full"
                        style={{ width: `${(s.contribution / maxContribCombined) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fund Category Breakdown */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Fund Distribution</h3>
              <p className="text-xs text-gray-400 dark:text-slate-600 mt-0.5">By donation category</p>
            </div>
            <div className="p-5 space-y-4">
              {categoryWithBot.map(([cat, amt]) => (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-gray-700 dark:text-slate-300 truncate">{cat}</span>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="text-xs text-gray-400 dark:text-slate-600">
                        {Math.round((amt / Math.max(totalRaisedWithBot, 1)) * 100)}%
                      </span>
                      <span className="text-xs font-bold text-gray-800 dark:text-slate-200">
                        ${amt >= 1000 ? `${(amt / 1000).toFixed(0)}K` : amt}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${CATEGORY_COLORS[cat] ?? 'bg-slate-400'}`}
                      style={{ width: `${(amt / maxCatWithBot) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="px-5 pb-5">
              <div className="bg-gradient-to-r from-pedi-500 to-pedi-700 rounded-xl p-4 text-white">
                <p className="text-[11px] font-medium text-pedi-100">Total Raised (All Funds)</p>
                <p className="text-2xl font-bold mt-0.5">${(totalRaisedWithBot / 1000).toFixed(1)}K</p>
                <p className="text-[11px] text-pedi-100 mt-0.5">{donorCountWithBot} unique donors (sponsors + bot)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Sponsor Activity */}
        <div className="mt-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Recent Donor Activity</h3>
              <p className="text-xs text-gray-400 dark:text-slate-600 mt-0.5">Latest contributions</p>
            </div>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-slate-800">
            {recentDonors.map((s) => (
              <div key={s.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className={`w-8 h-8 bg-gradient-to-br ${getAvatarGradient(s.id)} rounded-lg flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0`}>
                  {s.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate">{s.name}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-600 mt-0.5">{s.category} · {s.city}{s.state ? `, ${s.state}` : ''}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-pedi-600 dark:text-pedi-400">${s.contribution.toLocaleString()}</p>
                  <p className="text-[11px] text-gray-400 dark:text-slate-600 mt-0.5">{s.lastContact}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
