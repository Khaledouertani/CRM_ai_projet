# CRM AI Project Documentation for AI Agents

Welcome, fellow agent! Please read this document before making any modifications to the project. This project follows a strict **MVC (Model-View-Controller)** pattern.

## 1. Project Overview
"CRM IA - Agent Intelligent" is a Python-based CRM application designed to analyze calls from customer service agents using Artificial Intelligence. It provides automated insights such as call quality, agent performance scores, and sentiment analysis. The project uses a Streamlit web interface and a FastAPI backend for processing audio.

## 2. Technology Stack
- **View Layer:** [Streamlit](https://streamlit.io/) (with a multi-page setup in `ui/`)
- **Controller/Backend Layer:** [FastAPI](https://fastapi.tiangolo.com/) (For API routing)
- **Data Layer:** **MySQL** via `pymysql` (Database `pfe_crm_ia` managed via phpMyAdmin/XAMPP)
- **AI / Services:** 
  - `whisper` (by OpenAI) for audio-to-text transcription.
  - `transformers` (`pipeline` from HuggingFace) using `distilbert-base-uncased-finetuned-sst-2-english` for sentiment analysis.
- **Data Visualization:** Plotly Express (`plotly.express`)
- **Other Utilities:** `smtplib` for email automation (Gmail & Mailtrap).

## 3. Architecture & Data Flow (MVC)
We cleanly separate responsibilities:
- **Models:** MySQL connection mapping, aliasing, and validation (Pydantic).
- **Services:** External tool logic (AI APIs, Emails).
- **Controllers:** Routing, mapping HTTP requests to internal functions, and handling chatbot queries.
- **View:** Pure UI rendering with Streamlit.

1. **Adding Calls:** A user uploads audio via `ui/Pages/dashboard.py`. The file is saved to the local `audio/` directory.
2. **Analysis:** The View (`dashboard.py`) sends an HTTP POST request to the Controller (`http://127.0.0.1:8000/analyze_call`) with the audio path.
3. **AI Processing:** The Controller calls the Service (`services.ai`) to transcribe audio and analyze sentiment.
4. **Storage:** The record is then pushed locally into the Model logic (`models.database.insert_call`) by the View. It will be pushed into the `calls` table, automatically registering the agent in the `agents` table.
5. **Chatbot:** Streamlit (`ui/app.py`) captures user input and sends it directly to its designated Controller (`controllers.chatbot.simple_agent`).

## 4. File Structure

### Models (`models/`)
- `database.py`: Contains the MySQL connection logic using `pymysql`. Standardizes column outputs exactly according to how Streamlit reads them (using SQL aliases on `call_date` to `call_time`, etc.)
- `schemas.py`: Pydantic validation models (`AnalysisResponse`, `AnalysisError`).

### Services (`services/`)
- `ai.py`: AI operations wrapping the `whisper` and `transformers` models.
- `automation.py`: Reporting generation, ranking, and notification emails via both Mailtrap and Gmail.

### Controllers (`controllers/` & `main.py`)
- `main.py`: Root FastAPI application instance. Merges the endpoints and boots the server.
- `controllers/api_routes.py`: Contains the `/analyze_call` endpoint linking `main.py` with `services/ai.py`.
- `controllers/chatbot.py`: Handles all conditional logic and tool dispatch mapping for the NLP chatbot used in the UI.

### View / User Interface (`ui/`)
- `ui/app.py`: The entry point for the Streamlit application. Contains the chatbot frontend.
- `ui/Pages/dashboard.py`: Form to upload audio, trigger FastAPI analysis, and save the result.
- `ui/Pages/agent.py`: Agent-specific analytics dashboard featuring Plotly charts.
- `ui/Pages/analyse.py`: Global dashboard with overall insights.
- `ui/Pages/supervision.py`: Supervisor view showing calls per hour, active alerts, and reporting functions.

### Utilities & Scripts
- `scripts/migrate_sqlite_to_mysql.py`: One-off utility script used for migrating data from `crm.db` into MySQL `pfe_crm_ia`.
- `generate_data.py`: A utility script to seed the database with mock calls (transcriptions, scores, sentiments).
- `.env`: Environment variables (not heavily used in code yet).

## 5. Important Gotchas & Notes for Agents
- **MySQL Requirement:** You MUST have XAMPP/WAMP or a local MySQL server running dynamically with a database named `pfe_crm_ia` exposed at `localhost:3306` with user `root` (no password).
- **Two Servers Required:** For the system to be fully functional, you need to run BOTH the Streamlit app and the FastAPI server.
  - Run View: `python -m streamlit run ui/app.py`
  - Run Controller: `uvicorn main:app --reload`
- **Module Resolution:** Because UI components are inside the `ui/` directory, the View references `models` and `services`. It is crucial to run Streamlit explicitly from the project root (`python -m streamlit ...`) or use the `sys.path.append` hack currently in `ui/app.py`.
- **File Manipulation:** Uploaded audio files in `dashboard.py` are saved dynamically to an `audio/` directory.
