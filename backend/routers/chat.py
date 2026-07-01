import os
import uuid
import pytesseract
import cv2
import numpy as np
from PIL import Image
import chromadb
from sentence_transformers import SentenceTransformer
from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from models import ChatSession, ChatMessage, Document, ParametricProfile, Transaction
from langchain_core.messages import HumanMessage, AIMessage as LChainAIMessage
from agents.graph import agent_graph

# Setup Tesseract path for Windows
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# Setup Chroma DB
chroma_client = chromadb.PersistentClient(path="./chroma_data")
chat_collection = chroma_client.get_or_create_collection(name="chat_embeddings")

# Setup Sentence Transformer (loads all-MiniLM-L6-v2)
embedder = SentenceTransformer('all-MiniLM-L6-v2')

router = APIRouter(prefix="/api/chat", tags=["chat"])

@router.post("/message")
async def chat_message(
    user_id: str = Form(...),
    session_title: str = Form("New Conversation"),
    message: str = Form(""),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    # 1. Handle Chat Session
    session = db.query(ChatSession).filter(ChatSession.user_id == user_id).order_by(ChatSession.created_at.desc()).first()
    if not session:
        session = ChatSession(user_id=user_id, session_title=session_title)
        db.add(session)
        db.commit()

    document_record = None
    ocr_text = ""

    # 2. Handle Image Upload & OCR
    if image:
        file_ext = image.filename.split('.')[-1] if '.' in image.filename else 'jpg'
        file_path = f"uploads/images/{uuid.uuid4()}.{file_ext}"
        
        with open(file_path, "wb") as buffer:
            buffer.write(await image.read())
            
        # Run OCR with OpenCV Preprocessing
        try:
            # Read image using OpenCV
            cv_img = cv2.imread(file_path)
            
            # 1. Convert to Grayscale
            gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
            
            # 2. Upscale image by 3x to improve DPI for Tesseract
            gray = cv2.resize(gray, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)
            
            # 3. Apply Otsu's Binarization (Forces pixels to pure black or pure white)
            _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # Convert the processed OpenCV array back into a PIL Image for Tesseract
            img = Image.fromarray(thresh)
            
            ocr_text = pytesseract.image_to_string(img).strip()
        except Exception as e:
            print(f"OCR Error: {e}")
            ocr_text = f"[OCR Failed: {str(e)}]"

        # Create Document in DB
        document_record = Document(
            user_id=user_id,
            file_storage_url=file_path,
            raw_extracted_text=ocr_text
        )
        db.add(document_record)
        db.commit()

    # 3. Create Chat Messages
    # User message
    user_msg_content = message.strip()
    if ocr_text:
        user_msg_content += f"\n[Extracted Text from Image]: {ocr_text}"

    user_msg = ChatMessage(
        session_id=session.session_id,
        sender_role="User",
        message_content=user_msg_content
    )
    db.add(user_msg)

    # Fetch user profile for AgentState
    profile = db.query(ParametricProfile).filter(ParametricProfile.user_id == user_id).first()
    profile_dict = {
        "user_id": profile.user_id,
        "name": profile.name,
        "language_code": profile.language_code,
        "occupation_type": profile.occupation_type,
        "income_value": profile.income_value,
        "current_balance": profile.current_balance
    } if profile else {}

    # Fetch recent transactions
    transactions = db.query(Transaction).filter(Transaction.user_id == user_id).order_by(Transaction.created_at.desc()).limit(15).all()
    recent_transactions_str = ""
    if transactions:
        recent_transactions_str = "\n".join([f"- {tx.created_at.strftime('%Y-%m-%d %H:%M')}: {tx.type.upper()} ₹{tx.amount} ({tx.reason})" for tx in transactions])
    else:
        recent_transactions_str = "No recent transactions found."

    # Fetch chat history for context window
    history = db.query(ChatMessage).filter(ChatMessage.session_id == session.session_id).order_by(ChatMessage.timestamp.asc()).all()[-5:]
    langchain_msgs = []
    for msg in history:
        if msg.sender_role == "User":
            langchain_msgs.append(HumanMessage(content=msg.message_content))
        else:
            langchain_msgs.append(LChainAIMessage(content=msg.message_content))
            
    # Always append the current user message to the state
    langchain_msgs.append(HumanMessage(content=user_msg_content))

    # Retrieve context from Chroma DB if no new image was uploaded
    context = ""
    if ocr_text:
        context = ocr_text
    else:
        results = chat_collection.query(query_texts=[user_msg_content], n_results=1)
        if results['documents'] and results['documents'][0]:
            context = results['documents'][0][0]

    # Invoke LangGraph Multi-Agent System
    initial_state = {
        "session_id": session.session_id,
        "user_profile": profile_dict,
        "messages": langchain_msgs,
        "document_context": context,
        "recent_transactions": recent_transactions_str,
        "budget_analysis": "",
        "planning_metrics": "",
        "auditor_findings": "",
        "next_node": ""
    }
    
    final_state = await agent_graph.ainvoke(initial_state)
    final_message = final_state["messages"][-1].content

    # Save the AI response
    ai_msg = ChatMessage(
        session_id=session.session_id,
        sender_role="AI_Educator",
        message_content=final_message
    )
    db.add(ai_msg)
    db.commit()

    # 4. Generate Embeddings & Store in Chroma DB
    text_to_embed = user_msg_content
    if text_to_embed:
        embeddings = embedder.encode(text_to_embed).tolist()
        
        chat_collection.add(
            embeddings=[embeddings],
            documents=[text_to_embed],
            metadatas=[{"user_id": user_id, "session_id": session.session_id, "role": "User"}],
            ids=[user_msg.message_id]
        )

    return {
        "status": "success",
        "message": "Message processed successfully",
        "ocr_text": ocr_text,
        "ai_response": ai_msg.message_content,
        "session_id": session.session_id
    }
