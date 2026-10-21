import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Store as StoreIcon, MapPin, Building, ShieldCheck } from 'lucide-react';

export const StoreMasterView: React.FC = () => {
  const [stores, setStores] = useState<any[]>([]);

  useEffect(() => {
    api.getStores().then(setStores).catch(() => {});
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Master Data</span>
          <h1 className="text-2xl font-extrabold text-white mt-1">Store Network & Hierarchy</h1>
          <p className="text-xs text-slate-400">Country &rarr; Region &rarr; State &rarr; City &rarr; Store Grade (A/B/C/D)</p>
        </div>
        <span className="text-xs bg-emerald-950 text-emerald-300 font-bold px-3 py-1.5 rounded-full border border-emerald-800">
          {stores.length} Retail Locations
        </span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
            <tr>
              <th className="p-3.5">Store Code</th>
              <th className="p-3.5">Store Name</th>
              <th className="p-3.5">Region</th>
              <th className="p-3.5">City</th>
              <th className="p-3.5">Grade</th>
              <th className="p-3.5">Cluster</th>
              <th className="p-3.5">Floor Area</th>
              <th className="p-3.5 text-right font-bold text-white">Capacity</th>
              <th className="p-3.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {stores.map(s => (
              <tr key={s.store_code} className="hover:bg-slate-800/50">
                <td className="p-3.5 font-bold text-white">{s.store_code}</td>
                <td className="p-3.5 font-semibold text-slate-200">{s.store_name}</td>
                <td className="p-3.5 text-slate-400">{s.region}</td>
                <td className="p-3.5">{s.city}</td>
                <td className="p-3.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    s.store_grade === 'A' ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'bg-slate-800 text-slate-300'
                  }`}>
                    Grade {s.store_grade}
                  </span>
                </td>
                <td className="p-3.5 text-slate-400">{s.cluster}</td>
                <td className="p-3.5">{s.floor_area_sqft} sqft</td>
                <td className="p-3.5 text-right font-bold text-emerald-400">{s.store_capacity} u</td>
                <td className="p-3.5 text-center">
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-800">
                    Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
