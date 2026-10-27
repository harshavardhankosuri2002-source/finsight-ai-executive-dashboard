from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
import os
import pandas as pd
from app.core.database import get_db
from app.models.models import MonthlyRecord, RiskAlertRecord
from app.schemas.schemas import DataQualityReport
from app.analytics.data_quality import parse_and_validate_dataset
from app.services.seed_data import generate_synthetic_data, generate_risk_alerts

router = APIRouter(prefix="/data", tags=["Data Management"])

@router.post("/upload", response_model=DataQualityReport)
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Check filename extension
    if not (file.filename.endswith(".csv") or file.filename.endswith((".xlsx", ".xls"))):
        raise HTTPException(status_code=400, detail="Only .csv and .xlsx files are supported.")

    # Read content with file size limit (15 MB)
    content = await file.read()
    if len(content) > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum 15 MB limit.")

    try:
        df, report = parse_and_validate_dataset(content, file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Upsert valid rows into MonthlyRecord
    records_count = 0
    for _, row in df.iterrows():
        period_val = str(row["period"])
        bu_val = str(row["business_unit"])

        existing = db.query(MonthlyRecord).filter(
            MonthlyRecord.period == period_val,
            MonthlyRecord.business_unit == bu_val
        ).first()

        data_payload = {
            "period": period_val,
            "business_unit": bu_val,
            "revenue": float(row.get("revenue", 0.0)),
            "net_interest_income": float(row.get("net_interest_income", 0.0)),
            "operating_expenses": float(row.get("operating_expenses", 0.0)),
            "operating_profit": float(row.get("operating_profit", 0.0)),
            "credit_loss_provisions": float(row.get("credit_loss_provisions", 0.0)),
            "net_profit": float(row.get("net_profit", 0.0)),
            "net_interest_margin": float(row.get("net_interest_margin", 0.0)),
            "cost_to_income_ratio": float(row.get("cost_to_income_ratio", 0.0)),
            "gross_npa_ratio": float(row.get("gross_npa_ratio", 0.0)),
            "net_npa_ratio": float(row.get("net_npa_ratio", 0.0)),
            "provision_coverage_ratio": float(row.get("provision_coverage_ratio", 0.0)),
            "casa_ratio": float(row.get("casa_ratio", 0.0)),
            "total_advances": float(row.get("total_advances", 0.0)),
            "total_deposits": float(row.get("total_deposits", 0.0)),
            "loan_processing_time": float(row.get("loan_processing_time", 0.0)),
            "loan_approval_rate": float(row.get("loan_approval_rate", 0.0)),
            "customer_acquisition_cost": float(row.get("customer_acquisition_cost", 0.0)),
            "customer_complaints": float(row.get("customer_complaints", 0.0)),
            "customer_satisfaction": float(row.get("customer_satisfaction", 0.0)),
            "employee_productivity": float(row.get("employee_productivity", 0.0)),
            "employee_attrition": float(row.get("employee_attrition", 0.0)),
            "digital_adoption": float(row.get("digital_adoption", 0.0)),
            "service_resolution_time": float(row.get("service_resolution_time", 0.0)),
            "delinquency_rate": float(row.get("delinquency_rate", 0.0)),
            "is_synthetic": False
        }

        if existing:
            for k, v in data_payload.items():
                setattr(existing, k, v)
        else:
            new_rec = MonthlyRecord(**data_payload)
            db.add(new_rec)
        records_count += 1

    db.commit()
    report.validation_messages.append(f"Successfully synchronized {records_count} rows with the database.")
    return report

@router.get("/template")
def download_template():
    template_path = "data/sample_upload_template.csv"
    if not os.path.exists(template_path):
        template_path = "backend/data/sample_upload_template.csv"
    if os.path.exists(template_path):
        with open(template_path, "r") as f:
            content = f.read()
        return Response(content=content, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=finsight_upload_template.csv"})
    # Dynamic fallback generation
    records = generate_synthetic_data(seed=42)
    df = pd.DataFrame(records).head(3)
    content = df.to_csv(index=False)
    return Response(content=content, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=finsight_upload_template.csv"})

@router.post("/reset-demo")
def reset_to_synthetic_baseline(db: Session = Depends(get_db)):
    """
    Clears current monthly records and re-seeds the standard reproducible 36-month baseline.
    """
    db.query(MonthlyRecord).delete()
    db.query(RiskAlertRecord).delete()
    db.commit()

    records = generate_synthetic_data(seed=42)
    for r in records:
        db.add(MonthlyRecord(**r))
    db.commit()

    alerts = generate_risk_alerts(records)
    for a in alerts:
        db.add(RiskAlertRecord(**a))
    db.commit()

    return {"status": "success", "message": f"Reset to pristine baseline with {len(records)} observations and {len(alerts)} alerts."}
