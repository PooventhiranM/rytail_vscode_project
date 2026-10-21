import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { 
  Scan, 
  Camera, 
  Barcode, 
  Layers, 
  ArrowRightLeft, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  History, 
  Package, 
  Store, 
  Check, 
  X,
  Keyboard,
  ShieldCheck
} from 'lucide-react';

export const BarcodeScannerView: React.FC = () => {
  const [storeCode, setStoreCode] = useState('E0100');
  const [barcodeInput, setBarcodeInput] = useState('8901234567890');
  const [loading, setLoading] = useState(false);
  const [scannedItem, setScannedItem] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Stock Movement Modal State
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [sourceLoc, setSourceLoc] = useState('BACKROOM');
  const [destLoc, setDestLoc] = useState('SALES_FLOOR');
  const [moveQty, setMoveQty] = useState(3);
  const [moveReason, setMoveReason] = useState('DISPLAY_REPLENISHMENT');
  const [moveLoading, setMoveLoading] = useState(false);
  const [moveSuccessMsg, setMoveSuccessMsg] = useState<string | null>(null);

  // Transactions History
  const [transactions, setTransactions] = useState<any[]>([]);

  // Camera Scanner active state
  const [cameraActive, setCameraActive] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  // Keyboard wedge listener buffer
  const barcodeBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    // Initial lookup
    handleLookup('8901234567890');
    loadTransactions();

    // Setup USB / Bluetooth Keyboard Wedge Scanner Listener
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      const now = Date.now();
      if (now - lastKeyTimeRef.current > 150) {
        barcodeBufferRef.current = '';
      }
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        if (barcodeBufferRef.current.length >= 8) {
          const scannedCode = barcodeBufferRef.current;
          setBarcodeInput(scannedCode);
          handleLookup(scannedCode);
          barcodeBufferRef.current = '';
        }
      } else if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadTransactions = async () => {
    try {
      const txs = await api.getScannerTransactions(storeCode);
      setTransactions(txs || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLookup = async (codeToLookup?: string) => {
    const code = (codeToLookup || barcodeInput).trim();
    if (!code) return;

    setLoading(true);
    setErrorMsg(null);
    setMoveSuccessMsg(null);

    try {
      const res = await api.lookupBarcode(code, storeCode);
      setScannedItem(res);
      // Auto-set suggested refill quantity if display shortage exists
      if (res.display_shortage > 0) {
        setMoveQty(Math.min(res.display_shortage, res.backroom_stock || 1));
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Product or Barcode not found.');
      setScannedItem(null);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveStock = async () => {
    if (!scannedItem) return;
    if (sourceLoc === destLoc) {
      alert('Source and destination locations cannot be identical.');
      return;
    }

    setMoveLoading(true);
    try {
      const payload = {
        store_code: storeCode,
        sku: scannedItem.sku,
        source_location: sourceLoc,
        destination_location: destLoc,
        quantity: Number(moveQty),
        reason: moveReason,
        idempotency_key: `IDEMP-${Date.now()}`
      };

      const res = await api.moveStock(payload);
      setMoveSuccessMsg(res.message);
      setShowMoveModal(false);
      // Refresh current barcode data and transaction list
      await handleLookup(scannedItem.barcode);
      await loadTransactions();
    } catch (err: any) {
      alert(`Movement failed: ${err.message}`);
    } finally {
      setMoveLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-700/80 text-emerald-100 uppercase tracking-wider">
              Module 4 &bull; Store Mobility Workstation
            </span>
            <span className="flex items-center gap-1 text-xs text-emerald-200">
              <Keyboard className="w-3.5 h-3.5 text-emerald-300" />
              Hardware Wedge & Camera Active
            </span>
          </div>
          <h1 className="text-2xl font-bold">In-Store Barcode Scanner & Stock Movement</h1>
          <p className="text-emerald-100/80 text-sm mt-1 max-w-2xl">
            Real-time multi-location inventory tracking (Sales Floor, Backroom, Quarantine). 
            Identifies display shelf shortages against Minimum Display Quantity (MDQ) and posts atomic stock movements.
          </p>
        </div>

        {/* Store Selector */}
        <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20 shrink-0">
          <label className="text-xs text-emerald-200 font-medium block mb-1">Store Context</label>
          <select 
            value={storeCode}
            onChange={(e) => {
              setStoreCode(e.target.value);
              handleLookup();
            }}
            className="bg-emerald-950/80 text-white font-medium text-sm rounded-lg px-3 py-2 border border-emerald-600/50 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <option value="E0100">Store E0100 - Phoenix Mall Bengaluru</option>
            <option value="E0101">Store E0101 - Forum Mall Whitefield</option>
            <option value="E0105">Store E0105 - High Street Phoenix Mumbai</option>
          </select>
        </div>
      </div>

      {/* Barcode Search & Sample Presets Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Barcode className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              placeholder="Scan barcode via camera, laser scanner or enter manually (e.g. 8901234567890)"
              className="w-full pl-11 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-medium"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={() => handleLookup()}
              disabled={loading}
              className="flex-1 md:flex-initial px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-xl shadow transition-colors flex items-center justify-center gap-1.5"
            >
              <Scan className="w-4 h-4" />
              <span>{loading ? 'Searching...' : 'Scan / Lookup'}</span>
            </button>

            <button
              onClick={() => setCameraActive(!cameraActive)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                cameraActive 
                  ? 'bg-rose-50 border-rose-200 text-rose-700' 
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>{cameraActive ? 'Close Camera' : 'Camera'}</span>
            </button>
          </div>
        </div>

        {/* Quick Sample Barcode Chips */}
        <div className="flex items-center gap-2 pt-1 flex-wrap text-xs">
          <span className="text-slate-400 font-medium">Quick Demo Barcodes:</span>
          {[
            { label: "Polo Gray (M)", code: "8901234567890" },
            { label: "Polo Black (L)", code: "8901234000101" },
            { label: "Navy Blazer (40)", code: "8901234000105" }
          ].map((sample) => (
            <button
              key={sample.code}
              onClick={() => {
                setBarcodeInput(sample.code);
                handleLookup(sample.code);
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200 rounded-lg text-slate-700 font-medium transition-colors"
            >
              {sample.label} <code className="text-slate-400 font-mono text-[10px]">({sample.code})</code>
            </button>
          ))}
        </div>
      </div>

      {/* Simulated Live Camera Viewfinder Overlay */}
      {cameraActive && (
        <div className="bg-slate-900 rounded-2xl p-6 text-white text-center relative overflow-hidden border-2 border-emerald-500 shadow-xl">
          <div className="max-w-md mx-auto py-8">
            <div className="w-64 h-44 border-2 border-dashed border-emerald-400 rounded-2xl mx-auto flex flex-col items-center justify-center relative">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg"></div>
              <div className="w-full h-0.5 bg-emerald-400/80 animate-pulse my-auto"></div>
              <p className="text-xs text-emerald-200 mt-2 font-medium">Align Barcode within Guide</p>
            </div>

            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => setTorchOn(!torchOn)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                  torchOn ? 'bg-amber-400 text-slate-900 border-amber-300' : 'bg-white/10 text-white border-white/20'
                }`}
              >
                🔦 {torchOn ? 'Torch ON' : 'Torch OFF'}
              </button>
              <button
                onClick={() => {
                  handleLookup('8901234567890');
                  setCameraActive(false);
                }}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-semibold"
              >
                Simulate Camera Capture
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Movement Success Alert */}
      {moveSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{moveSuccessMsg}</span>
          </div>
          <button onClick={() => setMoveSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* Product & Multi-Location Stock Details */}
      {scannedItem && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Garment Identification Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 uppercase">
                  {scannedItem.category}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{scannedItem.product_name}</h3>
                <div className="text-xs text-slate-500 font-mono mt-0.5">SKU: {scannedItem.sku}</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-extrabold text-emerald-800">₹{scannedItem.mrp.toLocaleString()}</div>
                <div className="text-[11px] text-slate-400">MRP Inclusive</div>
              </div>
            </div>

            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
              <img 
                src={scannedItem.image_url} 
                alt={scannedItem.product_name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px]">STYLE</span>
                <span className="font-semibold text-slate-800 font-mono">{scannedItem.style_code}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px]">COLOR</span>
                <span className="font-semibold text-slate-800">{scannedItem.color}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px]">SIZE</span>
                <span className="font-semibold text-slate-800">{scannedItem.size}</span>
              </div>
            </div>
          </div>

          {/* Location Inventory & Replenishment Alert (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* MDQ Shelf Replenishment Banner */}
            <div className={`p-4 rounded-2xl border ${
              scannedItem.display_shortage > 0 
                ? 'bg-amber-50/80 border-amber-200 text-amber-950' 
                : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {scannedItem.display_shortage > 0 ? (
                    <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="font-bold text-sm">
                      {scannedItem.display_shortage > 0 
                        ? `Display Shelf Shortage Detected: ${scannedItem.display_shortage} units`
                        : 'Shelf Compliant: Meets Minimum Display Quantity'
                      }
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Required MDQ: <strong>{scannedItem.mdq} units</strong> on Sales Floor. Current Sales Floor on-hand: <strong>{scannedItem.sales_floor_stock} units</strong>.
                      {scannedItem.display_shortage > 0 && scannedItem.backroom_stock > 0 && (
                        <span> Available in backroom to replenish: <strong>{scannedItem.backroom_stock} units</strong>.</span>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSourceLoc('BACKROOM');
                    setDestLoc('SALES_FLOOR');
                    setMoveQty(Math.min(scannedItem.display_shortage, scannedItem.backroom_stock || 1));
                    setShowMoveModal(true);
                  }}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold shadow transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Move Stock</span>
                </button>
              </div>
            </div>

            {/* Location-wise Inventory Balances Grid */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  Location-Wise Stock Balances ({scannedItem.store_code})
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full">
                  Total Store: {scannedItem.total_store_stock} units
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {(scannedItem.locations || []).map((loc: any) => (
                  <div 
                    key={loc.code}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      loc.code === 'SALES_FLOOR' 
                        ? 'bg-emerald-50/50 border-emerald-300' 
                        : (loc.code === 'BACKROOM' ? 'bg-indigo-50/50 border-indigo-200' : 'bg-slate-50 border-slate-200')
                    }`}
                  >
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                      {loc.code.replace('_', ' ')}
                    </span>
                    <div className="text-2xl font-bold text-slate-900 my-1">
                      {loc.on_hand}
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      {loc.available} Available
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-xs text-slate-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Internal movements update locations atomically and preserve total store inventory count.</span>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setSourceLoc('BACKROOM');
                  setDestLoc('SALES_FLOOR');
                  setShowMoveModal(true);
                }}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Replenish Sales Floor</span>
              </button>
              <button 
                onClick={() => {
                  setSourceLoc('SALES_FLOOR');
                  setDestLoc('DAMAGED');
                  setShowMoveModal(true);
                }}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition-colors"
              >
                Mark Damaged
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Movement Modal */}
      {showMoveModal && scannedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Move Inventory Within Store</h3>
              <button onClick={() => setShowMoveModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-900">{scannedItem.product_name}</div>
              <div className="text-slate-500">{scannedItem.sku} &bull; Size {scannedItem.size}</div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Source Location</label>
                <select 
                  value={sourceLoc}
                  onChange={(e) => setSourceLoc(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
                >
                  <option value="BACKROOM">Backroom (Available: {scannedItem.backroom_stock})</option>
                  <option value="SALES_FLOOR">Sales Floor (Available: {scannedItem.sales_floor_stock})</option>
                  <option value="RECEIVING">Goods Receiving Area</option>
                  <option value="DAMAGED">Damaged Stock</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Destination Location</label>
                <select 
                  value={destLoc}
                  onChange={(e) => setDestLoc(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
                >
                  <option value="SALES_FLOOR">Sales Floor</option>
                  <option value="BACKROOM">Backroom</option>
                  <option value="DAMAGED">Damaged Stock</option>
                  <option value="QUARANTINE">Quarantine Stock</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Quantity to Move</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    min="1"
                    max="50"
                    value={moveQty}
                    onChange={(e) => setMoveQty(Number(e.target.value))}
                    className="w-24 p-2 bg-white border border-slate-300 rounded-lg font-semibold text-center"
                  />
                  <div className="flex gap-1">
                    {[1, 2, 3, 5, 10].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setMoveQty(q)}
                        className={`px-2 py-1 rounded border text-xs ${moveQty === q ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-slate-100 text-slate-700'}`}
                      >
                        +{q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Movement Reason</label>
                <select 
                  value={moveReason}
                  onChange={(e) => setMoveReason(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                >
                  <option value="DISPLAY_REPLENISHMENT">Display Shelf Replenishment</option>
                  <option value="CUSTOMER_REQUEST">Customer Fitting Room Request</option>
                  <option value="DAMAGED_REMOVAL">Damaged / Defect Segregation</option>
                  <option value="CYCLE_COUNT_ADJUSTMENT">Cycle Count Reconciliation</option>
                </select>
              </div>
            </div>

            <div className="pt-3 flex gap-2">
              <button
                onClick={() => setShowMoveModal(false)}
                className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleMoveStock}
                disabled={moveLoading}
                className="flex-1 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold shadow"
              >
                {moveLoading ? 'Posting...' : 'Confirm Movement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Movement Audit Trail Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-700" />
            Recent Stock Movement Audit Transactions
          </h3>
          <button onClick={loadTransactions} className="text-slate-400 hover:text-slate-600 text-xs flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3">Tx Number</th>
                <th className="py-2.5 px-3">Store</th>
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3">Source &rarr; Dest</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3">Reason</th>
                <th className="py-2.5 px-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No transactions recorded yet. Move stock to create an audit record.
                  </td>
                </tr>
              ) : (
                transactions.slice(0, 8).map((tx, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-900">{tx.transaction_number}</td>
                    <td className="py-2.5 px-3">{tx.store_code}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">{tx.sku}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-slate-700">{tx.source}</span>
                      <span className="text-slate-400 mx-1">&rarr;</span>
                      <span className="font-semibold text-emerald-800">{tx.dest}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800">{tx.quantity}</td>
                    <td className="py-2.5 px-3 text-slate-600">{tx.reason}</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">
                      {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
