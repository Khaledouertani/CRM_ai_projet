# CRM AI Project Documentation for AI Agents

Welcome, fellow agent! Please read this document before making any modifications to the project. It outlines the architecture, technology stack, and structure of the application.

## 1. Project Overview
"CRM IA - Agent Intelligent" is a Python-based CRM application designed to analyze calls from customer service agents using Artificial Intelligence. It provides automated insights such as call quality, agent performance scores, and sentiment analysis. The project includes a Streamlit web interface and a FastAPI backend for processing audio.

## 2. Technology Stack
- **Frontend / UI:** [Streamlit](https://streamlit.io/) (with a multi-page setup)
- **Backend API:** [FastAPI](https://fastapi.tiangolo.com/) (For AI processing endpoints)
- **Database:** SQLite3 (`crm.db` using `pandas` for data manipulation)
- **AI / Machine Learning:**
  - `whisper` (by OpenAI) for audio-to-text transcription.
  - `transformers` (`pipeline` from HuggingFace) using `distilbert-base-uncased-finetuned-sst-2-english` for sentiment analysis.
- **Data Visualization:** Plotly Express (`plotly.express`)
- **Other Utilities:** `smtplib` for email automation

## 3. Architecture & Data Flow
1. **Adding Calls:** A user uploads an audio call via `Pages/dashboard.py`. The file is saved to the local `audio/` directory.
2. **Analysis:** `dashboard.py` sends an HTTP POST request to the local FastAPI server (`http://127.0.0.1:8000/analyze_call`) with the audio path.
3. **AI Processing:** FastAPI uses `ai_utils.py` to transcribe the audio and analyze sentiment. It returns JSON data containing the transcription, sentiment, and agent score.
4. **Storage:** `dashboard.py` receives the result and inserts the record into the SQLite database via `database.py`.
5. **Insights:** Other Streamlit pages (`Pages/*.py`) read from `crm.db` to display analytics and dashboards.

## 4. File Structure

### Core Application
- `app.py`: The entry point for the Streamlit app. It contains the main landing page and a simple chatbot assistant (`simple_agent`) that queries the database.
- `database.py`: Contains the database schema definition (`create_db()`), read (`load_data()`), and write (`insert_call()`) operations.
- `crm.db`: The SQLite database containing the `calls` table.

### AI & API
- `api.py`: FastAPI server serving a single endpoint (`/analyze_call`) which orchestrates the transcription and sentiment analysis.
- `ai_utils.py`: The AI engine. Loads the Whisper model and HuggingFace sentiment pipeline. Calculates call scores based on sentiment and keyword complaints.

### Multi-page UI (Streamlit Pages)
- `Pages/dashboard.py`: Form to upload audio, trigger FastAPI analysis, and save the result to the DB.
- `Pages/agent.py`: Agent-specific analytics dashboard featuring Plotly charts, call counts, and score filtering.
- `Pages/analyse.py`: Global dashboard with overall insights, identifying the best/worst agents.
- `Pages/supervision.py`: Supervisor view showing calls per hour (Line chart), active alerts (e.g., dissatisfied clients), and a report generation feature.

### Utilities & Scripts
- `automation.py`: Provides automation tools such as detecting alerts (`detect_alerts`), generating summarized reports (`generate_report`), and sending emails via Gmail SMTP.
- `generate_data.py`: A utility script to seed the database with 50 mock calls (transcriptions, scores, sentiments, and agents) for testing.
- `.env`: Exists in the directory but isn't currently loaded in the codebase by default.

## 5. Important Gotchas & Notes for Agents
- **Two Servers Required:** For the system to be fully functional, you need to run BOTH the Streamlit app (`streamlit run app.py`) AND the FastAPI server (`uvicorn api:app --reload` or `fastapi run api.py`). If the API is offline, audio uploads in `dashboard.py` will fail.
- **Hardcoded Credentials:** Email credentials are currently hardcoded in plain text.
  - In `app.py`: Mailtrap sandbox credentials (used by the chatbot).
  - In `automation.py`: Gmail SMTP credentials.
  *If you are tasked with refactoring, consider moving these to the `.env` file.*
- **File Manipulation:** Uploaded audio files in `dashboard.py` are saved directly to an `audio/` directory.
- **Styling:** Streamlit sidebars use a hardcoded custom CSS style snippet (`<style>section[data-testid="stSidebar"]...`) at the top of every UI page. If you create a new page, you might need to copy this block to maintain visual consistency.
- **Agent Names:** The list of agents is dynamically pulled from the database if records exist, otherwise it defaults to a hardcoded array (`["Agent_1", "Agent_2", "Agent_3"]`).

Use this context to make safe, informed modifications to the project!
