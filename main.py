from fastapi import FastAPI
from controllers.api_routes import router as analyze_router

app = FastAPI(title="CRM AI - FastAPI Backend")

@app.get("/")
def home():
    return {"message": "CRM AI Backend Running"}

app.include_router(analyze_router)
