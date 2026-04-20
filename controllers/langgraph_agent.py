import os
import json
import pandas as pd
from typing import Annotated, TypedDict, List
from langchain_ollama import ChatOllama
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from models.database import load_data
from services.automation import send_email_mailtrap
from services.ai import get_available_ollama_model
from services.rag import search_docs
from controllers.chatbot import ai_agent


# ================= TOOLS DEFINITION (READ-ONLY) =================

@tool
def get_global_crm_metrics():
    """Returns general CRM metrics like total calls, overall average score, and sentiment counts."""
    data = load_data()
    if data.empty: return "No data available."
    
    total = len(data)
    avg = round(data["score_percentage"].mean(), 1)
    pos = len(data[data["sentiment"] == "POSITIVE"])
    neg = len(data[data["sentiment"] == "NEGATIVE"])
    
    return {
        "total_calls": total,
        "average_score": f"{avg}%",
        "positive_calls": pos,
        "negative_calls": neg,
        "metrics_summary": f"Total: {total}, Score: {avg}%, Pos: {pos}, Neg: {neg}"
    }

@tool
def get_agent_report(agent_name: str):
    """Returns a performance report for a specific agent. Useful to answer 'How is Ali doing?'."""
    data = load_data()
    agent_data = data[data["agent_name"].str.lower() == agent_name.lower()]
    
    if agent_data.empty:
        return f"No agent found with name '{agent_name}'."
    
    avg = round(agent_data["score_percentage"].mean(), 1)
    total = len(agent_data)
    perf = agent_data["performance"].iloc[0] if "performance" in agent_data.columns else "N/A"
    
    return {
        "agent": agent_name,
        "average_score": f"{avg}%",
        "total_calls": total,
        "status": perf,
        "details": f"Agent {agent_name} has {total} calls with an average score of {avg}%."
    }

@tool
def list_all_agents():
    """Returns a list of all names of agents present in the CRM database."""
    data = load_data()
    if data.empty: return []
    return sorted(data["agent_name"].dropna().unique().tolist())


@tool
def search_call_transcripts_tool(query: str):
    """Search CRM call transcripts using semantic search."""
    return search_docs(query)

@tool
def send_crm_email(to_email: str, subject: str, body: str):
    """Sends an email via CRM automation. Use this if the user asks to send a report or feedback by mail."""
    return send_email_mailtrap(to_email, subject, body)

# ================= GRAPH STATE =================

class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]

# ================= AGENT CORE =================

def get_smart_agent():
    model_name = get_available_ollama_model() or "llama3"
    
    # Initialize LLM with tools
    llm = ChatOllama(model=model_name, temperature=0).bind_tools([
        get_global_crm_metrics, 
        get_agent_report, 
        list_all_agents,
        search_call_transcripts_tool,
        send_crm_email
    ])

    # Node: The reasoner/chatbot
    def call_model(state: AgentState):
        system_prompt = (
            "You are an advanced AI assistant integrated into a professional CRM SaaS platform for call center analysis.\n\n"
            "Your role is to help agents, supervisors, and managers by analyzing and answering questions based ONLY on internal CRM data such as:\n"
            "* Call transcriptions\n"
            "* Call summaries\n"
            "* Sentiment analysis\n"
            "* Agent performance metrics\n"
            "* Keywords and insights\n\n"
            "STRICT RULES:\n"
            "* You MUST answer ONLY using the provided CONTEXT from your tools.\n"
            "* You are NOT allowed to use external knowledge.\n"
            "* If the answer is not found in the CONTEXT, respond: \"Information not available in CRM data.\"\n"
            "* Do NOT hallucinate or invent information.\n"
            "* Be factual, precise, and professional.\n\n"
            "BEHAVIOR:\n"
            "* Act like a smart business assistant in a SaaS CRM.\n"
            "* Provide insights, not just raw answers.\n"
            "* Be concise but informative.\n"
            "* Use structured answers when helpful (bullet points, short summaries).\n"
            "* Highlight important signals (negative sentiment, top agents, issues).\n"
            "* When possible, include: Agent name, Call outcome, Sentiment, Performance indicators.\n\n"
            "ADVANCED INSTRUCTIONS:\n"
            "* If the question is about \"best agent\": Identify the agent with the highest performance score.\n"
            "* If the question is about \"negative calls\": Filter calls with NEGATIVE sentiment.\n"
            "* If the question is about \"performance\": Summarize strengths and weaknesses.\n"
            "* If the question is vague: Ask a clarification question.\n\n"
            "OUTPUT FORMAT:\n"
            "* Start with a clear answer.\n"
            "* Then provide supporting insights (if needed).\n"
            "* Keep it professional and readable.\n\n"
            "IMPORTANT:\n"
            "* Always rely on your tools to get real and up-to-date data.\n"
            "* If a user asks about an agent, use get_agent_report.\n"
            "* If they want statistics, use get_global_crm_metrics.\n"
            "* If they want to search for specific conversation topics or words in transcripts, use search_call_transcripts_tool."
        )
        messages = [SystemMessage(content=system_prompt)] + state["messages"]
        response = llm.invoke(messages)
        return {"messages": [response]}

    # Build the Graph
    workflow = StateGraph(AgentState)

    # Add Nodes
    workflow.add_node("agent", call_model)
    
    tool_node = ToolNode([
        get_global_crm_metrics, 
        get_agent_report, 
        list_all_agents,
        search_call_transcripts_tool,
        send_crm_email
    ])
    workflow.add_node("tools", tool_node)

    # Add Edges
    workflow.set_entry_point("agent")
    
    # Conditional logic: does the agent want to use tools?
    def should_continue(state: AgentState):
        messages = state["messages"]
        last_message = messages[-1]
        if hasattr(last_message, "tool_calls") and last_message.tool_calls:
            return "tools"
        return END

    workflow.add_conditional_edges("agent", should_continue)
    workflow.add_edge("tools", "agent")

    return workflow.compile()

# Singleton for conversation
SMART_AGENT = get_smart_agent()



def langgraph_chat(question, history=None):
    answer = ai_agent(question)

    if history is None:
        history = []

    return answer, history