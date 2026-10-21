const API_BASE = '/api/v1';

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API Error (${response.status}): ${errText}`);
  }

  return response.json();
}

export const api = {
  // Master Data
  getProducts: () => fetchApi<any[]>('/products'),
  getStores: () => fetchApi<any[]>('/stores'),
  getInventory: (locationCode?: string, sku?: string) => 
    fetchApi<any[]>(`/inventory?${locationCode ? `location_code=${locationCode}` : ''}${sku ? `&sku=${sku}` : ''}`),
  getNetworkBalancing: (sku: string) => fetchApi<any>(`/inventory/network-balancing?sku=${encodeURIComponent(sku)}`),
  getSalesSummary: (sku?: string) => fetchApi<any>(`/sales/summary${sku ? `?sku=${encodeURIComponent(sku)}` : ''}`),
  getComparables: (sku: string) => fetchApi<any>(`/sales/comparables/${encodeURIComponent(sku)}`),

  // First Allocation
  runFirstAllocation: (data: any) => fetchApi<any>('/allocation/run', { method: 'POST', body: JSON.stringify(data) }),
  getAllocationRun: (runId: string) => fetchApi<any>(`/allocation/${runId}`),
  overrideAllocation: (runId: string, override: any) => 
    fetchApi<any>(`/allocation/${runId}/override`, { method: 'POST', body: JSON.stringify(override) }),
  approveAllocation: (runId: string) => fetchApi<any>(`/allocation/${runId}/approve`, { method: 'POST' }),

  // Replenishment
  runReplenishment: (data?: any) => fetchApi<any>('/replenishment/run', { method: 'POST', body: JSON.stringify(data || {}) }),
  getReplenishmentRun: (runId: string) => fetchApi<any>(`/replenishment/${runId}`),
  approveReplenishment: (runId: string) => fetchApi<any>(`/replenishment/${runId}/approve`, { method: 'POST' }),

  // Store Transfer
  runTransfers: (data?: any) => fetchApi<any>('/transfers/run', { method: 'POST', body: JSON.stringify(data || {}) }),
  getTransferRun: (runId: string) => fetchApi<any>(`/transfers/${runId}`),
  approveTransfer: (runId: string) => fetchApi<any>(`/transfers/${runId}/approve`, { method: 'POST' }),

  // Planning & Simulation
  getPlanningRuns: () => fetchApi<any[]>('/planning/runs'),
  simulateAllocation: (data: any) => fetchApi<any>('/planning/simulate', { method: 'POST', body: JSON.stringify(data) }),

  // Approvals & Governance
  getPendingApprovals: () => fetchApi<any>('/approvals/pending'),
  getConfig: () => fetchApi<any>('/config'),
  updateConfig: (key: string, value: string) => fetchApi<any>(`/config?key=${key}&value=${value}`, { method: 'POST' }),
  getDataQuality: () => fetchApi<any>('/data-quality/audit'),
  getAuditLogs: () => fetchApi<any[]>('/audit/logs'),

  // Warehouse-to-Store Distance & Routing Network
  getWarehouses: () => fetchApi<any[]>('/warehouses'),
  getWarehouseNetworkMap: (warehouseCode?: string) => 
    fetchApi<any>(`/warehouses/network-map${warehouseCode ? `?warehouse_code=${encodeURIComponent(warehouseCode)}` : ''}`),

  // In-Store Barcode Scanning & Multi-Location Stock Movements
  lookupBarcode: (code: string, storeCode = 'E0100') =>
    fetchApi<any>(`/scanner/lookup?barcode=${encodeURIComponent(code)}&store_code=${encodeURIComponent(storeCode)}`),
  moveStock: (payload: any) => 
    fetchApi<any>('/scanner/move-stock', { method: 'POST', body: JSON.stringify(payload) }),
  getScannerTransactions: (storeCode?: string) => 
    fetchApi<any[]>(`/scanner/transactions${storeCode ? `?store_code=${storeCode}` : ''}`),

  // Physical Inventory Cycle Counts & Audits
  getCycleCountSessions: (storeCode?: string) => 
    fetchApi<any[]>(`/cycle-counts?${storeCode ? `store_code=${storeCode}` : ''}`),
  createCycleCountSession: (payload: any) => 
    fetchApi<any>('/cycle-counts', { method: 'POST', body: JSON.stringify(payload) }),
  recordCycleCountScan: (sessionId: number, payload: any) => 
    fetchApi<any>(`/cycle-counts/${sessionId}/scan`, { method: 'POST', body: JSON.stringify(payload) }),
  submitCycleCount: (sessionId: number) => 
    fetchApi<any>(`/cycle-counts/${sessionId}/submit`, { method: 'POST' }),
  reviewCycleCount: (sessionId: number, approve: boolean, notes?: string) => 
    fetchApi<any>(`/cycle-counts/${sessionId}/review`, { method: 'POST', body: JSON.stringify({ approve, notes }) }),

  // Multi-Platform Data Connectors & Ingestion
  getConnectors: () => fetchApi<any[]>('/connectors'),
  syncConnector: (connectorId: string) => 
    fetchApi<any>(`/connectors/${connectorId}/sync`, { method: 'POST' }),

  // Google Cloud Storage (GCS) Live Data Connect & Ingestion
  getGCSStatus: () => fetchApi<any>('/gcs/status'),
  configureGCS: (payload: { project_id?: string; bucket_name?: string; prefix?: string; service_account_json?: string }) =>
    fetchApi<any>('/gcs/configure', { method: 'POST', body: JSON.stringify(payload) }),
  testGCSConnection: () => fetchApi<any>('/gcs/test-connection', { method: 'POST' }),
  getGCSObjects: () => fetchApi<any[]>('/gcs/objects'),
  syncGCSLiveData: (blobName?: string) =>
    fetchApi<any>('/gcs/sync-live-data', { method: 'POST', body: JSON.stringify({ blob_name: blobName }) }),
  exportGCSSnapshot: (runId: string, runType = 'first_allocation') =>
    fetchApi<any>('/gcs/export-snapshot', { method: 'POST', body: JSON.stringify({ run_id: runId, run_type: runType }) }),

  // AI Copilot
  queryCopilot: (query: string) => fetchApi<any>('/copilot/query', { method: 'POST', body: JSON.stringify({ query }) }),
};
