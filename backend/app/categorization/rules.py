from app.models import Category

# Data-driven categorization rules
MERCHANT_RULES = {
    Category.FOOD: ["swiggy", "zomato", "mcdonald", "kfc", "starbucks", "burger king", "dominos", "pizza hut", "bakingo"],
    Category.GROCERIES: ["bigbasket", "blinkit", "zepto", "instamart", "dmart", "reliance fresh", "more", "nature's basket", "suvidha"],
    Category.TRANSPORT: ["uber", "ola", "rapido", "metro", "irctc", "makemytrip", "namma yatri", "blusmart"],
    Category.SHOPPING: ["amazon", "flipkart", "myntra", "ajio", "meesho", "nykaa", "shopee"],
    Category.ENTERTAINMENT: ["pvr", "bookmyshow", "inox", "cinepolis", "paytm movies", "eventbrite"],
    Category.SUBSCRIPTIONS: ["netflix", "spotify", "prime", "hotstar", "youtube premium", "apple one", "chatgpt", "midjourney"],
    Category.BILLS: ["phonepe", "airtel", "jio", "bescom", "electricity", "water", "bill", "vi", "bsnl", "broadband", "act fibernet"],
    Category.RENT: ["rent", "nobroker", "housing.com"],
    Category.HEALTHCARE: ["apollo", "pharmEasy", "netmeds", "1mg", "hospital", "clinic", "dr.", "doctor"],
    Category.INCOME: ["salary", "payroll", "dividend", "interest", "cashback"],
    Category.FEES: ["bank fee", "annual fee", "processing fee", "gst", "cgst", "sgst", "charge", "chrg", "fee", "tax"],
    Category.EDUCATION: ["coursera", "udemy", "byjus", "unacademy", "school", "college", "tuition"],
    Category.TRAVEL: ["agoda", "airbnb", "booking.com", "yatra", "goibibo", "cleartrip", "flight", "hotel", "indigo", "air india"],
    Category.TRANSFERS: ["transfer", "neft", "rtgs", "imps", "upi", "paytm"],
    Category.CASH: ["atm", "cash withdrawal"]
}

def categorize_merchant(merchant: str) -> tuple[Category, float]:
    """
    Categorizes a merchant string using deterministic rules.
    Returns (Category, category_confidence).
    """
    if not isinstance(merchant, str) or not merchant.strip():
        return Category.OTHER, 0.3
    
    merchant_lower = merchant.lower()
    
    for category, keywords in MERCHANT_RULES.items():
        if any(keyword in merchant_lower for keyword in keywords):
            return category, 0.99
            
    return Category.OTHER, 0.3
