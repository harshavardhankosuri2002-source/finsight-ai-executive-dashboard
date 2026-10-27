from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
from app.core.database import get_db
from app.models.models import MonthlyRecord
from app.schemas.schemas import DriverAnalysisRequest, DriverAnalysisResponse
from app.analytics.regression import run_multiple_regression_analysis

router = APIRouter(prefix="/analysis", tags=["Driver Analysis Engine"])

@router.post("/drivers", response_model=DriverAnalysisResponse)
def analyze_drivers(
    req: DriverAnalysisRequest,
    db: Session = Depends(get_db)
):
    # Fetch data records for the requested business unit
    records = db.query(MonthlyRecord).filter(
        MonthlyRecord.business_unit == req.business_unit
    ).order_by(MonthlyRecord.period.asc()).all()

    if not records or len(records) < 10:
        # Fallback to Consolidated if not enough points in unit
        records = db.query(MonthlyRecord).filter(
            MonthlyRecord.business_unit == "Consolidated"
        ).order_by(MonthlyRecord.period.asc()).all()

    if len(records) < 10:
        raise HTTPException(status_code=400, detail="Insufficient historical data (minimum 10 periods required).")

    # Convert to DataFrame
    df = pd.DataFrame([r.__dict__ for r in records])
    if "_sa_instance_state" in df.columns:
        df = df.drop(columns=["_sa_instance_state"])

    try:
        results = run_multiple_regression_analysis(
            df=df,
            target_metric=req.target_metric,
            candidate_drivers=req.candidate_drivers,
            test_size=req.test_size,
            include_lags=req.include_lags
        )
        results["business_unit"] = req.business_unit
        return DriverAnalysisResponse(**results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Driver analysis engine error: {str(e)}")
