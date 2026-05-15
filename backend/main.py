from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Routers
from controllers.auth_routes import router as auth_router
from controllers.api_routes import router as analyze_router
from controllers.api_routes import router2 as extra_router
from controllers.alerts_routes import router as alerts_router
from controllers.config_routes import router as config_router
from controllers.calls_routes import router as calls_router
from controllers.leads_routes import router as leads_router
from controllers.analytics_routes import router as analytics_router
from controllers.messages_routes import router as messages_router
from controllers.performance_routes import router as performance_router
from controllers.chat_routes import router as chat_router
from controllers.ws_routes import router as ws_router
from controllers.maintenance_routes import router as maintenance_router

app = FastAPI(
    title="CRM AI - FastAPI Backend",
    description="Backend API for CRM AI with JWT Auth and Real-time messaging",
    version="1.0.0"
)

# CORS Configuration
# Note: allow_origins=["*"] is incompatible with allow_credentials=True in many browsers
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {
        "status": "online",
        "message": "CRM AI Backend is running",
        "version": "1.0.0"
    }

# Include Routers with proper prefixes and tags
app.include_router(auth_router)             # /auth
app.include_router(analyze_router)          # /api/analyze
app.include_router(extra_router)            # /api/...
app.include_router(calls_router)
app.include_router(leads_router)
app.include_router(analytics_router)
app.include_router(alerts_router)
app.include_router(config_router)
app.include_router(messages_router)         # /api/messages
app.include_router(performance_router)
app.include_router(chat_router)
app.include_router(ws_router)
app.include_router(maintenance_router)