import React from 'react';
import { Calendar, Filter, Sparkles, RefreshCw } from 'lucide-react';

interface HeaderProps {
  businessUnit: string;
  setBusinessUnit: (unit: string) => void;
  asOfPeriod: string;
  onRefresh?: () => void;
  onOpenAssistant?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  businessUnit,
  setBusinessUnit,
  asOfPeriod,
  onRefresh,
  onOpenAssistant,
}) => {
  const businessUnits = [
    'Consolidated',
    'Retail Banking',
    'Wholesale Banking',
    'Wealth Management',
    'Treasury & Digital',
  ];

  return (
    <header className="h-16 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-20 backdrop-blur-md">
      {/* Title & Scope */}
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-base font-semibold text-white tracking-tight flex items-center space-x-2">
            <span>Executive Decision Intelligence</span>
            <span className="text-slate-500 font-normal">/</span>
            <span className="text-blue-400 font-medium">{businessUnit}</span>
          </h1>
        </div>
      </div>

      {/* Controls & Filter */}
      <div className="flex items-center space-x-3">
        {/* Business Unit Selector */}
        <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 shadow-sm">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={businessUnit}
            onChange={(e) => setBusinessUnit(e.target.value)}
            className="bg-transparent text-xs font-medium text-slate-200 outline-none cursor-pointer pr-1"
          >
            {businessUnits.map((u) => (
              <option key={u} value={u} className="bg-slate-900 text-slate-200">
                {u}
              </option>
            ))}
          </select>
        </div>

        {/* Current Period Badge */}
        <div className="flex items-center space-x-2 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-1.5 text-xs text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-mono text-[11px] font-medium">{asOfPeriod || '2026-09'}</span>
        </div>

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Refresh active view"
            className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Quick Assistant Launch Button */}
        {onOpenAssistant && (
          <button
            onClick={onOpenAssistant}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-teal-900/30 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-200" />
            <span>Ask FinSight AI</span>
          </button>
        )}
      </div>
    </header>
  );
};
