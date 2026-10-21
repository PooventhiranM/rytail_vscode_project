import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Settings, Save } from 'lucide-react';

export const ConfigView: React.FC = () => {
  const [config, setConfig] = useState<any>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    api.getConfig().then(setConfig).catch(() => {});
  }, []);

  const handleSave = async (key: string, val: string) => {
    setSavingKey(key);
    try {
      await api.updateConfig(key, val);
      alert(`Parameter '${key}' saved.`);
    } catch (e: any) {
      alert(`Error updating config: ${e.message}`);
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Business Governance</span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Algorithm Configuration & Parameters</h1>
          <p className="text-xs text-slate-500 font-medium">Configure global retail business rules: lead times, review periods, safety stocks, display MOQs, and threshold rules.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(config).map(([key, item]: [string, any]) => (
            <div key={key} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-900 text-sm">{key}</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 font-mono font-bold px-2 py-0.5 rounded-md">{item.type}</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">{item.description}</p>
              
              <div className="flex gap-2 pt-2">
                <input 
                  type="text"
                  defaultValue={item.value}
                  onBlur={(e) => setConfig({...config, [key]: {...item, value: e.target.value}})}
                  className="bg-white border border-slate-300 text-slate-900 font-bold rounded-xl p-2 text-xs flex-1"
                />
                <button
                  onClick={() => handleSave(key, config[key].value)}
                  disabled={savingKey === key}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
