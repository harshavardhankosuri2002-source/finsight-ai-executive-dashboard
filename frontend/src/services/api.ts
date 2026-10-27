import axios from 'axios';
import {
  DashboardSummary,
  KpiMeta,
  KpiTrendData,
  DriverAnalysisResponse,
  RiskOverviewResponse,
  ScenarioAssumptions,
  ScenarioResponse,
  ExecutiveReport,
  DataQualityReport
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export const fetchDashboardSummary = async (businessUnit: string = 'Consolidated', period?: string): Promise<DashboardSummary> => {
  const params: Record<string, string> = { business_unit: businessUnit };
  if (period) params.period = period;
  const res = await api.get<DashboardSummary>('/dashboard/summary', { params });
  return res.data;
};

export const fetchKpis = async (category?: string): Promise<KpiMeta[]> => {
  const params: Record<string, string> = {};
  if (category) params.category = category;
  const res = await api.get<KpiMeta[]>('/kpis', { params });
  return res.data;
};

export const fetchKpiTrends = async (
  kpis: string[],
  businessUnit: string = 'Consolidated',
  startPeriod?: string,
  endPeriod?: string
): Promise<KpiTrendData> => {
  const params: Record<string, string> = {
    kpis: kpis.join(','),
    business_unit: businessUnit,
  };
  if (startPeriod) params.start_period = startPeriod;
  if (endPeriod) params.end_period = endPeriod;
  const res = await api.get<KpiTrendData>('/kpis/trends', { params });
  return res.data;
};

export const runDriverAnalysis = async (
  targetMetric: string,
  businessUnit: string = 'Consolidated',
  candidateDrivers?: string[],
  includeLags: boolean = true
): Promise<DriverAnalysisResponse> => {
  const res = await api.post<DriverAnalysisResponse>('/analysis/drivers', {
    target_metric: targetMetric,
    business_unit: businessUnit,
    candidate_drivers: candidateDrivers,
    include_lags: includeLags,
  });
  return res.data;
};

export const fetchRiskAlerts = async (
  businessUnit?: string,
  severity?: string
): Promise<RiskOverviewResponse> => {
  const params: Record<string, string> = {};
  if (businessUnit && businessUnit !== 'All') params.business_unit = businessUnit;
  if (severity && severity !== 'All') params.severity = severity;
  const res = await api.get<RiskOverviewResponse>('/risks', { params });
  return res.data;
};

export const sendExecutiveChat = async (
  message: string,
  businessUnit: string = 'Consolidated',
  sessionId: string = 'exec-session-default'
) => {
  const res = await api.post('/assistant/chat', {
    message,
    business_unit: businessUnit,
    session_id: sessionId,
  });
  return res.data;
};

export const runScenarioSimulation = async (
  assumptions: ScenarioAssumptions
): Promise<ScenarioResponse> => {
  const res = await api.post<ScenarioResponse>('/scenarios/run', assumptions);
  return res.data;
};

export const uploadDatasetFile = async (file: File): Promise<DataQualityReport> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post<DataQualityReport>('/data/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const resetToDemoBaseline = async () => {
  const res = await api.post('/data/reset-demo');
  return res.data;
};

export const fetchExecutiveReport = async (
  businessUnit: string = 'Consolidated',
  period: string = 'latest'
): Promise<ExecutiveReport> => {
  const res = await api.get<ExecutiveReport>('/reports/executive', {
    params: { business_unit: businessUnit, period },
  });
  return res.data;
};

export default api;
