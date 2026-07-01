from langgraph.graph import StateGraph, END, START
from .state import AgentState
from .workers import budget_node, planning_node, auditor_node, guardrail_node
from .supervisor import supervisor_node, responder_node

# Construct Graph
workflow = StateGraph(AgentState)
workflow.add_node("supervisor", supervisor_node)
workflow.add_node("budget", budget_node)
workflow.add_node("planning", planning_node)
workflow.add_node("auditor", auditor_node)
workflow.add_node("guardrail", guardrail_node)
workflow.add_node("responder", responder_node)

workflow.add_edge(START, "supervisor")

workflow.add_conditional_edges(
    "supervisor",
    lambda state: state["next_node"],
    {
        "budget": "budget",
        "planning": "planning",
        "auditor": "auditor",
        "guardrail": "guardrail" 
    }
)

# Workers report back to supervisor
workflow.add_edge("budget", "supervisor")
workflow.add_edge("planning", "supervisor")
workflow.add_edge("auditor", "supervisor")

# Guardrail flows directly into the final responder
workflow.add_edge("guardrail", "responder")
workflow.add_edge("responder", END)

agent_graph = workflow.compile()
