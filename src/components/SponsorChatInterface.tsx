import React, { useState } from 'react';
import { Send, Mail, MessageSquare, Bot, Building, DollarSign, MoreVertical, FileText } from 'lucide-react';

interface Sponsor {
  id: string;
  name: string;
  company: string;
  email: string;
  contribution: number;
  status: 'active' | 'pending' | 'inactive';
  category: string;
  avatar: string;
}

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
    type: 'message'
  },
  {
    id: '2',
    text: 'We\'re excited to discuss how we can support PediPlace\'s mission. What specific programs are you looking to fund?',
    sender: 'agent',
    timestamp: '9:35 AM',
    type: 'message'
  },
  {
    id: '3',
    text: 'We\'re particularly interested in supporting pediatric research initiatives and equipment upgrades.',
    sender: 'sponsor',
    timestamp: '9:40 AM',
    type: 'message'
  }
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
        type: activeTab
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
        type: activeTab
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsGenerating(false);
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'inactive': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-white to-blue-50">
      {/* Enhanced Header */}
      <div className="p-6 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {sponsor.avatar}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{sponsor.name}</h2>
              <div className="flex items-center space-x-2">
                <Building className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 font-medium">{sponsor.company}</span>
              </div>
              <div className="flex items-center space-x-4 mt-1">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(sponsor.status)}`}>
                  {sponsor.status.charAt(0).toUpperCase() + sponsor.status.slice(1)}
                </span>
                <span className="text-sm text-gray-500">{sponsor.category}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="flex items-center space-x-1 text-green-600">
                <DollarSign className="w-4 h-4" />
                <span className="text-lg font-bold">${sponsor.contribution.toLocaleString()}</span>
              </div>
              <span className="text-xs text-gray-500">Total Contribution</span>
            </div>
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Enhanced Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('message')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'message'
                ? 'bg-white text-blue-600 shadow-md'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Messages</span>
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'email'
                ? 'bg-white text-blue-600 shadow-md'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Email</span>
          </button>
          <button className="flex items-center space-x-2 px-6 py-3 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
            <FileText className="w-4 h-4" />
            <span>Documents</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages
          .filter(msg => msg.type === activeTab)
          .map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'sponsor' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-md px-6 py-3 rounded-2xl shadow-sm ${
                message.sender === 'sponsor'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}
            >
              <p className="text-sm leading-relaxed">{message.text}</p>
              <p
                className={`text-xs mt-2 ${
                  message.sender === 'sponsor' ? 'text-blue-100' : 'text-gray-500'
                }`}
              >
                {message.timestamp}
              </p>
            </div>
          </div>
        ))}
        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-900 px-6 py-3 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Input */}
      <div className="p-6 border-t border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <button
            onClick={generateAIResponse}
            disabled={isGenerating}
            className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            title="Generate AI Response"
          >
            <Bot className="w-5 h-5" />
          </button>
          <div className="flex-1 flex items-center space-x-3 border border-gray-300 rounded-xl px-4 py-3 shadow-sm bg-gray-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={activeTab === 'message' ? 'Type a message to sponsor...' : 'Compose an email...'}
              className="flex-1 outline-none bg-transparent text-gray-900 placeholder-gray-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="p-2 text-blue-500 hover:text-blue-600 disabled:text-gray-400 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}