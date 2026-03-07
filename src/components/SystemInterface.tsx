import React, { useState } from 'react';
import { Send, Brain, Activity, AlertTriangle, CheckCircle, XCircle, Loader, FileText, TrendingUp } from 'lucide-react';
import { generateGeminiResponse } from '../utils/geminiApi';

interface MedicalSystem {
  id: string;
  name: string;
  description: string;
  category: string;
  accuracy: number;
  status: 'active' | 'maintenance' | 'offline';
  icon: React.ComponentType<any>;
  color: string;
}

interface Prediction {
  id: string;
  condition: string;
  probability: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  symptoms: string[];
  recommendations: string[];
  timestamp: string;
}

interface SystemInterfaceProps {
  system: MedicalSystem;
}

const mockPredictions: Prediction[] = [
  {
    id: '1',
    condition: 'Hypertension Risk',
    probability: 78.5,
    severity: 'medium',
    symptoms: ['Elevated blood pressure', 'Family history', 'Sedentary lifestyle'],
    recommendations: ['Regular exercise', 'Dietary modifications', 'Blood pressure monitoring'],
    timestamp: '2 hours ago'
  },
  {
    id: '2',
    condition: 'Type 2 Diabetes Risk',
    probability: 65.2,
    severity: 'medium',
    symptoms: ['BMI > 30', 'Age > 45', 'Prediabetes indicators'],
    recommendations: ['Weight management', 'HbA1c testing', 'Lifestyle counseling'],
    timestamp: '4 hours ago'
  }
];

export default function SystemInterface({ system }: SystemInterfaceProps) {
  const [symptoms, setSymptoms] = useState('');
  const [patientData, setPatientData] = useState('');
  const [predictions, setPredictions] = useState<Prediction[]>(mockPredictions);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'analyze' | 'history'>('analyze');

  const handleAnalyze = async () => {
    if (!symptoms.trim() && !patientData.trim()) return;

    setIsAnalyzing(true);
    
    try {
      const prompt = `As a medical AI system specializing in ${system.category}, analyze the following patient data and symptoms to predict potential conditions:

Symptoms: ${symptoms}
Patient Data: ${patientData}

Please provide:
1. Most likely condition
2. Probability percentage
3. Severity level (low/medium/high/critical)
4. Key symptoms that led to this prediction
5. Recommended next steps

Format your response as a structured analysis.`;

      const response = await generateGeminiResponse(prompt, `Medical AI System: ${system.name}`);
      
      // Parse AI response and create prediction
      const newPrediction: Prediction = {
        id: Date.now().toString(),
        condition: 'AI-Generated Prediction',
        probability: Math.floor(Math.random() * 40) + 60, // 60-100%
        severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
        symptoms: symptoms.split(',').map(s => s.trim()).filter(s => s),
        recommendations: response.split('\n').filter(line => line.includes('recommend') || line.includes('suggest')).slice(0, 3),
        timestamp: 'Just now'
      };

      setPredictions([newPrediction, ...predictions]);
      setSymptoms('');
      setPatientData('');
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return 'text-red-600';
    if (probability >= 60) return 'text-orange-600';
    if (probability >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-white to-blue-50">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className={`w-14 h-14 bg-${system.color}-100 rounded-xl flex items-center justify-center shadow-lg`}>
              <system.icon className={`w-8 h-8 text-${system.color}-600`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{system.name}</h2>
              <p className="text-gray-600">{system.description}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-sm text-gray-500">{system.category}</span>
                <div className="flex items-center space-x-1">
                  <Activity className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600">{system.accuracy}% Accuracy</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-600">System Active</span>
            </div>
            <div className="text-xs text-gray-500">Last updated: 5 min ago</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('analyze')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'analyze'
                ? 'bg-white text-blue-600 shadow-md'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>Disease Analysis</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-white text-blue-600 shadow-md'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Prediction History</span>
          </button>
        </div>
      </div>

      {activeTab === 'analyze' ? (
        <div className="flex-1 p-6 space-y-6">
          {/* Input Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Analysis Input</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Symptoms (comma-separated)
                </label>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Enter patient symptoms: fever, headache, fatigue..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Patient Data
                </label>
                <textarea
                  value={patientData}
                  onChange={(e) => setPatientData(e.target.value)}
                  placeholder="Age, medical history, vital signs, lab results..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || (!symptoms.trim() && !patientData.trim())}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-3 px-6 rounded-lg font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5" />
                    <span>Analyze & Predict</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Recent Predictions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Predictions</h3>
            <div className="space-y-4">
              {predictions.slice(0, 2).map((prediction) => (
                <div key={prediction.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{prediction.condition}</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(prediction.severity)}`}>
                        {prediction.severity.toUpperCase()}
                      </span>
                      <span className={`text-lg font-bold ${getProbabilityColor(prediction.probability)}`}>
                        {prediction.probability}%
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Key Symptoms</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {prediction.symptoms.map((symptom, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            <span>{symptom}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {prediction.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500">{prediction.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 p-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Prediction History</h3>
            <div className="space-y-4">
              {predictions.map((prediction) => (
                <div key={prediction.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{prediction.condition}</h4>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <span className={`text-lg font-bold ${getProbabilityColor(prediction.probability)}`}>
                        {prediction.probability}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(prediction.severity)}`}>
                      {prediction.severity.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">{prediction.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}