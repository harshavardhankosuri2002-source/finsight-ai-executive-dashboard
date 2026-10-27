import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Sparkles,
  DollarSign,
  PieChart,
  ShieldCheck,
  Clock,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { fetchDashboardSummary } from '../services/api';
import { DashboardSummary } from '../types';
import { MetricCard } from '../components/MetricCard';

interface OverviewProps {
  businessUnit: string;
  onNavigateTab: (tab: string) => void;
}

export const ExecutiveOverviewPage: React.FC<OverviewProps> = ({ businessUnit, onNavigateTab }) => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchDashboardSummary(businessUnit)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to fetch executive dashboard summary.');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [businessUnit]);

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass-panel p-5 rounded-xl border border-slate-800 animate-pulse h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
          <h3 className="font-semibold text-lg mb-1">Failed to Load Executive Dashboard</h3>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const { kpis, recent_trend, executive_briefing, high_risks_count, top_driver_summary } = data;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Executive Briefing Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950/80 via-slate-900 to-teal-950/40 border border-blue-800/40 p-6 shadow-xl backdrop-blur-md">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                AI Executive Decision Briefing ({data.as_of_period})
              </span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-normal">
              {executive_briefing}
            </p>
          </div>

          <div className="flex items-center space-x-3 flex-shrink-0">
            <button
              onClick={() => onNavigateTab('assistant')}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-700/30 transition-all cursor-pointer"
            >
              <span>Explore Drivers & Scenarios</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Primary Financial Metric Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Financial Core Performance
          </h2>
          <span className="text-xs text-slate-400">Scale: ₹ Crores & Percentages</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            metric={kpis.revenue}
            titleOverride="Net Revenue"
            icon={<DollarSign className="w-4 h-4" />}
          />
          <MetricCard
            metric={kpis.operating_profit}
            titleOverride="Pre-Provision Operating Profit"
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <MetricCard
            metric={kpis.net_interest_margin}
            titleOverride="Net Interest Margin (NIM)"
            icon={<PieChart className="w-4 h-4" />}
          />
          <MetricCard
            metric={kpis.cost_to_income_ratio}
            titleOverride="Cost-to-Income Ratio (CIR)"
            icon={<ShieldCheck className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Operational KPI Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Operational Transmission Levers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            metric={kpis.loan_processing_time}
            titleOverride="Loan Processing Turnaround Time"
            icon={<Clock className="w-4 h-4" />}
          />
          <MetricCard
            metric={kpis.customer_acquisition_cost}
            titleOverride="Customer Acquisition Cost"
            icon={<DollarSign className="w-4 h-4" />}
          />
          <MetricCard
            metric={kpis.delinquency_rate}
            titleOverride="Early Delinquency (30+ DPD)"
            icon={<AlertTriangle className="w-4 h-4" />}
          />
          <MetricCard
            metric={kpis.digital_adoption}
            titleOverride="Digital Channel Adoption"
            icon={<TrendingUp className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Chart: Revenue vs Operating Profit (PPOP) Trend */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800/80 bg-slate-900/60 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Revenue & Operating Profit Trend</h3>
              <p className="text-xs text-slate-400">Monthly trajectory over the last 12 periods (₹ Crores)</p>
            </div>
            <span className="text-xs font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
              12 Months Trajectory
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={recent_trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPpop" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="period" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString()} Cr`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Net Revenue"
                  stroke="#0284c7"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
                <Area
                  type="monotone"
                  dataKey="operating_profit"
                  name="Operating Profit (PPOP)"
                  stroke="#0d9488"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPpop)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Action Widgets: Risks & Drivers */}
        <div className="space-y-6">
          {/* Risk Alerts Callout Widget */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 bg-slate-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Risk Status</span>
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {high_risks_count} High Risk Alerts
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Anomaly detection engine flagged {high_risks_count} critical threshold anomalies in {businessUnit}.
            </p>
            <button
              onClick={() => onNavigateTab('risks')}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium border border-slate-700/60 flex items-center justify-center space-x-1 transition-colors cursor-pointer"
            >
              <span>Investigate Alert Evidence</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>
          </div>

          {/* Top Performance Driver Widget */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 bg-slate-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider flex items-center space-x-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Primary Drivers</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">Multiple OLS</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {top_driver_summary}
            </p>
            <button
              onClick={() => onNavigateTab('drivers')}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium border border-slate-700/60 flex items-center justify-center space-x-1 transition-colors cursor-pointer"
            >
              <span>View Full Driver Econometrics</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Chart: Operational Transmission vs Asset Quality */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-slate-900/60 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Efficiency & Risk Correlation Timeline</h3>
            <p className="text-xs text-slate-400">Co-movement of Cost-to-Income Ratio (CIR %), Loan TAT (Days), and Delinquency (30+ DPD %)</p>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={recent_trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="period" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: '#f8fafc',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line type="monotone" dataKey="cir" name="Cost-to-Income Ratio (%)" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="tat" name="Loan TAT (Days)" stroke="#06b6d4" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="delinquency" name="Delinquency Rate (%)" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
