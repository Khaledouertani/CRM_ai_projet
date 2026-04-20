# CRM AI Project - Documentation for AI Agents

Welcome, fellow agent! This document provides comprehensive documentation for the CRM IA project. Please read it before making any modifications. This project follows a strict **MVC (Model-View-Controller)** pattern with AI-powered call center analysis capabilities.

---

## 1. Project Overview

**CRM IA - Agent Intelligent** is a Python-based CRM application designed to analyze calls from customer service agents using Artificial Intelligence. It provides:

- **Automatic transcription** via Whisper (OpenAI)
- **Diarization** (Agent vs Client voice separation)
- **Sentiment analysis** (DistilBERT fallback)
- **Semantic extraction** via LLM (Ollama/Llama3)
- **Agent scoring** with weighted metrics
- **RAG chatbot** with semantic search (ChromaDB)
- **Geo-analysis** by postal code
- **Time tracking** and pointage system
- **Alert system** for supervisors
- **Export capabilities** (CSV/Excel)

## 2. Technology Stack

### View Layer (UI)
- **Streamlit** - Web interface with multi-page setup in `ui/`
- **Plotly Express** - Data visualization

### Controller/Backend Layer
- **FastAPI** - REST API for call analysis (`main.py`, `controllers/api_routes.py`)
- **LangGraph** - Agent workflow orchestration (`controllers/langgraph_agent.py`)

### Data Layer
- **MySQL** via `pymysql` - Database `pfe_crm_ia` (managed via phpMyAdmin/XAMPP)
- **Pydantic** - Data validation (`models/schemas.py`)
- **ChromaDB** - Vector database for RAG (`services/rag.py`)

### AI / ML Services
- **Whisper** (OpenAI) - Audio-to-text transcription
- **Ollama / Llama3** - Semantic extraction and LLM responses
- **DistilBERT** - Sentiment analysis fallback
- **LangChain** - Agent tools and RAG pipeline

## 3. Architecture & Data Flow (MVC)

```
┌─────────────────────────────────────────────────────────────────────┐
│                           VIEW (ui/)                                │
│   ┌──────────┐  ┌──────────────┐  ┌────────────────────────────┐  │
│   │  app.py  │  │ analytiques  │  │        gestion.py        │  │
│   │(Home)    │  │    .py      │  │  (Upload + Analysis)     │  │
│   └──────────┘  └──────────────┘  └────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────────────┘
                             │ HTTP POST
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CONTROLLER (controllers/)                         │
│   ┌──────────────┐  ┌─────────────┐  ┌────────────────────────────┐  │
│   │api_routes   │  │  chatbot  │  │   langgraph_agent.py      │  │
│   │   .py       │  │   .py     │  │    (Tools Agent)        │  │
│   └──────────────┘  └─────────────┘  └────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SERVICES (services/)                           │
│   ┌────────┐  ┌─────────┐  ┌────────┐  ┌──────────┐  ┌────────┐ │
│   │ ai.py  │  │ rag.py │  │ auto-   │  │diari-   │  │watcher │ │
│   │       │  │       │  │mation  │  │zation  │  │ .py    │ │
│   └────────┘  └─────────┘  └────────┘  └──────────┘  └────────┘ │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      MODELS (models/)                               │
│   ┌──────────┐  ┌─────────────────────────────────────────────┐        │
│   │database │  │     schemas.py (Pydantic validation)       │        │
│   │  .py    │  │                                        │        │
│   └──────────┘  └─────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        MySQL Database                              │
│                    Database: pfe_crm_ia                            │
│                     Table: calls ( + agents)                         │
└─────────────────────────────────────────────────────────────────────┘
```

### Call Analysis Pipeline

1. **Upload**: User uploads audio via `ui/Pages/gestion.py`
2. **API Call**: View sends HTTP POST to `/analyze_call`
3. **Transcription**: Whisper converts audio to text
4. **Diarization**: Separation of Agent/Client voices
5. **Analysis**: LLM (Ollama) extracts entities and scores
6. **Scoring**: Weighted calculation of agent performance
7. **Storage**: Data saved to MySQL via Model `insert_call`

## 4. File Structure

