import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  HelpCircle,
  Database,
  User,
} from 'lucide-react';
import { sendExecutiveChat } from '../services/api';
import { ChatMessage } from '../types';

interface AssistantProps {
  businessUnit: string;
}

const SAMPLE_PROMPTS = [
  'Why did operating profit decline in recent periods?',
  'What is affecting the cost-to-income ratio?',
  'What could happen if loan processing time decreases by 10%?',
  'Which operational risks require immediate C-suite attention?',
  'Which KPIs have the strongest relationship with profitability?',
];

export const AiExecutiveAssistantPage: React.FC<AssistantProps> = ({ businessUnit }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: `### Welcome to FinSight AI Executive Decision Support\n\nI am your C-suite decision intelligence partner for **${businessUnit}**.\n\nAll responses are strictly grounded in verified database records and econometric regressions. I explicitly distinguish:\n- **[OBSERVED FACT]** (Historical financial & operational records)\n- **[STATISTICAL ASSOCIATION]** (Multiple regression β and correlation coefficients)\n- **[HYPOTHESIS]** (Underwriting & branch operational explanations)\n- **[ESTIMATE]** (Scenario sensitivity projections)\n\nAsk any question or click a prompt below to begin.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      is_llm_generated: false,
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || inputText).trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputText('');
    setLoading(true);

    try {
      const res = await sendExecutiveChat(textToSend, businessUnit);
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: res.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        is_llm_generated: res.is_llm_generated,
        evidence_points: res.evidence_points,
        disclaimer: res.disclaimer,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `### Executive Reasoning Error\nUnable to generate response: ${err.message || 'API connection failed.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        is_llm_generated: false,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format text with badge highlights
  const renderMessageContent = (content: string) => {
    const lines = content.split('\n');

    return (
      <div className="space-y-2 text-xs leading-relaxed text-slate-200">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="text-sm font-bold text-white border-b border-slate-700/60 pb-1 mt-2 mb-2">
                {line.replace('### ', '')}
              </h4>
            );
          }
          if (line.startsWith('**') && line.endsWith('**')) {
            return (
              <div key={idx} className="font-semibold text-slate-100 text-xs mt-3 mb-1">
                {line.replace(/\*\*/g, '')}
              </div>
            );
          }

          if (line.includes('[OBSERVED FACT]')) {
            return (
              <div key={idx} className="flex items-start space-x-2 my-1">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex-shrink-0">
                  OBSERVED FACT
                </span>
                <span className="text-slate-200">{line.replace('- [OBSERVED FACT] ', '').replace('[OBSERVED FACT] ', '')}</span>
              </div>
            );
          }

          if (line.includes('[STATISTICAL ASSOCIATION]')) {
            return (
              <div key={idx} className="flex items-start space-x-2 my-1">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 flex-shrink-0">
                  STATISTICAL ASSOC
                </span>
                <span className="text-slate-200">{line.replace('- [STATISTICAL ASSOCIATION] ', '').replace('[STATISTICAL ASSOCIATION] ', '')}</span>
              </div>
            );
          }

          if (line.includes('[HYPOTHESIS]')) {
            return (
              <div key={idx} className="flex items-start space-x-2 my-1">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex-shrink-0">
                  HYPOTHESIS
                </span>
                <span className="text-slate-200">{line.replace('- [HYPOTHESIS] ', '').replace('[HYPOTHESIS] ', '')}</span>
              </div>
            );
          }

          if (line.includes('[ESTIMATE]')) {
            return (
              <div key={idx} className="flex items-start space-x-2 my-1">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex-shrink-0">
                  ESTIMATE
                </span>
                <span className="text-slate-200">{line.replace('- [ESTIMATE] ', '').replace('[ESTIMATE] ', '')}</span>
              </div>
            );
          }

          if (line.startsWith('> ')) {
            return (
              <blockquote key={idx} className="p-2.5 rounded-lg bg-slate-800/60 border-l-2 border-teal-500 text-[11px] text-slate-300 my-2">
                {line.replace('> ', '')}
              </blockquote>
            );
          }

          return <p key={idx}>{line}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="p-8 max-w-5xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-teal-400" />
            <span>AI Executive Decision Assistant</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Grounded LLM dialogue distinguishing observed facts, statistical regressions, hypotheses, and scenario estimates.
          </p>
        </div>

        {/* Verification Status */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <Database className="w-3.5 h-3.5 text-teal-400" />
          <span className="text-slate-300">Grounding:</span>
          <span className="font-mono text-teal-300 font-semibold">{businessUnit}</span>
        </div>
      </div>

      {/* Suggested Prompts Carousel */}
      <div className="py-3 flex items-center space-x-2 overflow-x-auto no-scrollbar flex-shrink-0">
        <span className="text-[11px] font-medium text-slate-400 flex items-center space-x-1 flex-shrink-0">
          <HelpCircle className="w-3 h-3 text-slate-400" />
          <span>Quick Inquiries:</span>
        </span>
        {SAMPLE_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            className="flex-shrink-0 px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-750 text-[11px] text-slate-300 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Message Chat Feed */}
      <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-gradient-to-br from-teal-600 to-blue-600 text-white shadow-md shadow-teal-900/40'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-2xl rounded-2xl p-4 shadow-sm ${
                  isUser
                    ? 'bg-blue-600 text-white text-xs'
                    : 'glass-panel bg-slate-900/85 border border-slate-800/80 text-slate-200'
                }`}
              >
                {!isUser ? renderMessageContent(msg.text) : <p>{msg.text}</p>}

                {/* Footer metadata */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-800/40">
                  <span className="font-mono">{msg.timestamp}</span>
                  {!isUser && (
                    <span className="font-mono text-teal-400">
                      {msg.is_llm_generated ? 'OpenAI GPT-4o-mini' : 'Deterministic Template Intelligence'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-600 to-blue-600 flex items-center justify-center text-white flex-shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-xs text-teal-300">
                <div className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                <span>Computing verified evidence & validating econometric regressions...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="pt-3 border-t border-slate-800 flex-shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2 bg-slate-900 border border-slate-700/80 rounded-xl p-1.5 focus-within:border-blue-500 transition-colors shadow-lg"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Ask FinSight AI about ${businessUnit} performance, regressions, or risks...`}
            className="flex-1 bg-transparent px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white disabled:text-slate-500 transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <p className="text-[10px] text-center text-slate-400 mt-2">
          FinSight AI adheres to strict banking supervisory guidelines: statistical regressions indicate observational associations and never prove causation.
        </p>
      </div>
    </div>
  );
};
