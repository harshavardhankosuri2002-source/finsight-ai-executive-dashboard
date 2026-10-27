import React, { useEffect, useState } from 'react';
import {
  Activity,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { fetchKpis, fetchKpiTrends } from '../services/api';
import { KpiMeta, KpiTrendData } from '../types';

interface KpiIntelligenceProps {
  businessUnit: string;
}

const COLORS = ['#0284c7', '#0d9488', '#f59e0b', '#ec4899', '#8b5cf6'];

export const KpiIntelligencePage: React.FC<KpiIntelligenceProps> = ({ businessUnit }) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'operational' | 'financial'>('operational');
  const [kpiList, setKpiList] = useState<KpiMeta[]>([]);
  const [selectedKpis, setSelectedKpis] = useState<string[]>([
    'loan_processing_time',
    'delinquency_rate',
    'customer_acquisition_cost',
  ]);
  const [useMovingAvg, setUseMovingAvg] = useState<boolean>(false);
  const [trendData, setTrendData] = useState<KpiTrendData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load KPI Definitions
  useEffect(() => {
    fetchKpis().then((res) => {
      setKpiList(res);
    });
  }, []);

  // Load Trends
  useEffect(() => {
    if (selectedKpis.length === 0) return;
    setLoading(true);
    fetchKpiTrends(selectedKpis, businessUnit)
      .then((data) => {
        setTrendData(data);
      })
      .finally(() => setLoading(false));
  }, [selectedKpis, businessUnit]);

  const filteredKpis = kpiList.filter((k) =>
    activeCategory === 'all' ? true : k.category === activeCategory
  );

  const toggleSelectKpi = (code: string) => {
    if (selectedKpis.includes(code)) {
      if (selectedKpis.length > 1) {
        setSelectedKpis(selectedKpis.filter((c) => c !== code));
      }
    } else {
      if (selectedKpis.length < 4) {
        setSelectedKpis([...selectedKpis, code]);
      }
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Title & Category Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Activity className="w-5 h-5 text-teal-400" />
            <span>KPI Intelligence Explorer</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Analyze operational drivers, variance against supervisory targets, and multi-metric historical co-movements.
          </p>
        </div>

        {/* Category switcher */}
        <div className="flex items-center space-x-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          {(['operational', 'financial', 'all'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Trend Chart Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-slate-900/60 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-white">Historical Multi-Metric Co-Movement</h3>
            <p className="text-xs text-slate-400">
              Select up to 4 metrics below to compare time trajectories ({trendData?.total_periods || 36} months)
            </p>
          </div>

          {/* Moving Average Toggle */}
          <div className="flex items-center space-x-2 bg-slate-800/70 border border-slate-700/60 rounded-lg px-3 py-1.5">
            <span className="text-xs text-slate-300 font-medium">3-Month Moving Average:</span>
            <button
              onClick={() => setUseMovingAvg(!useMovingAvg)}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                useMovingAvg ? 'bg-teal-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  useMovingAvg ? 'transform translate-x-4' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Selected KPI Selector Chips */}
        <div className="flex flex-wrap gap-2 pt-2">
          {kpiList.map((k) => {
            const isSelected = selectedKpis.includes(k.code);
            return (
              <button
                key={k.code}
                onClick={() => toggleSelectKpi(k.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500/60 text-blue-300'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span>{k.name}</span>
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
              </button>
            );
          })}
        </div>

        {/* Recharts Line Display */}
        <div className="h-80 w-full pt-4">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 animate-pulse">
              Calculating statistical trend series...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData?.points || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                {selectedKpis.map((kpiCode, idx) => {
                  const meta = kpiList.find((k) => k.code === kpiCode);
                  const dataKey = useMovingAvg ? `${kpiCode}_ma3` : kpiCode;
                  return (
                    <Line
                      key={kpiCode}
                      type="monotone"
                      dataKey={dataKey}
                      name={`${meta?.name || kpiCode}${useMovingAvg ? ' (MA3)' : ''}`}
                      stroke={COLORS[idx % COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* KPI Catalog Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
          <Layers className="w-4 h-4 text-slate-400" />
          <span>Metric Definitions & Operating Parameters</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredKpis.map((k) => (
            <div
              key={k.code}
              className="glass-panel p-5 rounded-xl border border-slate-800/80 bg-slate-900/60 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">{k.name}</h4>
                  <span className="text-[11px] font-mono text-slate-400">Code: {k.code}</span>
                </div>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {k.category}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed min-h-[3rem]">
                {k.description}
              </p>

              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1 text-slate-300">
                  <span className="text-slate-400">Target:</span>
                  <span className="font-semibold text-teal-300 font-mono">
                    {k.target_value !== null ? `${k.target_value} ${k.unit}` : 'N/A'}
                  </span>
                </div>

                <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                  <span>Goal:</span>
                  <span className="font-semibold capitalize text-blue-400">
                    {k.direction_better}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
