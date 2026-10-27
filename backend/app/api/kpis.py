from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
import pandas as pd
from app.core.database import get_db
from app.models.models import KpiDefinition, MonthlyRecord
from app.schemas.schemas import KpiMeta, KpiTrendsRequest

router = APIRouter(prefix="/kpis", tags=["KPI Intelligence"])

@router.get("", response_model=List[KpiMeta])
def list_kpis(
    category: Optional[str] = Query(None, description="Filter by category: operational or financial"),
    db: Session = Depends(get_db)
):
    query = db.query(KpiDefinition)
    if category:
        query = query.filter(KpiDefinition.category == category)
    items = query.order_by(KpiDefinition.category.desc(), KpiDefinition.id.asc()).all()
    return [
        KpiMeta(
            code=item.code,
            name=item.name,
            category=item.category,
            unit=item.unit,
            direction_better=item.direction_better,
            target_value=item.target_value,
            description=item.description
        )
        for item in items
    ]

@router.get("/trends")
def get_kpi_trends(
    kpis: str = Query("revenue,operating_profit,loan_processing_time", description="Comma-separated KPI codes"),
    business_unit: str = Query("Consolidated", description="Business unit"),
    start_period: Optional[str] = Query(None),
    end_period: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    kpi_list = [k.strip() for k in kpis.split(",") if k.strip()]

    query = db.query(MonthlyRecord).filter(MonthlyRecord.business_unit == business_unit)
    if start_period:
        query = query.filter(MonthlyRecord.period >= start_period)
    if end_period:
        query = query.filter(MonthlyRecord.period <= end_period)

    records = query.order_by(MonthlyRecord.period.asc()).all()
    if not records:
        records = db.query(MonthlyRecord).filter(MonthlyRecord.business_unit == "Consolidated").order_by(MonthlyRecord.period.asc()).all()

    # Convert to DataFrame to calculate 3-month rolling averages
    data_dicts = []
    for r in records:
        d = {"period": r.period}
        for k in kpi_list:
            if hasattr(r, k):
                d[k] = getattr(r, k)
        data_dicts.append(d)

    df = pd.DataFrame(data_dicts)
    
    # Calculate rolling averages
    rolling_df = pd.DataFrame({"period": df["period"]})
    for k in kpi_list:
        if k in df.columns:
            rolling_df[f"{k}_ma3"] = df[k].rolling(window=3, min_periods=1).mean().round(2)
            rolling_df[k] = df[k]

    return {
        "business_unit": business_unit,
        "kpis": kpi_list,
        "points": rolling_df.to_dict(orient="records"),
        "total_periods": len(rolling_df)
    }