```
crm_ai_project/
├── main.py                      # FastAPI app entry point
├── config.json                 # Weights & alert configuration
├── .env                      # Environment variables
├── crm.db                    # SQLite fallback (deprecated)
├── db_schema.json            # Database schema reference
├── generate_data.py          # Demo data generator
├── gap_analysis.md          # Features pending
├── agent.md                  # THIS FILE
│
├── models/
│   ├── database.py           # MySQL connection + CRUD
│   └── schemas.py           # Pydantic validation models
│
├── services/
│   ├── ai.py                # Whisper + Ollama + scoring
│   ├── rag.py              # ChromaDB RAG pipeline
│   ├── automation.py        # Emails + alerts + reports
│   ├── diarization.py       # Speaker separation
│   ├── watcher.py          # File monitoring
│   └── llm.py             # LLM utilities
│
├── controllers/
│   ├── api_routes.py        # /analyze_call endpoint
│   ├── chatbot.py         # RAG chatbot logic
│   └── langgraph_agent.py # LangGraph agent with tools
│
├── ui/
│   ├── app.py             # Streamlit entry + login
│   ├── style.py           # Custom CSS styling
│   └── Pages/
│       ├── gestion.py     # Upload + analysis + pointage
│       └── analytiques.py # Dashboards + export
│
├── scripts/
│   ├── generate_demo_data.py
│   └── alter_db.py
│
├── audio/                  # Uploaded audio files
│   └── *.mp3
│
├── rag_db/                 # ChromaDB vector store
└── audio/
    └── (uploaded files)
```

## 5. Database Schema

### Main Table: `calls`

| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Auto-increment ID |
| agent_id | VARCHAR(50) | Agent identifier |
| agent_name | VARCHAR(100) | Display name |
| audio_file | VARCHAR(255) | Audio file path |
| transcription | TEXT | Full transcription |
| labeled_transcript | TEXT | Diarized [Agent]/[Client] |
| agent_text | TEXT | Agent speech only |
| client_text | TEXT | Client speech only |
| sentiment | VARCHAR(20) | POSITIVE/NEGATIVE/NEUTRAL |
| sentiment_score | FLOAT | 0-1 scale |
| score_percentage | FLOAT | 0-100 weighted score |
| performance | VARCHAR(50) | Excellent/Bon/Moyen/A améliorer |
| summary | TEXT | 2-3 sentence summary |
| keywords | JSON | List of keywords |
| call_type | VARCHAR(50) | Customer intent |
| problem | VARCHAR(200) | Detected issue |
| postal_code | VARCHAR(10) | French postal code |
| script_respected | BOOLEAN | Script adherence |
| customer_intent | VARCHAR(100) | RDV client 1/2, Refus, etc. |
| objections_handled | BOOLEAN | Objection handling |
| agent_politeness | INT (1-10) | Politeness score |
| next_steps | TEXT | Recommended actions |
| appointment_date | VARCHAR(100) | Scheduled RDV |
| appointment_confidence | INT (0-100) | RDV confidence |
| score_ecoute | INT (0-10) | Listening score |
| score_persuasion | INT (0-10) | Persuasion score |
| score_empathie | INT (0-10) | Empathy score |
| score_argumentation | INT (0-10) | Argumentation score |
| score_refus | INT (0-10) | Refusal handling |
| score_vente | INT (0-10) | Sales closing |
| agent_talk_ratio | FLOAT | 0-1 |
| client_talk_ratio | FLOAT | 0-1 |
| agent_seconds | FLOAT | Talk time in seconds |
| client_seconds | FLOAT | Talk time in seconds |
| diarization_method | VARCHAR(20) | pyannote/heuristic/none |
| inactivity_detected | BOOLEAN | Silence > 30s |
| inactivity_duration | FLOAT | Silence duration |
| call_date | DATETIME | Call timestamp |
| created_at | DATETIME | Record creation |

### Agents Table (Reference)

| Column | Type |
|--------|------|
| id | INT (PK) |
| agent_id | VARCHAR(50) |
| name | VARCHAR(100) |
| created_at | DATETIME |

## 6. Features Implemented

### ✅ Working Features

1. **Audio Transcription** - Whisper model transcription
2. **Diarization** - Agent vs Client voice separation (pyannote/heuristic)
3. **Sentiment Analysis** - DistilBERT + Ollama fallback
4. **Semantic Extraction** - LLM-powered entity extraction
5. **Agent Scoring** - Weighted multi-criteria scoring
6. **RAG Chatbot** - Semantic search in transcripts
7. **Time Tracking** - First/last call per day
8. **Geo-analysis** - Postal code extraction and visualization
9. **Alert System** - Email alerts for low scores
10. **Export** - CSV/Excel download buttons
11. **Login System** - Agent vs Supervisor roles
12. **RGPD Anonymization** - Auto-censorship of sensitive data
13. **Agent-Scoped RAG Search** - Agents see only their own data in chatbot
14. **Role-Based Data Isolation** - Agents only see their own data in all UI pages

