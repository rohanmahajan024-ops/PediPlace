import { useEffect, useState, useCallback } from 'react';
import { Bot, Download, Inbox } from 'lucide-react';
import { getStoredLeads, type BotLead } from './DonorDiscovery';

export default function BotLeadsPage() {
  const [leads, setLeads] = useState<BotLead[]>([]);

  const refresh = useCallback(() => {
    setLeads(getStoredLeads());
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 8000);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(t);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh]);

  const exportCSV = () => {
    const h = ['Name', 'Email', 'Interest', 'Program', 'Amount', 'Timeline', 'Volunteer', 'Date'];
    const rows = leads.map((l) => [
      l.name,
      l.email,
      l.interest,
      l.program,
      l.donationAmount,
      l.timeline,
      l.volunteerType,
      new Date(l.timestamp).toLocaleString(),
    ]);
    const csv = [h, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'pediplace_bot_leads.csv';
    a.click();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 flex-shrink-0">
              <Inbox className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Recent Bot Leads
                <span className="text-sm font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-2.5 py-0.5 rounded-full">
                  {leads.length}
                </span>
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Donor prospects captured from the public PediBot conversation (stored in this browser).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={exportCSV}
            disabled={leads.length === 0}
            className="inline-flex items-center justify-center gap-2 text-sm font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-4 py-2.5 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-500/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {leads.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-12 text-center">
            <Bot className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-slate-400 font-medium">No bot leads yet</p>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-2 max-w-md mx-auto">
              When visitors complete the public Donor Prospect Bot, their details will appear here.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-800/50">
                    <th className="text-left font-semibold text-gray-600 dark:text-slate-400 px-4 py-3 whitespace-nowrap">Date</th>
                    <th className="text-left font-semibold text-gray-600 dark:text-slate-400 px-4 py-3">Name</th>
                    <th className="text-left font-semibold text-gray-600 dark:text-slate-400 px-4 py-3">Email</th>
                    <th className="text-left font-semibold text-gray-600 dark:text-slate-400 px-4 py-3">Interest</th>
                    <th className="text-left font-semibold text-gray-600 dark:text-slate-400 px-4 py-3">Program</th>
                    <th className="text-left font-semibold text-gray-600 dark:text-slate-400 px-4 py-3 whitespace-nowrap">Amount</th>
                    <th className="text-left font-semibold text-gray-600 dark:text-slate-400 px-4 py-3">Timeline</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-b border-gray-50 dark:border-slate-800/80 hover:bg-gray-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-gray-500 dark:text-slate-500 whitespace-nowrap text-xs">
                        {new Date(lead.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-slate-200">{lead.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-400">
                        {lead.email ? (
                          <a href={`mailto:${lead.email}`} className="text-blue-600 dark:text-cyan-400 hover:underline">
                            {lead.email}
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-400">{lead.interest || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-400 max-w-[160px] truncate" title={lead.program}>
                        {lead.program || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-800 dark:text-slate-300 whitespace-nowrap">
                        {lead.donationAmount && !Number.isNaN(Number(lead.donationAmount))
                          ? `$${Number(lead.donationAmount).toLocaleString()}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-slate-500">{lead.timeline || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
