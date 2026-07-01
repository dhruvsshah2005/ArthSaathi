import os
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.runnables import RunnableConfig
from langchain_groq import ChatGroq
from langchain_community.tools import DuckDuckGoSearchRun
from pydantic import BaseModel, Field
from .state import AgentState

llm = ChatGroq(
    model="llama-3.3-70b-versatile", 
    temperature=0, 
    api_key=os.environ.get("GROQ_API_KEY", "dummy_key_to_prevent_import_crash")
)

def get_latest_user_message(messages):
    for m in reversed(messages):
        if isinstance(m, HumanMessage):
            return m
    return messages[0] if messages else HumanMessage(content="")

async def budget_node(state: AgentState, config: RunnableConfig = None):
    profile = state.get("user_profile", {})
    balance = profile.get("current_balance", 0)
    income = profile.get("income_value", "0")
    occupation = profile.get("occupation_type", "Unknown")
    
    user_msg = get_latest_user_message(state["messages"])
    prompt = (
        f"User Occupation: {occupation}\n"
        f"Current Bank Balance: ₹{balance}\n"
        f"Stated Monthly Income: ₹{income}\n"
        f"User Request: {user_msg.content}\n\n"
        "TASK: Analyze the budget quantitatively based on the available profile data.\n"
        "1. Calculate total available funds.\n"
        "2. Explicitly state the exact numbers (e.g. 'You currently have ₹X in your account and earn ₹Y monthly').\n"
        "3. Do NOT invent transactions. Work strictly with the provided balance and income.\n"
        "Do NOT give generic advice. Provide strict numerical facts based on the data."
    )
    response = await llm.ainvoke([HumanMessage(content=prompt)])
    
    receipt = AIMessage(content="[STATUS]: Budget analysis complete.", name="budget_node")
    return {"budget_analysis": response.content, "messages": [receipt], "next_node": "supervisor"}

async def planning_node(state: AgentState, config: RunnableConfig = None):
    profile = state.get("user_profile", {})
    income = profile.get("income_value", "0")
    
    user_msg = get_latest_user_message(state["messages"])
    prompt = (
        f"User Income: ₹{income}\n"
        f"Budget Analysis: {state.get('budget_analysis', 'None')}\n"
        f"User Request: {user_msg.content}\n\n"
        "TASK: Create a highly specific, quantified financial plan based on the user's request.\n"
        "1. Give exact timelines (e.g., 'It will take exactly 4 months').\n"
        "2. Break down the exact monthly savings required (e.g., 'Save ₹5000/month').\n"
        "3. Detail exactly how this impacts their available balance numerically.\n"
        "Do NOT give generic fluff. Give hard numbers, exact percentages, and a clear step-by-step mathematical path."
    )
    response = await llm.ainvoke([HumanMessage(content=prompt)])
    
    receipt = AIMessage(content="[STATUS]: Planning metrics calculated.", name="planning_node")
    return {"planning_metrics": response.content, "messages": [receipt], "next_node": "supervisor"}

async def auditor_node(state: AgentState, config: RunnableConfig = None):
    context = state.get("document_context", "No document context available.")
    
    user_msg = get_latest_user_message(state["messages"])
    prompt = (
        f"Context from User's Uploaded Document (via Chroma DB Vector Search):\n"
        f"---\n{context}\n---\n\n"
        f"User's query: {user_msg.content}\n\n"
        "TASK: Audit the provided document context to answer the user's query. "
        "Specifically look for and flag hidden trap mechanisms, exorbitant interest rates, non-refundable clauses, "
        "or predatory debt traps. If none are found, clearly state that. Cite the document text directly."
    )
    response = await llm.ainvoke([HumanMessage(content=prompt)])
    
    receipt = AIMessage(content="[STATUS]: Contract audit complete.", name="auditor_node")
    return {"auditor_findings": response.content, "messages": [receipt], "next_node": "supervisor"}

class GuardrailEvaluation(BaseModel):
    is_unsafe_advice_requested: bool = Field(description="True if the user is asking for specific, prescriptive financial advice like 'which bank should I choose?' or 'should I take a loan from X?'")
    safety_guidance: str = Field(description="If unsafe, provide instructions for the responder to only give pros/cons and educational info. If safe, just say 'Safe'.")
    search_query: str = Field(default="", description="If unsafe and comparing specific banks/institutions, provide a search query to find their current interest rates (e.g., 'SBI vs HDFC current home loan interest rates 2024'). Otherwise empty.")

async def guardrail_node(state: AgentState, config: RunnableConfig = None):
    system_prompt = (
        "You are the Guardrail Node. Check the user's latest message and the gathered notes. "
        "If the user is asking for specific prescriptive advice (e.g., 'should I take a loan from SBI or HDFC?'), "
        "flag it and instruct the responder to ONLY provide educational pros and cons, not direct advice."
    )
    
    user_msg = get_latest_user_message(state["messages"])
    eval_llm = llm.with_structured_output(GuardrailEvaluation)
    
    try:
        evaluation: GuardrailEvaluation = await eval_llm.ainvoke([
            SystemMessage(content=system_prompt),
            user_msg
        ])
    except Exception as e:
        # Fallback if structure parsing fails
        return {}
    
    if evaluation.is_unsafe_advice_requested:
        guidance = evaluation.safety_guidance
        if getattr(evaluation, "search_query", ""):
            try:
                # DuckDuckGo search is synchronous, so we run it quickly. In heavy loads, this should be wrapped in run_in_executor.
                search = DuckDuckGoSearchRun()
                search_results = search.invoke(evaluation.search_query)
                guidance += f"\n\nHere are real-time interest rates/details from the web: {search_results}. Include these numerical details in your pros/cons comparison."
            except Exception as e:
                pass
                
        receipt = AIMessage(content=f"[GUARDRAIL TRIGGERED]: {guidance}", name="guardrail_node")
        return {"messages": [receipt]}
    else:
        # Pass through silently if safe
        return {}
