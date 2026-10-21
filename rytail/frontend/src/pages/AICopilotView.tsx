import React, { useState } from 'react';
import { api } from '../api/client';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Terminal, 
  ShieldCheck, 
  Activity, 
  CheckCircle2, 
  Clock, 
  Layers, 
  ArrowRight,
  Database,
  Truck,
  Scan,
  ClipboardCheck,
  Scale,
  RefreshCw,
  GitBranch
} from 'lucide-react';

const SPECIALIZED_AGENTS = [
  { id: 'data', name: 'Data Intelligence', icon: Database, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'alloc', name: 'First Allocation', icon: Scale, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { id: 'replen', name: 'Replenishment', icon: RefreshCw, color: 'text-teal-700 bg-teal-50 border-teal-200' },
  { id: 'transfer', name: 'Store Transfers', icon: GitBranch, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { id: 'compare', name: 'Nextail Benchmark', icon: Layers, color: 'text-purple-700 bg-purple-50 border-purple-200' },
  { id: 'scanner', name: 'Barcode & Backroom', icon: Scan, color: 'text-emerald-800 bg-emerald-100/70 border-emerald-300' },
  { id: 'logistics', name: 'Warehouse Routing', icon: Truck, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  { id: 'count', name: 'Cycle Counts', icon: ClipboardCheck, color: 'text-rose-700 bg-rose-50 border-rose-200' },
];

export const AICopilotView: React.FC = () => {
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
      text: 'Welcome to Rytail Agentic AI Retail Platform Command Center. I coordinate 8 specialized retail intelligence agents across allocation math, store replenishment, routing distance, in-store barcode scanning, and cycle count reconciliation.',
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

  const sampleQueries = [
    "Scan barcode 8901234567890 and check display shortage",
    "Show warehouse distance map and transit time",
    "Check cycle count session variance and shrinkage",
    "Run first allocation for EXFP00035 WHITECAP GRAY",
    "Verify SAP ERP connector health and data quality",
    "Why was E0100 allocated 13 units vs Nextail?"
  ];

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

  return (
    <div className="space-y-6 max-w-6xl mx-auto flex flex-col h-[calc(100vh-80px)]">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-800 p-5 rounded-2xl text-white flex items-center justify-between shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md text-white flex items-center justify-center border border-white/20">
            <Bot className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              Rytail Agentic AI Command Center
              <span className="text-[10px] bg-emerald-700/80 text-emerald-100 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/30">
                Multi-Agent Orchestrator
              </span>
            </h1>
            <p className="text-xs text-emerald-100/80">
              Coordinated decisioning: Recommended &rarr; Approved &rarr; Executed. Deterministic math engine handoff.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-200 bg-white/10 px-3 py-1.5 rounded-xl border border-white/20">
          <ShieldCheck className="w-4 h-4 text-emerald-300" />
          <span>Air-Gapped Transaction Safety</span>
        </div>
      </div>

      {/* 8 Specialized Agents Badges Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 shrink-0">
        {SPECIALIZED_AGENTS.map((agent) => {
          const Icon = agent.icon;
          return (
            <div 
              key={agent.id}
              className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center gap-1 ${agent.color}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold leading-tight">{agent.name}</span>
            </div>
          );
        })}
      </div>

      {/* Quick Prompts Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs shrink-0">
        <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
        {sampleQueries.map((sq, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(sq)}
            className="bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-xs transition-colors"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Chat Messages Transcript */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-5 overflow-y-auto space-y-4 shadow-sm">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-3xl rounded-2xl p-4 space-y-3 text-xs leading-relaxed ${
              m.sender === 'user' 
                ? 'bg-emerald-800 text-white font-medium rounded-tr-none shadow' 
                : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none font-normal'
            }`}>
              {/* Agent Title & State Badge */}
              {m.sender === 'assistant' && (
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                    <Activity className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{m.active_agent || 'Rytail Orchestrator Agent'}</span>
                  </div>
                  {m.workflow_state && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      State: {m.workflow_state}
                    </span>
                  )}
                </div>
              )}

              {/* Message Content */}
              <div className="whitespace-pre-wrap text-xs font-normal">
                {m.text}
              </div>

              {/* Lifecycle State Progress Timeline */}
              {m.lifecycle_timeline && (
                <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200 space-y-1.5 mt-2">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-700" />
                    Multi-Agent Lifecycle Trace
                  </div>
                  <div className="flex items-center gap-1 overflow-x-auto py-1">
                    {m.lifecycle_timeline.map((step: any, sIdx: number) => (
                      <React.Fragment key={sIdx}>
                        <div className={`px-2 py-0.5 rounded text-[9px] font-bold whitespace-nowrap ${
                          step.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          (step.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse' : 'bg-slate-100 text-slate-400')
                        }`}>
                          {step.step}
                        </div>
                        {sIdx < (m.lifecycle_timeline?.length || 0) - 1 && (
                          <span className="text-slate-300 text-[10px]">&rarr;</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Tool Execution Logs */}
              {m.tools && m.tools.length > 0 && (
                <div className="pt-2 border-t border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1">
                    <Terminal className="w-3 h-3 text-emerald-700" />
                    Authoritative Deterministic Tool Invocation:
                  </span>
                  {m.tools.map((t, tIdx) => (
                    <div key={tIdx} className="bg-white p-2 rounded-lg border border-slate-200 text-[11px] font-mono text-emerald-800 font-medium">
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
            <div className="bg-slate-50 border border-slate-200 text-slate-600 rounded-2xl p-3.5 text-xs font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700 animate-spin" />
              <span>Orchestrating specialized retail agents & authoritative calculations...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="flex gap-2 shrink-0">
        <input 
          type="text"
          placeholder="Ask Rytail Multi-Agent Copilot (e.g. Scan barcode, distance map, replenishment, Nextail compare)..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 bg-white border border-slate-300 text-slate-900 font-medium text-xs rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !inputQuery.trim()}
          className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold px-5 py-3 rounded-xl flex items-center gap-2 disabled:opacity-50 text-xs shadow transition-colors"
        >
          <Send className="w-4 h-4" />
          <span>Dispatch Query</span>
        </button>
      </div>
    </div>
  );
};
