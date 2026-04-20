import os
from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic
from langgraph.prebuilt import create_react_agent
from langchain_google_community import GmailToolkit
from langchain_google_community.gmail.utils import build_gmail_service
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

load_dotenv()

api_key = os.getenv("ANTHROPIC_API_KEY")
if not api_key:
    raise ValueError("The ANTHROPIC_API_KEY environment key is not set")

SCOPES = ["https://mail.google.com/"]

def get_credentials():
    creds = None
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                "credentials.json", SCOPES
            )
            creds = flow.run_local_server(port=8080)  # Fixed port!
        with open("token.json", "w") as token:
            token.write(creds.to_json())
    return creds

# Set up Gmail credentials
credentials = get_credentials()
api_resource = build_gmail_service(credentials=credentials)

toolkit = GmailToolkit(api_resource=api_resource)
tools = toolkit.get_tools()

llm = ChatAnthropic(model = "claude-sonnet-4-6", api_key=api_key)