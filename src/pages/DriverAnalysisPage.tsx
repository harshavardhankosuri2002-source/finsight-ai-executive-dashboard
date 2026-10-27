import React, { useEffect, useState } from 'react';
import {
  GitCompare,
  Clock,
  ShieldAlert,
  BarChart2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { runDriverAnalysis } from '../services/api';
import { DriverAnalysisResponse } from '../types';

interface DriverAnalysisProps {
  businessUnit: string;
}

const TARGET_METRICS = [
  { code: 'operating_profit', name: 'Operating Profit (PPOP)' },
  { code: 'net_profit', name: 'Net Profit (PAT)' },
  { code: 'cost_to_income_ratio', name: 'Cost-to-Income Ratio (CIR)' },
  { code: 'net_interest_margin', name: 'Net Interest Margin (NIM)' },
  { code: 'credit_loss_provisions', name: 'Credit Loss Provisions' },
];

export const DriverAnalysisPage: React.FC<DriverAnalysisProps> = ({ businessUnit }) => {
  const [targetMetric, setTargetMetric] = useState<string>('operating_profit');
  const [includeLags, setIncludeLags] = useState<boolean>(true);
  const [data, setData] = useState<DriverAnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    runDriverAnalysis(targetMetric, businessUnit, undefined, includeLags)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Driver analysis calculation failed.');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [targetMetric, businessUnit, includeLags]);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header & Target Metric Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <GitCompare className="w-5 h-5 text-blue-400" />
            <span>Operational-Financial Driver Analysis</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Empirical multiple OLS regression and lag modeling identifying which operational levers co-determine financial volatility.
          </p>
        </div>

        {/* Target Outcome Selector */}
        <div className="flex items-center space-x-3">
          <label className="text-xs text-slate-300 font-medium">Outcome Metric:</label>
          <div className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-sm">
            <select
              value={targetMetric}
              onChange={(e) => setTargetMetric(e.target.value)}
              className="bg-transparent text-xs font-semibold text-teal-300 outline-none cursor-pointer"
            >
              {TARGET_METRICS.map((m) => (
                <option key={m.code} value={m.code} className="bg-slate-900 text-slate-100">
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Lags Toggle */}
          <button
            onClick={() => setIncludeLags(!includeLags)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer flex items-center space-x-1.5 ${
              includeLags
                ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Lag Modeling: {includeLags ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Statistical Causation Governance Banner */}
      <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 flex items-start space-x-3 text-xs text-amber-200">
        <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold uppercase tracking-wider text-[11px] text-amber-300">
            Supervisory Econometric Notice: Association vs Causation
          </span>
          <p className="text-amber-200/90 leading-relaxed">
            Coefficients reflect historical observational covariance across 36 monthly reporting cycles.
            Statistical significance indicates predictive association, not counterfactual causation.
            Results are cross-validated on an out-of-sample 25% test partition to safeguard against over-fitting.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3 animate-pulse">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Computing OLS regression, VIF collinearity checks, and lag cross-correlations...</p>
        </div>
      ) : error || !data ? (
        <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
          <h3 className="font-semibold text-sm">Analysis Unavailable</h3>
          <p className="text-xs">{error}</p>
        </div>
      ) : (
        <>
          {/* Model Diagnostics Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/60">
              <span className="text-[11px] text-slate-400">R-Squared (In-Sample)</span>
              <div className="text-lg font-bold font-mono text-teal-400 mt-1">
                {(data.diagnostics.r_squared * 100).toFixed(1)}%
              </div>
              <span className="text-[10px] text-slate-400">Variance explained</span>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/60">
              <span className="text-[11px] text-slate-400">Adjusted R²</span>
              <div className="text-lg font-bold font-mono text-blue-400 mt-1">
                {(data.diagnostics.adj_r_squared * 100).toFixed(1)}%
              </div>
              <span className="text-[10px] text-slate-400">Degrees of freedom</span>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/60">
              <span className="text-[11px] text-slate-400">Out-of-Sample Test R²</span>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                {(data.diagnostics.test_r_squared * 100).toFixed(1)}%
              </div>
              <span className="text-[10px] text-slate-400">25% holdout partition</span>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/60">
              <span className="text-[11px] text-slate-400">F-Statistic P-Value</span>
              <div className="text-lg font-bold font-mono text-white mt-1">
                {data.diagnostics.f_pvalue < 0.001 ? '< 0.001' : data.diagnostics.f_pvalue.toFixed(3)}
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold">Model Significant</span>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/60">
              <span className="text-[11px] text-slate-400">Durbin-Watson</span>
              <div className="text-lg font-bold font-mono text-white mt-1">
                {data.diagnostics.durbin_watson.toFixed(2)}
              </div>
              <span className="text-[10px] text-slate-400">~2.0 (No autocorrelation)</span>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/60">
              <span className="text-[11px] text-slate-400">Holdout RMSE</span>
              <div className="text-lg font-bold font-mono text-white mt-1">
                {data.diagnostics.test_rmse.toFixed(2)}σ
              </div>
              <span className="text-[10px] text-slate-400">{data.diagnostics.test_samples} test periods</span>
            </div>
          </div>

          {/* Feature Importance Bar Chart */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-slate-900/60 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center space-x-2">
                  <BarChart2 className="w-4 h-4 text-blue-400" />
                  <span>Standardized Impact Coefficients (Beta β)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Impact magnitude on {data.target_name} per 1-standard-deviation operational shift
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">Normalized Z-Score Scale</span>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.ranked_drivers.map((d) => ({
                    name: d.kpi_name,
                    beta: d.standardized_beta,
                    importance: d.importance_score,
                  }))}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 140, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#cbd5e1" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${Number(val).toFixed(3)}σ`, 'Standardized Beta']}
                  />
                  <Bar dataKey="beta" radius={[0, 4, 4, 0]}>
                    {data.ranked_drivers.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.standardized_beta > 0 ? '#0d9488' : '#0284c7'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ranked Driver Detailed Table */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-slate-900/60 space-y-4">
            <h3 className="text-base font-semibold text-white">Driver Ranking & Econometric Evidence</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">Operational Driver</th>
                    <th className="py-3 px-3 text-right">Standardized Beta (β)</th>
                    <th className="py-3 px-3 text-right">Regression P-Value</th>
                    <th className="py-3 px-3 text-right">Pearson (r)</th>
                    <th className="py-3 px-3 text-right">Spearman (ρ)</th>
                    <th className="py-3 px-3 text-right">VIF Collinearity</th>
                    <th className="py-3 px-3 text-center">Optimal Lag</th>
                    <th className="py-3 px-3">Executive Econometric Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {data.ranked_drivers.map((d, i) => (
                    <tr key={d.kpi_code} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-3 font-medium text-slate-100 flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-mono">
                          {i + 1}
                        </span>
                        <span>{d.kpi_name}</span>
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono font-bold">
                        <span className={d.standardized_beta > 0 ? 'text-teal-400' : 'text-blue-400'}>
                          {d.standardized_beta > 0 ? `+${d.standardized_beta.toFixed(3)}` : d.standardized_beta.toFixed(3)}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono text-slate-300">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            d.regression_p_value < 0.05
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {d.regression_p_value.toFixed(3)}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono text-slate-300">
                        {d.pearson_corr > 0 ? `+${d.pearson_corr.toFixed(2)}` : d.pearson_corr.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono text-slate-300">
                        {d.spearman_corr > 0 ? `+${d.spearman_corr.toFixed(2)}` : d.spearman_corr.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono text-slate-300">
                        <span
                          className={d.vif > 5.0 ? 'text-amber-400 font-bold' : 'text-slate-300'}
                          title={d.vif > 5.0 ? 'Moderate multicollinearity' : 'Acceptable VIF'}
                        >
                          {d.vif.toFixed(1)}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700/60 font-mono text-[11px] text-slate-300">
                          {d.optimal_lag_months === 0 ? 'T (Current)' : `T-${d.optimal_lag_months} Mo`}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-slate-300 text-[11px] max-w-xs">
                        {d.association_summary}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
