import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from tests.test_first_allocation import (
    test_allocation_pool_exact_math,
    test_store_e0100_allocation_trace,
    test_hard_gate_violation_rejection,
    test_comparable_sku_hard_gates,
    test_replenishment_formula
)
from tests.test_new_modules import (
    test_warehouse_routing,
    test_barcode_scanner_lookup,
    test_stock_movement_atomic_preservation,
    test_cycle_count_session_workflow,
    test_data_connectors_and_sync,
    test_multi_agent_copilot_orchestration,
    test_gcs_cloud_storage_connection_and_sync
)

def run_all_tests():
    print("==========================================")
    print("   RYTAIL DETERMINISTIC ENGINE TEST SUITE  ")
    print("==========================================")
    
    tests = [
        ("Allocation Pool Exact Math (4435 * 52.4% = 2323)", test_allocation_pool_exact_math),
        ("Store E0100 Trace & 13 Unit Allocation", test_store_e0100_allocation_trace),
        ("Hard Gate Violation Rejection", test_hard_gate_violation_rejection),
        ("Comparable SKU Hard Gates & Similarity Scoring", test_comparable_sku_hard_gates),
        ("Replenishment Target Stock Formula (Target 27, Rec 15)", test_replenishment_formula),
        ("Warehouse Network & Road Routing Distance Engine", test_warehouse_routing),
        ("In-Store Barcode Lookup & MDQ Shortage Calculation", test_barcode_scanner_lookup),
        ("Multi-Location Stock Movement & Atomic Inventory Preservation", test_stock_movement_atomic_preservation),
        ("Cycle Count Session Scanning & Manager Approval Flow", test_cycle_count_session_workflow),
        ("Multi-Platform Data Connectors & On-Demand Sync", test_data_connectors_and_sync),
        ("Agentic AI Multi-Agent Lifecycle Orchestration", test_multi_agent_copilot_orchestration),
        ("Google Cloud Storage (GCS) Live Bucket Connect & Ingestion", test_gcs_cloud_storage_connection_and_sync)
    ]
    
    passed = 0
    failed = 0
    
    for name, test_func in tests:
        try:
            test_func()
            print(f"  [PASS] {name}")
            passed += 1
        except Exception as e:
            print(f"  [FAIL] {name} -> Error: {e}")
            failed += 1
            
    print("==========================================")
    print(f"   TEST SUMMARY: {passed} PASSED, {failed} FAILED")
    print("==========================================")
    
    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    run_all_tests()
