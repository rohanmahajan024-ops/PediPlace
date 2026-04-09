import React, { useState } from 'react';
import { Send, Mail, MessageSquare, Bot, Building, DollarSign, MoreVertical, FileText, Phone, MapPin } from 'lucide-react';
import { Sponsor } from '../types/sponsor';

interface Message {
  id: string;
  text: string;
  sender: 'sponsor' | 'agent';
  timestamp: string;
  type: 'message' | 'email';
}

const mockMessages: Message[] = [
  {
    id: '1',
    text: 'Thank you for reaching out about the sponsorship opportunities.',
    sender: 'sponsor',
    timestamp: '9:30 AM',
    type: 'message',
  },
  {
    id: '2',
    text: "We're excited to discuss how we can support PediPlace's mission. What specific programs are you looking to fund?",
    sender: 'agent',
    timestamp: '9:35 AM',
    type: 'message',
  },
  {
    id: '3',
    text: "We're particularly interested in supporting pediatric research initiatives and equipment upgrades.",
    sender: 'sponsor',
    timestamp: '9:40 AM',
    type: 'message',
  },
];

interface SponsorChatInterfaceProps {
  sponsor: Sponsor;
}

export default function SponsorChatInterface({ sponsor }: SponsorChatInterfaceProps) {
  const [activeTab, setActiveTab] = useState<'message' | 'email'>('message');
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState(mockMessages);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        text: newMessage,
        sender: 'agent',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: activeTab,
      };
      setMessages([...messages, message]);
      setNewMessage('');
    }
  };

  const generateAIResponse = async () => {
    setIsGenerating(true);
    setTimeout(() => {
      const aiMessage: Message = {
        id: Date.now().toString(),
        text: "Thank you for your continued support! We're looking for additional sponsors to help expand our pediatric healthcare services. Your partnership would make a significant impact on children's health in our community. Would you be interested in exploring new sponsorship opportunities with PediPlace?",
        sender: 'agent',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: activeTab,
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsGenerating(false);
    }, 2000);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active': return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10';
      case 'pending': return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10';
      default: return 'text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-800';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
              {sponsor.avatar}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">{sponsor.name}</h2>
              <p className="text-xs text-gray-400 dark:text-slate-500">{sponsor.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Building className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
                <span className="text-sm text-gray-500 dark:text-slate-400">{sponsor.company}</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${getStatusStyle(sponsor.status)}`}>
                  {sponsor.status.charAt(0).toUpperCase() + sponsor.status.slice(1)}
                </span>
                <span className="text-xs text-gray-400 dark:text-slate-600">{sponsor.category}</span>
                <span className="text-xs text-gray-400 dark:text-slate-600">{sponsor.type}</span>
                <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-600">
                  <MapPin className="w-3 h-3" />
                  <span>{sponsor.city}, {sponsor.state}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-600">
                  <Phone className="w-3 h-3" />
                  <span>{sponsor.phone}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                <DollarSign className="w-4 h-4" />
                <span className="text-lg font-bold">{sponsor.contribution.toLocaleString()}</span>
              </div>
              <span className="text-[11px] text-gray-400 dark:text-slate-600">Total Contribution</span>
            </div>
            <button className="p-2 text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
          {[
            { id: 'message', label: 'Messages', icon: MessageSquare },
            { id: 'email', label: 'Email', icon: Mail },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'message' | 'email')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-cyan-400 shadow-sm'
                  : 'text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition-colors">
            <FileText className="w-3.5 h-3.5" />
            <span>Documents</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages
          .filter((msg) => msg.type === activeTab)
          .map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'sponsor' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-md px-5 py-3 rounded-2xl shadow-sm ${
                  message.sender === 'sponsor'
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 border border-gray-100 dark:border-slate-700'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
                <p
                  className={`text-xs mt-1.5 ${
                    message.sender === 'sponsor' ? 'text-blue-200' : 'text-gray-400 dark:text-slate-600'
                  }`}
                >
                  {message.timestamp}
                </p>
              </div>
            </div>
          ))}

        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 px-5 py-3.5 rounded-2xl shadow-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-blue-400 dark:bg-cyan-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-blue-400 dark:bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                <div className="w-2 h-2 bg-blue-400 dark:bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors duration-200">
        <div className="flex items-center gap-3">
          <button
            onClick={generateAIResponse}
            disabled={isGenerating}
            title="Generate AI Response"
            className="p-2.5 bg-gradient-to-br from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white rounded-xl transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Bot className="w-4 h-4" />
          </button>
          <div className="flex-1 flex items-center gap-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus-within:border-blue-400 dark:focus-within:border-cyan-500/60 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-cyan-500/15 transition-all">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={activeTab === 'message' ? 'Type a message...' : 'Compose an email...'}
              className="flex-1 outline-none bg-transparent text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-600"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="text-blue-500 dark:text-cyan-500 hover:text-blue-600 dark:hover:text-cyan-400 disabled:text-gray-300 dark:disabled:text-slate-700 transition-colors flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
