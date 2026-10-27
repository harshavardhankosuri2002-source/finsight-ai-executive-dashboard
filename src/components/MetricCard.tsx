import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, Target } from 'lucide-react';
import { MetricSummary } from '../types';

interface MetricCardProps {
  metric?: MetricSummary;
  titleOverride?: string;
  icon?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({ metric, titleOverride, icon }) => {
  if (!metric) {
    return (
      <div className="glass-panel p-5 rounded-xl border border-slate-800 animate-pulse h-36">
        <div className="h-4 bg-slate-800 rounded w-1/2 mb-4" />
        <div className="h-8 bg-slate-800 rounded w-3/4 mb-2" />
        <div className="h-4 bg-slate-800 rounded w-1/3" />
      </div>
    );
  }

  const {
    name,
    unit,
    current_value,
    mom_change_pct,
    target_value,
    is_favorable,
  } = metric;

  const displayTitle = titleOverride || name;

  // Format value based on unit
  const formatValue = (val: number, u: string) => {
    if (u === '₹ Cr') {
      return `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr`;
    }
    if (u === '₹') {
      return `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    }
    if (u === '%') {
      return `${val.toFixed(2)}%`;
    }
    if (u === 'Days') {
      return `${val.toFixed(1)} Days`;
    }
    return `${val.toLocaleString()} ${u}`;
  };

  const isPositiveChange = mom_change_pct > 0;
  const isZeroChange = Math.abs(mom_change_pct) < 0.05;

  return (
    <div className="glass-panel glass-panel-hover p-5 rounded-xl border border-slate-800/80 bg-slate-900/60 relative overflow-hidden group">
      {/* Top row: Label & Icon */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
          {displayTitle}
        </span>
        {icon && <div className="text-slate-400 group-hover:text-teal-400 transition-colors">{icon}</div>}
      </div>

      {/* Primary Value */}
      <div className="flex items-baseline space-x-2 mb-3">
        <span className="text-2xl font-bold tracking-tight text-white font-mono">
          {formatValue(current_value, unit)}
        </span>
      </div>

      {/* Footer: MoM & Target Variance */}
      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
        {/* Period over period change badge */}
        <div
          className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-[11px] font-medium ${
            isZeroChange
              ? 'bg-slate-800 text-slate-400'
              : is_favorable
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}
        >
          {isZeroChange ? (
            <Minus className="w-3 h-3" />
          ) : isPositiveChange ? (
            <ArrowUpRight className="w-3 h-3" />
          ) : (
            <ArrowDownRight className="w-3 h-3" />
          )}
          <span>{mom_change_pct > 0 ? `+${mom_change_pct.toFixed(1)}%` : `${mom_change_pct.toFixed(1)}%`} MoM</span>
        </div>

        {/* Target Indicator */}
        {target_value !== null && target_value !== undefined && (
          <div className="flex items-center space-x-1 text-[11px] text-slate-400" title={`Benchmark Target: ${target_value} ${unit}`}>
            <Target className="w-3 h-3 text-slate-400" />
            <span>Tgt: {target_value}</span>
          </div>
        )}
      </div>
    </div>
  );
};
