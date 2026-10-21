from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_warehouse_routing():
    response = client.get("/api/v1/warehouses/network-map?warehouse_code=WH-NAGPUR-NDC")
    assert response.status_code == 200
    data = response.json()
    assert "active_warehouse" in data
    assert data["active_warehouse"]["code"] in ["WH-NAGPUR", "WH-NAGPUR-NDC"]
    assert "summary" in data
    assert data["summary"]["total_stores_serviced"] > 0
    assert data["summary"]["avg_road_distance_km"] > 0
    assert len(data["connections"]) > 0
    # Road circuity factor verified on connections
    sample_conn = data["connections"][0]
    assert sample_conn["road_km"] >= sample_conn["straight_km"]

def test_barcode_scanner_lookup():
    response = client.get("/api/v1/scanner/lookup?barcode=8901234567890&store_code=E0100")
    assert response.status_code == 200
    data = response.json()
    assert data["sku"] == "EXFP00035WHITECAP GRAY"
    assert data["store_code"] == "E0100"
    assert "inventory_by_location" in data
    assert "SALES_FLOOR" in data["inventory_by_location"]
    assert "BACKROOM" in data["inventory_by_location"]
    assert data["display_shortage"] >= 0

def test_stock_movement_atomic_preservation():
    # Initial lookup
    init_res = client.get("/api/v1/scanner/lookup?barcode=8901234567890&store_code=E0100")
    assert init_res.status_code == 200
    initial_total = init_res.json()["total_store_stock"]
    initial_sf = init_res.json()["inventory_by_location"]["SALES_FLOOR"]
    initial_br = init_res.json()["inventory_by_location"]["BACKROOM"]

    # Execute movement of 2 units from BACKROOM to SALES_FLOOR
    move_payload = {
        "store_code": "E0100",
        "sku": "EXFP00035WHITECAP GRAY",
        "source_location": "BACKROOM",
        "destination_location": "SALES_FLOOR",
        "quantity": 2,
        "reason": "DISPLAY_REPLENISHMENT",
        "performed_by": "Test Suite Runner"
    }
    move_res = client.post("/api/v1/scanner/move-stock", json=move_payload)
    assert move_res.status_code == 200
    result = move_res.json()
    assert result["success"] is True
    assert result["total_store_stock"] == initial_total
    assert result["new_source_quantity"] == initial_br - 2
    assert result["new_destination_quantity"] == initial_sf + 2

def test_cycle_count_session_workflow():
    # 1. Create count session
    session_payload = {
        "store_code": "E0100",
        "location": "SALES_FLOOR",
        "notes": "Test Automated Count"
    }
    create_res = client.post("/api/v1/cycle-counts/sessions", json=session_payload)
    assert create_res.status_code == 200
    session_data = create_res.json()
    session_id = session_data["id"]

    # 2. Record scan line
    scan_payload = {
        "sku": "EXFP00035WHITECAP GRAY",
        "counted_qty": 5,
        "notes": "Physical count verified"
    }
    scan_res = client.post(f"/api/v1/cycle-counts/sessions/{session_id}/scan", json=scan_payload)
    assert scan_res.status_code == 200
    updated_session = scan_res.json()
    assert len(updated_session["lines"]) > 0

    # 3. Approve session
    review_res = client.post(f"/api/v1/cycle-counts/sessions/{session_id}/review", json={"approve": True, "notes": "Approved by Test"})
    assert review_res.status_code == 200
    assert review_res.json()["status"] == "APPROVED"

def test_data_connectors_and_sync():
    list_res = client.get("/api/v1/connectors")
    assert list_res.status_code == 200
    connectors = list_res.json()
    assert len(connectors) >= 3

    sync_res = client.post("/api/v1/connectors/conn-erp-01/sync")
    assert sync_res.status_code == 200
    assert sync_res.json()["success"] is True

def test_multi_agent_copilot_orchestration():
    # Test Agent F (Scanner)
    q_scanner = client.post("/api/v1/copilot/query", json={"query": "Scan barcode 8901234567890 and check display shortage"})
    assert q_scanner.status_code == 200
    res_f = q_scanner.json()
    assert res_f["active_agent"] == "Store Operations & Barcode Scanner Agent"
    assert len(res_f["lifecycle_timeline"]) == 8

    # Test Agent G (Warehouse)
    q_wh = client.post("/api/v1/copilot/query", json={"query": "Show warehouse distance map and transit time"})
    assert q_wh.status_code == 200
    res_g = q_wh.json()
    assert res_g["active_agent"] == "Warehouse Routing & Logistics Agent"

    # Test Agent H (Cycle count)
    q_cc = client.post("/api/v1/copilot/query", json={"query": "Check cycle count session variance"})
    assert q_cc.status_code == 200
    res_h = q_cc.json()
    assert res_h["active_agent"] == "Physical Stock Counting & Variance Agent"

def test_gcs_cloud_storage_connection_and_sync():
    # 1. Status & Test Connection
    status_res = client.get("/api/v1/gcs/status")
    assert status_res.status_code == 200
    data = status_res.json()
    assert "bucket_name" in data
    assert data["is_connected"] is True

    # 2. Configure bucket
    config_payload = {
        "project_id": "gcp-styleunion-retail",
        "bucket_name": "gs://styleunion-live-inventory",
        "prefix": "live-feeds/",
        "auth_mode": "ADC"
    }
    cfg_res = client.post("/api/v1/gcs/configure", json=config_payload)
    assert cfg_res.status_code == 200
    assert cfg_res.json()["bucket_name"] == "styleunion-live-inventory"

    # 3. List objects
    objs_res = client.get("/api/v1/gcs/objects")
    assert objs_res.status_code == 200
    assert len(objs_res.json()["objects"]) > 0

    # 4. Ingest live data from GCS blob
    ingest_payload = {
        "blob_name": "live-feeds/inventory_stream_latest.csv",
        "target_table": "inventory"
    }
    sync_res = client.post("/api/v1/gcs/sync-live-data", json=ingest_payload)
    assert sync_res.status_code == 200
    assert sync_res.json()["rows_processed"] > 0

