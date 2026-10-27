from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
from app.core.database import get_db
from app.models.models import MonthlyRecord, RiskAlertRecord, ExecutiveChatHistory
from app.schemas.schemas import ChatMessageRequest, ChatMessageResponse
from app.services.executive_ai import ask_executive_assistant, extract_evidence_context
from app.analytics.regression import run_multiple_regression_analysis

router = APIRouter(prefix="/assistant", tags=["AI Executive Assistant"])

@router.post("/chat", response_model=ChatMessageResponse)
def executive_chat(
    req: ChatMessageRequest,
    db: Session = Depends(get_db)
):
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="Query message cannot be empty.")

    b_unit = req.business_unit or "Consolidated"

    # 1. Fetch historical records for this unit
    records = db.query(MonthlyRecord).filter(
        MonthlyRecord.business_unit == b_unit
    ).order_by(MonthlyRecord.period.asc()).all()

    if not records:
        records = db.query(MonthlyRecord).filter(
            MonthlyRecord.business_unit == "Consolidated"
        ).order_by(MonthlyRecord.period.asc()).all()

    if not records:
        raise HTTPException(status_code=404, detail="No financial records found to ground AI response.")

    latest = records[-1].__dict__
    prev = records[-2].__dict__ if len(records) > 1 else latest

    # 2. Fetch active risk alerts
    db_alerts = db.query(RiskAlertRecord).filter(
        RiskAlertRecord.period == records[-1].period
    ).all()
    alerts_list = [a.__dict__ for a in db_alerts]

    # 3. Calculate regression drivers to ground causality & association
    drivers_data = None
    try:
        df = pd.DataFrame([r.__dict__ for r in records])
        if "_sa_instance_state" in df.columns:
            df = df.drop(columns=["_sa_instance_state"])
        drivers_data = run_multiple_regression_analysis(
            df=df,
            target_metric="operating_profit",
            include_lags=True
        )
    except Exception:
        pass

    # 4. Synthesize pre-computed evidence
    evidence = extract_evidence_context(latest, prev, drivers_data, alerts_list)

    # 5. Execute executive assistant reasoning
    result = ask_executive_assistant(req.message, evidence)

    # 6. Save audit record to DB
    chat_log = ExecutiveChatHistory(
        session_id=req.session_id or "default",
        user_query=req.message,
        assistant_response=result["response"],
        is_llm_generated=result["is_llm_generated"],
        evidence_context=evidence
    )
    db.add(chat_log)
    db.commit()

    return ChatMessageResponse(
        session_id=req.session_id or "default",
        query=req.message,
        response=result["response"],
        is_llm_generated=result["is_llm_generated"],
        evidence_points=result.get("evidence_points", []),
        grounding_facts=result.get("grounding_facts", {}),
        disclaimer=result.get("disclaimer", "")
    )
