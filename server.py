import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from langchain_google_community import GmailToolkit
from langchain_google_community.gmail.utils import build_gmail_service
from langchain_anthropic import ChatAnthropic
from langgraph.prebuilt import create_react_agent

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SCOPES = ["https://mail.google.com/"]
CLIENT_SECRETS_FILE = "credentials.json"
REDIRECT_URI = "http://localhost:8000/callback"

# Store user credentials in memory
user_sessions = {}

# System prompt defined outside of any class
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


def create_agent_for_user(creds_dict):
    # Build credentials from stored dict
    creds = Credentials(
        token=creds_dict["token"],
        refresh_token=creds_dict["refresh_token"],
        token_uri=creds_dict["token_uri"],
        client_id=creds_dict["client_id"],
        client_secret=creds_dict["client_secret"],
        scopes=creds_dict["scopes"]
    )
    # Build Gmail service with user's credentials
    api_resource = build_gmail_service(credentials=creds)
    toolkit = GmailToolkit(api_resource=api_resource)
    tools = toolkit.get_tools()
    # Create agent
    llm = ChatAnthropic(model="claude-sonnet-4-6", api_key=os.getenv("ANTHROPIC_API_KEY"))
    agent = create_react_agent(llm, tools)
    return agent


@app.get("/login")
def login():
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )
    auth_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent"
    )
    user_sessions[state] = {"flow": flow}
    return RedirectResponse(auth_url)


@app.get("/callback")
def callback(request: Request):
    state = request.query_params.get("state")
    code = request.query_params.get("code")

    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI,
        state=state
    )
    flow.fetch_token(code=code)
    creds = flow.credentials

    # Store credentials in memory
    user_sessions[state] = {
        "token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri": creds.token_uri,
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
        "scopes": list(creds.scopes)
    }

    # Redirect back to frontend with session token
    frontend_url = f"http://localhost:3000?session={state}"
    return RedirectResponse(frontend_url)


class ChatRequest(BaseModel):
    messages: list
    session: str


@app.post("/chat")
def chat(req: ChatRequest):
    creds_dict = user_sessions.get(req.session)
    if not creds_dict:
        return {"error": "Not authenticated. Please login again."}

    agent = create_agent_for_user(creds_dict)
    messages = [("system", SYSTEM_PROMPT)] + req.messages
    response = agent.invoke({"messages": messages})
    return {"response": response["messages"][-1].content}


@app.get("/check_session")
def check_session(session: str):
    if session in user_sessions and "token" in user_sessions[session]:
        return {"authenticated": True}
    return {"authenticated": False}