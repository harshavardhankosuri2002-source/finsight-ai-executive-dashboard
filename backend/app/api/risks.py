from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import RiskAlertRecord, MonthlyRecord
from app.schemas.schemas import RiskOverviewResponse, RiskAlertItem
from app.services.seed_data import generate_risk_alerts

router = APIRouter(prefix="/risks", tags=["Risk Monitor"])

@router.get("", response_model=RiskOverviewResponse)
def get_risk_alerts(
    business_unit: Optional[str] = Query(None, description="Optional business unit filter"),
    severity: Optional[str] = Query(None, description="Optional severity filter: high, medium, low"),
    db: Session = Depends(get_db)
):
    # Find latest period that has risk alerts
    latest_alert = db.query(RiskAlertRecord).order_by(RiskAlertRecord.period.desc()).first()
    latest_period = latest_alert.period if latest_alert else "2026-09"

    query = db.query(RiskAlertRecord).filter(RiskAlertRecord.period == latest_period)
    
    if business_unit and business_unit != "All":
        query = query.filter(RiskAlertRecord.business_unit == business_unit)
    if severity and severity != "All":
        query = query.filter(RiskAlertRecord.severity == severity)

    alerts = query.order_by(
        RiskAlertRecord.severity.asc(), # 'high' comes before 'medium'/'low' alphabetically, but let's sort custom
        RiskAlertRecord.deviation_pct.desc()
    ).all()

    # If no alerts found in table, generate dynamically from monthly records
    if not alerts:
        records = db.query(MonthlyRecord).all()
        recs_dict = [r.__dict__ for r in records]
        new_alerts = generate_risk_alerts(recs_dict)
        for a in new_alerts:
            db_a = RiskAlertRecord(**a)
            db.add(db_a)
        db.commit()
        alerts = db.query(RiskAlertRecord).filter(RiskAlertRecord.period == latest_period).all()

    # Custom severity rank
    sev_rank = {"high": 1, "medium": 2, "low": 3}
    alert_items = [
        RiskAlertItem(
            id=a.id,
            period=a.period,
            business_unit=a.business_unit,
            kpi_code=a.kpi_code,
            kpi_name=a.kpi_name,
            observed_value=a.observed_value,
            baseline_value=a.baseline_value,
            deviation_pct=a.deviation_pct,
            severity=a.severity,
            detection_method=a.detection_method,
            supporting_evidence=a.supporting_evidence,
            recommended_investigation=a.recommended_investigation
        )
        for a in alerts
    ]
    alert_items.sort(key=lambda x: (sev_rank.get(x.severity, 9), -abs(x.deviation_pct)))

    high_c = sum(1 for a in alert_items if a.severity == "high")
    med_c = sum(1 for a in alert_items if a.severity == "medium")
    low_c = sum(1 for a in alert_items if a.severity == "low")

    return RiskOverviewResponse(
        as_of_period=latest_period,
        total_alerts=len(alert_items),
        high_count=high_c,
        medium_count=med_c,
        low_count=low_c,
        alerts=alert_items
    )
