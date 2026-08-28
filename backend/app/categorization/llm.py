import os
import logging
from typing import List, Dict
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

class MerchantSuggestion(BaseModel):
    raw_merchant: str = Field(description="The original messy merchant string")
    clean_name: str = Field(description="The deduced clean brand name. Use Title Case.")
    category: str = Field(description="The financial category from the provided taxonomy")

class BatchResolveResponse(BaseModel):
    suggestions: list[MerchantSuggestion]

def resolve_unknown_merchants_batch(raw_merchants: List[str]) -> Dict[str, dict]:
    """
    Sends a batch of raw merchant strings to Gemini to deduce their clean name and category.
    Returns a dictionary mapping raw_merchant to {"clean_name": str, "category": str}.
    """
    if not raw_merchants:
        return {}
        
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        logger.warning("GEMINI_API_KEY not found. LLM Fallback unavailable.")
        return {}
        
    try:
        from google import genai
        from google.genai import types
        
        client = genai.Client(api_key=api_key)
        
        taxonomy = [
            "Food", "Groceries", "Transport", "Shopping", "Entertainment", 
            "Bills & Utilities", "Rent", "Healthcare", "Education", "Travel", 
            "Subscriptions", "Transfers", "Cash Withdrawal", "Income", "Fees & Charges", "Other"
        ]
        
        prompt = f"""
        You are a financial parsing expert. I have a list of raw, messy bank statement descriptions.
        For each string, deduce the clean brand or merchant name, and assign it to exactly one of these categories:
        {taxonomy}
        
        If it's a person's name (e.g., from a UPI transfer), the clean name should be the person's name and the category should be 'Transfers'.
        If it's a bank fee, category is 'Fees & Charges'.
        
        Raw strings:
        {raw_merchants}
        """
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=BatchResolveResponse,
                temperature=0.1
            ),
        )
        
        result = BatchResolveResponse.model_validate_json(response.text)
        
        # Build mapping
        mapping = {}
        for s in result.suggestions:
            mapping[s.raw_merchant] = {
                "clean_name": s.clean_name,
                "category": s.category
            }
            
        return mapping
        
    except Exception as e:
        logger.error(f"LLM resolution failed: {e}")
        return {}
