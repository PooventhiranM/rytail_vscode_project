import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';
import { ReplenishmentRun, ReplenishmentResult } from '../types';
import { 
  RefreshCw, Download, Filter, Search, AlertTriangle, 
  CheckCircle2, ArrowUpDown, ChevronRight, Binary, FileSpreadsheet
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { KpiCard } from '../components/common/KpiCard';
import { StatusPill } from '../components/common/StatusPill';
import { AiSuggestionCard } from '../components/common/AiSuggestionCard';
import { EvidencePanel } from '../components/common/EvidencePanel';
import { Drawer } from '../components/common/Drawer';
import { ReplenishmentPriorityScatter } from '../components/visuals/ReplenishmentPriorityScatter';

export const ReplenishmentView: React.FC = () => {
  const [run, setRun] = useState<ReplenishmentRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrace, setSelectedTrace] = useState<ReplenishmentResult | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'priority' | 'qty' | 'store'>('priority');

  const handleExecuteReplenishment = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.runReplenishment({ 
        lead_time_days: 5, 
        review_period_days: 7, 
        safety_stock_units: 3 
      });
      setRun(res);
    } catch (e: any) {
      setError(e.message || 'Failed to execute replenishment simulation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleExecuteReplenishment();
  }, []);

  // Filter and sort results
  const filteredResults = useMemo(() => {
    if (!run) return [];
    return run.results.filter((item) => {
      const matchesPriority = priorityFilter === 'ALL' || item.priority_level.toUpperCase() === priorityFilter.toUpperCase();
      const matchesSearch = 
        item.store_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.size_code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesPriority && matchesSearch;
    }).sort((a, b) => {
      if (sortField === 'qty') return b.recommended_qty - a.recommended_qty;
      if (sortField === 'store') return a.store_code.localeCompare(b.store_code);
      // Priority sorting: Critical -> High -> Medium -> Low
      const order: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      return (order[a.priority_level] ?? 4) - (order[b.priority_level] ?? 4);
    });
  }, [run, priorityFilter, searchQuery, sortField]);

  // CSV Export helper
  const handleExportCSV = () => {
    if (!run || !run.results.length) return;
    const headers = ['Priority', 'StoreCode', 'SKU', 'Size', 'CurrentStock', 'InTransit', 'ADS', 'WOS', 'TargetStock', 'RecommendedQty'];
    const rows = run.results.map(r => [
      r.priority_level,
      r.store_code,
      r.sku,
      r.size_code,
      r.current_stock,
      r.in_transit_stock,
      r.average_daily_sales,
      r.wos,
      r.target_stock,
      r.recommended_qty
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `replenishment_dispatch_${run.run_id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 min-h-screen bg-bg text-ink max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="bg-card border border-border rounded p-5 sm:p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Planning & Replenishment
            </span>
            <span className="text-[11px] font-mono bg-sage text-primary px-2 py-0.5 rounded-sm font-medium">
              REPL-SPE-02 + REPL-ORD-01
            </span>
          </div>
          <h1 className="text-[22px] font-semibold text-ink mt-1 leading-tight">
            Store Inventory Replenishment
          </h1>
          <p className="text-sm text-ink-muted mt-1 max-w-2xl">
            Exceptions-first replenishment optimization at Store &times; SKU &times; Size grain. Target stock formula: <code className="font-mono text-xs bg-bg px-1.5 py-0.5 rounded text-primary">ceil(ADS &times; (LT + RP) + SS)</code>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {run && (
            <Button
              variant="secondary"
              size="md"
              icon={<Download className="w-4 h-4" />}
              onClick={handleExportCSV}
            >
              Export CSV
            </Button>
          )}

          <Button
            variant="primary"
            size="md"
            loading={loading}
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={handleExecuteReplenishment}
          >
            {loading ? 'Calculating...' : 'Run Replenishment'}
          </Button>
        </div>
      </div>

      {/* State 1: Error Banner */}
      {error && (
        <div className="bg-danger-bg border border-danger/30 rounded p-4 flex items-center justify-between text-danger text-sm">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="danger" size="sm" onClick={handleExecuteReplenishment}>
            Retry
          </Button>
        </div>
      )}

      {/* State 2: Loading Skeletons */}
      {loading && !run && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-card border border-border rounded animate-pulse p-4" />
            ))}
          </div>
          <div className="h-64 bg-card border border-border rounded animate-pulse" />
        </div>
      )}

      {/* Main Content Area */}
      {run && (
        <>
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Recommended Units"
              value={`${run.total_recommended_units.toLocaleString('en-IN')} u`}
              delta={{ value: '+12% vs last cycle', trend: 'up', isPositiveGood: true }}
              subtitle="Total dispatch requirement"
              asOf={new Date(run.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            />
            <KpiCard
              label="Total MRP Value"
              value={`₹${(run.total_recommended_value / 100000).toFixed(2)} Lakhs`}
              subtitle="₹1,299 avg ticket price"
            />
            <KpiCard
              label="Critical Stockouts"
              value={`${run.critical_count} lines`}
              delta={{ value: 'Immediate Action', trend: 'down', isPositiveGood: false }}
              subtitle="WOS < 1.0 or Zero Stock"
            />
            <KpiCard
              label="High Priority Cover"
              value={`${run.high_count} lines`}
              subtitle="1.0 ≤ WOS < 2.0"
            />
          </div>

          {/* AI Orchestrator Suggestion Card */}
          <AiSuggestionCard
            title={`Replenishment Run Plan: ${run.run_id}`}
            summary={`Automated evaluation completed across ${run.results.length} store SKU-size lines. The engine detected ${run.critical_count} critical stockout risks requiring prompt backroom or DC dispatch. All allocations comply with warehouse supply limits and maximum store capacities.`}
            onViewCalculation={() => setSelectedTrace(run.results[0])}
            metrics={[
              { label: 'Run Status', value: run.status },
              { label: 'Lines Scored', value: run.results.length },
              { label: 'Critical Lines', value: run.critical_count },
              { label: 'Lead Time', value: '5 Days' }
            ]}
            assumptions={[
              'Lead time set to 5 days, review period to 7 days, safety buffer to 3 units.',
              'Negative net store sales resulting from customer returns are clamped to zero.',
              'Zero warehouse stock items are filtered upfront per REPL-SPE-02 Gate G3.'
            ]}
          />

          {/* Visual Priority Scatter Quadrant */}
          <Card title="Replenishment Priority Matrix" subtitle="Current Available Stock vs Rate of Sale (ADS) with Weeks of Cover Bands">
            <ReplenishmentPriorityScatter />
          </Card>

          {/* Exceptions-First Table Card */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <span>Replenishment Dispatch Matrix</span>
                <span className="text-xs font-normal text-ink-muted">
                  ({filteredResults.length} matching of {run.results.length} total lines)
                </span>
              </div>
            }
            subtitle="Store x SKU x Size allocation ordered by operational urgency"
            action={
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-ink-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search store or SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-bg border border-border text-xs rounded pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary w-44"
                  />
                </div>

                {/* Priority Filter */}
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-bg border border-border text-ink text-xs rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="CRITICAL">Critical Only</option>
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                </select>

                {/* Sort Option */}
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as any)}
                  className="bg-bg border border-border text-ink text-xs rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="priority">Sort by Urgency</option>
                  <option value="qty">Sort by Quantity</option>
                  <option value="store">Sort by Store</option>
                </select>
              </div>
            }
          >
            <div className="overflow-x-auto -mx-4 sm:-mx-5 -my-4 sm:-my-5">
              <table className="w-full text-left text-xs text-ink">
                <thead className="bg-bg border-b border-border text-ink-muted uppercase font-semibold text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Store</th>
                    <th className="py-3 px-4">SKU Code</th>
                    <th className="py-3 px-4">Size</th>
                    <th className="py-3 px-4 text-right">Current Stock</th>
                    <th className="py-3 px-4 text-right">In-Transit</th>
                    <th className="py-3 px-4 text-right">ADS</th>
                    <th className="py-3 px-4 text-right">WOS</th>
                    <th className="py-3 px-4 text-right">Target</th>
                    <th className="py-3 px-4 text-right font-semibold text-primary">Replenish Qty</th>
                    <th className="py-3 px-4 text-center">Trace</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-normal">
                  {filteredResults.slice(0, 150).map((r, idx) => (
                    <tr 
                      key={idx} 
                      className="hover:bg-sage/40 transition-colors cursor-pointer group"
                      onClick={() => setSelectedTrace(r)}
                    >
                      <td className="py-2.5 px-4">
                        <StatusPill status={r.priority_level} />
                      </td>
                      <td className="py-2.5 px-4 font-mono font-medium text-ink">
                        {r.store_code}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-ink-muted group-hover:text-ink">
                        {r.sku}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-primary">
                        {r.size_code}
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums">
                        {r.current_stock}
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums text-ink-muted">
                        {r.in_transit_stock}
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums">
                        {r.average_daily_sales.toFixed(1)}/d
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums font-mono font-medium">
                        {r.wos.toFixed(1)}w
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums font-semibold">
                        {r.target_stock}
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums font-bold text-primary text-sm bg-sage/20">
                        {r.recommended_qty} u
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTrace(r);
                          }}
                          className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-0.5"
                        >
                          <span>Explain</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredResults.length === 0 && (
                <div className="p-8 text-center text-ink-muted">
                  <p className="text-sm">No items found matching the selected filters.</p>
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      {/* Calculation Trace Detail Drawer */}
      <Drawer
        isOpen={Boolean(selectedTrace)}
        onClose={() => setSelectedTrace(null)}
        title={
          <div className="flex items-center gap-2">
            <span>Replenishment Calculation Trace</span>
            {selectedTrace && <StatusPill status={selectedTrace.priority_level} />}
          </div>
        }
        subtitle={
          selectedTrace
            ? `Store ${selectedTrace.store_code} • SKU ${selectedTrace.sku} • Size ${selectedTrace.size_code}`
            : ''
        }
      >
        {selectedTrace && (
          <div className="space-y-4">
            <EvidencePanel
              formulaName="Target Stock Replenishment Formula"
              expression="ceil(AverageDailySales × (LeadTimeDays + ReviewPeriodDays) + SafetyStockUnits)"
              algorithmVersion="repl-v1.0.0"
              ruleVersion="REPL-ORD-01"
              inputs={{
                StoreCode: selectedTrace.store_code,
                SKU: selectedTrace.sku,
                Size: selectedTrace.size_code,
                CurrentStock: selectedTrace.current_stock,
                InTransitStock: selectedTrace.in_transit_stock,
                AverageDailySales: selectedTrace.average_daily_sales,
                LeadTimeDays: 5,
                ReviewPeriodDays: 7,
                SafetyStockUnits: 3,
                RateOfSale: selectedTrace.ros,
                WeeksOfSupply: `${selectedTrace.wos} weeks`,
              }}
              outputs={{
                TargetStock: selectedTrace.target_stock,
                RawReplenishmentNeed: selectedTrace.raw_replenishment_qty,
                RecommendedQuantity: `${selectedTrace.recommended_qty} units`,
                PriorityClassification: selectedTrace.priority_level,
              }}
              dataSources={[
                { name: 'DEV|Rytail|OUT|Replenishment Order Details', id: '8152de75-f313-47f6-a50c-48b524fcb503', asOf: 'Live ETL Stream' },
                { name: 'SU_Product_Master', id: '7fb59cab-dd64-4821-a55f-2276d808bfc3', asOf: 'Catalog Master' },
                { name: 'Store_Sku_Min_Display_mapping', id: '7491b7c0-28e1-46fb-804f-79e69b714dc3', asOf: 'Read-Only Matrix' }
              ]}
            />

            <Card title="Trace Log Explanation" subtitle="Deterministic calculation output">
              <p className="text-xs text-ink-muted leading-relaxed font-mono bg-bg p-3 rounded border border-border">
                {selectedTrace.calculation_trace?.explanation || 'No textual trace provided.'}
              </p>
            </Card>

            <div className="pt-2 flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setSelectedTrace(null)}>
                Close Panel
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
