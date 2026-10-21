import React, { useState, useRef, useEffect } from 'react';
import { api } from '../api/client';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Terminal, 
  ShieldCheck, 
  Activity, 
  Clock, 
  Database, 
  Truck, 
  Scan, 
  ClipboardCheck, 
  Scale, 
  RefreshCw, 
  GitBranch, 
  Layers, 
  Maximize2, 
  Minimize2,
  Trash2
} from 'lucide-react';

const SPECIALIZED_AGENTS = [
  { id: 'data', name: 'Data Intel', icon: Database, color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { id: 'alloc', name: 'Allocation', icon: Scale, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { id: 'replen', name: 'Replenish', icon: RefreshCw, color: 'text-teal-700 bg-teal-50 border-teal-200' },
  { id: 'transfer', name: 'Transfers', icon: GitBranch, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { id: 'compare', name: 'Nextail', icon: Layers, color: 'text-purple-700 bg-purple-50 border-purple-200' },
  { id: 'scanner', name: 'Scanner', icon: Scan, color: 'text-emerald-800 bg-emerald-100/70 border-emerald-300' },
  { id: 'logistics', name: 'Routing', icon: Truck, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  { id: 'count', name: 'Cycle Count', icon: ClipboardCheck, color: 'text-rose-700 bg-rose-50 border-rose-200' },
];

export const FloatingAICopilot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Array<{ 
    sender: 'user' | 'assistant'; 
    text: string; 
    tools?: any[]; 
    data?: any;
    active_agent?: string;
    workflow_state?: string;
    lifecycle_timeline?: any[];
  }>>([
    {
      sender: 'assistant',
      text: 'Hello! I am Rytail AI Copilot. I coordinate 8 specialized retail intelligence agents across allocation math, store replenishment, routing distance, in-store barcode scanning, and cycle count audits. How can I assist you?',
      active_agent: 'Rytail Orchestrator Agent',
      workflow_state: 'RECOMMENDATION',
      lifecycle_timeline: [
        { step: 'REQUESTED', status: 'COMPLETED' },
        { step: 'DATA_VALIDATION', status: 'COMPLETED' },
        { step: 'ANALYSIS', status: 'COMPLETED' },
        { step: 'RECOMMENDATION', status: 'COMPLETED' },
        { step: 'VALIDATION', status: 'IN_PROGRESS' },
        { step: 'PENDING_APPROVAL', status: 'PENDING' },
        { step: 'APPROVED', status: 'PENDING' },
        { step: 'EXECUTED', status: 'PENDING' }
      ]
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sampleQueries = [
    "Scan barcode 8901234567890 and check display shortage",
    "Connect to GCP bucket styleunion-live-inventory and fetch live data",
    "Show warehouse distance map and transit time",
    "Check cycle count session variance and shrinkage",
    "Run first allocation for EXFP00035 WHITECAP GRAY",
    "Verify SAP ERP connector health and data quality",
    "Why was E0100 allocated 13 units vs Nextail?"
  ];

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (queryText?: string) => {
    const textToSubmit = queryText || inputQuery;
    if (!textToSubmit.trim() || loading) return;

    const newMsgs = [...messages, { sender: 'user' as const, text: textToSubmit }];
    setMessages(newMsgs);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await api.queryCopilot(textToSubmit);
      setMessages([...newMsgs, {
        sender: 'assistant',
        text: res.answer,
        tools: res.tool_calls_made,
        data: res.data,
        active_agent: res.active_agent,
        workflow_state: res.workflow_state,
        lifecycle_timeline: res.lifecycle_timeline
      }]);
    } catch (e: any) {
      setMessages([...newMsgs, {
        sender: 'assistant',
        text: `Orchestrator error: ${e.message}`,
        active_agent: 'Error Recovery Agent'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        sender: 'assistant',
        text: 'Chat history cleared. How can I assist you with fashion inventory allocation or store operations?',
        active_agent: 'Rytail Orchestrator Agent'
      }
    ]);
  };

  return (
    <>
      {/* Floating Action Button (FAB) at Bottom Right */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {/* Tooltip / Prompt bubble when closed */}
        {!isOpen && (
          <div 
            onClick={() => setIsOpen(true)}
            className="cursor-pointer hidden sm:flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-700 transition-all hover:scale-105 active:scale-95 group"
          >
            <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
            <span>Ask Rytail Copilot</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        )}

        {/* Circular Floating Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open AI Copilot Chat"
          className={`relative w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-emerald-400/50 ${
            isOpen 
              ? 'bg-slate-800 hover:bg-slate-900 rotate-90 scale-95' 
              : 'bg-gradient-to-tr from-emerald-800 via-teal-800 to-emerald-600 hover:scale-105 active:scale-95 shadow-emerald-900/30 ring-4 ring-white dark:ring-slate-900'
          }`}
        >
          {/* Subtle Ping Animation when closed */}
          {!isOpen && (
            <span className="absolute -inset-1 rounded-full bg-emerald-500 opacity-25 animate-ping pointer-events-none"></span>
          )}

          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <div className="relative flex items-center justify-center">
              <Bot className="w-7 h-7 text-white" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-emerald-900 rounded-full"></span>
            </div>
          )}
        </button>
      </div>

      {/* Floating Chat Box Pop Up */}
      {isOpen && (
        <div 
          className={`fixed z-50 transition-all duration-300 flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden ${
            isExpanded
              ? 'bottom-4 right-4 left-4 sm:left-auto sm:right-6 sm:w-[680px] h-[calc(100vh-2rem)]'
              : 'bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[480px] h-[630px] max-h-[85vh]'
          }`}
        >
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-800 p-4 text-white flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Bot className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm tracking-tight">Rytail AI Copilot</h3>
                  <span className="text-[10px] bg-emerald-700/80 text-emerald-100 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/30">
                    8 Agents Active
                  </span>
                </div>
                <p className="text-[11px] text-emerald-100/75">
                  Multi-Agent Orchestrator &bull; Deterministic Engine
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={clearChat}
                title="Clear chat"
                className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Restore size' : 'Expand window'}
                className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors hidden sm:block"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 8 Specialized Agents Strip */}
          <div className="bg-slate-50 dark:bg-slate-950 p-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
            {SPECIALIZED_AGENTS.map((agent) => {
              const Icon = agent.icon;
              return (
                <div 
                  key={agent.id}
                  className={`px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 shrink-0 ${agent.color}`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{agent.name}</span>
                </div>
              );
            })}
          </div>

          {/* Quick Prompts Strip */}
          <div className="p-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />
            {sampleQueries.map((sq, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(sq)}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg border border-slate-200 dark:border-slate-700 whitespace-nowrap transition-colors"
              >
                {sq}
              </button>
            ))}
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs bg-slate-50/50 dark:bg-slate-950/40">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-2xl p-3.5 space-y-2.5 leading-relaxed shadow-xs ${
                  m.sender === 'user' 
                    ? 'bg-emerald-800 text-white font-medium rounded-tr-none' 
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none font-normal'
                }`}>
                  {/* Assistant Agent Identity Header */}
                  {m.sender === 'assistant' && (
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1 font-bold text-emerald-900 dark:text-emerald-400 text-[11px]">
                        <Activity className="w-3 h-3 text-emerald-600" />
                        <span>{m.active_agent || 'Rytail Orchestrator Agent'}</span>
                      </div>
                      {m.workflow_state && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {m.workflow_state}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Message Text */}
                  <div className="whitespace-pre-wrap font-normal text-xs">
                    {m.text}
                  </div>

                  {/* Lifecycle State Progress Timeline */}
                  {m.lifecycle_timeline && (
                    <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-emerald-700" />
                        Lifecycle State Machine
                      </div>
                      <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                        {m.lifecycle_timeline.map((step: any, sIdx: number) => (
                          <React.Fragment key={sIdx}>
                            <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold whitespace-nowrap ${
                              step.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                              (step.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse' : 'bg-slate-100 text-slate-400')
                            }`}>
                              {step.step}
                            </div>
                            {sIdx < (m.lifecycle_timeline?.length || 0) - 1 && (
                              <span className="text-slate-300 text-[8px]">&rarr;</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tool Execution Logs */}
                  {m.tools && m.tools.length > 0 && (
                    <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 space-y-1">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                        <Terminal className="w-2.5 h-2.5 text-emerald-700" />
                        Deterministic Tool Dispatch:
                      </span>
                      {m.tools.map((t, tIdx) => (
                        <div key={tIdx} className="bg-slate-50 dark:bg-slate-950 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-emerald-800 dark:text-emerald-400">
                          dispatch &rarr; {t.tool || t.agent}({JSON.stringify(t.args)})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl p-3 text-xs font-semibold flex items-center gap-2 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700 animate-spin" />
                  <span>Orchestrating specialized retail agents...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Footer / Input */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-1.5 shrink-0">
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="Ask Copilot (e.g. Scan barcode, distance map, replenishment)..."
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-medium text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !inputQuery.trim()}
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5 disabled:opacity-50 text-xs shadow transition-colors shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>
            
            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Read-Only Safe Agent Execution
              </span>
              <span>Rytail AI Engine</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
