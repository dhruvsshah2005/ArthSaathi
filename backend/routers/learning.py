import os
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import ParametricProfile
from langchain_groq import ChatGroq
from langchain_community.tools import DuckDuckGoSearchRun
from langchain_core.messages import HumanMessage, SystemMessage

router = APIRouter(prefix="/api/learning", tags=["learning"])

# Load static lessons once on startup
STATIC_LESSONS_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "static_lessons.json")

def load_static_lessons():
    try:
        with open(STATIC_LESSONS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"⚠️ Failed to load static lessons: {e}")
        return {}

static_lessons_data = load_static_lessons()

# Fallback news data per education slab
FALLBACK_NEWS_DATA: dict = {
    "under_5th": [
        {
            "id": "news_u5_1",
            "category": "Current Affairs",
            "title": "New Easy-to-Identify Bank Notes",
            "content": "The government has released clear, colorful bank notes. Always check the shiny security line and the picture of Mahatma Gandhi to confirm your money is real.",
            "icon": "💵",
            "quiz": {
                "question": "What should you check to verify if a currency note is real?",
                "options": ["The shiny security thread", "The color of your wallet", "Nothing"],
                "correct_answer_index": 0
            }
        },
        {
            "id": "news_u5_2",
            "category": "Security Alert",
            "title": "Alert: Beware of Phone Fraud",
            "content": "Police have warned against phone callers pretending to be bank officers. Never share your secret 4-digit PIN or OTP on phone calls.",
            "icon": "🚨",
            "quiz": {
                "question": "Should you share your bank PIN with someone calling on the phone?",
                "options": ["Yes", "Never share it", "Only if they sound polite"],
                "correct_answer_index": 1
            }
        }
    ],
    "5th_pass": [
        {
            "id": "news_5p_1",
            "category": "Banking Update",
            "title": "Jan Dhan Account Insurance Benefit",
            "content": "Jan Dhan account holders get free accident insurance cover up to ₹2 Lakhs with their RuPay debit card. Keep your account active to stay covered.",
            "icon": "🏦",
            "quiz": {
                "question": "What free benefit comes with an active RuPay Jan Dhan card?",
                "options": ["Free movie tickets", "Accident insurance cover", "Free smartphones"],
                "correct_answer_index": 1
            }
        },
        {
            "id": "news_5p_2",
            "category": "Digital Payments",
            "title": "Faster Payments with UPI Lite",
            "content": "You can now use UPI Lite for small daily purchases under ₹500. It processes payments instantly without needing your PIN every time.",
            "icon": "⚡",
            "quiz": {
                "question": "What is the benefit of UPI Lite for small payments?",
                "options": ["Fast payments without typing PIN every time", "It charges high fees", "It takes 5 days"],
                "correct_answer_index": 0
            }
        }
    ],
    "10th_pass": [
        {
            "id": "news_10p_1",
            "category": "Economic News",
            "title": "RBI Keeps Bank Loan Interest Rates Stable",
            "content": "The Reserve Bank of India kept the repo rate unchanged at its latest meeting. This means home, auto, and personal loan interest rates will remain steady for consumers.",
            "icon": "📈",
            "quiz": {
                "question": "What does a steady RBI repo rate mean for borrowers?",
                "options": ["Loan interest rates remain stable", "Loans become illegal", "Bank accounts are closed"],
                "correct_answer_index": 0
            }
        },
        {
            "id": "news_10p_2",
            "category": "Consumer Rights",
            "title": "3-Day Rule for Cyber Fraud Refunds",
            "content": "Under RBI guidelines, if you report an unauthorized bank transfer within 3 days, the bank is legally obligated to investigate and refund your stolen money.",
            "icon": "🛡️",
            "quiz": {
                "question": "Within how many days should you report unauthorized bank transactions to qualify for a full refund?",
                "options": ["3 days", "30 days", "1 year"],
                "correct_answer_index": 0
            }
        }
    ],
    "12th_pass_above": [
        {
            "id": "news_12p_1",
            "category": "Market Watch",
            "title": "Micro-SIPs Launched from ₹250 Monthly",
            "content": "SEBI has approved Micro-SIPs allowing retail investors to start mutual fund investments with just ₹250/month, making market investments accessible to everyone.",
            "icon": "🚀",
            "quiz": {
                "question": "What is the minimum monthly amount for new Micro-SIP mutual fund plans?",
                "options": ["₹250", "₹10,000", "₹1,00,000"],
                "correct_answer_index": 0
            }
        },
        {
            "id": "news_12p_2",
            "category": "Tax & Finance",
            "title": "Higher Standard Deduction in New Tax Regime",
            "content": "The standard deduction under the new income tax regime provides extra tax relief for salaried workers earning up to ₹7.5 Lakhs annually.",
            "icon": "🧾",
            "quiz": {
                "question": "Who benefits from the standard deduction in income tax?",
                "options": ["Salaried individuals and taxpayers", "Foreign companies", "Nobody"],
                "correct_answer_index": 0
            }
        }
    ]
}

