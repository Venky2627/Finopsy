from app.categorization.identity import normalize_merchant_string, identify_merchant

def test_normalize_merchant_string():
    assert normalize_merchant_string("UPI-ZOMATO-1234567890123") == "ZOMATO"
    assert normalize_merchant_string("UPI/SWIGGY INSTAMART/123") == "SWIGGY INSTAMART 123"
    assert normalize_merchant_string("ZOMATO ONLINE") == "ZOMATO"
    assert normalize_merchant_string("AMAZON PAY INDIA P") == "AMAZON PAY INDIA P"
    assert normalize_merchant_string("POS*MCDONALDS*DELHI") == "MCDONALDS DELHI"
    assert normalize_merchant_string("  Extra   Spaces  ") == "EXTRA SPACES"

def test_identify_merchant():
    clean_merchants = ["Zomato", "Swiggy", "Amazon", "McDonalds", "Uber"]
    global_aliases = {"ZOMATO FOOD": "Zomato"}
    user_rules = {"upi-zomato-999": "Food"}
    
    # 1. User rule
    norm, clean, method, conf, cat = identify_merchant("UPI-ZOMATO-999", user_rules, global_aliases, clean_merchants)
    assert method == 'user'
    assert conf == 1.0
    assert cat == "Food"
    
    # 2. Exact match
    norm, clean, method, conf, cat = identify_merchant("ZOMATO", user_rules, global_aliases, clean_merchants)
    assert method == 'exact'
    assert clean == "Zomato"
    
    # 3. Global Alias
    norm, clean, method, conf, cat = identify_merchant("ZOMATO FOOD", user_rules, global_aliases, clean_merchants)
    assert method == 'exact'
    assert clean == "Zomato"
    
    # 4. Known Pattern (substring)
    norm, clean, method, conf, cat = identify_merchant("UBER RIDES", user_rules, global_aliases, clean_merchants)
    assert method == 'rule'
    assert clean == "Uber"
    
    # 5. Fuzzy Match (>= 95)
    clean_merchants.append("Kentucky Fried Chicken")
    norm, clean, method, conf, cat = identify_merchant("KENTUCKY FRIED CHICKN", user_rules, global_aliases, clean_merchants)
    assert method == 'fuzzy'
    assert clean == "Kentucky Fried Chicken"
    assert conf >= 0.95
    
    # 6. Fuzzy Candidate (85-94)
    # Let's use something that matches reasonably well but not perfectly
    # WRatio of "MCD" to "McDonalds" is 90
    norm, clean, method, conf, cat = identify_merchant("MCD", user_rules, global_aliases, clean_merchants)
    assert method == 'fuzzy_candidate'
    assert clean is None
    assert conf >= 0.85
