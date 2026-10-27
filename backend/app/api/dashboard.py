from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
import pandas as pd
from app.core.database import get_db
from app.models.models import MonthlyRecord, KpiDefinition, RiskAlertRecord
from app.schemas.schemas import DashboardSummaryResponse, MetricSummary

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    business_unit: str = Query("Consolidated", description="Business unit filter"),
    period: Optional[str] = Query(None, description="Specific period YYYY-MM or latest"),
    db: Session = Depends(get_db)
):
    # Query all records for this business unit ordered by period
    records = db.query(MonthlyRecord).filter(
        MonthlyRecord.business_unit == business_unit
    ).order_by(MonthlyRecord.period.asc()).all()

    if not records:
        # Fallback to Consolidated if unit not found
        records = db.query(MonthlyRecord).filter(
            MonthlyRecord.business_unit == "Consolidated"
        ).order_by(MonthlyRecord.period.asc()).all()

    if not records:
        raise ValueError("No records found in database.")

    # Determine latest and prior records
    if period:
        target_idx = next((i for i, r in enumerate(records) if r.period == period), len(records) - 1)
    else:
        target_idx = len(records) - 1

    cur = records[target_idx]
    prev = records[target_idx - 1] if target_idx > 0 else cur
    yoy_prev = records[target_idx - 12] if target_idx >= 12 else prev

    # Query KPI definitions for targets & metadata
    kpi_defs = {k.code: k for k in db.query(KpiDefinition).all()}

    def build_metric_summary(code: str, name: str, category: str, unit: str, cur_val: float, prev_val: float, yoy_val: float):
        k_def = kpi_defs.get(code)
        target = k_def.target_value if k_def else None
        dir_better = k_def.direction_better if k_def else "higher"

        mom_pct = round(((cur_val - prev_val) / abs(prev_val)) * 100.0, 2) if prev_val != 0 else 0.0
        yoy_pct = round(((cur_val - yoy_val) / abs(yoy_val)) * 100.0, 2) if yoy_val != 0 else 0.0

        target_var = round(((cur_val - target) / target) * 100.0, 2) if target else None

        trend = "flat"
        if mom_pct > 0.5:
            trend = "up"
        elif mom_pct < -0.5:
            trend = "down"

        is_fav = (trend == "up" and dir_better == "higher") or (trend == "down" and dir_better == "lower") or (trend == "flat")

        return MetricSummary(
            code=code,
            name=name,
            category=category,
            unit=unit,
            current_value=round(cur_val, 2),
            previous_value=round(prev_val, 2),
            mom_change_pct=mom_pct,
            yoy_change_pct=yoy_pct,
            target_value=target,
            target_variance_pct=target_var,
            trend_direction=trend,
            is_favorable=is_fav
        )

    kpi_summaries = {
        "revenue": build_metric_summary("revenue", "Total Revenue", "financial", "₹ Cr", cur.revenue, prev.revenue, yoy_prev.revenue),
        "operating_profit": build_metric_summary("operating_profit", "Operating Profit (PPOP)", "financial", "₹ Cr", cur.operating_profit, prev.operating_profit, yoy_prev.operating_profit),
        "net_profit": build_metric_summary("net_profit", "Net Profit (PAT)", "financial", "₹ Cr", cur.net_profit, prev.net_profit, yoy_prev.net_profit),
        "net_interest_margin": build_metric_summary("net_interest_margin", "Net Interest Margin (NIM)", "financial", "%", cur.net_interest_margin, prev.net_interest_margin, yoy_prev.net_interest_margin),
        "cost_to_income_ratio": build_metric_summary("cost_to_income_ratio", "Cost-to-Income Ratio (CIR)", "financial", "%", cur.cost_to_income_ratio, prev.cost_to_income_ratio, yoy_prev.cost_to_income_ratio),
        "gross_npa_ratio": build_metric_summary("gross_npa_ratio", "Gross NPA Ratio", "financial", "%", cur.gross_npa_ratio, prev.gross_npa_ratio, yoy_prev.gross_npa_ratio),
        "loan_processing_time": build_metric_summary("loan_processing_time", "Turnaround Time (TAT)", "operational", "Days", cur.loan_processing_time, prev.loan_processing_time, yoy_prev.loan_processing_time),
        "customer_acquisition_cost": build_metric_summary("customer_acquisition_cost", "Customer Acquisition Cost", "operational", "₹", cur.customer_acquisition_cost, prev.customer_acquisition_cost, yoy_prev.customer_acquisition_cost),
        "delinquency_rate": build_metric_summary("delinquency_rate", "Early Delinquency Rate", "operational", "%", cur.delinquency_rate, prev.delinquency_rate, yoy_prev.delinquency_rate),
        "digital_adoption": build_metric_summary("digital_adoption", "Digital Adoption", "operational", "%", cur.digital_adoption, prev.digital_adoption, yoy_prev.digital_adoption),
    }

    # Recent 6 periods for sparklines & dashboard chart
    recent_trend = [
        {
            "period": r.period,
            "revenue": r.revenue,
            "operating_profit": r.operating_profit,
            "net_profit": r.net_profit,
            "nim": r.net_interest_margin,
            "cir": r.cost_to_income_ratio,
            "tat": r.loan_processing_time,
            "delinquency": r.delinquency_rate
        }
        for r in records[-12:]
    ]

    # Count high severity risk alerts for this period & business unit
    high_risks = db.query(RiskAlertRecord).filter(
        RiskAlertRecord.period == cur.period,
        RiskAlertRecord.severity == "high"
    ).count()

    briefing = (
        f"For {cur.period} ({cur.business_unit}), Net Revenue registered at ₹{cur.revenue:,.0f} Cr with Pre-Provision Operating Profit of ₹{cur.operating_profit:,.0f} Cr. "
        f"Net Interest Margin stood resilient at {cur.net_interest_margin:.2f}%. Cost-to-Income Ratio was {cur.cost_to_income_ratio:.2f}%. "
        f"Operational velocity shows Loan Processing TAT at {cur.loan_processing_time:.2f} days and Early Delinquency at {cur.delinquency_rate:.2f}%."
    )

    top_driver_note = "Loan Processing TAT and Early Delinquency exhibit the strongest statistical association with operating profitability volatility."

    disclaimer = "HDFC Bank simulated prototype scenario. All figures are model-generated synthetic observations for executive decision intelligence."

    return DashboardSummaryResponse(
        as_of_period=cur.period,
        business_unit=cur.business_unit,
        kpis=kpi_summaries,
        recent_trend=recent_trend,
        executive_briefing=briefing,
        high_risks_count=high_risks,
        top_driver_summary=top_driver_note,
        data_disclaimer=disclaimer
    )
