import math
from typing import List, Dict, Any, Optional

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate straight-line distance in km between two geographic coordinates"""
    R = 6371.0  # Earth radius in kilometers
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = (math.sin(dLat / 2) * math.sin(dLat / 2) +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dLon / 2) * math.sin(dLon / 2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)

def estimate_road_distance(straight_km: float) -> float:
    """Empirical road circuity factor for Indian national and state highway networks ~1.28x"""
    return round(straight_km * 1.28, 1)

def estimate_transit_time_hours(road_km: float) -> float:
    """Average commercial freight transit speed ~42 km/h accounting for toll gates and breaks"""
    return round(road_km / 42.0, 1)

# Authoritative Hubs across India
DEFAULT_WAREHOUSES = [
    {
        "id": "WH-NDC-01",
        "code": "WH-NAGPUR",
        "name": "National Distribution Center (Nagpur MIHAN Hub)",
        "hub_type": "Primary NDC",
        "address": "MIHAN Multi-modal International Cargo Hub, Nagpur, Maharashtra",
        "latitude": 21.0500,
        "longitude": 79.0200,
        "capacity_sqft": 450000,
        "is_active": True
    },
    {
        "id": "WH-RDC-02",
        "code": "WH-MUMBAI",
        "name": "Western Regional DC (Bhiwandi Hub)",
        "hub_type": "Regional RDC",
        "address": "Bhiwandi Logistics Park, Mumbai MMR, Maharashtra",
        "latitude": 19.2967,
        "longitude": 73.0631,
        "capacity_sqft": 280000,
        "is_active": True
    },
    {
        "id": "WH-RDC-03",
        "code": "WH-DELHI",
        "name": "Northern Regional DC (Gurugram Bilaspur Hub)",
        "hub_type": "Regional RDC",
        "address": "NH-48 Bilaspur Logistics Corridor, NCR / Haryana",
        "latitude": 28.3182,
        "longitude": 76.9022,
        "capacity_sqft": 320000,
        "is_active": True
    },
    {
        "id": "WH-RDC-04",
        "code": "WH-BLR",
        "name": "Southern Regional DC (Hosakote Hub)",
        "hub_type": "Regional RDC",
        "address": "Hosakote Industrial Area, Bengaluru, Karnataka",
        "latitude": 13.0719,
        "longitude": 77.7981,
        "capacity_sqft": 300000,
        "is_active": True
    },
    {
        "id": "WH-RDC-05",
        "code": "WH-KOLKATA",
        "name": "Eastern Regional DC (Dankuni Hub)",
        "hub_type": "Regional RDC",
        "address": "Dankuni Logistics Park, Hooghly, West Bengal",
        "latitude": 22.6841,
        "longitude": 88.2936,
        "capacity_sqft": 220000,
        "is_active": True
    }
]

# Fashion Retail Outlets mapped to coordinates
DEFAULT_STORES_GEO = [
    {"store_code": "E0100", "name": "Mumbai BKC Flagship", "city": "Mumbai", "state": "Maharashtra", "region": "WEST", "latitude": 19.0600, "longitude": 72.8600, "assigned_wh": "WH-MUMBAI"},
    {"store_code": "E0101", "name": "Delhi Connaught Place", "city": "New Delhi", "state": "Delhi", "region": "NORTH", "latitude": 28.6315, "longitude": 77.2167, "assigned_wh": "WH-DELHI"},
    {"store_code": "E0102", "name": "Bengaluru Indiranagar 100ft", "city": "Bengaluru", "state": "Karnataka", "region": "SOUTH", "latitude": 12.9719, "longitude": 77.6412, "assigned_wh": "WH-BLR"},
    {"store_code": "E0103", "name": "Hyderabad Banjara Hills", "city": "Hyderabad", "state": "Telangana", "region": "SOUTH", "latitude": 17.4156, "longitude": 78.4350, "assigned_wh": "WH-NAGPUR"},
    {"store_code": "E0104", "name": "Chennai T. Nagar Premier", "city": "Chennai", "state": "Tamil Nadu", "region": "SOUTH", "latitude": 13.0418, "longitude": 80.2342, "assigned_wh": "WH-BLR"},
    {"store_code": "E0105", "name": "Kolkata Park Street Galleria", "city": "Kolkata", "state": "West Bengal", "region": "EAST", "latitude": 22.5535, "longitude": 88.3518, "assigned_wh": "WH-KOLKATA"},
    {"store_code": "E0106", "name": "Ahmedabad CG Road", "city": "Ahmedabad", "state": "Gujarat", "region": "WEST", "latitude": 23.0300, "longitude": 72.5600, "assigned_wh": "WH-MUMBAI"},
    {"store_code": "E0107", "name": "Pune Koregaon Park", "city": "Pune", "state": "Maharashtra", "region": "WEST", "latitude": 18.5362, "longitude": 73.8940, "assigned_wh": "WH-MUMBAI"},
    {"store_code": "E0108", "name": "Jaipur MI Road Heritage", "city": "Jaipur", "state": "Rajasthan", "region": "NORTH", "latitude": 26.9167, "longitude": 75.8167, "assigned_wh": "WH-DELHI"},
    {"store_code": "E0109", "name": "Lucknow Gomti Nagar", "city": "Lucknow", "state": "Uttar Pradesh", "region": "NORTH", "latitude": 26.8500, "longitude": 80.9900, "assigned_wh": "WH-DELHI"},
    {"store_code": "E0110", "name": "Kochi Marine Drive Walk", "city": "Kochi", "state": "Kerala", "region": "SOUTH", "latitude": 9.9816, "longitude": 76.2753, "assigned_wh": "WH-BLR"},
    {"store_code": "E0111", "name": "Chandigarh Sector 17 Plaza", "city": "Chandigarh", "state": "Punjab", "region": "NORTH", "latitude": 30.7398, "longitude": 76.7827, "assigned_wh": "WH-DELHI"},
    {"store_code": "E0112", "name": "Indore Vijay Nagar", "city": "Indore", "state": "Madhya Pradesh", "region": "CENTRAL", "latitude": 22.7533, "longitude": 75.8937, "assigned_wh": "WH-NAGPUR"},
    {"store_code": "E0113", "name": "Patna Kankarbagh Junction", "city": "Patna", "state": "Bihar", "region": "EAST", "latitude": 25.5941, "longitude": 85.1376, "assigned_wh": "WH-KOLKATA"},
    {"store_code": "E0114", "name": "Guwahati Christian Basti", "city": "Guwahati", "state": "Assam", "region": "EAST", "latitude": 26.1584, "longitude": 91.7709, "assigned_wh": "WH-KOLKATA"}
]

class WarehouseNetworkService:
    @staticmethod
    def get_network_analytics(selected_wh_code: Optional[str] = None) -> Dict[str, Any]:
        warehouses = DEFAULT_WAREHOUSES
        stores = DEFAULT_STORES_GEO
        
        wh_lookup = {w["code"]: w for w in warehouses}
        active_wh = wh_lookup.get(selected_wh_code)
        if not active_wh and selected_wh_code:
            active_wh = next((w for w in warehouses if w["code"] in selected_wh_code or selected_wh_code in w["code"]), None)
        if not active_wh:
            active_wh = warehouses[0]

        connections = []
        total_straight_km = 0
        total_road_km = 0
        max_distance_km = 0
        unassigned_count = 0
        distance_alerts = []

        for s in stores:
            wh_code = s.get("assigned_wh")
            wh = wh_lookup.get(wh_code)
            
            if not wh:
                unassigned_count += 1
                continue

            straight_km = haversine_distance(wh["latitude"], wh["longitude"], s["latitude"], s["longitude"])
            road_km = estimate_road_distance(straight_km)
            transit_hours = estimate_transit_time_hours(road_km)

            total_straight_km += straight_km
            total_road_km += road_km
            if straight_km > max_distance_km:
                max_distance_km = straight_km

            # Alert if transit distance exceeds 900 km (flag for alternative regional hub)
            if straight_km > 900:
                # Find closer alternative warehouse
                alt_wh = min(warehouses, key=lambda w: haversine_distance(w["latitude"], w["longitude"], s["latitude"], s["longitude"]))
                if alt_wh["code"] != wh_code:
                    alt_dist = haversine_distance(alt_wh["latitude"], alt_wh["longitude"], s["latitude"], s["longitude"])
                    distance_alerts.append({
                        "store_code": s["store_code"],
                        "store_name": s["name"],
                        "current_wh": wh["name"],
                        "current_distance_km": straight_km,
                        "suggested_wh": alt_wh["name"],
                        "suggested_distance_km": alt_dist,
                        "savings_km": round(straight_km - alt_dist, 1),
                        "road_distance_km": road_km
                    })

            connections.append({
                "store_code": s["store_code"],
                "store_name": s["name"],
                "store_lat": s["latitude"],
                "store_lng": s["longitude"],
                "city": s["city"],
                "state": s["state"],
                "region": s["region"],
                "warehouse_code": wh["code"],
                "warehouse_name": wh["name"],
                "wh_lat": wh["latitude"],
                "wh_lng": wh["longitude"],
                "straight_km": straight_km,
                "road_km": road_km,
                "transit_hours": transit_hours,
                "is_active_hub": (wh["code"] == active_wh["code"])
            })

        store_count = len(stores)
        avg_straight_km = round(total_straight_km / max(1, len(connections)), 1)
        avg_road_km = round(total_road_km / max(1, len(connections)), 1)
        avg_transit_hours = round(avg_road_km / 42.0, 1)

        summary_metrics = {
            "total_warehouses": len(warehouses),
            "total_stores": store_count,
            "connected_stores": len(connections),
            "total_stores_serviced": len(connections),
            "unassigned_stores": unassigned_count,
            "average_straight_km": avg_straight_km,
            "average_road_km": avg_road_km,
            "avg_road_distance_km": avg_road_km,
            "avg_transit_time_hrs": avg_transit_hours,
            "max_distance_km": max_distance_km,
            "network_coverage_pct": round(100.0 * len(connections) / max(1, store_count), 1),
            "alerts_count": len(distance_alerts)
        }

        return {
            "warehouses": warehouses,
            "active_warehouse": active_wh,
            "stores": stores,
            "connections": connections,
            "metrics": summary_metrics,
            "summary": summary_metrics,
            "distance_alerts": distance_alerts,
            "alerts": distance_alerts
        }
