import os
import base64
import json
import requests
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from models import User, ParametricProfile, Transaction
from schemas import SyncPayload

router = APIRouter(tags=["transactions"])

@router.post("/api/transactions/sync")
def sync_transactions(payload: SyncPayload, db: Session = Depends(get_db)):
    # 1. Verify user exists
    user = db.query(User).filter(User.user_id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    profile = db.query(ParametricProfile).filter(ParametricProfile.user_id == payload.user_id).first()
    
    synced_ids = []
    
    for item in payload.transactions:
        # Check if transaction already exists in Postgres (idempotency check)
        existing = db.query(Transaction).filter(Transaction.transaction_id == item.transaction_id).first()
        if not existing:
            # Parse created_at string
            try:
                # Handle SQLite timestamp format 'YYYY-MM-DD HH:MM:SS' or ISO format
                date_str = item.created_at.replace('T', ' ').replace('Z', '')
                created_dt = datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S")
            except Exception:
                created_dt = datetime.utcnow()
                
            new_tx = Transaction(
                transaction_id=item.transaction_id,
                user_id=payload.user_id,
                amount=item.amount,
                type=item.type,
                reason=item.reason,
                created_at=created_dt
            )
            db.add(new_tx)
            
            # Update current balance in PostgreSQL
            if profile:
                if item.type == 'credit':
                    profile.current_balance += item.amount
                else:
                    profile.current_balance -= item.amount
                    
        synced_ids.append(item.transaction_id)
        
    db.commit()
    return {"status": "success", "synced_ids": synced_ids}


@router.post("/audio-khata")
async def audio_khata(audio: UploadFile = File(...)):
    content = await audio.read()
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "YOUR_GEMINI_API_KEY_HERE":
        print("⚠️ Gemini API Key not configured or placeholder. Falling back to Mock response.")
        return {
            "amount": 150.0,
            "type": "debit",
            "reason": "Milk and Groceries (Mock)",
            "reply": "Gemini API key is not set. Showing mock response: Spent 150 rupees on Milk and Groceries.",
            "tts_language": "en",
            "status": "success"
        }
        
    try:
        # Base64 encode the audio file
        audio_b64 = base64.b64encode(content).decode("utf-8")
        
        # Determine the MIME type (Gemini rejects audio/mp4 for inline data, requires audio/m4a)
        mime_type = "audio/m4a"
        if audio.content_type and "wav" in audio.content_type:
            mime_type = "audio/wav"
        elif audio.content_type and "mp3" in audio.content_type:
            mime_type = "audio/mp3"
        
        # Build the payload
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "inlineData": {
                                "mimeType": mime_type,
                                "data": audio_b64
                            }
                        },
                        {
                            "text": (
                                "You are a multilingual voice transaction analyzer for a financial app named 'ArthSaathi'. "
                                "The user has spoken a transaction in their local language (which could be English, Hindi, Marathi, Tamil, Telugu, Kannada, Bengali, Gujarati, etc.).\n\n"
                                "Analyze the audio and extract the transaction details:\n"
                                "1. Transcribe the spoken amount (numerical value only).\n"
                                "2. Classify the transaction type as 'debit' (for spending, paying, buying) or 'credit' (for earning, receiving, salary).\n"
                                "3. Transcribe or summarize the reason/item (e.g. 'vegetables', 'milk', 'bus fare', 'salary').\n"
                                "4. Formulate a short, natural confirmation 'reply' speaking in the EXACT same language that the user spoke (e.g., in Hindi: 'दूध के लिए 150 रुपये खर्च किए गए हैं', in Tamil: 'பாலுக்கு 150 ரூபாய் செலவு பதிவு செய்யப்பட்டது', in English: 'Recorded spent of 150 rupees on milk').\n"
                                "5. Identify the 2-letter ISO 639-1 language code of the language they spoke as 'tts_language' (e.g. 'hi' for Hindi, 'mr' for Marathi, 'ta' for Tamil, 'en' for English).\n\n"
                                "You MUST return your response as a raw JSON object strictly conforming to this schema:\n"
                                "{\n"
                                "  \"amount\": float,\n"
                                "  \"type\": \"debit\" | \"credit\",\n"
                                "  \"reason\": \"string\",\n"
                                "  \"reply\": \"string\",\n"
                                "  \"tts_language\": \"string\"\n"
                                "}"
                            )
                        }
                    ]
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }
        
        # Call Gemini API
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        res = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=15)
        
        if res.status_code != 200:
            raise HTTPException(
                status_code=res.status_code, 
                detail=f"Gemini API error: {res.text}"
            )
            
        res_json = res.json()
        
        # Extract the text part which contains the JSON string
        raw_text = res_json["candidates"][0]["content"]["parts"][0]["text"]
        result = json.loads(raw_text.strip())
        
        # Validate that the expected keys exist
        required_keys = ["amount", "type", "reason", "reply", "tts_language"]
        for key in required_keys:
            if key not in result:
                raise ValueError(f"Gemini response missing required key: {key}")
                
        result["status"] = "success"
        return result
        
    except Exception as e:
        print(f"❌ Error processing audio with Gemini: {e}")
        # Graceful fallback to avoid app crash
        return {
            "amount": 0.0,
            "type": "debit",
            "reason": "Error",
            "reply": f"Could not process voice recording. Error: {str(e)}",
            "tts_language": "en",
            "status": "error"
        }
