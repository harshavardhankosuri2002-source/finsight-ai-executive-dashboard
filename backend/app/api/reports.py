from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import MonthlyRecord, RiskAlertRecord
from app.schemas.schemas import ExecutiveReportResponse

router = APIRouter(prefix="/reports", tags=["Executive Reports"])

@router.get("/executive", response_model=ExecutiveReportResponse)
def get_executive_report(
    business_unit: str = Query("Consolidated", description="Business unit filter"),
    period: str = Query("latest", description="Specific period or 'latest'"),
    db: Session = Depends(get_db)
):
    query = db.query(MonthlyRecord).filter(MonthlyRecord.business_unit == business_unit)
    records = query.order_by(MonthlyRecord.period.asc()).all()
    if not records:
        records = db.query(MonthlyRecord).filter(MonthlyRecord.business_unit == "Consolidated").order_by(MonthlyRecord.period.asc()).all()

    target_idx = len(records) - 1
    if period != "latest":
        for i, r in enumerate(records):
            if r.period == period:
                target_idx = i
                break

    cur = records[target_idx]
    prev = records[target_idx - 1] if target_idx > 0 else cur

    def pct_change(c, p):
        return round(((c - p) / abs(p)) * 100.0, 2) if p != 0 else 0.0

    rev_chg = pct_change(cur.revenue, prev.revenue)
    ppop_chg = pct_change(cur.operating_profit, prev.operating_profit)
    pat_chg = pct_change(cur.net_profit, prev.net_profit)

    # Active alerts
    alerts = db.query(RiskAlertRecord).filter(
        RiskAlertRecord.period == cur.period,
        RiskAlertRecord.business_unit == cur.business_unit
    ).all()

    summary_text = (
        f"FinSight AI Executive Briefing for {cur.business_unit} as of period {cur.period}. "
        f"Total Revenue closed at ₹{cur.revenue:,.0f} Cr ({rev_chg:+.1f}% MoM) with Pre-Provision Operating Profit of ₹{cur.operating_profit:,.0f} Cr ({ppop_chg:+.1f}% MoM). "
        f"Net Interest Margin is operating at {cur.net_interest_margin:.2f}%, and Cost-to-Income Ratio registered at {cur.cost_to_income_ratio:.2f}%. "
        f"Asset quality indicators reflect Gross NPA at {cur.gross_npa_ratio:.2f}% and Early Delinquency (30+ DPD) at {cur.delinquency_rate:.2f}%."
    )

    fin_highlights = [
        f"Topline Net Revenue: ₹{cur.revenue:,.2f} Cr ({rev_chg:+.1f}% vs prior month)",
        f"Net Interest Margin (NIM): {cur.net_interest_margin:.2f}% (benchmark corridor: 3.45% - 4.10%)",
        f"Cost-to-Income Ratio (CIR): {cur.cost_to_income_ratio:.2f}% ({pct_change(cur.cost_to_income_ratio, prev.cost_to_income_ratio):+.1f}% MoM change)",
        f"Net Profit (PAT): ₹{cur.net_profit:,.2f} Cr with Provision Coverage Ratio (PCR) at {cur.provision_coverage_ratio:.1f}%",
        f"Total Loan Advances Book: ₹{cur.total_advances:,.0f} Cr backed by CASA Ratio of {cur.casa_ratio:.1f}%"
    ]

    op_vulns = [
        f"Loan Processing Turnaround Time: {cur.loan_processing_time:.2f} Days (target: 3.50 Days)",
        f"Early Arrears Delinquency Rate: {cur.delinquency_rate:.2f}% (warning threshold: 2.20%)",
        f"Customer Acquisition Cost (CAC): ₹{cur.customer_acquisition_cost:,.0f} per onboarded relationship",
        f"Digital Adoption Share: {cur.digital_adoption:.1f}% across all retail & commercial channels"
    ]

    key_drivers = [
        "Loan Processing TAT: Strongest negative driver of non-interest fee capture (β = -0.42). Speeding TAT accelerates disbursal conversion.",
        "Early Delinquency (30+ DPD): Exhibits 1-to-2 month leading transmission into credit loss provisions and bottom-line PAT.",
        "Digital Adoption Rate: Primary structural lever reducing Cost-to-Income Ratio (-0.31β impact per 1σ expansion)."
    ]

    recs = [
        {
            "priority": "P1 - Critical",
            "action": "Loan Origination System (LOS) Optimization",
            "detail": "Streamline credit approval workflows in Retail and MSME segments to compress TAT back toward the 3.5-day target, recovering up to ₹250 Cr in lost fee conversions."
        },
        {
            "priority": "P1 - Critical",
            "action": "Early Delinquency Containment",
            "detail": "Deploy targeted digital collection reminders on 30+ DPD unsecured loans to arrest migration into Stage 2/3 gross non-performing assets."
        },
        {
            "priority": "P2 - Strategic",
            "action": "Channel CAC Rationalization",
            "detail": "Shift origination incentives from physical direct selling agents (DSA) toward in-app digital pre-approved sanction funnels to reduce CIR by 40-75 bps."
        },
        {
            "priority": "P3 - Operational",
            "action": "Customer Service MTTR Resolution",
            "detail": "Automate routine query handling in mobile banking to lower average resolution time from 16+ hours to under 10 hours."
        }
    ]

    disclaimer = (
        "CONFIDENTIAL EXECUTIVE BRIEFING: Generated by FinSight AI decision intelligence engine using simulated bank scenarios. "
        "Associations reflect empirical econometric regressions and should be evaluated alongside committee judgment."
    )

    return ExecutiveReportResponse(
        generated_at=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
        period=cur.period,
        business_unit=cur.business_unit,
        executive_summary=summary_text,
        financial_highlights=fin_highlights,
        operational_vulnerabilities=op_vulns,
        key_drivers=key_drivers,
        actionable_recommendations=recs,
        disclaimer=disclaimer
    )
