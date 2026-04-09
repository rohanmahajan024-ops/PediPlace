const AZURE_ENDPOINT =
  'https://financeops-azure-openai-backup.openai.azure.com/openai/deployments/financeops-azure-openai-backup/chat/completions?api-version=2024-04-01-preview';
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY?.trim() || '5b4d8a7651294134b88ada1181a43795';

function formatOpenAIError(status: number): string {
  if (status === 429) {
    return 'Azure OpenAI rate limit reached. Please wait a moment and try again.';
  }
  if (status === 401 || status === 403) {
    return 'Azure OpenAI rejected the request. Verify that your API key is valid and the deployment is accessible.';
  }
  return `Azure OpenAI request failed with status ${status}.`;
}

export interface MediaAttachment {
  id: string;
  name: string;
  base64: string;
  mimeType: string;
  size: number;
}

export interface DiseaseCondition {
  name: string;
  probability: number;
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  description: string;
  matchingSymptoms: string[];
  recommendations: string[];
}

export interface SymptomAnalysisResult {
  conditions: DiseaseCondition[];
  urgency: 'self-care' | 'see-doctor' | 'urgent-care' | 'emergency';
  urgencyNote: string;
  generalAdvice: string;
  disclaimer: string;
}

export interface ConversationMessage {
  role: 'user' | 'model';
  text: string;
  attachments?: MediaAttachment[];
}

type OpenAIContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | OpenAIContentPart[];
}

async function callOpenAI(messages: OpenAIMessage[]): Promise<string> {
  const payload = {
    messages,
    temperature: 0.4,
  };

  let res: Response;
  try {
    res = await fetch(AZURE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': API_KEY,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Unable to reach Azure OpenAI. Check your network connection and try again.');
  }

  if (!res.ok) {
    throw new Error(formatOpenAIError(res.status));
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

function buildUserContent(text: string, attachments: MediaAttachment[]): string | OpenAIContentPart[] {
  if (attachments.length === 0) return text;

  const parts: OpenAIContentPart[] = [{ type: 'text', text }];
  for (const att of attachments) {
    parts.push({
      type: 'image_url',
      image_url: { url: `data:${att.mimeType};base64,${att.base64}` },
    });
  }
  return parts;
}

export async function analyzeSymptoms(
  symptoms: string,
  additionalContext: string,
  attachments: MediaAttachment[] = []
): Promise<SymptomAnalysisResult> {
  const prompt = `You are a medical AI assistant. Analyze the following symptoms and provide a detailed health assessment.

Patient symptoms: ${symptoms}
${additionalContext ? `Additional context (age, gender, duration, history): ${additionalContext}` : ''}
${attachments.length > 0 ? `The patient has also provided ${attachments.length} medical image(s)/document(s) for analysis.` : ''}

Respond with ONLY a valid JSON object — no markdown fences, no explanation, just the JSON:
{
  "conditions": [
    {
      "name": "Condition Name",
      "probability": 82,
      "severity": "moderate",
      "description": "Clear description of this condition and why the symptoms match",
      "matchingSymptoms": ["symptom1", "symptom2", "symptom3"],
      "recommendations": ["Specific action 1", "Specific action 2", "Specific action 3"]
    }
  ],
  "urgency": "see-doctor",
  "urgencyNote": "You should schedule a doctor visit within 1-2 days.",
  "generalAdvice": "Rest, stay hydrated, and monitor your symptoms.",
  "disclaimer": "This assessment is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment."
}

Requirements:
- List 3-5 most probable conditions, ordered by probability (highest first)
- severity: one of "mild", "moderate", "severe", "critical"
- urgency: one of "self-care", "see-doctor", "urgent-care", "emergency"
- probability: integer 0-100
- matchingSymptoms: list the specific input symptoms that match this condition
- recommendations: 3-5 specific, actionable items
- Be clinically accurate
- Return ONLY valid JSON, nothing else`;

  const messages: OpenAIMessage[] = [
    { role: 'user', content: buildUserContent(prompt, attachments) },
  ];

  const raw = await callOpenAI(messages);
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

  try {
    return JSON.parse(cleaned) as SymptomAnalysisResult;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as SymptomAnalysisResult;
    throw new Error('Could not parse AI response. Please try again.');
  }
}

export async function sendChatMessage(
  userMessage: string,
  history: ConversationMessage[],
  medicalContext: string,
  attachments: MediaAttachment[] = []
): Promise<string> {
  const systemPrompt = `You are a compassionate and knowledgeable medical AI assistant for PediPlace Healthcare Portal.

The user has completed a symptom analysis. Medical context:
${medicalContext}

Your role:
- Answer questions about their symptoms and possible conditions thoroughly
- Explain medical terms in simple, understandable language
- Provide practical advice for managing symptoms at home
- Recommend when to seek professional care
- Be empathetic and supportive
- If images or documents are shared, analyze them in context of the patient's symptoms
- Use bullet points or numbered lists when helpful for clarity
- Always remind the user this is not a substitute for professional medical care`;

  const messages: OpenAIMessage[] = [{ role: 'system', content: systemPrompt }];

  for (const msg of history) {
    const role: 'user' | 'assistant' = msg.role === 'model' ? 'assistant' : 'user';
    messages.push({
      role,
      content: buildUserContent(msg.text, msg.attachments ?? []),
    });
  }

  messages.push({
    role: 'user',
    content: buildUserContent(userMessage, attachments),
  });

  return callOpenAI(messages);
}

// Backward compatibility
export async function generateGeminiResponse(prompt: string, context: string = ''): Promise<string> {
  const text = context ? `Context: ${context}\n\n${prompt}` : prompt;
  return callOpenAI([{ role: 'user', content: text }]);
}
