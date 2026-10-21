from typing import Dict, Any, List

DEFAULT_NETWORK_SIZE_CURVE = {
    "S": 0.1096,
    "M": 0.2498,
    "L": 0.3367,
    "XL": 0.2104,
    "XXL": 0.0936
}

def resolve_size_curve(
    store_code: str,
    product_category: str,
    product_sku: str,
    store_cluster: str,
    size_curves_db: Dict[str, Dict[str, float]]
) -> Dict[str, Any]:
    """
    Resolves size distribution based on fallback hierarchy:
    1. Store + Product (e.g. "STORE_PRODUCT:E0100|EXFP00035WHITECAP GRAY")
    2. Store + Category (e.g. "STORE_CATEGORY:E0100|POLOS")
    3. Cluster + Category (e.g. "CLUSTER_CATEGORY:Metro High Demand|POLOS")
    4. Network + Category (e.g. "NETWORK_CATEGORY:POLOS")
    5. Network Default (e.g. "NETWORK_DEFAULT")
    """
    keys_to_check = [
        ("STORE_PRODUCT", f"STORE_PRODUCT:{store_code}|{product_sku}"),
        ("STORE_CATEGORY", f"STORE_CATEGORY:{store_code}|{product_category}"),
        ("CLUSTER_CATEGORY", f"CLUSTER_CATEGORY:{store_cluster}|{product_category}"),
        ("NETWORK_CATEGORY", f"NETWORK_CATEGORY:{product_category}"),
        ("NETWORK_DEFAULT", "NETWORK_DEFAULT")
    ]
    
    selected_curve = None
    selected_level = None
    
    for level, key in keys_to_check:
        if key in size_curves_db:
            selected_curve = size_curves_db[key]
            selected_level = level
            break
            
    if not selected_curve:
        selected_curve = DEFAULT_NETWORK_SIZE_CURVE.copy()
        selected_level = "NETWORK_DEFAULT"
        
    # Ensure ratios sum to 1.0
    total = sum(selected_curve.values())
    normalized_curve = {k: round(v / total, 6) for k, v in selected_curve.items()} if total > 0 else DEFAULT_NETWORK_SIZE_CURVE.copy()
    
    return {
        "size_curve": normalized_curve,
        "fallback_level": selected_level,
        "is_fallback": selected_level != "STORE_PRODUCT"
    }
