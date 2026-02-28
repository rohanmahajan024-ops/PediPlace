import React, { useState } from 'react';
import { Send, Mail, MessageSquare, Bot, Phone, MoreVertical } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'online' | 'offline';
  avatar: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: string;
  type: 'message' | 'email';
}

const mockMessages: Message[] = [
  {
    id: '1',
    text: 'Hello! I need to schedule an appointment for my child.',
    sender: 'user',
    timestamp: '10:30 AM',
    type: 'message'
  },
  {
    id: '2',
    text: 'Hello! I\'d be happy to help you schedule an appointment. What type of appointment are you looking for?',
    sender: 'agent',
    timestamp: '10:31 AM',
    type: 'message'
  },
  {
    id: '3',
    text: 'A routine check-up for my 5-year-old daughter.',
    sender: 'user',
    timestamp: '10:32 AM',
    type: 'message'
  },
  {
    id: '4',
    text: 'Perfect! We have availability this week. Would you prefer morning or afternoon appointments?',
    sender: 'agent',
    timestamp: '10:33 AM',
    type: 'message'
  }
];

interface ChatInterfaceProps {
  customer: Customer;
}

export default function ChatInterface({ customer }: ChatInterfaceProps) {
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
    
    // Mock AI response generation
    setTimeout(() => {
      const aiMessage: Message = {
        id: Date.now().toString(),
        text: activeTab === 'message' 
          ? "Hi! We'd love to help you with your healthcare needs. Please visit us for a free consultation at PediPlace. We're here to provide the best care for you and your family!"
          : "Thank you for your interest in PediPlace! We're looking for healthcare sponsors to help us provide better care to our community. Would you like to learn more about our sponsorship opportunities?",
        sender: 'agent',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: activeTab
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                {customer.avatar}
              </div>
              {customer.status === 'online' && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{customer.name}</h2>
              <p className="text-sm text-gray-500">{customer.status === 'online' ? 'Online' : 'Last seen 2h ago'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
              <Phone className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mt-4 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('message')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'message'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Messages</span>
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'email'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Email</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages
          .filter(msg => msg.type === activeTab)
          .map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                message.sender === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm">{message.text}</p>
              <p
                className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}
              >
                {message.timestamp}
              </p>
            </div>
          </div>
        ))}
        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-2xl">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <button
            onClick={generateAIResponse}
            disabled={isGenerating}
            className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50"
            title="Generate AI Response"
          >
            <Bot className="w-5 h-5" />
          </button>
          <div className="flex-1 flex items-center space-x-2 border border-gray-300 rounded-lg px-3 py-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={activeTab === 'message' ? 'Type a message...' : 'Type an email...'}
              className="flex-1 outline-none"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="p-1 text-blue-500 hover:text-blue-600 disabled:text-gray-400"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}