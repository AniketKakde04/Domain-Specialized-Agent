# 5 Domain-Specialized AI Agents with Compliance Guardrails

## PROBLEM STATEMENT
Build a domain-specific AI agent for healthcare, finance, supply chain, or agriculture that executes domain workflows, handles edge cases properly, and stays within regulatory and policy guardrails at all times.

## WHAT YOU MAY BUILD
* **Healthcare operations agents** — that handle medical coding, claims adjudication, or prior authorization workflows — navigating complex rule sets (International Classification of Diseases (ICD-10), Current Procedural Terminology (CPT), payer-specific policies) with auditable reasoning at each step.
* **Financial close agents** — that run reconciliation, generate compliance-ready reports, flag anomalies, and maintain audit trails across regulatory frameworks.
* **Supply chain intelligence agents** — that detect disruption signals (port delays, weather, supplier issues), model ripple effects, and trigger rerouting or reorder actions autonomously.
* **Agricultural advisory agents** — that work with multi-modal inputs (soil data, weather, market prices, voice in local languages) to deliver actionable guidance to farmers — even in low-connectivity environments.

## 📱 MULTI-CHANNEL INTEGRATION

Reach your users wherever they are. This platform supports seamless integration with:

* **WhatsApp Business API**: Connect your bots to WhatsApp using Meta's Cloud API. Reach users on their most-used messaging app with automated workflows and compliance guardrails.
* **Telegram**: Instant connectivity via Telegram Bot Father. Perfect for lightweight, private, and secure domain-specific assistance.
* **Real-time Voice**: Built-in support for low-latency voice conversations using **LiveKit** and **Sarvam AI** (Bulbul/Saaras models), specifically optimized for Indian languages and accents.

## TECH STACK

**Frontend**:
- **Framework**: React 18 with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS / UI styling tools
- **Flow Builder**: React Flow (xyflow)
- **Animations & Icons**: Framer Motion, Lucide React
- **Real-time Components**: LiveKit

**Backend**:
- **Framework**: FastAPI (Python 3.13+)
- **AI Orchestration**: LangChain, LangGraph, Google GenAI
- **Real-time Agents**: LiveKit Agents
- **Vector Database (RAG)**: ChromaDB, HuggingFace Embeddings
- **Tools & Capabilities**: Web Search (DuckDuckGo, Tavily), Web Scraping (BeautifulSoup4), Document Parsing (PyPDF, OpenPyXL, Pandas)

**Database & Auth**:
- **BaaS**: Supabase

## LOCAL SETUP GUIDE

Follow these steps to clone and run the project locally on your machine.

### Prerequisites
- **Node.js** (v18 or newer)
- **Python** (3.13 or newer)
- **uv** (Optional but recommended for faster Python package management) or standard `pip`

### 1. Clone the Repository
```bash
git clone https://github.com/AniketKakde04/Domain-Specialized-Agent.git
cd Domain-Specialized-Agent
```

### 2. Set up the Backend
Navigate to the `backend` directory, create a virtual environment, and install the dependencies:

```bash
cd backend

# If using uv (recommended since a uv.lock exists)
uv venv
uv sync

# Or using standard pip
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Mac/Linux:
# source .venv/bin/activate
pip install -e .
```

*Note: Make sure to create a `.env` file inside the `backend` directory and add the necessary environment variables (e.g., Google GenAI, LiveKit, Supabase credentials) before starting.*

Run the FASTAPI backend server:
```bash
uvicorn main:app --reload
```
The backend API should now be running at `http://localhost:8000`.

### 3. Set up the Frontend
Open a new terminal window, navigate to the `frontend` directory, and install dependencies:

```bash
cd frontend
npm install
```

*Note: Create a `.env` file inside the `frontend` directory with your frontend environment variables.*

Start the Vite development server:
```bash
npm run dev
```

The app should now be accessible at `http://localhost:5173`.
