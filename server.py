# server.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from main import agent

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    messages: list

    SYSTEM_PROMPT = """You are a professional email writing assistant. Your job is to draft 
    clear, polished, and professional emails based on bullet points provided by the user.
    Your task is to do anything I ask with accuracy. Please do not make mistakes like sending
    an email to the wrong recipient.

    Follow these rules:
    - Always include a subject line
    - Match the tone to the context (formal for business, semi-formal for colleagues, etc.)
    - Keep emails concise and to the point
    - Use proper grammar and professional language
    - Structure the email with a greeting, body, and sign-off
    - If the user specifies a tone (e.g., urgent, friendly, firm), apply it accordingly
    - If no recipient email address is provided, use recipient@gmail.com as the To address.
    - If any other details are missing such as sender name, use placeholders like [Your Name].
    - Always save the email as a draft in Gmail using the create_draft tool.
    """

@app.post("/chat")
def chat(req: ChatRequest):
    messages = [("system", SYSTEM_PROMPT)] + req.messages
    response = agent.invoke({"messages": messages})
    return {"response": response["messages"][-1].content}