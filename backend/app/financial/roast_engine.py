import os
import json
import random
import logging
from typing import Optional, List, Dict
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class RoastRequest(BaseModel):
    total_spent: float
    category_totals: Dict[str, float]
    category_percentages: Dict[str, float]
    top_merchant: str
    top_merchant_amount: float
    transaction_count: int
    severity: Optional[str] = "savage"  # 'mild' | 'savage' | 'unhinged'
    seen_roasts: Optional[List[str]] = []

class RoastResponse(BaseModel):
    roast_id: str
    severity: str
    text: str
    source: str

# Deterministic Fact-Grounded Template Bank
ROAST_TEMPLATES = {
    "Food": {
        "mild": [
            "Food had a surprisingly powerful month, taking {pct}% of your spending.",
            "{count} transactions and {pct}% of your capital went straight to your appetite.",
            "You spent ₹{amount} on dining and delivery this month. Cooking was clearly not in the budget.",
            "{merchant} was your primary kitchen this month at ₹{top_amount}."
        ],
        "savage": [
            "Your kitchen is basically a glorified microwave stand. {count} food transactions is a financial hostage situation.",
            "At this point, {merchant} should start paying you rent for how much time you spend funding them.",
            "You did not order dinner. You sponsored an entire delivery fleet with ₹{amount}.",
            "{pct}% of your spending went to food. Your bank account is screaming while your stomach is living luxury."
        ],
        "unhinged": [
            "Your bank account is literally a food-delivery loyalty program with a direct deposit attached.",
            "₹{amount} on food. If delivery drivers had shares in your wallet, they would be board members by now.",
            "You are single-handedly keeping the restaurant industry afloat with {pct}% of your entire monthly income.",
            "Cancel the kitchen stove. You haven't turned it on since last quarter."
        ]
    },
    "Shopping": {
        "mild": [
            "Shopping claimed {pct}% of your liquidity this month.",
            "A busy retail cycle: ₹{amount} across {count} transactions.",
            "Retail therapy took the #1 spot this month with ₹{amount} spent.",
            "{merchant} took the biggest slice of your shopping budget at ₹{top_amount}."
        ],
        "savage": [
            "Amazon delivery drivers know your dogs by name. Retail therapy will not fix your GPA or your credit score.",
            "Respectfully, the shopping mall won against your bank account this month.",
            "You spent ₹{amount} on things that will end up in a drawer by next Thursday.",
            "{pct}% of your funds evaporated into packages. The cardboard boxes in your hallway are building a fortress."
        ],
        "unhinged": [
            "Your bank account is weeping in a corner while courier vans circle your apartment like vultures.",
            "You spent ₹{amount} shopping. That is not impulse buying; that is aggressive financial self-sabotage.",
            "At {pct}% of your money, your wardrobe has a higher GDP than some developing territories.",
            "Your debit card deserves a protective restraining order from online checkout buttons."
        ]
    },
    "Transport": {
        "mild": [
            "Transport accounted for {pct}% of your total spending this month.",
            "₹{amount} spent moving from place to place across {count} trips.",
            "Uber and cabs took a solid {pct}% slice of your monthly budget.",
            "Your rides with {merchant} added up to ₹{top_amount} this month."
        ],
        "savage": [
            "Uber should quietly put you on their board of directors for personal fleet subsidization.",
            "₹{amount} on cabs? Walking was free, but your legs apparently went on strike.",
            "You spent {pct}% of your money avoiding public transit at all costs.",
            "Your commute costs more than a monthly spaceship lease."
        ],
        "unhinged": [
            "You bought enough cab rides to fund a small airline. Your bank account is running on fumes.",
            "At {pct}% on rides, you are basically paying rent to drivers instead of a landlord.",
            "Your legs have formally filed for unemployment after {count} motorized trips.",
            "₹{amount} on transit. You could have bought a bicycle, a scooter, and peace of mind."
        ]
    },
    "Entertainment": {
        "mild": [
            "Entertainment took {pct}% of your monthly liquidity.",
            "₹{amount} went towards movies, tickets, and distractions.",
            "You kept things lively this month with {pct}% spent on fun.",
            "{merchant} was your primary entertainment expense at ₹{top_amount}."
        ],
        "savage": [
            "You did not spend money; you funded elaborate distractions from your financial reality.",
            "₹{amount} on entertainment while your savings balance quietly withered in the background.",
            "{pct}% on fun this month. Your wallet was not entertained.",
            "Cinema tickets and outings claimed {pct}% of your liquidity."
        ],
        "unhinged": [
            "Your financial priorities are pure circus: ₹{amount} spent entertaining yourself while broke.",
            "You paid {pct}% of your net worth to forget about your bank account for 2 hours.",
            "Your wallet would like to formally speak to the entertainment manager.",
            "At this rate of fun funding, your retirement plan is a lottery ticket."
        ]
    },
    "Subscriptions": {
        "mild": [
            "Recurring subscriptions took ₹{amount} across {count} charges.",
            "{pct}% of your funds auto-debited without you lifting a finger.",
            "Subscription services quietly claimed ₹{amount} this month.",
            "{merchant} was your highest recurring charge at ₹{top_amount}."
        ],
        "savage": [
            "You have subscription leeches auto-debiting you for services you haven't opened since last winter.",
            "₹{amount} leaking every month on auto-pilot. That is ₹{top_amount} a year into the void.",
            "Your bank account is an all-you-can-eat buffet for recurring billing bots.",
            "You are paying gym memberships and streaming services you only look at in your dreams."
        ],
        "unhinged": [
            "Vampire subscriptions are draining your lifeblood while you sleep. ₹{amount} vanishes every single month.",
            "You are paying for 4 different platforms to watch the same 2 shows you ignore.",
            "Cancel your auto-debits before your debit card cancels itself in protest.",
            "₹{amount} on recurring fees. You are actively subsidizing tech company balance sheets."
        ]
    },
    "General": {
        "mild": [
            "Total monthly damage clocked in at ₹{amount} across {count} transactions.",
            "A busy financial month: ₹{amount} spent, with {pct}% concentrated in your top category.",
            "You spent ₹{amount} this month. Nothing catastrophic, but your wallet had a workout.",
            "Your capital was distributed across {count} verified transactions."
        ],
        "savage": [
            "₹{amount} vanished from your account. The math is simple: capital in, immediate chaos out.",
            "You did not budget this month; you just tapped and hoped for the best.",
            "Your bank account experienced avoidable trauma across {count} transactions.",
            "₹{amount} spent. Your wallet is currently in recovery from acute spending fatigue."
        ],
        "unhinged": [
            "Your bank balance looked at your spending this month and filed a formal grievance.",
            "₹{amount} total casualty. If spending money was an Olympic sport, you would be on the podium.",
            "You managed to spend ₹{amount} across {count} transactions without a single second thought.",
            "Your financial strategy this month was pure vibes and zero survival instinct."
        ]
    }
}

