import re
from rapidfuzz import process, fuzz
from typing import Tuple, Optional, Dict, List

DEFAULT_CLEAN_BRANDS = [
    "Swiggy", "Zomato", "Amazon", "Flipkart", "Myntra", "Uber", "Ola", "Rapido",
    "Netflix", "Spotify", "Blinkit", "Zepto", "Instamart", "BigBasket", "McDonald's",
    "Starbucks", "KFC", "Dominos", "PhonePe", "Google Pay", "Paytm", "Airtel", "Jio",
    "Apollo", "PharmEasy", "Cult.fit", "Gold's Gym", "Coursera", "Udemy"
]

# Normalize merchant string
def normalize_merchant_string(raw: str) -> str:
    if not isinstance(raw, str):
        return ""
        
    s = raw.upper()
    
    # Remove common prefixes like UPI-, UPI/, POS, ACH, NEFT, IMPS, RTGS
    s = re.sub(r'^(UPI|POS|ACH|NEFT|IMPS|RTGS|CARD)[\-\/\*]', '', s)
    
    # Remove dates, long transaction numbers (e.g., 6 or more digits)
    s = re.sub(r'\d{6,}', '', s)
    
    # Remove common suffixes like ONLINE
    s = re.sub(r'\sONLINE$', '', s)
    
    # Replace punctuation with spaces
    s = re.sub(r'[\-\/\_\*\.]', ' ', s)
    
    # Remove extra spaces
    s = re.sub(r'\s+', ' ', s).strip()
    
    return s

def identify_merchant(
    raw: str, 
    user_rules: Dict[str, str] = None, # lowercase raw -> category
    global_aliases: Dict[str, str] = None, # normalized -> clean_name
    clean_merchants: List[str] = None # List of clean names
) -> Tuple[str, Optional[str], str, float, Optional[str]]:
    """
    Returns: (normalized_pattern, clean_name, match_method, confidence, override_category)
    """
    if not raw or not isinstance(raw, str):
        return ("", None, "none", 0.0, None)
        
    if user_rules is None:
        user_rules = {}
    if global_aliases is None:
        global_aliases = {}
    if not clean_merchants:
        clean_merchants = DEFAULT_CLEAN_BRANDS
    else:
        # Merge with defaults
        clean_merchants = list(set(clean_merchants + DEFAULT_CLEAN_BRANDS))
        
    raw_lower = raw.lower()
    
    # 1. User Alias Lookup
    if raw_lower in user_rules:
        return (raw, raw, 'user', 1.0, user_rules[raw_lower])
        
    # 2. Normalization
    norm = normalize_merchant_string(raw)
    if not norm:
        return (raw, None, "none", 0.0, None)
        
    # 3. Global Exact Match
    for clean in clean_merchants:
        if norm == clean.upper():
            return (norm, clean, 'exact', 1.0, None)
            
    # Check global aliases
    if norm in global_aliases:
        return (norm, global_aliases[norm], 'exact', 1.0, None)
        
    # 4. Known Merchant Substring Pattern
    for clean in clean_merchants:
        # Check standard word boundaries or substring
        clean_up = clean.upper()
        if clean_up in norm or (clean_up == "AMAZON" and "AMZN" in norm):
            return (norm, clean, 'rule', 0.99, None)
            
    # 5. RapidFuzz
    if clean_merchants:
        choices = {clean.upper(): clean for clean in clean_merchants}
        best_match = process.extractOne(norm, choices.keys(), scorer=fuzz.WRatio)
        if best_match:
            match_str, score, _ = best_match
            confidence = score / 100.0
            clean_val = choices[match_str]
            
            if confidence >= 0.95:
                return (norm, clean_val, 'fuzzy', confidence, None)
            elif confidence >= 0.85:
                return (norm, None, 'fuzzy_candidate', confidence, None)
                
    return (norm, None, 'none', 0.0, None)
