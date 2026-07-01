from typing import TypedDict, List, Annotated, Dict, Any
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages

class AgentState(TypedDict):
    # Core state variables
    session_id: str
    user_profile: Dict[str, Any]
    
    # LangGraph's built-in message reducer safely handles merging lists of BaseMessages
    messages: Annotated[List[BaseMessage], add_messages]
    
    # Context injected from outside (Chroma DB and Postgres)
    document_context: str
    recent_transactions: str
    
    # Inter-agent communication / notes
    budget_analysis: str
    planning_metrics: str
    auditor_findings: str
    
    # Orchestration control
    next_node: str
