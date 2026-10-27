import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  CheckCircle,
  Info,
} from 'lucide-react';
import { fetchRiskAlerts } from '../services/api';
import { RiskOverviewResponse } from '../types';

interface RiskMonitorProps {
  businessUnit: string;
}

export const RiskMonitorPage: React.FC<RiskMonitorProps> = ({ businessUnit }) => {
  const [data, setData] = useState<RiskOverviewResponse | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchRiskAlerts(businessUnit, severityFilter)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to fetch risk monitor alerts.');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [businessUnit, severityFilter]);

  const filteredAlerts = (data?.alerts || []).filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.kpi_name.toLowerCase().includes(q) ||
      a.supporting_evidence.toLowerCase().includes(q) ||
      a.recommended_investigation.toLowerCase().includes(q) ||
      a.detection_method.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Title & Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <span>Operational & Credit Risk Monitor</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time statistical anomaly detection, Z-score variance tracking, and early warning threshold monitoring.
          </p>
        </div>

        {/* Severity Summary Pills */}
        <div className="flex items-center space-x-2">
          <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="font-semibold text-rose-300">{data?.high_count || 0} High</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="font-semibold text-amber-300">{data?.medium_count || 0} Medium</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="font-semibold text-blue-300">{data?.low_count || 0} Low</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search alerts by KPI, evidence, recommendation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/60 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Severity Filter Toggle */}
        <div className="flex items-center space-x-1 self-stretch sm:self-auto">
          <span className="text-xs text-slate-400 mr-2 flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Severity:</span>
          </span>
          {['All', 'high', 'medium', 'low'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                severityFilter === sev
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Cards List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-panel p-6 rounded-2xl border border-slate-800 animate-pulse h-40" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
          <h3 className="font-semibold text-sm">Failed to Load Alerts</h3>
          <p className="text-xs">{error}</p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-sm font-semibold text-white">No Active Threshold Breaches</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            All monitored operational and credit indicators in {businessUnit} are currently operating within nominal statistical control limits.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert, idx) => {
            const isHigh = alert.severity === 'high';
            const isMedium = alert.severity === 'medium';

            return (
              <div
                key={idx}
                className={`glass-panel p-6 rounded-2xl border transition-all ${
                  isHigh
                    ? 'border-rose-500/30 bg-slate-900/80 shadow-lg shadow-rose-950/20'
                    : isMedium
                    ? 'border-amber-500/30 bg-slate-900/80 shadow-lg shadow-amber-950/10'
                    : 'border-slate-800 bg-slate-900/60'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                  {/* Title & Scope */}
                  <div className="flex items-center space-x-3">
                    <span
                      className={`p-2 rounded-xl flex-shrink-0 ${
                        isHigh
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : isMedium
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      <AlertTriangle className="w-5 h-5" />
                    </span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-base font-bold text-white">{alert.kpi_name}</h4>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isHigh
                              ? 'bg-rose-500 text-white'
                              : isMedium
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-blue-500 text-white'
                          }`}
                        >
                          {alert.severity} Risk
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        Business Unit: <strong className="text-slate-300 font-medium">{alert.business_unit}</strong> • Period: <span className="font-mono">{alert.period}</span>
                      </span>
                    </div>
                  </div>

                  {/* Quantitative Comparison Pill */}
                  <div className="flex items-center space-x-4 bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 self-stretch lg:self-auto justify-between lg:justify-start">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Observed Value</span>
                      <span className="text-sm font-bold font-mono text-white">{alert.observed_value}</span>
                    </div>
                    <div className="h-6 w-px bg-slate-800" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Baseline Mean</span>
                      <span className="text-sm font-semibold font-mono text-slate-300">{alert.baseline_value}</span>
                    </div>
                    <div className="h-6 w-px bg-slate-800" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Deviation</span>
                      <span
                        className={`text-sm font-bold font-mono ${
                          alert.deviation_pct > 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {alert.deviation_pct > 0 ? `+${alert.deviation_pct.toFixed(1)}%` : `${alert.deviation_pct.toFixed(1)}%`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Evidence & Action Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 text-xs">
                  {/* Supporting Evidence */}
                  <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
                    <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px] flex items-center space-x-1.5">
                      <Info className="w-3.5 h-3.5 text-blue-400" />
                      <span>Empirical Evidence & Method</span>
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      {alert.supporting_evidence}
                    </p>
                    <span className="text-[10px] font-mono text-slate-500 block">
                      Detection: {alert.detection_method}
                    </span>
                  </div>

                  {/* Recommended Investigation */}
                  <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
                    <span className="font-semibold text-teal-300 uppercase tracking-wider text-[10px] flex items-center space-x-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-teal-400" />
                      <span>Executive Action & Investigation</span>
                    </span>
                    <p className="text-slate-200 leading-relaxed font-normal">
                      {alert.recommended_investigation}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
