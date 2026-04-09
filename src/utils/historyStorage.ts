import type { SymptomAnalysisResult } from './geminiApi';

export interface StoredCheck {
  id: string;
  timestamp: number;
  symptoms: string;
  additionalContext: string;
  attachmentCount: number;
  topCondition: string;
  topProbability: number;
  urgency: 'self-care' | 'see-doctor' | 'urgent-care' | 'emergency';
  result: SymptomAnalysisResult;
}

export interface StoredChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  attachmentCount: number;
}

const CHECKS_KEY = 'pp_symptom_checks';
const CHATS_KEY = 'pp_chats';
const MAX_CHECKS = 30;

export function saveCheck(check: StoredCheck): void {
  const checks = getChecks();
  const idx = checks.findIndex((c) => c.id === check.id);
  if (idx >= 0) {
    checks[idx] = check;
  } else {
    checks.unshift(check);
  }
  localStorage.setItem(CHECKS_KEY, JSON.stringify(checks.slice(0, MAX_CHECKS)));
}

export function getChecks(): StoredCheck[] {
  try {
    return JSON.parse(localStorage.getItem(CHECKS_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function deleteCheck(id: string): void {
  localStorage.setItem(CHECKS_KEY, JSON.stringify(getChecks().filter((c) => c.id !== id)));
  const chats = getAllChats();
  delete chats[id];
  localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
}

export function saveMessages(checkId: string, messages: StoredChatMessage[]): void {
  const chats = getAllChats();
  chats[checkId] = messages.slice(-100);
  localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
}

export function getMessages(checkId: string): StoredChatMessage[] {
  return getAllChats()[checkId] ?? [];
}

function getAllChats(): Record<string, StoredChatMessage[]> {
  try {
    return JSON.parse(localStorage.getItem(CHATS_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function clearAllHistory(): void {
  localStorage.removeItem(CHECKS_KEY);
  localStorage.removeItem(CHATS_KEY);
}
