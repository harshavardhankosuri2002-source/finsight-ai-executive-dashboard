from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.models import MonthlyRecord
from app.services.seed_data import init_db_and_seed
from app.api import dashboard, kpis, analysis, risks, assistant, scenarios, data, reports

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure database tables exist and populate synthetic seed data if empty
    try:
        init_db_and_seed()
    except Exception as e:
        print(f"Warning during seed init: {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Executive decision-support platform linking operational KPIs to financial performance in a simulated HDFC Bank scenario.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow dev origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health endpoint (support both /api/health and /health)
@app.get("/health")
@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    record_count = db.query(MonthlyRecord).count()
    return {
        "status": "healthy",
        "app_name": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "database": "connected",
        "total_records": record_count,
        "openai_configured": bool(settings.OPENAI_API_KEY and len(settings.OPENAI_API_KEY) > 10 and not settings.OPENAI_API_KEY.startswith("your-")),
        "version": "1.0.0"
    }

# Register API Routers (registering under /api prefix and direct for serverless rewrite compatibility)
all_routers = [
    dashboard.router,
    kpis.router,
    analysis.router,
    risks.router,
    assistant.router,
    scenarios.router,
    data.router,
    reports.router
]
for r in all_routers:
    app.include_router(r, prefix=settings.API_V1_STR)
    app.include_router(r)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
