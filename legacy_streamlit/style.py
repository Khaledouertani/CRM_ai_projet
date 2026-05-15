import streamlit as st

# =============================================================================
# DESIGN SYSTEM TOKENS - SaaS Modern (Dynamic Dark/Light)
# =============================================================================

COLORS = {
    "primary": "#6366F1",
    "accent": "#8B5CF6",
    "accent_hover": "#A78BFA",
    "bg_primary": "#0F172A",
    "bg_secondary": "#1E293B",
    "bg_tertiary": "#334155",
    "text_primary": "#F8FAFC",
    "text_secondary": "#CBD5E1",
    "text_tertiary": "#94A3B8",
    "border_subtle": "rgba(255, 255, 255, 0.08)",
    "success": "#10B981",
    "warning": "#F59E0B",
    "error": "#EF4444",
    "info": "#3B82F6"
}

def inject_custom_css():
    """Injects professional SaaS design CSS with dynamic theme support."""
    st.markdown("""
        <style>
        /* ===== FONT IMPORT ===== */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');

        /* ===== VARIABLE DEFINITIONS (ROOT) ===== */
        :root {
            /* Default: Dark Mode (SaaS Premium) */
            --bg-primary: #0F172A;
            --bg-secondary: #1E293B;
            --bg-tertiary: #334155;
            --bg-hover: #475569;
            
            --text-primary: #F8FAFC;
            --text-secondary: #CBD5E1;
            --text-tertiary: #94A3B8;
            
            --border-subtle: rgba(255, 255, 255, 0.08);
            --border-default: rgba(255, 255, 255, 0.15);
            --border-accent: #6366F1;
            
            --accent: #8B5CF6;
            --accent-hover: #A78BFA;
            --accent-glow: rgba(139, 92, 246, 0.25);
            
            --success: #10B981;
            --warning: #F59E0B;
            --error: #EF4444;
            
            --radius-md: 10px;
            --radius-lg: 14px;
            --radius-xl: 20px;
            
            --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.2);
            --shadow-md: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
            --shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.4);
            
            --glass: rgba(30, 41, 59, 0.7);
            --glass-blur: blur(12px);
        }

        /* Light Mode Overrides (Automatic) */
        @media (prefers-color-scheme: light) {
            :root {
                --bg-primary: #F8FAFC;
                --bg-secondary: #FFFFFF;
                --bg-tertiary: #F1F5F9;
                --bg-hover: #E2E8F0;
                
                --text-primary: #0F172A;
                --text-secondary: #475569;
                --text-tertiary: #64748B;
                
                --border-subtle: rgba(0, 0, 0, 0.05);
                --border-default: rgba(0, 0, 0, 0.1);
                --border-accent: #6366F1;
                
                --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05);
                --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                
                --glass: rgba(255, 255, 255, 0.8);
            }
        }

        /* ===== GLOBAL RESET ===== */
        html, body, [class*="css"] {
            font-family: 'Inter', sans-serif !important;
            color: var(--text-primary);
        }

        .stApp {
            background-color: var(--bg-primary) !important;
            background-image: radial-gradient(circle at top right, rgba(99, 102, 241, 0.05), transparent 400px),
                              radial-gradient(circle at bottom left, rgba(139, 92, 246, 0.05), transparent 400px) !important;
        }

        /* ===== HIDE DEFAULT ELEMENTS ===== */
        header { visibility: hidden; }
        footer { visibility: hidden; }
        [data-testid="stStatusWidget"] { visibility: hidden; }

        /* ===== SIDEBAR ===== */
        section[data-testid="stSidebar"] {
            background-color: var(--bg-secondary) !important;
            border-right: 1px solid var(--border-subtle) !important;
            box-shadow: 4px 0 20px rgba(0,0,0,0.05) !important;
        }
        
        section[data-testid="stSidebar"] .st-emotion-cache-1wq75u2 {
            padding-top: 2rem !important;
        }

        /* Sidebar labels */
        section[data-testid="stSidebar"] p, 
        section[data-testid="stSidebar"] span {
            color: var(--text-secondary) !important;
            font-weight: 500;
        }

        /* Sidebar navigation link hover */
        [data-testid="stSidebarNav"] li div:hover {
            background-color: var(--bg-hover) !important;
            border-radius: var(--radius-md);
        }

        /* ===== TYPOGRAPHY ===== */
        h1, h2, h3, h4, h5, h6 {
            color: var(--text-primary) !important;
            font-weight: 700 !important;
            letter-spacing: -0.02em !important;
        }
        
        h1 { font-size: 2.5rem !important; margin-bottom: 1.5rem !important; }
        h2 { font-size: 1.8rem !important; margin-bottom: 1rem !important; }

        /* ===== KPI CARDS ===== */
        .kpi-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        .kpi-card {
            background: var(--bg-secondary);
            border: 1px solid var(--border-subtle);
            border-radius: var(--radius-lg);
            padding: 1.5rem;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: var(--shadow-sm);
            position: relative;
            overflow: hidden;
        }

        .kpi-card:hover {
            transform: translateY(-5px);
            box-shadow: var(--shadow-lg);
            border-color: var(--border-accent);
        }

        .kpi-card::after {
            content: "";
            position: absolute;
            top: 0;
            right: 0;
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, transparent 50%, rgba(99, 102, 241, 0.1) 50%);
        }

        .kpi-title {
            color: var(--text-tertiary);
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.5rem;
        }

        .kpi-value {
            color: var(--text-primary);
            font-size: 1.75rem;
            font-weight: 800;
            margin-bottom: 0.25rem;
        }

        .kpi-trend {
            font-size: 0.8rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .trend-up { color: var(--success); }
        .trend-down { color: var(--error); }

        /* ===== BUTTONS ===== */
        .stButton > button {
            background-color: var(--bg-secondary);
            color: var(--text-primary);
            border: 1px solid var(--border-default);
            border-radius: var(--radius-md);
            padding: 0.6rem 1.2rem;
            font-weight: 600;
            transition: all 0.2s ease;
            width: 100%;
        }

        .stButton > button:hover {
            background-color: var(--bg-hover);
            border-color: var(--border-accent);
            transform: scale(1.02);
        }

        /* Primary Button */
        button[kind="primary"] {
            background: linear-gradient(135deg, var(--accent) 0%, #6366F1 100%) !important;
            color: white !important;
            border: none !important;
            box-shadow: 0 4px 12px var(--accent-glow) !important;
        }

        /* ===== INPUT FIELDS ===== */
        .stTextInput > div > div, 
        .stTextArea > div > div, 
        .stSelectbox > div > div {
            background-color: var(--bg-secondary) !important;
            border: 1px solid var(--border-default) !important;
            border-radius: var(--radius-md) !important;
            color: var(--text-primary) !important;
        }

        .stTextInput input, .stTextArea textarea {
            color: var(--text-primary) !important;
        }

        /* Focus states */
        .stTextInput > div > div:focus-within {
            border-color: var(--border-accent) !important;
            box-shadow: 0 0 0 3px var(--accent-glow) !important;
        }

        /* ===== TABS ===== */
        .stTabs [data-baseweb="tab-list"] {
            background-color: var(--bg-secondary);
            padding: 4px;
            border-radius: var(--radius-md);
            gap: 8px;
        }
        .stTabs [role="tab"] {
            border-radius: var(--radius-md) !important;
            color: var(--text-secondary);
            font-weight: 600;
        }
        .stTabs [role="tab"][aria-selected="true"] {
            background-color: var(--accent) !important;
            color: white !important;
        }

        /* ===== DATAFRAME / TABLES ===== */
        [data-testid="stDataFrame"] {
            border: 1px solid var(--border-subtle);
            border-radius: var(--radius-lg);
            overflow: hidden;
        }

        /* ===== CHAT BUBBLES ===== */
        [data-testid="stChatMessage"] {
            background-color: var(--bg-secondary) !important;
            border: 1px solid var(--border-subtle);
            border-radius: var(--radius-lg);
            margin-bottom: 1rem;
        }

        /* User bubble specific */
        [data-testid="stChatMessage"][data-testid="stChatMessageContainer"] {
            border-left: 4px solid var(--accent);
        }

        /* AI bubble specific */
        .st-emotion-cache-janbk0 {
            background-color: var(--bg-tertiary) !important;
        }

        /* ===== CHAT INPUT ===== */
        [data-testid="stChatInput"] {
            background-color: var(--glass) !important;
            backdrop-filter: var(--glass-blur);
            border: 1px solid var(--border-default) !important;
            border-radius: var(--radius-xl) !important;
            bottom: 20px !important;
            max-width: 800px !important;
            margin: 0 auto !important;
        }

        /* ===== PROGRESS BARS ===== */
        .stProgress > div > div > div > div {
            background-color: var(--accent) !important;
        }

        /* ===== CUSTOM SCROLLBAR ===== */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-track {
            background: transparent;
        }
        ::-webkit-scrollbar-thumb {
            background: var(--bg-tertiary);
            border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: var(--bg-hover);
        }

        /* ===== RESPONSIVE FIXES ===== */
        @media (max-width: 640px) {
            h1 { font-size: 1.8rem !important; }
            .kpi-container { grid-template-columns: 1fr; }
        }

        /* ===== ANIMATIONS ===== */
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .stApp main {
            animation: fadeIn 0.5s ease-out;
        }

        </style>
    """, unsafe_allow_html=True)


def metric_card(title, value, trend=None, trend_value=None):
    """
    Renders a KPI metric card with semantic colors and modern SaaS style.
    """
    trend_html = ""
    if trend and trend_value:
        trend_class = "trend-up" if trend == "up" else "trend-down"
        trend_icon = "↑" if trend == "up" else "↓"
        trend_html = f'<div class="kpi-trend {trend_class}">{trend_icon} {trend_value}</div>'
    
    html = f"""
    <div class="kpi-card">
        <div class="kpi-title">{title}</div>
        <div class="kpi-value">{value}</div>
        {trend_html}
    </div>
    """
    st.markdown(html, unsafe_allow_html=True)


def ai_logo_html():
    """Generates the modern AI logo icon."""
    return """
    <div style='display:flex;justify-content:center;margin-bottom:24px;'>
        <div style='width:64px;height:64px;background:linear-gradient(135deg,#8B5CF6,#6366F1);
                    border-radius:18px;display:flex;align-items:center;justify-content:center;
                    box-shadow: 0 8px 16px rgba(139, 92, 246, 0.3);'>
            <svg viewBox="0 0 24 24" style='width:32px;height:32px;fill:none;stroke:white;stroke-width:2.5;'>
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
        </div>
    </div>
    """