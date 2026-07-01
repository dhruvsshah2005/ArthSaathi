import os
from pydantic import BaseModel, Field
from typing import Literal
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage
from .state import AgentState

llm = ChatGroq(
    model="llama-3.3-70b-versatile", 
    temperature=0, 
    api_key=os.environ.get("GROQ_API_KEY", "dummy_key_to_prevent_import_crash")
)

class RouteDecision(BaseModel):
    next_node: Literal["budget", "planning", "auditor", "guardrail"] = Field(
        description="The next agent to route to. If you have gathered enough context to answer the user, choose 'guardrail'."
    )

structured_llm = llm.with_structured_output(RouteDecision)

async def supervisor_node(state: AgentState):
    # Track which nodes have populated their notes in the state
    visited = []
    if state.get("budget_analysis"): visited.append("budget")
    if state.get("planning_metrics"): visited.append("planning")
    if state.get("auditor_findings"): visited.append("auditor")
    
    system_prompt = (
        "You are the Core Financial Supervisor. Your job is to route the user's request.\n"
        f"Currently visited nodes: {visited}\n"
        "CRITICAL RULES FOR ROUTING:\n"
        "1. If the user asks about affording something or needs a financial plan, you need BOTH 'budget' and 'planning'.\n"
        "   - If 'budget' is not in the visited list, route to 'budget'.\n"
        "   - If 'budget' is in the visited list but 'planning' is not, route to 'planning'.\n"
        "2. If there is document context available, you need 'auditor'. Route to 'auditor' if it's not in the visited list.\n"
        "3. NEVER route back to a node that is already in the visited list. This causes infinite loops.\n"
        "4. If you have gathered all necessary context, OR if you are stuck and all needed nodes are visited, route to 'guardrail'."
    )
    
    messages = [SystemMessage(content=system_prompt)] + state["messages"]
    
    try:
        decision: RouteDecision = await structured_llm.ainvoke(messages)
        next_n = decision.next_node
    except Exception as e:
        # Fallback if structure parsing fails
        next_n = "guardrail"
        
    # Programmatic Guardrail: NEVER allow routing to a visited node
    if next_n in visited:
        next_n = "guardrail"
    
    return {"next_node": next_n}

async def responder_node(state: AgentState):
    # This node writes the final, friendly message to the user
    user_language = state.get("user_profile", {}).get("language_code", "en")
    
    system_prompt = (
        "You are ArthaSaathi, a friendly financial assistant. Formulate a final helpful response to the user "
        "using the following agent notes. \n\n"
        "CRITICAL INSTRUCTION: You MUST use the exact numbers, calculations, and timelines provided by the Budget and Planning notes. "
        "Tell the user EXACTLY how much they need to save, how many months it will take, and the exact mathematical impact. "
        "Do NOT give vague advice like 'save more money'. Be extremely specific and quantified.\n\n"
        
        f"CRITICAL RULE: You MUST translate and write your final response strictly in the user's preferred language code: {user_language}. "
        f"Do not use English unless the requested language code is 'en'.\n\n"
        
        f"Budget Notes: {state.get('budget_analysis', 'None')}\n"
        f"Planning Notes: {state.get('planning_metrics', 'None')}\n"
        f"Audit Notes: {state.get('auditor_findings', 'None')}\n\n"
        
        "Review the conversation history. Pay special attention to any [GUARDRAIL TRIGGERED] messages from the guardrail_node. "
        "If the guardrail was triggered, strictly follow its guidance (e.g. providing pros/cons instead of direct advice)."
    )
    
    messages = [SystemMessage(content=system_prompt)] + state["messages"]
    final_response = await llm.ainvoke(messages)
    
    # We strip any internal agent tracking nodes and return just the AI response
    return {"messages": [final_response], "next_node": "__end__"}