### ❌ Pending Features (from gap_analysis.md)

1. **Diarization Improvement** - Full pyannote integration
2. **Intent Semantic Extraction** - Deep NER via SpaCy
3. **Auto-summary Generation** - BART or LLM synthesis
4. **Talk Time Metrics** - Real-time ratio calculation
5. **Script Adherence Check** - LLM-based script compliance
6. **Qualification Coherence** - Intent vs content validation
7. **Real-time Alerts** - Webhook integration (Asterisk/Aircall)
8. **Inactivity Tracking** - Auto-fill from audio analysis
9. **Attendance Detection** - Real-time lateness monitoring
10. **Planning Recommendations** - Textual insights from graphs
11. **Auto-follow-up** - Cron job for prospect follow-up
12. **Data Export** - Download buttons (Partially done)
13. **RGPD Full Compliance** - Advanced anonymization
14. **Access Control** - Login-protected pages

## 7. Configuration

### Scoring Weights (config.json)

```json
{
  "weights": {
    "ecoute": 23,
    "persuasion": 20,
    "empathie": 15,
    "argumentation": 12,
    "refus": 15,
    "vente": 15
  },
  "alerts": {
    "min_score": 70,
    "alert_email": "admin@crm.local"
  }
}
```

Note: Weights must sum to 100.

### User Accounts (ui/app.py)

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | superviseur |
| superviseur | super2024 | superviseur |
| ali | agent123 | agent |
| sana | agent123 | agent |
| omar | agent123 | agent |
| mariam | agent123 | agent |
| youssef | agent123 | agent |

## 8. Important Gotchas & Notes

### Required Services

For full functionality, you need THREE servers running:

1. **View Server**: `python -m streamlit run ui/app.py`
2. **API Server**: `uvicorn main:app --reload`
3. **Ollama Server**: `ollama run llama3` (or any installed model)

If Ollama is unavailable, the system gracefully degrades to:
- DistilBERT for sentiment
- Dictionary-based keyword extraction

### Role-Based Access Control

The application enforces strict data isolation:

| Page | Agent Access | Supervisor Access |
|------|-------------|-------------------|
| Home | "Mes performances" with own KPIs | Full KPIs + Top Agent |
| Analytics | "Mes Statistiques" tab only | All 4 tabs (Vue Globale, Performance, Supervision, Géo) |
| Gestion | Blocked (error message) | Full access |
| Chatbot | Own stats + own transcripts | All stats + all transcripts |

### Database Requirements

- **MySQL** must be running (XAMPP/WAMP or standalone)
- Database name: `pfe_crm_ia`
- Host: `localhost:3306`
- User: `root` (no password)
- Run `_migrate_columns()` automatically adds missing columns

### Module Resolution

Streamlit apps run from the root using `sys.path.append`:
```python
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/analyze_call` | POST | Analyze audio file |
| `/status` | GET | API status |

### Environment Variables

Create a `.env` file for sensitive configuration:
```
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=pfe_crm_ia
```

## 9. Git Configuration

### .gitignore

The project includes a comprehensive `.gitignore` file to exclude:

| Category | Files/Directories |
|----------|-------------------|
| Python Cache | `__pycache__/`, `*.pyc`, `*.pyo` |
| Virtual Envs | `venv/`, `env/`, `.venv/` |
| Environment | `.env` (sensitive credentials) |
| Database | `crm.db`, `*.sqlite`, `*.sqlite3` |
| RAG Data | `rag_db/`, `chroma.sqlite3` |
| Audio | `audio/`, `*.mp3`, `*.wav` |
| Streamlit | `.streamlit/` |
| IDE | `.idea/`, `.vscode/` |
| Logs | `*.log`, `logs/` |
| Temp | `*.tmp`, `*.temp`, `tmp/` |
| OS | `.DS_Store`, `Thumbs.db` |
| Exports | `rapport_agents.csv`, `*.csv`, `*.xlsx` |