# Instantiating the LLM & Search Tool
llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0.2,
    api_key=os.environ.get("GROQ_API_KEY", "dummy_key_to_prevent_import_crash")
)

@router.get("/modules")
async def get_learning_modules(user_id: str, db: Session = Depends(get_db)):
    # 1. Fetch user profile
    profile = db.query(ParametricProfile).filter(ParametricProfile.user_id == user_id).first()
    
    if not profile:
        education_level = "10th_pass"
        language_code = "en"
        user_name = "User"
    else:
        education_level = profile.education_level or "10th_pass"
        language_code = profile.language_code or "en"
        user_name = profile.name or "User"
        
    if education_level not in ["under_5th", "5th_pass", "10th_pass", "12th_pass_above"]:
        education_level = "10th_pass"

    # Get static lessons for this level
    lessons = static_lessons_data.get(education_level, [])
    
    # 2. Try fetching dynamic financial news adapted to education level & language
    news_cards = []
    try:
        search = DuckDuckGoSearchRun()
        search_query = "India financial current affairs banking rules government schemes news 2026"
        raw_search_results = search.invoke(search_query)
        
        prompt = (
            f"You are a helpful economic assistant. We need to create exactly 2 simplified financial news cards for our user {user_name}.\n"
            f"Target Education Level: {education_level} (under_5th = extreme simplicity, story-like; 5th_pass = very simple banking; 10th_pass = moderate budgeting; 12th_pass_above = details about inflation/market)\n"
            f"Target Language Code: {language_code} (Ensure the text is fully translated to this language, e.g. 'hi' for Hindi, 'en' for English).\n\n"
            f"Raw Search Results:\n{raw_search_results}\n\n"
            "TASK: Output exactly 2 news items in JSON format, translated and simplified. Output ONLY the raw valid JSON array, do not include markdown blocks or extra explanations.\n"
            "JSON Format must match exactly:\n"
            "[\n"
            "  {\n"
            "    \"id\": \"news_item_1\",\n"
            "    \"category\": \"Current Affairs\",\n"
            "    \"title\": \"Translated & Simplified Headline\",\n"
            "    \"content\": \"Easy to read summary of the news adapted to the education level.\",\n"
            "    \"icon\": \"📰\",\n"
            "    \"quiz\": {\n"
            "      \"question\": \"Simple multiple choice question about the news summary.\",\n"
            "      \"options\": [\"Option 1\", \"Option 2\", \"Option 3\"],\n"
            "      \"correct_answer_index\": 0\n"
            "    }\n"
            "  }\n"
            "]"
        )
        
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        cleaned_response = response.content.strip()
        
        if cleaned_response.startswith("```json"):
            cleaned_response = cleaned_response[7:]
        if cleaned_response.startswith("```"):
            cleaned_response = cleaned_response[3:]
        if cleaned_response.endswith("```"):
            cleaned_response = cleaned_response[:-3]
        cleaned_response = cleaned_response.strip()
        
        parsed_news = json.loads(cleaned_response)
        if isinstance(parsed_news, list) and len(parsed_news) > 0:
            news_cards = parsed_news[:2]
    except Exception as e:
        print(f"⚠️ Dynamic news generation fallback activated: {e}")
        news_cards = []

    # If dynamic news call returned empty or failed, use static fallback news for this level
    if not news_cards:
        news_cards = FALLBACK_NEWS_DATA.get(education_level, FALLBACK_NEWS_DATA["10th_pass"])

    return {
        "education_level": education_level,
        "language_code": language_code,
        "lessons": lessons,
        "news": news_cards
    }
