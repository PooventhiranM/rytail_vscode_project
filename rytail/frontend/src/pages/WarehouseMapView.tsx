import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { 
  MapPin, 
  Warehouse, 
  Truck, 
  AlertTriangle, 
  Navigation, 
  Layers, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Search,
  ArrowRight,
  Filter
} from 'lucide-react';

declare global {
  interface Window {
    L: any;
  }
}

export const WarehouseMapView: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersGroupRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [networkData, setNetworkData] = useState<any>(null);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedHub, setSelectedHub] = useState<string>('WH-NAGPUR');
  const [filterRegion, setFilterRegion] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStore, setSelectedStore] = useState<any>(null);

  useEffect(() => {
    loadNetwork();
  }, [selectedHub]);

  const loadNetwork = async () => {
    setLoading(true);
    try {
      const data = await api.getWarehouseNetworkMap(selectedHub);
      setNetworkData(data);
      if (data.warehouses) setWarehouses(data.warehouses);
    } catch (err) {
      console.error('Failed to load warehouse network:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!networkData || !mapContainerRef.current || !window.L) return;

    if (!mapInstanceRef.current) {
      const map = window.L.map(mapContainerRef.current, {
        center: [21.5, 78.9],
        zoom: 5,
        zoomControl: true,
      });

      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap & CartoDB',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
      layersGroupRef.current = window.L.layerGroup().addTo(map);
    }

    const map = mapInstanceRef.current;
    const layers = layersGroupRef.current;
    layers.clearLayers();

    const activeWh = networkData.active_warehouse;

    // Plot Warehouse Hubs
    (networkData.warehouses || []).forEach((wh: any) => {
      const isSelected = activeWh && wh.code === activeWh.code;
      const whIcon = window.L.divIcon({
        className: 'custom-wh-icon',
        html: `
          <div style="background:${isSelected ? '#176B45' : '#475569'}; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; border:3px solid white; box-shadow:0 4px 10px rgba(0,0,0,0.3); font-size:16px;">
            🏢
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const marker = window.L.marker([wh.latitude, wh.longitude], { icon: whIcon }).addTo(layers);
      marker.bindPopup(`
        <div style="font-family:sans-serif; min-width:200px;">
          <div style="font-weight:700; color:#176B45; font-size:14px;">${wh.name}</div>
          <div style="font-size:12px; color:#64748b; margin-top:2px;">${wh.hub_type} &bull; ${wh.code}</div>
          <div style="font-size:12px; margin-top:6px;"><strong>Capacity:</strong> ${wh.capacity_sqft.toLocaleString()} sq.ft.</div>
          <div style="font-size:11px; color:#475569; margin-top:4px;">${wh.address}</div>
        </div>
      `);
    });

    // Plot Stores & Connection Polylines
    (networkData.connections || []).forEach((conn: any) => {
      if (filterRegion !== 'ALL' && conn.region !== filterRegion) return;
      if (searchQuery && !conn.store_name.toLowerCase().includes(searchQuery.toLowerCase()) && !conn.city.toLowerCase().includes(searchQuery.toLowerCase())) return;

      const storeIcon = window.L.divIcon({
        className: 'custom-store-icon',
        html: `
          <div style="background:#2F9E62; width:14px; height:14px; border-radius:50%; border:2px solid white; box-shadow:0 2px 5px rgba(0,0,0,0.25);"></div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const storeMarker = window.L.marker([conn.store_lat, conn.store_lng], { icon: storeIcon }).addTo(layers);
      storeMarker.on('click', () => setSelectedStore(conn));

      storeMarker.bindPopup(`
        <div style="font-family:sans-serif; min-width:180px;">
          <div style="font-weight:700; color:#1e293b;">${conn.store_name}</div>
          <div style="font-size:12px; color:#64748b;">${conn.store_code} &bull; ${conn.city}, ${conn.state}</div>
          <hr style="margin:6px 0; border:0; border-top:1px solid #e2e8f0;"/>
          <div style="font-size:12px;"><strong>Road Distance:</strong> ${conn.road_km} km</div>
          <div style="font-size:12px;"><strong>Est. Transit:</strong> ${conn.transit_hours} hrs</div>
          <div style="font-size:11px; color:#176B45; margin-top:4px;">Supplied by: ${conn.warehouse_name}</div>
        </div>
      `);

      // Polyline from warehouse to store
      const color = conn.road_km > 1000 ? '#ef4444' : (conn.road_km > 600 ? '#f59e0b' : '#2F9E62');
      const line = window.L.polyline(
        [[conn.wh_lat, conn.wh_lng], [conn.store_lat, conn.store_lng]],
        {
          color: color,
          weight: 2,
          opacity: 0.65,
          dashArray: conn.road_km > 1000 ? '4, 6' : undefined
        }
      ).addTo(layers);

      line.on('click', () => setSelectedStore(conn));
    });

  }, [networkData, filterRegion, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-700/80 text-emerald-100 uppercase tracking-wider">
              Module 3 &bull; Logistics & Supply Chain
            </span>
            <span className="flex items-center gap-1 text-xs text-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Geodesic Engine
            </span>
          </div>
          <h1 className="text-2xl font-bold">Warehouse-to-Store Distance & Routing Map</h1>
          <p className="text-emerald-100/80 text-sm mt-1 max-w-2xl">
            Calculates exact Haversine straight-line coordinates, 1.28x Indian highway circuity factor, 
            freight transit hours, and detects cross-docking threshold alerts across national hubs.
          </p>
        </div>

        {/* Hub Selector */}
        <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20 shrink-0">
          <label className="text-xs text-emerald-200 font-medium block mb-1">Active Distribution Hub</label>
          <select 
            value={selectedHub}
            onChange={(e) => setSelectedHub(e.target.value)}
            className="bg-emerald-950/80 text-white font-medium text-sm rounded-lg px-3 py-2 border border-emerald-600/50 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            {warehouses.map((wh) => (
              <option key={wh.code} value={wh.code} className="bg-slate-900 text-white">
                {wh.name} ({wh.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Metrics Row */}
      {networkData && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Serviced Doors</span>
              <Warehouse className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-800">
              {networkData.summary?.total_stores_serviced || networkData.connections?.length || 0}
            </div>
            <div className="text-xs text-emerald-600 font-medium mt-1">100% network reach</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Avg Road Distance</span>
              <Truck className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-bold text-slate-800">
              {networkData.summary?.avg_road_distance_km || 0} <span className="text-sm font-normal text-slate-500">km</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">1.28x Circuity Factor</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Avg Transit Time</span>
              <Clock className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-slate-800">
              {networkData.summary?.avg_transit_time_hrs || 0} <span className="text-sm font-normal text-slate-500">hrs</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">@ 42 km/h commercial freight</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Network Coverage</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-600">
              {networkData.summary?.network_coverage_pct || 100}%
            </div>
            <div className="text-xs text-slate-500 mt-1">0 unassigned stores</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Distance Alerts</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-600">
              {networkData.alerts?.length || 0}
            </div>
            <div className="text-xs text-amber-600 mt-1">&gt; 900 km threshold</div>
          </div>
        </div>
      )}

      {/* Distance Threshold Alerts Banner */}
      {networkData?.alerts && networkData.alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-amber-900 text-sm">
                Supply Chain Route Optimization Recommendation ({networkData.alerts.length} Outlets)
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                The following stores exceed the 900 km transit threshold from current warehouse. Shifting replenishment to nearby regional DCs saves significant freight cost and transit hours.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                {networkData.alerts.map((alert: any, idx: number) => (
                  <div key={idx} className="bg-white/80 p-2.5 rounded-lg border border-amber-200 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{alert.store_name} ({alert.store_code})</div>
                      <div className="text-slate-500">Current: {alert.current_distance_km} km ({alert.current_wh})</div>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-emerald-700">Recommend {alert.suggested_wh}</span>
                      <div className="text-emerald-600 font-medium">Save {alert.savings_km} km</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Map + Side Details Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Viewport (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* Controls Bar */}
          <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search store or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-44"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <div className="flex gap-1">
                {['ALL', 'SOUTH', 'WEST', 'NORTH', 'EAST', 'CENTRAL'].map((reg) => (
                  <button
                    key={reg}
                    onClick={() => setFilterRegion(reg)}
                    className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${
                      filterRegion === reg ? 'bg-emerald-800 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    {reg}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Leaflet Map Canvas */}
          <div 
            ref={mapContainerRef} 
            className="w-full h-[520px] bg-slate-100 z-10"
          />

          {/* Map Legend */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-800 inline-block"></span>
                NDC / RDC Hub
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
                Retail Store
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-emerald-600 inline-block"></span>
                &lt;600 km
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-amber-500 inline-block"></span>
                600 - 1000 km
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-red-500 inline-block"></span>
                &gt;1000 km
              </span>
            </div>
            <div className="text-slate-400">Tile: CartoDB Voyager</div>
          </div>
        </div>

        {/* Selected Store / Connection Details Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-700" />
                Store Route Intelligence
              </h2>
              {selectedStore && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  {selectedStore.region}
                </span>
              )}
            </div>

            {selectedStore ? (
              <div className="mt-4 space-y-4">
                <div>
                  <div className="text-lg font-bold text-slate-900">{selectedStore.store_name}</div>
                  <div className="text-xs text-slate-500">{selectedStore.store_code} &bull; {selectedStore.city}, {selectedStore.state}</div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Origin Warehouse:</span>
                    <span className="font-semibold text-slate-800">{selectedStore.warehouse_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Straight-line Distance:</span>
                    <span className="font-semibold text-slate-800">{selectedStore.straight_km} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Highway Road Distance:</span>
                    <span className="font-semibold text-emerald-700">{selectedStore.road_km} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Est. Freight Transit Time:</span>
                    <span className="font-semibold text-indigo-700">{selectedStore.transit_hours} hours</span>
                  </div>
                </div>

                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-xs">
                  <div className="font-semibold text-emerald-900 mb-1">Rytail Allocation Sync</div>
                  <p className="text-slate-600">
                    Lead time of <strong>{Math.ceil(selectedStore.transit_hours / 24)} business days</strong> is fed into Rytail Replenishment calculation engine to optimize reorder cycle timing.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400">
                <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600">Click on any store pin or connection line</p>
                <p className="text-xs text-slate-400 mt-1">View routing distance, circuity penalty, and replenishment transit metrics</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button 
              onClick={() => {
                if (networkData?.connections?.length) {
                  setSelectedStore(networkData.connections[0]);
                }
              }}
              className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold shadow transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Inspect Flagship Outlet (E0100)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
