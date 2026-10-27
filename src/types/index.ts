export interface MetricSummary {
  code: string;
  name: string;
  category: 'operational' | 'financial';
  unit: string;
  current_value: number;
  previous_value: number;
  mom_change_pct: number;
  yoy_change_pct: number;
  target_value?: number | null;
  target_variance_pct?: number | null;
  trend_direction: 'up' | 'down' | 'flat';
  is_favorable: boolean;
}

export interface DashboardSummary {
  as_of_period: string;
  business_unit: string;
  kpis: Record<string, MetricSummary>;
  recent_trend: Array<{
    period: string;
    revenue: number;
    operating_profit: number;
    net_profit: number;
    nim: number;
    cir: number;
    tat: number;
    delinquency: number;
  }>;
  executive_briefing: string;
  high_risks_count: number;
  top_driver_summary: string;
  data_disclaimer: string;
}

export interface KpiMeta {
  code: string;
  name: string;
  category: string;
  unit: string;
  direction_better: string;
  target_value?: number | null;
  description?: string | null;
}

export interface KpiTrendData {
  business_unit: string;
  kpis: string[];
  points: Array<{
    period: string;
    [key: string]: string | number | null;
  }>;
  total_periods: number;
}

export interface DriverRankItem {
  kpi_code: string;
  kpi_name: string;
  pearson_corr: number;
  spearman_corr: number;
  corr_p_value: number;
  standardized_beta: number;
  regression_p_value: number;
  importance_score: number;
  vif: number;
  optimal_lag_months: number;
  relationship_direction: string;
  association_summary: string;
}

export interface RegressionDiagnostics {
  r_squared: number;
  adj_r_squared: number;
  f_statistic: number;
  f_pvalue: number;
  durbin_watson: number;
  aic: number;
  bic: number;
  train_samples: number;
  test_samples: number;
  test_rmse: number;
  test_r_squared: number;
}

export interface DriverAnalysisResponse {
  target_metric: string;
  target_name: string;
  business_unit: string;
  sample_size: number;
  ranked_drivers: DriverRankItem[];
  diagnostics: RegressionDiagnostics;
  shap_feature_importance: Array<{
    kpi_code: string;
    kpi_name: string;
    mean_abs_impact: number;
    rf_importance: number;
  }>;
  interpretation_notes: string[];
  statistical_disclaimer: string;
}

export interface RiskAlertItem {
  id?: number;
  period: string;
  business_unit: string;
  kpi_code: string;
  kpi_name: string;
  observed_value: number;
  baseline_value: number;
  deviation_pct: number;
  severity: 'high' | 'medium' | 'low';
  detection_method: string;
  supporting_evidence: string;
  recommended_investigation: string;
}

export interface RiskOverviewResponse {
  as_of_period: string;
  total_alerts: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  alerts: RiskAlertItem[];
}

export interface ScenarioAssumptions {
  business_unit: string;
  name: string;
  opex_change_pct: number;
  loan_growth_pct: number;
  tat_change_pct: number;
  cac_change_pct: number;
  delinquency_change_pct: number;
}

export interface ScenarioMetricResult {
  metric_code: string;
  metric_name: string;
  unit: string;
  baseline: number;
  projected: number;
  delta_abs: number;
  delta_pct: number;
}

export interface ScenarioResponse {
  scenario_name: string;
  business_unit: string;
  baseline_period: string;
  assumptions: ScenarioAssumptions;
  metrics: Record<string, ScenarioMetricResult>;
  sensitivity_table: Array<Record<string, number | string>>;
  methodology_notes: string[];
  limitations: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  is_llm_generated?: boolean;
  evidence_points?: string[];
  disclaimer?: string;
}

export interface ExecutiveReport {
  generated_at: string;
  period: string;
  business_unit: string;
  executive_summary: string;
  financial_highlights: string[];
  operational_vulnerabilities: string[];
  key_drivers: string[];
  actionable_recommendations: Array<{
    priority: string;
    action: string;
    detail: string;
  }>;
  disclaimer: string;
}

export interface DataQualityReport {
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  missing_values_count: number;
  duplicate_rows_count: number;
  column_mapping_success: boolean;
  unmapped_columns: string[];
  validation_messages: string[];
  synthetic_notice: string;
}