**Important**: Never commit `.env` - it contains sensitive data like API keys and database passwords. If you need to share configuration, create a `.env.example` file.

---

## 10. Role-Based Data Isolation

### Overview

The CRM implements **complete data isolation** between agents and supervisors. Agents can only see their own data, while supervisors have access to all data.

| Role | Home Page | Analytics Page | Chatbot | RAG Search |
|------|-----------|---------------|---------|------------|
| **Superviseur/Admin** | All KPIs + Top Agent | All 4 tabs + all agents | All stats | All transcripts |
| **Agent** | Own KPIs only | "Mes Statistiques" tab only | Own stats only | Own transcripts only |

### Implementation Locations

#### 1. UI/app.py (Home Page)
```python
user_role = st.session_state.get("user_role", "agent")
user_name = st.session_state.get("user_name", "")
if user_role == "agent" and user_name:
    data = data[data["agent_name"] == user_name]
```

#### 2. UI/Pages/analytiques.py (Analytics Page)
```python
if user_role == "agent" and user_name:
    data = data[data["agent_name"] == user_name]

# Tabs visibility
if user_role == "superviseur":
    tab1, tab2, tab3, tab4 = st.tabs([...])  # All 4 tabs
else:
    tab1 = st.tabs(["Mes Statistiques"])[0]  # Only 1 tab
```

#### 3. Controllers/chatbot.py (Stats Answer)
```python
def _stats_answer(question: str, agent_name: str | None = None):
    df = load_data()
    if agent_name:
        df = df[df["agent_name"] == agent_name]  # Filter by agent
    # Return personalized stats
```

#### 4. Services/rag.py (RAG Search)
```python
def search_docs(question: str, agent_name: str | None = None):
    docs = db.similarity_search(question, k=5)
    if agent_name:
        filtered_docs = [d for d in docs if agent_name.lower() in d.page_content.lower()]
        if filtered_docs:
            docs = filtered_docs[:3]
        else:
            return f"Aucune transcription trouvée pour l'agent {agent_name}."
    return "\n\n".join([d.page_content for d in docs])
```

### Flow

1. **Login**: User logs in, role stored in `session_state`
2. **Data Load**: Each page filters data based on `user_role` and `user_name`
3. **UI Display**: Agents see only their own KPIs, stats, and transcripts
4. **Chatbot**: Pass `agent_name` to return personalized responses

### Usage in Chatbot

```python
# In ui/app.py (chat section)
agent_name = None
if st.session_state.get("user_role") == "agent":
    agent_name = st.session_state.get("user_name")
reply_text = ai_agent(user_input, agent_name)
```

---

## 11. Quick Start

### Development Setup

```bash
# 1. Install dependencies
pip install streamlit fastapi pymysql pandas plotly
pip install whisper transformers requests chromadb
pip install langchain langchain-ollama langgraph

# 2. Start MySQL (XAMPP or other)

# 3. Start Ollama
ollama run llama3

# 4. Start FastAPI
uvicorn main:app --reload

# 5. Start Streamlit
python -m streamlit run ui/app.py
```

### Upload & Analyze a Call

1. Login as supervisor (admin/admin123)
2. Navigate to **Gestion** page
3. Select agent and upload audio file
4. Click **Lancer l'Analyse IA**
5. Review analysis results
6. Click **Enregistrer dans la Base de Données**

### Query Data via Chatbot

1. Go to **Accueil** page
2. Type questions like:
   - "Quel est le meilleur agent?"
   - "Donne-moi les statistiques globales"
   - "Recherche les appels sur le solaire"

---

## 12. Troubleshooting

### Common Issues

1. **MySQL Connection Error**
   - Verify XAMPP MySQL is running
   - Check credentials in `.env`

2. **Ollama Timeout**
   - Default fallback activates automatically
   - Check Ollama is running: `http://localhost:11434`

3. **Whisper Model Not Found**
   - Automatically downloads on first run
   - Requires ~140MB for "base" model

4. **Streamlit Authentication Failed**
   - Use credentials from USERS dict in `ui/app.py`
   - Note: passwords stored in plain text (demo only)

5. **RAG No Results**
   - Index transcripts first: Gestion → Paramètres IA → Indexer

6. **Empty Dashboard**
   - Analyze and save at least one call first

---

*Last Updated: April 2026*
*For questions or issues, check gap_analysis.md for pending features.*