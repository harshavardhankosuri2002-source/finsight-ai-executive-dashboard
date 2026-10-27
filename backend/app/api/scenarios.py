from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import MonthlyRecord, ScenarioRunRecord
from app.schemas.schemas import ScenarioAssumptions, ScenarioResponse
from app.analytics.scenario_engine import run_strategic_scenario

router = APIRouter(prefix="/scenarios", tags=["Scenario Planner"])

@router.post("/run", response_model=ScenarioResponse)
def execute_scenario(
    assumptions: ScenarioAssumptions,
    db: Session = Depends(get_db)
):
    # Fetch latest baseline record for this business unit
    b_unit = assumptions.business_unit or "Consolidated"
    records = db.query(MonthlyRecord).filter(
        MonthlyRecord.business_unit == b_unit
    ).order_by(MonthlyRecord.period.desc()).first()

    if not records:
        records = db.query(MonthlyRecord).filter(
            MonthlyRecord.business_unit == "Consolidated"
        ).order_by(MonthlyRecord.period.desc()).first()

    if not records:
        raise HTTPException(status_code=404, detail="No baseline financial record found to simulate scenario.")

    baseline_dict = records.__dict__
    response = run_strategic_scenario(baseline_dict, assumptions)

    # Persist scenario run for executive auditing
    try:
        run_record = ScenarioRunRecord(
            name=assumptions.name,
            business_unit=assumptions.business_unit,
            assumptions=assumptions.model_dump(),
            baseline_metrics={k: v.baseline for k, v in response.metrics.items()},
            projected_metrics={k: v.projected for k, v in response.metrics.items()}
        )
        db.add(run_record)
        db.commit()
    except Exception:
        pass

    return response
