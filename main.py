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


#Define instructions for the assitant
agent = create_react_agent(llm, tools)

#INVOKE AGENT TO SEND EMAIL
input_command = {
    "messages": [
        ("system", 
        """You are a professional email writing assistant. Your job is to draft 
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
        """),
        ("user", "Draft an email to my colleague about my new lecture on AI Agents.")
    ]
}

response = agent.invoke(input_command)
print(response["messages"][-1].content)