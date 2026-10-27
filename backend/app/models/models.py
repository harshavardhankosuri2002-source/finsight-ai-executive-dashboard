from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON, Index
from app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class KpiDefinition(Base):
    __tablename__ = "kpi_definitions"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(64), unique=True, index=True, nullable=False)
    name = Column(String(128), nullable=False)
    category = Column(String(32), nullable=False) # 'operational' | 'financial'
    unit = Column(String(32), nullable=False)
    description = Column(Text, nullable=True)
    target_value = Column(Float, nullable=True)
    direction_better = Column(String(16), default="higher") # 'higher' | 'lower'
    warning_threshold = Column(Float, nullable=True)
    critical_threshold = Column(Float, nullable=True)

class MonthlyRecord(Base):
    __tablename__ = "monthly_records"

    id = Column(Integer, primary_key=True, index=True)
    period = Column(String(7), index=True, nullable=False) # YYYY-MM
    business_unit = Column(String(64), index=True, nullable=False)
    
    # Financial metrics (₹ Crores & percentages)
    revenue = Column(Float, nullable=False)
    net_interest_income = Column(Float, nullable=False)
    operating_expenses = Column(Float, nullable=False)
    operating_profit = Column(Float, nullable=False)
    credit_loss_provisions = Column(Float, nullable=False)
    net_profit = Column(Float, nullable=False)
    net_interest_margin = Column(Float, nullable=False)
    cost_to_income_ratio = Column(Float, nullable=False)
    gross_npa_ratio = Column(Float, nullable=False)
    net_npa_ratio = Column(Float, nullable=False)
    provision_coverage_ratio = Column(Float, nullable=False)
    casa_ratio = Column(Float, nullable=False)
    total_advances = Column(Float, nullable=False)
    total_deposits = Column(Float, nullable=False)

    # Operational KPIs
    loan_processing_time = Column(Float, nullable=False) # Days
    loan_approval_rate = Column(Float, nullable=False) # %
    customer_acquisition_cost = Column(Float, nullable=False) # ₹
    customer_complaints = Column(Float, nullable=False) # per 10k customers
    customer_satisfaction = Column(Float, nullable=False) # CSAT out of 100
    employee_productivity = Column(Float, nullable=False) # ₹ Lakhs disbursal/FTE
    employee_attrition = Column(Float, nullable=False) # % annualized
    digital_adoption = Column(Float, nullable=False) # % digital txn
    service_resolution_time = Column(Float, nullable=False) # Hours MTTR
    delinquency_rate = Column(Float, nullable=False) # % 30+ DPD

    is_synthetic = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

    __table_args__ = (
        Index("idx_period_unit", "period", "business_unit", unique=True),
    )

class RiskAlertRecord(Base):
    __tablename__ = "risk_alerts"

    id = Column(Integer, primary_key=True, index=True)
    period = Column(String(7), index=True, nullable=False)
    business_unit = Column(String(64), index=True, nullable=False)
    kpi_code = Column(String(64), nullable=False)
    kpi_name = Column(String(128), nullable=False)
    observed_value = Column(Float, nullable=False)
    baseline_value = Column(Float, nullable=False)
    deviation_pct = Column(Float, nullable=False)
    severity = Column(String(16), nullable=False) # 'high' | 'medium' | 'low'
    detection_method = Column(String(64), nullable=False)
    supporting_evidence = Column(Text, nullable=False)
    recommended_investigation = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now)

class ScenarioRunRecord(Base):
    __tablename__ = "scenario_runs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    business_unit = Column(String(64), nullable=False)
    assumptions = Column(JSON, nullable=False)
    baseline_metrics = Column(JSON, nullable=False)
    projected_metrics = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=utc_now)

class ExecutiveChatHistory(Base):
    __tablename__ = "executive_chat_history"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), index=True, nullable=False)
    user_query = Column(Text, nullable=False)
    assistant_response = Column(Text, nullable=False)
    is_llm_generated = Column(Boolean, default=False)
    evidence_context = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utc_now)
