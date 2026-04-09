import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Upload,
  X,
  Send,
  ArrowLeft,
  Clock,
  Trash2,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Zap,
  MessageSquare,
  Plus,
  FileText,
  Image as ImageIcon,
  Activity,
  ChevronDown,
  ChevronRight,
  Info,
  Heart,
  Stethoscope,
  History,
  RefreshCw,
  User,
  Timer,
  Shield,
} from 'lucide-react';
import {
  analyzeSymptoms,
  sendChatMessage,
  type MediaAttachment,
  type SymptomAnalysisResult,
  type ConversationMessage,
} from '../utils/geminiApi';
import {
  saveCheck,
  getChecks,
  deleteCheck,
  saveMessages,
  getMessages,
  clearAllHistory,
  type StoredCheck,
  type StoredChatMessage,
} from '../utils/historyStorage';

// ─── Types ────────────────────────────────────────────────────────────────────

type View = 'input' | 'loading' | 'results' | 'chat';

interface AdditionalInfo {
  age: string;
  gender: string;
  duration: string;
  medicalHistory: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const QUICK_QUESTIONS = [
  'How can I prevent this condition?',
  'What are the treatment options?',
  'What tests should I get?',
  'When should I go to the ER?',
  'What lifestyle changes help?',
  'Is this condition contagious?',
  'What foods should I avoid?',
  'Can this get worse if untreated?',
  'What are the typical stages?',
  'Are there effective home remedies?',
];

const urgencyConfig = {
  'self-care': {
    label: 'Self-Care',
    Icon: CheckCircle,
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  'see-doctor': {
    label: 'See a Doctor',
    Icon: AlertCircle,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-700',
  },
  'urgent-care': {
    label: 'Urgent Care',
    Icon: AlertTriangle,
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    dot: 'bg-orange-500',
    badge: 'bg-orange-100 text-orange-700',
  },
  emergency: {
    label: 'Emergency',
    Icon: Zap,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    dot: 'bg-red-500',
    badge: 'bg-red-100 text-red-700',
  },
} as const;

const severityConfig = {
  mild: { label: 'Mild', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  moderate: { label: 'Moderate', bg: 'bg-amber-100', text: 'text-amber-700' },
  severe: { label: 'Severe', bg: 'bg-orange-100', text: 'text-orange-700' },
  critical: { label: 'Critical', bg: 'bg-red-100', text: 'text-red-700' },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const formatRelativeTime = (ts: number): string => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatBytes = (b: number): string => {
  if (b < 1024) return `${b} B`;
  if (b < 1_048_576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1_048_576).toFixed(1)} MB`;
};

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

// ─── Component ────────────────────────────────────────────────────────────────

export default function SymptomChecker() {
  // View
  const [view, setView] = useState<View>('input');
  const [showHistory, setShowHistory] = useState(false);

  // Input
  const [symptoms, setSymptoms] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState<AdditionalInfo>({
    age: '',
    gender: '',
    duration: '',
    medicalHistory: '',
  });
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Analysis
  const [analysisResult, setAnalysisResult] = useState<SymptomAnalysisResult | null>(null);
  const [currentCheckId, setCurrentCheckId] = useState<string | null>(null);
  const [expandedConditions, setExpandedConditions] = useState<Set<number>>(new Set([0]));
  const [error, setError] = useState<string | null>(null);

  // Chat
  const [chatMessages, setChatMessages] = useState<StoredChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatAttachments, setChatAttachments] = useState<MediaAttachment[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [isDragOverChat, setIsDragOverChat] = useState(false);

  // History
  const [history, setHistory] = useState<StoredCheck[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatFileRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setHistory(getChecks());
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  // ── File handling ────────────────────────────────────────────────────────────

  const processFiles = async (files: FileList | File[], target: 'input' | 'chat') => {
    const valid = Array.from(files).filter(
      (f) => ACCEPTED_TYPES.includes(f.type) && f.size <= 10 * 1_048_576
    );
    const results = await Promise.allSettled(
      valid.map(async (f) => ({
        id: genId(),
        name: f.name,
        base64: await fileToBase64(f),
        mimeType: f.type,
        size: f.size,
      }))
    );
    const processed = results
      .filter((r): r is PromiseFulfilledResult<MediaAttachment> => r.status === 'fulfilled')
      .map((r) => r.value);

    if (target === 'input') {
      setAttachments((p) => [...p, ...processed].slice(0, 5));
    } else {
      setChatAttachments((p) => [...p, ...processed].slice(0, 3));
    }
  };

  // ── Analysis ─────────────────────────────────────────────────────────────────

  const handleAnalyze = async () => {
    if (!symptoms.trim()) return;

    const contextParts = [
      additionalInfo.age && `Age: ${additionalInfo.age}`,
      additionalInfo.gender && `Gender: ${additionalInfo.gender}`,
      additionalInfo.duration && `Duration: ${additionalInfo.duration}`,
      additionalInfo.medicalHistory && `Medical history: ${additionalInfo.medicalHistory}`,
    ]
      .filter(Boolean)
      .join(', ');

    setError(null);
    setView('loading');

    try {
      const result = await analyzeSymptoms(symptoms, contextParts, attachments);

      const checkId = genId();
      const check: StoredCheck = {
        id: checkId,
        timestamp: Date.now(),
        symptoms: symptoms.trim(),
        additionalContext: contextParts,
        attachmentCount: attachments.length,
        topCondition: result.conditions[0]?.name ?? 'Unknown',
        topProbability: result.conditions[0]?.probability ?? 0,
        urgency: result.urgency,
        result,
      };

      saveCheck(check);
      setHistory(getChecks());
      setCurrentCheckId(checkId);
      setAnalysisResult(result);
      setExpandedConditions(new Set([0]));
      setConversationHistory([]);
      setChatMessages([]);
      setView('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
      setView('input');
    }
  };

  // ── Chat ─────────────────────────────────────────────────────────────────────

  const handleSendMessage = async (prefill?: string) => {
    const text = (prefill ?? chatInput).trim();
    if (!text && chatAttachments.length === 0) return;
    if (!analysisResult || !currentCheckId) return;

    const userMsg: StoredChatMessage = {
      id: genId(),
      role: 'user',
      text: text || '(Attached files)',
      timestamp: Date.now(),
      attachmentCount: chatAttachments.length,
    };

    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setChatInput('');
    if (chatTextareaRef.current) chatTextareaRef.current.style.height = 'auto';

    const currentAtts = [...chatAttachments];
    setChatAttachments([]);
    setIsChatLoading(true);

    const nextConvHistory: ConversationMessage[] = [
      ...conversationHistory,
      { role: 'user', text, attachments: currentAtts },
    ];

    try {
      const context = `
Analyzed symptoms: ${analysisResult.conditions
        .map((c) => `${c.name} (${c.probability}%, ${c.severity})`)
        .join('; ')}
Urgency: ${analysisResult.urgency} — ${analysisResult.urgencyNote}
General advice: ${analysisResult.generalAdvice}
      `.trim();

      const aiText = await sendChatMessage(text, conversationHistory, context, currentAtts);

      const aiMsg: StoredChatMessage = {
        id: genId(),
        role: 'assistant',
        text: aiText,
        timestamp: Date.now(),
        attachmentCount: 0,
      };

      const finalMessages = [...updatedMessages, aiMsg];
      setChatMessages(finalMessages);
      saveMessages(currentCheckId, finalMessages);

      setConversationHistory([...nextConvHistory, { role: 'model', text: aiText }]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Sorry, I encountered an error. Please try again.';
      const errMsg: StoredChatMessage = {
        id: genId(),
        role: 'assistant',
        text: message,
        timestamp: Date.now(),
        attachmentCount: 0,
      };
      setChatMessages((p) => [...p, errMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // ── History helpers ───────────────────────────────────────────────────────────

  const loadFromHistory = (check: StoredCheck) => {
    setCurrentCheckId(check.id);
    setAnalysisResult(check.result);
    setSymptoms(check.symptoms);
    setExpandedConditions(new Set([0]));

    const msgs = getMessages(check.id);
    setChatMessages(msgs);
    setConversationHistory(
      msgs.map((m) => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text }))
    );

    setView('results');
    setShowHistory(false);
  };

  const handleDeleteCheck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteCheck(id);
    setHistory(getChecks());
    if (currentCheckId === id) {
      setView('input');
      setAnalysisResult(null);
    }
  };

  const handleNewCheck = () => {
    setView('input');
    setSymptoms('');
    setAdditionalInfo({ age: '', gender: '', duration: '', medicalHistory: '' });
    setAttachments([]);
    setAnalysisResult(null);
    setCurrentCheckId(null);
    setError(null);
  };

  const toggleCondition = (i: number) =>
    setExpandedConditions((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  // ── Render: Input ─────────────────────────────────────────────────────────────

  const renderInput = () => (
    <div className="flex-1 overflow-y-auto">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 px-6 py-10">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4 backdrop-blur-sm">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Symptom Checker</h1>
          <p className="text-blue-100 text-lg">
            Describe your symptoms and get instant AI-powered health insights
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-red-800">Analysis Failed</p>
              <p className="text-sm text-red-600 mt-0.5">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Symptoms */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Describe Your Symptoms <span className="text-red-500">*</span>
          </label>
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Describe your symptoms in detail… e.g. I have had a persistent headache for 3 days along with a low-grade fever, fatigue, and a stiff neck. The headache is worse in the morning."
            className="w-full h-36 resize-none border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            Be as detailed as possible for more accurate results
          </p>
        </div>

        {/* Additional info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Additional Information{' '}
            <span className="text-gray-400 font-normal">(optional, improves accuracy)</span>
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
                <User className="w-3.5 h-3.5" /> Age
              </label>
              <input
                type="text"
                value={additionalInfo.age}
                onChange={(e) => setAdditionalInfo((p) => ({ ...p, age: e.target.value }))}
                placeholder="e.g. 28"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
                <User className="w-3.5 h-3.5" /> Gender
              </label>
              <select
                value={additionalInfo.gender}
                onChange={(e) => setAdditionalInfo((p) => ({ ...p, gender: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select…</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other / Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
                <Timer className="w-3.5 h-3.5" /> Duration
              </label>
              <input
                type="text"
                value={additionalInfo.duration}
                onChange={(e) => setAdditionalInfo((p) => ({ ...p, duration: e.target.value }))}
                placeholder="e.g. 3 days"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
                <Heart className="w-3.5 h-3.5" /> Medical History
              </label>
              <input
                type="text"
                value={additionalInfo.medicalHistory}
                onChange={(e) =>
                  setAdditionalInfo((p) => ({ ...p, medicalHistory: e.target.value }))
                }
                placeholder="e.g. diabetes, asthma"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* File upload */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Upload Medical Images or Documents{' '}
            <span className="text-gray-400 font-normal">(optional)</span>
          </h3>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              processFiles(e.dataTransfer.files, 'input');
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragOver
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600">Drop files here or click to upload</p>
            <p className="text-xs text-gray-400 mt-1">
              Images (JPG, PNG, GIF, WebP) and PDFs · max 10 MB each
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_TYPES.join(',')}
              className="hidden"
              onChange={(e) => e.target.files && processFiles(e.target.files, 'input')}
            />
          </div>

          {attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2"
                >
                  {att.mimeType.startsWith('image/') ? (
                    <ImageIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  )}
                  <span className="text-sm text-gray-700 flex-1 truncate">{att.name}</span>
                  <span className="text-xs text-gray-400">{formatBytes(att.size)}</span>
                  <button
                    onClick={() => setAttachments((p) => p.filter((a) => a.id !== att.id))}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleAnalyze}
            disabled={!symptoms.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white disabled:text-gray-400 font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Search className="w-5 h-5" />
            Check Symptoms
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium py-3.5 px-5 rounded-xl flex items-center gap-2 transition-colors"
          >
            <History className="w-5 h-5" />
            History
            {history.length > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                {history.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-start gap-2 text-xs text-gray-400 pb-4">
          <Shield className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <p>
            This tool provides informational insights only and is not a substitute for professional
            medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.
          </p>
        </div>
      </div>
    </div>
  );

  // ── Render: Loading ───────────────────────────────────────────────────────────

  const renderLoading = () => (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 bg-gray-50">
      <div className="relative">
        <div className="w-24 h-24 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Activity className="w-9 h-9 text-blue-600" />
        </div>
      </div>
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Analyzing Your Symptoms</h3>
        <p className="text-gray-500">
          Our AI is reviewing your symptoms and identifying possible conditions…
        </p>
      </div>
      <div className="flex gap-1.5">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );

  // ── Render: Results ───────────────────────────────────────────────────────────

  const renderResults = () => {
    if (!analysisResult) return null;
    const urg = urgencyConfig[analysisResult.urgency];
    const { Icon: UrgencyIcon } = urg;

    return (
      <div className="flex-1 overflow-y-auto">
        {/* Urgency banner */}
        <div className={`${urg.bg} ${urg.border} border-b px-6 py-4`}>
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <UrgencyIcon className={`w-6 h-6 ${urg.text} flex-shrink-0`} />
              <div>
                <p className={`font-bold text-lg ${urg.text}`}>{urg.label}</p>
                <p className={`text-sm ${urg.text} opacity-80`}>{analysisResult.urgencyNote}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleNewCheck}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                New Check
              </button>
              <button
                onClick={() => setView('chat')}
                className="flex items-center gap-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Ask AI
              </button>
              <button
                onClick={() => setShowHistory(true)}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <History className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {/* Symptom recap */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Analyzed Symptoms
            </p>
            <p className="text-sm text-gray-800">{symptoms}</p>
          </div>

          {/* Conditions */}
          <div>
            <h2 className="text-base font-bold text-gray-800 mb-3">Possible Conditions</h2>
            <div className="space-y-3">
              {analysisResult.conditions.map((cond, i) => {
                const sev = severityConfig[cond.severity];
                const isOpen = expandedConditions.has(i);
                return (
                  <div
                    key={i}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
                  >
                    <button
                      onClick={() => toggleCondition(i)}
                      className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-700">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="font-semibold text-gray-900">{cond.name}</span>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${sev.bg} ${sev.text}`}
                          >
                            {sev.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div
                              className="h-full rounded-full bg-blue-500 transition-all"
                              style={{ width: `${cond.probability}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-600 w-10 text-right">
                            {cond.probability}%
                          </span>
                        </div>
                      </div>
                      {isOpen ? (
                        <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 border-t border-gray-50">
                        <p className="text-sm text-gray-600 mt-3 mb-4">{cond.description}</p>
                        <div className="space-y-4">
                          {cond.matchingSymptoms.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Matching Symptoms
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {cond.matchingSymptoms.map((s, j) => (
                                  <span
                                    key={j}
                                    className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full"
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {cond.recommendations.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Recommendations
                              </p>
                              <ul className="space-y-1.5">
                                {cond.recommendations.map((r, j) => (
                                  <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                    {r}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* General advice */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-blue-800 text-sm mb-1">General Advice</p>
                <p className="text-sm text-blue-700">{analysisResult.generalAdvice}</p>
              </div>
            </div>
          </div>

          {/* Chat CTA */}
          <button
            onClick={() => setView('chat')}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all shadow-md hover:shadow-lg"
          >
            <MessageSquare className="w-5 h-5" />
            <div className="text-left">
              <p>Discuss with AI</p>
              <p className="text-xs font-normal opacity-80">
                Ask follow-up questions and get deeper insights
              </p>
            </div>
          </button>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 text-xs text-gray-400 pb-4">
            <Shield className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <p>{analysisResult.disclaimer}</p>
          </div>
        </div>
      </div>
    );
  };

  // ── Render: Chat ──────────────────────────────────────────────────────────────

  const renderChat = () => {
    const isEmpty = chatMessages.length === 0;

    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Chat header */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setView('results')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Results
          </button>
          <div className="w-px h-4 bg-gray-200" />
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">PediPlace AI</p>
              <p className="text-xs text-emerald-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" />
                Online
              </p>
            </div>
          </div>
          <button
            onClick={handleNewCheck}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <History className="w-4 h-4" />
          </button>
        </div>

        {/* Quick questions — only before first message */}
        {isEmpty && (
          <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex-shrink-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Quick Questions
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {QUICK_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(q)}
                  className="flex-shrink-0 text-xs bg-white border border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 px-3 py-1.5 rounded-full transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50">
          {isEmpty && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-700 mb-1">Ask me anything</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                I'll help you understand your symptoms and possible conditions better.
              </p>
            </div>
          )}

          {chatMessages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div key={msg.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <Stethoscope className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-3 ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'
                  }`}
                >
                  <p
                    className={`text-sm leading-relaxed whitespace-pre-wrap ${
                      isUser ? 'text-white' : 'text-gray-800'
                    }`}
                  >
                    {msg.text}
                  </p>
                  {msg.attachmentCount > 0 && (
                    <p className={`text-xs mt-1 ${isUser ? 'text-blue-200' : 'text-gray-400'}`}>
                      📎 {msg.attachmentCount} attachment{msg.attachmentCount > 1 ? 's' : ''}
                    </p>
                  )}
                  <p className={`text-xs mt-1.5 ${isUser ? 'text-blue-200' : 'text-gray-400'}`}>
                    {formatRelativeTime(msg.timestamp)}
                  </p>
                </div>
                {isUser && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>
            );
          })}

          {isChatLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Stethoscope className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  {[0, 150, 300].map((d) => (
                    <span
                      key={d}
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${d}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Inline quick chips after first message */}
        {!isEmpty && (
          <div className="bg-white border-t border-gray-100 px-4 pt-2.5 pb-0 flex-shrink-0">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {QUICK_QUESTIONS.slice(0, 6).map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(q)}
                  disabled={isChatLoading}
                  className="flex-shrink-0 text-xs bg-gray-50 border border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-40 px-3 py-1.5 rounded-full transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="bg-white border-t border-gray-100 p-4 flex-shrink-0">
          {/* Attachment previews */}
          {chatAttachments.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
              {chatAttachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 bg-gray-100 rounded-lg px-2.5 py-1.5 flex-shrink-0"
                >
                  {att.mimeType.startsWith('image/') ? (
                    <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-orange-500" />
                  )}
                  <span className="text-xs text-gray-700 max-w-[6rem] truncate">{att.name}</span>
                  <button
                    onClick={() => setChatAttachments((p) => p.filter((a) => a.id !== att.id))}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOverChat(true);
            }}
            onDragLeave={() => setIsDragOverChat(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOverChat(false);
              processFiles(e.dataTransfer.files, 'chat');
            }}
            className={`flex items-end gap-2 ${isDragOverChat ? 'bg-blue-50 rounded-xl p-2' : ''}`}
          >
            <button
              onClick={() => chatFileRef.current?.click()}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
              title="Attach image or document"
            >
              <Plus className="w-5 h-5" />
              <input
                ref={chatFileRef}
                type="file"
                multiple
                accept={ACCEPTED_TYPES.join(',')}
                className="hidden"
                onChange={(e) => e.target.files && processFiles(e.target.files, 'chat')}
              />
            </button>

            <textarea
              ref={chatTextareaRef}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask about your symptoms or conditions… (Shift+Enter for new line)"
              rows={1}
              className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ minHeight: '42px', maxHeight: '128px' }}
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={(!chatInput.trim() && chatAttachments.length === 0) || isChatLoading}
              className="flex-shrink-0 w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Render: History Panel ─────────────────────────────────────────────────────

  const renderHistoryPanel = () => (
    <div className={`fixed inset-0 z-50 flex ${showHistory ? '' : 'pointer-events-none'}`}>
      <div
        className={`absolute inset-0 bg-black/20 transition-opacity duration-200 ${
          showHistory ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={() => setShowHistory(false)}
      />
      <div
        className={`absolute right-0 top-0 h-full w-80 bg-white shadow-2xl flex flex-col transition-transform duration-200 ${
          showHistory ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            Recent History
          </h2>
          <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {history.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Clock className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No checks yet</p>
              <p className="text-gray-400 text-xs mt-1">Your symptom checks will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {history.map((check) => {
                const urg = urgencyConfig[check.urgency];
                return (
                  <button
                    key={check.id}
                    onClick={() => loadFromHistory(check)}
                    className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${urg.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {check.topCondition}
                        <span className="text-gray-400 font-normal ml-1">
                          {check.topProbability}%
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{check.symptoms}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">
                          {formatRelativeTime(check.timestamp)}
                        </span>
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${urg.badge}`}>
                          {urg.label}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteCheck(check.id, e)}
                      className="flex-shrink-0 text-gray-300 hover:text-red-500 transition-colors p-1 mt-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={() => {
                clearAllHistory();
                setHistory([]);
                setShowHistory(false);
              }}
              className="w-full text-sm text-red-500 hover:text-red-700 font-medium py-2 border border-red-100 hover:border-red-200 rounded-lg transition-colors"
            >
              Clear All History
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ── Root ──────────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {view === 'input' && renderInput()}
      {view === 'loading' && renderLoading()}
      {view === 'results' && renderResults()}
      {view === 'chat' && renderChat()}
      {renderHistoryPanel()}
    </div>
  );
}
