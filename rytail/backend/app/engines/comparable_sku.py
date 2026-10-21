import math
from typing import List, Dict, Any

def find_comparable_skus(
    target_product: Dict[str, Any],
    candidate_products: List[Dict[str, Any]],
    top_n: int = 5
) -> List[Dict[str, Any]]:
    """
    Identifies comparable SKUs for new products using Hard Gates and Soft Scoring.
    
    Hard Gates (All must match):
      - Division
      - Department
      - Product Type
      - Sleeve
      - Fit
      
    Soft Attributes Scoring:
      - Length (Weight 20%)
      - Pattern (Weight 20%)
      - Price Similarity (Weight 30%)
      - Season Match (Weight 30%)
    """
    hard_gates = ["division", "department", "product_type", "sleeve", "fit"]
    results = []
    
    for candidate in candidate_products:
        if candidate["sku"] == target_product["sku"]:
            continue
            
        # 1. Evaluate Hard Gates
        passed_gates = True
        gate_failures = []
        for gate in hard_gates:
            target_val = str(target_product.get(gate, "")).strip().upper()
            candidate_val = str(candidate.get(gate, "")).strip().upper()
            if target_val != candidate_val:
                passed_gates = False
                gate_failures.append(f"{gate}: {candidate_val} != {target_val}")
                
        if not passed_gates:
            continue  # Excluded by hard gate
            
        # 2. Soft Scoring
        score = 0.0
        details = []
        
        # Length
        if str(candidate.get("length", "")).upper() == str(target_product.get("length", "")).upper():
            score += 0.20
            details.append("Length matched (+20%)")
            
        # Pattern
        if str(candidate.get("pattern", "")).upper() == str(target_product.get("pattern", "")).upper():
            score += 0.20
            details.append("Pattern matched (+20%)")
            
        # Price similarity: 1 - (|price_diff| / target_price)
        t_price = float(target_product.get("selling_price", 1000.0))
        c_price = float(candidate.get("selling_price", 1000.0))
        if t_price > 0:
            price_ratio = max(0.0, 1.0 - (abs(t_price - c_price) / t_price))
            score += 0.30 * price_ratio
            details.append(f"Price similarity {int(price_ratio * 100)}% (+{round(0.30 * price_ratio * 100, 1)}%)")
            
        # Season
        if str(candidate.get("season", "")).upper() == str(target_product.get("season", "")).upper():
            score += 0.30
            details.append("Season matched (+30%)")
        else:
            score += 0.15 # Partial match for carryover/different season
            details.append("Different season (+15%)")
            
        # Convert total score to percentage (0 - 100%)
        # Base hard gate pass gives starting 50% threshold bonus
        total_score_pct = round((0.50 + (score * 0.50)) * 100.0, 1)
        
        results.append({
            "comparable_sku": candidate["sku"],
            "product_name": candidate.get("product_name", candidate["sku"]),
            "style_code": candidate.get("style_code"),
            "color": candidate.get("color"),
            "similarity_score": total_score_pct / 100.0,
            "similarity_pct": total_score_pct,
            "reason": f"Passed all hard gates ({', '.join(hard_gates)}). Soft features: {'; '.join(details)}."
        })
        
    # Sort by similarity score descending
    results.sort(key=lambda x: x["similarity_score"], reverse=True)
    
    # Assign ranks
    for idx, item in enumerate(results):
        item["rank"] = idx + 1
        
    return results[:top_n]
