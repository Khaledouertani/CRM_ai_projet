import streamlit as st

def inject_custom_css():
    st.markdown("""
        <style>
        /* Import Font */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        /* Global Streamlit overrides for Dark AI Chat Mode */
        html, body, [class*="css"] {
            font-family: 'Inter', sans-serif !important;
            color: #d1d5db; /* Gray-300 */
        }
        
        /* Main Chat Background */
        .stApp {
            background-color: #0f1115 !important;
        }
        
        /* Navigation Sidebar */
        section[data-testid="stSidebar"] {
            background-color: #181a1f !important;
            border-right: 1px solid #272a31 !important;
        }
        
        section[data-testid="stSidebar"] .css-1d391kg {
            padding-top: 1rem;
        }
        
        section[data-testid="stSidebar"] div {
            font-size: 14px;
            font-weight: 500;
            color: #9ca3af !important; /* Gray-400 */
        }
        
        /* Sidebar collapse/expand toggle button - MUST be visible */
        [data-testid="collapsedControl"],
        button[kind="header"],
        .st-emotion-cache-1dp5vir,
        [data-testid="stSidebarCollapseButton"] {
            visibility: visible !important;
            display: flex !important;
            opacity: 1 !important;
            color: #9ca3af !important;
            background-color: #272a31 !important;
            border-radius: 50% !important;
        }
        [data-testid="collapsedControl"]:hover,
        [data-testid="stSidebarCollapseButton"]:hover {
            background-color: #3f424b !important;
            color: white !important;
        }
        
        /* Hide default header & footer */
        header {visibility: hidden;}
        footer {visibility: hidden;}
        
        /* Standard Header Styling */
        h1, h2, h3 {
            color: #ffffff !important;
            font-weight: 600 !important;
            text-align: center;
        }
        
        h1 {
            font-size: 2.2rem !important;
            margin-bottom: 2rem !important;
        }
        
        /* Chat Input overrides */
        [data-testid="stChatInput"] {
            background-color: #1e2025 !important;
            border: 1px solid #2e3138 !important;
            border-radius: 20px !important;
            padding: 5px 15px !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5) !important;
        }
        [data-testid="stChatInput"] textarea {
            color: white !important;
            background-color: transparent !important;
        }
        [data-testid="stChatInput"] button {
            color: #9ca3af !important;
        }
        [data-testid="stChatInput"] button:hover {
            color: white !important;
            background-color: #3f424b !important;
        }

        /* Buttons (General) */
        div.stButton > button {
            background-color: #1e2025;
            color: #d1d5db;
            border: 1px solid #2e3138;
            border-radius: 8px;
            font-weight: 500;
            padding: 0.5rem 1rem;
            transition: all 0.2s ease-in-out;
        }
        div.stButton > button:hover {
            background-color: #272a31;
            color: #ffffff;
            border-color: #3f424b;
        }
        
        /* Primary New Chat Button Style (Simulated) */
        .new-chat-btn {
            background-color: #2e3038;
            color: #d1d5db;
            border-radius: 12px;
            padding: 10px 15px;
            display: flex;
            align-items: center;
            font-weight: 500;
            font-size: 14px;
            cursor: pointer;
            margin-bottom: 20px;
            border: 1px solid transparent;
            transition: all 0.2s;
        }
        .new-chat-btn:hover {
            background-color: #383a44;
            color: white;
        }
        
        /* Suggestion Cards Container */
        .suggestion-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            max-width: 800px;
            margin: 0 auto;
        }
        
        /* Modern AI Chat Suggestion Cards */
        .suggestion-card {
            background-color: #15171a;
            border: 1px solid #272a31;
            border-radius: 16px;
            padding: 18px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .suggestion-card:hover {
            background-color: #1c1e23;
            border-color: #3f424b;
        }
        .suggestion-icon {
            color: #9ca3af;
            font-size: 18px;
            margin-bottom: 8px;
        }
        .suggestion-title {
            color: #ffffff;
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 4px;
        }
        .suggestion-desc {
            color: #6b7280;
            font-size: 13px;
        }
        
        /* Central Glowing Logo */
        .ai-logo-container {
            display: flex;
            justify-content: center;
            margin-bottom: 1.5rem;
            margin-top: 2rem;
        }
        .ai-logo {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #1d4ed8 0%, #7e22ce 100%);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 20px rgba(126, 34, 206, 0.4);
            border: 1px solid rgba(255,255,255,0.1);
        }
        .ai-logo svg {
            width: 30px;
            height: 30px;
            fill: white;
        }

        /* Divider */
        hr {
            margin: 2em 0;
            border-color: #272a31 !important;
        }

        /* ----- CUSTOM HTML METRIC CARDS FOR DASHBOARDS ----- */
        .kpi-card {
            background-color: #17191d;
            border: 1px solid #272a31;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            transition: all 0.2s ease;
        }
        .kpi-card:hover {
            border-color: #3f424b;
            background-color: #1b1d22;
        }
        .kpi-title {
            color: #9ca3af; /* Gray-400 */
            font-size: 0.875rem;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 8px;
        }
        .kpi-value {
            color: #ffffff;
            font-size: 2rem;
            font-weight: 700;
        }
        
        /* Detail Output Cards (Dashboard) */
        .detail-card {
            background-color: #17191d;
            border-left: 3px solid #6366f1; /* Indigo-500 */
            border-radius: 8px;
            padding: 16px;
            margin-top: 10px;
            margin-bottom: 10px;
        }
        .detail-card-title {
            font-size: 13px;
            color: #9ca3af;
            font-weight: 500;
            margin-bottom: 4px;
            text-transform: uppercase;
        }
        .detail-card-body {
            font-size: 15px;
            color: #ffffff;
            font-weight: 500;
        }
        </style>
    """, unsafe_allow_html=True)


def metric_card(title, value, icon=""):
    """
    Renders a clean dark-mode metric card matching the new AI theme.
    """
    html = f"""
    <div class="kpi-card">
        <div class="kpi-title">{title}</div>
        <div class="kpi-value">{value}</div>
    </div>
    """
    st.markdown(html, unsafe_allow_html=True)

def detail_card(title, value):
    """
    Renders a dark-theme detail output block.
    """
    html = f"""
    <div class="detail-card">
        <div class="detail-card-title">{title}</div>
        <div class="detail-card-body">{value}</div>
    </div>
    """
    st.markdown(html, unsafe_allow_html=True)

def suggestion_cards_html():
    """
    Generates the 3 main AI Chat suggestion cards exactly like the screenshot.
    """
    return """
    <div class="suggestion-grid">
        <div class="suggestion-card">
            <div class="suggestion-icon">&lt;&gt;</div>
            <div class="suggestion-title">Analyser un appel</div>
            <div class="suggestion-desc">Traite l'audio avec Ollama</div>
        </div>
        <div class="suggestion-card">
            <div class="suggestion-icon">✎</div>
            <div class="suggestion-title">Synthèse globale</div>
            <div class="suggestion-desc">Génère les rapports de qualité</div>
        </div>
        <div class="suggestion-card">
            <div class="suggestion-icon"></div>
            <div class="suggestion-title">Supervision Équipe</div>
            <div class="suggestion-desc">Alertes et retards en direct</div>
        </div>
    </div>
    """

def ai_logo_html():
    """
    Generates the glowing AI central logo from the screenshot.
    """
    return """
    <div class="ai-logo-container">
        <div class="ai-logo">
            <svg viewBox="0 0 24 24">
                <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z"></path>
            </svg>
        </div>
    </div>
    """
