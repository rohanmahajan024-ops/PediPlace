import React from 'react';
import { Mail, MessageSquare, Reply, Brain, HandHeart, TrendingUp, Activity, AlertTriangle } from 'lucide-react';

const stats = [
  {
    title: 'AI Predictions',
    value: '2,847',
    change: '+18%',
    icon: Brain,
    color: 'blue',
    trend: 'up'
  },
  {
    title: 'Disease Analyses',
    value: '1,456',
    change: '+15%',
    icon: Activity,
    color: 'green',
    trend: 'up'
  },
  {
    title: 'Critical Alerts',
    value: '23',
    change: '-8%',
    icon: AlertTriangle,
    color: 'purple',
    trend: 'up'
  },
  {
    title: 'System Accuracy',
    value: '94.2%',
    change: '+2.1%',
    icon: TrendingUp,
    color: 'orange',
    trend: 'up'
  },
  {
    title: 'Sponsors',
    value: '23',
    change: '+2',
    icon: HandHeart,
    color: 'pink',
    trend: 'up'
  },
  {
    title: 'Messages Sent',
    value: '3,891',
    change: '+12%',
    icon: MessageSquare,
    color: 'teal',
    trend: 'up'
  }
];

const recentActivity = [
  { id: 1, type: 'prediction', message: 'CardioPredict AI detected high-risk patient for hypertension', time: '2 minutes ago' },
  { id: 2, type: 'analysis', message: 'NeuroScan completed brain imaging analysis for patient #1247', time: '15 minutes ago' },
  { id: 3, type: 'sponsor', message: 'New sponsorship proposal from MedTech Corp', time: '1 hour ago' },
  { id: 4, type: 'alert', message: 'Emergency Triage AI flagged critical condition in ER', time: '2 hours ago' },
  { id: 5, type: 'system', message: 'PulmoAnalyzer system maintenance completed successfully', time: '3 hours ago' },
];

export default function Dashboard() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">AI Medical Systems Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your healthcare AI systems and disease prediction analytics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.title} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-600">{stat.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'email' ? 'bg-blue-500' :
                activity.type === 'prediction' ? 'bg-blue-500' :
                activity.type === 'analysis' ? 'bg-green-500' :
                  activity.type === 'reply' ? 'bg-purple-500' :
                activity.type === 'alert' ? 'bg-red-500' :
                'bg-purple-500'
                }`} />
                <p className="text-gray-900 flex-1">{activity.message}</p>
                <span className="text-sm text-gray-500">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}