def generate_local_roast(req: RoastRequest, severity: str) -> str:
    """Selects a fact-grounded template from the local bank that hasn't been seen yet."""
    top_cat = "General"
    max_amt = 0
    for cat, amt in req.category_totals.items():
        if amt > max_amt:
            max_amt = amt
            top_cat = cat
            
    category_bank = ROAST_TEMPLATES.get(top_cat, ROAST_TEMPLATES["General"])
    severity_bank = category_bank.get(severity, category_bank["savage"])
    
    top_pct = req.category_percentages.get(top_cat, round((max_amt / req.total_spent * 100), 1) if req.total_spent > 0 else 0)
    
    formatted_options = []
    for tpl in severity_bank:
        try:
            rendered = tpl.format(
                amount=f"{req.total_spent:,.0f}",
                pct=f"{top_pct:.0f}",
                count=req.transaction_count,
                merchant=req.top_merchant or top_cat,
                top_amount=f"{req.top_merchant_amount:,.0f}" if req.top_merchant_amount else f"{max_amt:,.0f}"
            )
            formatted_options.append(rendered)
        except Exception:
            formatted_options.append(tpl)
            
    fresh_options = [opt for opt in formatted_options if opt not in (req.seen_roasts or [])]
    if fresh_options:
        return random.choice(fresh_options)
    return random.choice(formatted_options)

async def generate_roast_engine(req: RoastRequest) -> RoastResponse:
    """
    Guaranteed Roast Engine:
    Tries Gemini with strict fact grounding & severity level;
    Falls back instantly to local fact-grounded template bank on any failure.
    NEVER returns null.
    """
    severity = req.severity if req.severity in ["mild", "savage", "unhinged"] else "savage"
    
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        try:
            from google import genai
            from google.genai import types
            
            client = genai.Client(api_key=api_key)
            
            severity_instructions = {
                "mild": "Tone: Playful, lighthearted, observational tease. 1-2 concise sentences.",
                "savage": "Tone: Sharp, sarcastic, witty, brutally honest roast. 1-2 concise sentences.",
                "unhinged": "Tone: Dramatically exasperated, savagely funny, extreme financial reality-check. 1-2 concise sentences."
            }
            
            prompt = f"""You are Finopsy, a savage financial autopsy assistant.
GROUND TRUTH FACTS:
- Total spent this month: ₹{req.total_spent:,.0f}
- Spending Breakdown: {json.dumps(req.category_totals)}
- Top merchant: {req.top_merchant} (₹{req.top_merchant_amount:,.0f})
- Total transactions: {req.transaction_count}
- Previously seen roasts: {json.dumps(req.seen_roasts or [])}

INSTRUCTIONS:
1. Roast their spending behavior using ONLY the numbers and facts above. Never invent facts.
2. {severity_instructions.get(severity, severity_instructions['savage'])}
3. Do NOT repeat or closely paraphrase any previously seen roast.
4. Output plain text only. No quotation marks, no emojis, no markdown."""

            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.85 if severity == "unhinged" else 0.7,
                    max_output_tokens=100
                ),
            )
            text = response.text.strip().strip('"').strip('“').strip('”')
            if text and text not in (req.seen_roasts or []):
                return RoastResponse(
                    roast_id=f"r_{abs(hash(text)) % 10000:04d}",
                    severity=severity,
                    text=text,
                    source="gemini"
                )
        except Exception as e:
            logger.warning(f"Gemini roast generation failed ({e}), using local deterministic bank.")
            
    # Guaranteed Local Fallback
    local_text = generate_local_roast(req, severity)
    return RoastResponse(
        roast_id=f"local_{abs(hash(local_text)) % 10000:04d}",
        severity=severity,
        text=local_text,
        source="local"
    )
