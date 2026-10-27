from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# Base KPI metadata
class KpiMeta(BaseModel):
    code: str
    name: str
    category: str # 'operational' | 'financial'
    unit: str
    direction_better: str
    target_value: Optional[float] = None
    description: Optional[str] = None

# Individual Metric Status with Period-over-Period
class MetricSummary(BaseModel):
    code: str
    name: str
    category: str
    unit: str
    current_value: float
    previous_value: float
    mom_change_pct: float
    yoy_change_pct: float
    target_value: Optional[float] = None
    target_variance_pct: Optional[float] = None
    trend_direction: str # 'up' | 'down' | 'flat'
    is_favorable: bool

# Dashboard Summary
class DashboardSummaryResponse(BaseModel):
    as_of_period: str
    business_unit: str
    kpis: Dict[str, MetricSummary]
    recent_trend: List[Dict[str, Any]]
    executive_briefing: str
    high_risks_count: int
    top_driver_summary: str
    data_disclaimer: str

# KPI Trend Request & Response
class KpiTrendsRequest(BaseModel):
    kpis: List[str]
    business_unit: Optional[str] = "Consolidated"
    start_period: Optional[str] = None
    end_period: Optional[str] = None

class KpiTrendPoint(BaseModel):
    period: str
    values: Dict[str, Optional[float]]

# Driver Analysis Request & Response
class DriverAnalysisRequest(BaseModel):
    target_metric: str = "operating_profit"
    candidate_drivers: Optional[List[str]] = None
    business_unit: Optional[str] = "Consolidated"
    test_size: float = 0.25
    include_lags: bool = True

class DriverRankItem(BaseModel):
    kpi_code: str
    kpi_name: str
    pearson_corr: float
    spearman_corr: float
    corr_p_value: float
    standardized_beta: float
    regression_p_value: float
    importance_score: float
    vif: float
    optimal_lag_months: int
    relationship_direction: str
    association_summary: str

class RegressionDiagnostics(BaseModel):
    r_squared: float
    adj_r_squared: float
    f_statistic: float
    f_pvalue: float
    durbin_watson: float
    aic: float
    bic: float
    train_samples: int
    test_samples: int
    test_rmse: float
    test_r_squared: float

class DriverAnalysisResponse(BaseModel):
    target_metric: str
    target_name: str
    business_unit: str
    sample_size: int
    ranked_drivers: List[DriverRankItem]
    diagnostics: RegressionDiagnostics
    shap_feature_importance: List[Dict[str, Any]]
    interpretation_notes: List[str]
    statistical_disclaimer: str

# Risk Alert Models
class RiskAlertItem(BaseModel):
    id: Optional[int] = None
    period: str
    business_unit: str
    kpi_code: str
    kpi_name: str
    observed_value: float
    baseline_value: float
    deviation_pct: float
    severity: str # 'high' | 'medium' | 'low'
    detection_method: str
    supporting_evidence: str
    recommended_investigation: str

class RiskOverviewResponse(BaseModel):
    as_of_period: str
    total_alerts: int
    high_count: int
    medium_count: int
    low_count: int
    alerts: List[RiskAlertItem]

# Scenario Planner Models
class ScenarioAssumptions(BaseModel):
    business_unit: str = "Consolidated"
    name: str = "Custom Strategic Simulation"
    opex_change_pct: float = Field(0.0, description="Operating Expense % adjustment, e.g. -5.0 for 5% cost rationalization")
    loan_growth_pct: float = Field(0.0, description="Loan book growth % adjustment, e.g. 8.0 for 8% loan expansion")
    tat_change_pct: float = Field(0.0, description="TAT % adjustment, e.g. -15.0 for 15% faster processing")
    cac_change_pct: float = Field(0.0, description="CAC % adjustment, e.g. -10.0 for 10% lower customer acquisition cost")
    delinquency_change_pct: float = Field(0.0, description="Delinquency % adjustment, e.g. 10.0 for 10% uptick in arrears")

class ScenarioMetricResult(BaseModel):
    metric_code: str
    metric_name: str
    unit: str
    baseline: float
    projected: float
    delta_abs: float
    delta_pct: float

class ScenarioResponse(BaseModel):
    scenario_name: str
    business_unit: str
    baseline_period: str
    assumptions: ScenarioAssumptions
    metrics: Dict[str, ScenarioMetricResult]
    sensitivity_table: List[Dict[str, Any]]
    methodology_notes: List[str]
    limitations: str

# Assistant Chat Models
class ChatMessageRequest(BaseModel):
    message: str
    session_id: Optional[str] = "exec-session-default"
    business_unit: Optional[str] = "Consolidated"

class ChatMessageResponse(BaseModel):
    session_id: str
    query: str
    response: str
    is_llm_generated: bool
    evidence_points: List[str]
    grounding_facts: Dict[str, Any]
    disclaimer: str

# Executive Report Models
class ExecutiveReportResponse(BaseModel):
    generated_at: str
    period: str
    business_unit: str
    executive_summary: str
    financial_highlights: List[str]
    operational_vulnerabilities: List[str]
    key_drivers: List[str]
    actionable_recommendations: List[Dict[str, str]]
    disclaimer: str

# Data Upload and Management
class DataQualityReport(BaseModel):
    total_rows: int
    valid_rows: int
    invalid_rows: int
    missing_values_count: int
    duplicate_rows_count: int
    column_mapping_success: bool
    unmapped_columns: List[str]
    validation_messages: List[str]
    synthetic_notice: str
