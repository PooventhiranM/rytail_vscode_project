import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Building2, Store } from 'lucide-react';

export const InventoryView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getNetworkBalancing("EXFP00035WHITECAP GRAY").then(res => {
      setData(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">Multi-Echelon View</span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Network Inventory Position</h1>
          <p className="text-xs text-slate-500 font-medium">SKU: <strong className="text-slate-900 font-bold">EXFP00035WHITECAP GRAY</strong> • Central Hub + 193 Retail Locations</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500 font-bold">Network Total Stock</span>
          <p className="text-2xl font-black text-emerald-600">{data?.total_network_stock ?? 4435} units</p>
        </div>
      </div>

      {data && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-600 uppercase font-extrabold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Location Code</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5 text-center">S</th>
                <th className="p-3.5 text-center">M</th>
                <th className="p-3.5 text-center">L</th>
                <th className="p-3.5 text-center">XL</th>
                <th className="p-3.5 text-center">XXL</th>
                <th className="p-3.5 text-right font-black text-slate-900">Available Stock</th>
                <th className="p-3.5 text-right">In Transit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {data.network_positions.map((pos: any, idx: number) => {
                const sb = pos.size_breakdown || {};
                const isWh = pos.location_type === 'WAREHOUSE';

                return (
                  <tr key={idx} className={`hover:bg-indigo-50/20 ${isWh ? 'bg-indigo-50/60 font-extrabold' : ''}`}>
                    <td className="p-3.5 font-extrabold text-slate-900 flex items-center gap-2">
                      {isWh ? <Building2 className="w-4 h-4 text-indigo-600" /> : <Store className="w-4 h-4 text-slate-400" />}
                      <span>{pos.location_code}</span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${isWh ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        {pos.location_type}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">{sb.S ?? 0}</td>
                    <td className="p-3.5 text-center">{sb.M ?? 0}</td>
                    <td className="p-3.5 text-center text-indigo-600 font-bold">{sb.L ?? 0}</td>
                    <td className="p-3.5 text-center">{sb.XL ?? 0}</td>
                    <td className="p-3.5 text-center">{sb.XXL ?? 0}</td>
                    <td className="p-3.5 text-right font-black text-emerald-600 text-sm">{pos.total_stock} u</td>
                    <td className="p-3.5 text-right text-slate-500">{pos.in_transit_stock} u</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
