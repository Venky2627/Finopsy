from app.models import Category

def categorize_merchant(merchant: str) -> Category:
    if not isinstance(merchant, str):
        return Category.OTHER
    merchant_lower = merchant.lower()
    
    if any(keyword in merchant_lower for keyword in ["swiggy", "zomato", "mcdonald", "kfc", "starbucks"]):
        return Category.FOOD
    elif any(keyword in merchant_lower for keyword in ["uber", "ola", "rapido", "metro"]):
        return Category.TRANSPORT
    elif any(keyword in merchant_lower for keyword in ["amazon", "flipkart", "myntra"]):
        return Category.SHOPPING
    elif any(keyword in merchant_lower for keyword in ["pvr", "bookmyshow", "netflix", "spotify", "prime"]):
        return Category.ENTERTAINMENT
    elif any(keyword in merchant_lower for keyword in ["phonepe", "airtel", "jio", "bescom", "electricity", "water", "bill"]):
        return Category.BILLS
        
    return Category.OTHER
