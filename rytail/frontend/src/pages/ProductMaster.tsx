import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { ShoppingBag } from 'lucide-react';

export const ProductMasterView: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    api.getProducts().then(setProducts).catch(() => {});
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Master Data</span>
          <h1 className="text-2xl font-extrabold text-white mt-1">Product Hierarchy & Master</h1>
          <p className="text-xs text-slate-400">Brand &rarr; Division &rarr; Department &rarr; Category &rarr; Product Type &rarr; Style &rarr; Color &rarr; SKU &rarr; Size</p>
        </div>
        <span className="text-xs bg-blue-950 text-blue-300 font-bold px-3 py-1.5 rounded-full border border-blue-800">
          {products.length} Products Cataloged
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map(p => (
          <div key={p.sku} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-xs text-blue-400 font-bold">{p.sku}</span>
                <h3 className="font-bold text-white text-base mt-0.5">{p.product_name}</h3>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                {p.lifecycle_status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-3 rounded-xl text-slate-300">
              <div>Division: <strong className="text-white">{p.division}</strong></div>
              <div>Dept: <strong className="text-white">{p.department}</strong></div>
              <div>Category: <strong className="text-white">{p.category}</strong></div>
              <div>Type: <strong className="text-white">{p.product_type}</strong></div>
              <div>Fit: <strong className="text-white">{p.fit}</strong></div>
              <div>Sleeve: <strong className="text-white">{p.sleeve}</strong></div>
            </div>

            <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800 text-slate-400">
              <span>Cost: ₹{p.cost_price}</span>
              <span>Selling Price: <strong className="text-emerald-400 font-bold">₹{p.selling_price}</strong></span>
              <span>MRP: ₹{p.mrp}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
