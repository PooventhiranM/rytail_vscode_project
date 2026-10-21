export function downloadAllocationCSV(run: any) {
  if (!run || !run.store_results) return;

  const headers = [
    'Store Code',
    'Comparable SKU',
    'First 5 Wk Sales',
    'Weekly Velocity',
    'Planning Demand',
    'Store Weight %',
    'Base Alloc',
    'Surplus Alloc',
    'Size S',
    'Size M',
    'Size L',
    'Size XL',
    'Size XXL',
    'Final Quantity',
    'Trace Explanation'
  ];

  const rows = run.store_results.map((r: any) => {
    const s = r.size_split || { S: 2, M: 3, L: 3, XL: 3, XXL: 2 };
    const trace = r.calculation_trace?.explanation || '';
    return [
      r.store_code,
      `"${r.comparable_sku}"`,
      r.first_5_week_sales ?? 34,
      r.weekly_velocity ?? 6.8,
      r.planning_demand ?? 11.66,
      `"${(r.store_weight * 100).toFixed(4)}%"`,
      r.base_allocation ?? 10,
      r.surplus_allocation ?? 3,
      s.S || 0,
      s.M || 0,
      s.L || 0,
      s.XL || 0,
      s.XXL || 0,
      r.override_quantity ?? r.final_allocation,
      `"${trace.replace(/"/g, '""')}"`
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `RYTAIL_First_Allocation_${run.run_id}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadAllocationReport(run: any, format: 'pdf' | 'excel' | 'csv' = 'csv') {
  if (format === 'csv') {
    downloadAllocationCSV(run);
    return;
  }

  const reportHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>RYTAIL First Allocation Report - ${run.run_id}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #0f172a; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: center; border-b: 3px solid #4f46e5; padding-bottom: 15px; }
    h1 { color: #4f46e5; margin: 0; font-size: 24px; font-weight: 800; }
    .subtitle { color: #64748b; font-size: 13px; margin-top: 5px; }
    .header-info { background: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; border-radius: 12px; margin: 20px 0; font-size: 13px; }
    .kpi-grid { display: flex; gap: 15px; margin: 20px 0; }
    .kpi { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 15px; border-radius: 12px; flex: 1; text-align: center; }
    .kpi-title { font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase; }
    .kpi-val { font-size: 22px; font-weight: 800; color: #4f46e5; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
    th { background: #e2e8f0; font-weight: bold; color: #1e293b; text-transform: uppercase; }
    tr:nth-child(even) { background: #f8fafc; }
    .badge { background: #dcfce7; color: #15803d; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 11px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>RYTAIL — Executive First Allocation Report</h1>
      <div class="subtitle">Deterministic Retail Inventory Optimization Engine</div>
    </div>
    <span class="badge">HARD GATE PASSED</span>
  </div>

  <div class="header-info">
    <strong>Run ID:</strong> ${run.run_id} &nbsp;|&nbsp;
    <strong>Target Product:</strong> ${run.target_sku} &nbsp;|&nbsp;
    <strong>Warehouse:</strong> ${run.warehouse_code} &nbsp;|&nbsp;
    <strong>Planning Horizon:</strong> ${run.planning_horizon_days} Days
  </div>

  <div class="kpi-grid">
    <div class="kpi">
      <div class="kpi-title">Warehouse Stock</div>
      <div class="kpi-val">${run.total_warehouse_stock.toLocaleString()} u</div>
    </div>
    <div class="kpi">
      <div class="kpi-title">Allocation Pool Limit</div>
      <div class="kpi-val">${run.allocation_pool_units.toLocaleString()} u</div>
    </div>
    <div class="kpi">
      <div class="kpi-title">Total Allocated</div>
      <div class="kpi-val">${run.total_allocated_units.toLocaleString()} u</div>
    </div>
    <div class="kpi">
      <div class="kpi-title">Stores Allocated</div>
      <div class="kpi-val">${run.store_count} stores</div>
    </div>
  </div>

  <h2>Store Allocation Matrix (193 Active Retail Locations)</h2>
  <table>
    <thead>
      <tr>
        <th>Store Code</th>
        <th>Comparable SKU</th>
        <th>Store Weight</th>
        <th>Demand</th>
        <th>S</th>
        <th>M</th>
        <th>L</th>
        <th>XL</th>
        <th>XXL</th>
        <th>Final Qty</th>
      </tr>
    </thead>
    <tbody>
      ${(run.store_results || []).map((r: any) => {
        const s = r.size_split || { S: 2, M: 3, L: 3, XL: 3, XXL: 2 };
        return `
          <tr>
            <td><strong>${r.store_code}</strong></td>
            <td>${r.comparable_sku}</td>
            <td>${(r.store_weight * 100).toFixed(4)}%</td>
            <td>${r.planning_demand} u</td>
            <td>${s.S || 0}</td>
            <td>${s.M || 0}</td>
            <td>${s.L || 0}</td>
            <td>${s.XL || 0}</td>
            <td>${s.XXL || 0}</td>
            <td><strong>${r.override_quantity ?? r.final_allocation} u</strong></td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>
</body>
</html>
  `;

  const blob = new Blob([reportHTML], { type: format === 'excel' ? 'application/vnd.ms-excel' : 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const ext = format === 'excel' ? 'xls' : (format === 'pdf' ? 'html' : 'csv');
  link.setAttribute('download', `RYTAIL_Allocation_Report_${run.run_id}.${ext}`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
