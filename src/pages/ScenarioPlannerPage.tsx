import React, { useState, useEffect } from 'react';
import {
  Sliders,
  RotateCcw,
  Info,
} from 'lucide-react';
import { runScenarioSimulation } from '../services/api';
import { ScenarioAssumptions, ScenarioResponse } from '../types';

interface ScenarioPlannerProps {
  businessUnit: string;
}

const PRESET_SCENARIOS = [
  {
    name: 'Cost Rationalization Sprint',
    assumptions: {
      opex_change_pct: -6.0,
      loan_growth_pct: 4.0,
      tat_change_pct: -10.0,
      cac_change_pct: -8.0,
      delinquency_change_pct: 0.0,
    },
  },
  {
    name: 'Aggressive Retail Loan Expansion',
    assumptions: {
      opex_change_pct: 3.5,
      loan_growth_pct: 12.0,
      tat_change_pct: -15.0,
      cac_change_pct: 5.0,
      delinquency_change_pct: 8.0,
    },
  },
  {
    name: 'Macro Delinquency Stress Test',
    assumptions: {
      opex_change_pct: 2.0,
      loan_growth_pct: -2.0,
      tat_change_pct: 5.0,
      cac_change_pct: 10.0,
      delinquency_change_pct: 25.0,
    },
  },
];

export const ScenarioPlannerPage: React.FC<ScenarioPlannerProps> = ({ businessUnit }) => {
  const [assumptions, setAssumptions] = useState<ScenarioAssumptions>({
    business_unit: businessUnit,
    name: 'Strategic Sensitivity Model',
    opex_change_pct: -5.0,
    loan_growth_pct: 8.0,
    tat_change_pct: -12.0,
    cac_change_pct: -8.0,
    delinquency_change_pct: 5.0,
  });

  const [scenarioData, setScenarioData] = useState<ScenarioResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sync businessUnit change
  useEffect(() => {
    setAssumptions((prev) => ({ ...prev, business_unit: businessUnit }));
  }, [businessUnit]);

  // Execute simulation when assumptions change
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    runScenarioSimulation(assumptions)
      .then((res) => {
        if (isMounted) {
          setScenarioData(res);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Simulation execution failed.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [assumptions]);

  const updateLever = (field: keyof ScenarioAssumptions, val: number) => {
    setAssumptions((prev) => ({ ...prev, [field]: val }));
  };

  const applyPreset = (preset: typeof PRESET_SCENARIOS[0]) => {
    setAssumptions({
      business_unit: businessUnit,
      name: preset.name,
      ...preset.assumptions,
    });
  };

  const resetDefaults = () => {
    setAssumptions({
      business_unit: businessUnit,
      name: 'Baseline Plan',
      opex_change_pct: 0.0,
      loan_growth_pct: 0.0,
      tat_change_pct: 0.0,
      cac_change_pct: 0.0,
      delinquency_change_pct: 0.0,
    });
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Title & Presets */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-teal-400" />
            <span>Executive What-If Scenario Planner</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Simulate the bottom-line financial impact of operational productivity, underwriting speed, and cost adjustments.
          </p>
        </div>

        {/* Preset scenario shortcuts */}
        <div className="flex items-center space-x-2">
          {PRESET_SCENARIOS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(p)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-medium text-slate-200 border border-slate-700/60 transition-colors cursor-pointer"
            >
              {p.name}
            </button>
          ))}
          <button
            onClick={resetDefaults}
            title="Reset to 0% variance baseline"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Left Sliders, Right Outcomes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Sliders (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-slate-800/80 bg-slate-900/60 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Strategic Assumption Levers
            </h3>
            <span className="text-[11px] font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
              Interactive
            </span>
          </div>

          {/* 1. Operating Expenses */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Operating Expenses (Opex)</span>
              <span className={`font-mono font-bold ${assumptions.opex_change_pct < 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                {assumptions.opex_change_pct > 0 ? `+${assumptions.opex_change_pct}%` : `${assumptions.opex_change_pct}%`}
              </span>
            </div>
            <input
              type="range"
              min="-15"
              max="15"
              step="0.5"
              value={assumptions.opex_change_pct}
              onChange={(e) => updateLever('opex_change_pct', parseFloat(e.target.value))}
              className="w-full accent-teal-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>-15% (Aggressive cut)</span>
              <span>0%</span>
              <span>+15% (Opex surge)</span>
            </div>
          </div>

          {/* 2. Loan Advances Growth */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Loan Advances Expansion</span>
              <span className={`font-mono font-bold ${assumptions.loan_growth_pct > 0 ? 'text-teal-400' : 'text-slate-400'}`}>
                {assumptions.loan_growth_pct > 0 ? `+${assumptions.loan_growth_pct}%` : `${assumptions.loan_growth_pct}%`}
              </span>
            </div>
            <input
              type="range"
              min="-10"
              max="20"
              step="0.5"
              value={assumptions.loan_growth_pct}
              onChange={(e) => updateLever('loan_growth_pct', parseFloat(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>-10%</span>
              <span>0%</span>
              <span>+20% (Aggressive push)</span>
            </div>
          </div>

          {/* 3. Loan Processing Turnaround Time (TAT) */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Loan Processing Speedup / Delay (TAT)</span>
              <span className={`font-mono font-bold ${assumptions.tat_change_pct < 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                {assumptions.tat_change_pct > 0 ? `+${assumptions.tat_change_pct}% (Delay)` : `${assumptions.tat_change_pct}% (Speedup)`}
              </span>
            </div>
            <input
              type="range"
              min="-30"
              max="30"
              step="1"
              value={assumptions.tat_change_pct}
              onChange={(e) => updateLever('tat_change_pct', parseFloat(e.target.value))}
              className="w-full accent-teal-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>-30% (Speedup)</span>
              <span>0%</span>
              <span>+30% (Bottleneck)</span>
            </div>
          </div>

          {/* 4. Customer Acquisition Cost (CAC) */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Customer Acquisition Cost (CAC)</span>
              <span className={`font-mono font-bold ${assumptions.cac_change_pct < 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                {assumptions.cac_change_pct > 0 ? `+${assumptions.cac_change_pct}%` : `${assumptions.cac_change_pct}%`}
              </span>
            </div>
            <input
              type="range"
              min="-25"
              max="25"
              step="1"
              value={assumptions.cac_change_pct}
              onChange={(e) => updateLever('cac_change_pct', parseFloat(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>-25% (Efficiency)</span>
              <span>0%</span>
              <span>+25% (Marketing inflation)</span>
            </div>
          </div>

          {/* 5. Early Delinquency (30+ DPD) */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Delinquency Arrears Movement</span>
              <span className={`font-mono font-bold ${assumptions.delinquency_change_pct < 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                {assumptions.delinquency_change_pct > 0 ? `+${assumptions.delinquency_change_pct}% (Stress)` : `${assumptions.delinquency_change_pct}% (Recovery)`}
              </span>
            </div>
            <input
              type="range"
              min="-30"
              max="50"
              step="1"
              value={assumptions.delinquency_change_pct}
              onChange={(e) => updateLever('delinquency_change_pct', parseFloat(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>-30%</span>
              <span>0%</span>
              <span>+50% (Credit stress)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Outcomes Table & Sensitivity Matrix (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Outcomes Comparison Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-slate-900/60 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Projected Executive Outcomes</h3>
                <p className="text-xs text-slate-400">Baseline ({scenarioData?.baseline_period}) vs Simulation Model</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                {assumptions.name}
              </span>
            </div>

            {loading ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400 animate-pulse">
                Simulating accounting mechanics & sensitivity impacts...
              </div>
            ) : error || !scenarioData ? (
              <div className="p-4 rounded-xl bg-rose-500/10 text-rose-300 text-xs">{error}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">Metric</th>
                      <th className="py-2.5 px-3 text-right">Baseline</th>
                      <th className="py-2.5 px-3 text-right">Projected</th>
                      <th className="py-2.5 px-3 text-right">Variance (Abs)</th>
                      <th className="py-2.5 px-3 text-right">Shift (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {[
                      'revenue',
                      'operating_expenses',
                      'operating_profit',
                      'credit_loss_provisions',
                      'net_profit',
                      'cost_to_income_ratio',
                      'net_interest_margin',
                    ].map((key) => {
                      const m = scenarioData.metrics[key];
                      if (!m) return null;
                      const isFavorable =
                        ['revenue', 'operating_profit', 'net_profit', 'net_interest_margin'].includes(key)
                          ? m.delta_abs >= 0
                          : m.delta_abs <= 0;

                      return (
                        <tr key={key} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-3 font-medium text-slate-100">{m.metric_name}</td>
                          <td className="py-3 px-3 text-right font-mono text-slate-400">
                            {m.baseline.toLocaleString()} {m.unit}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-white">
                            {m.projected.toLocaleString()} {m.unit}
                          </td>
                          <td
                            className={`py-3 px-3 text-right font-mono font-semibold ${
                              isFavorable ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {m.delta_abs > 0 ? `+${m.delta_abs.toLocaleString()}` : m.delta_abs.toLocaleString()}
                          </td>
                          <td
                            className={`py-3 px-3 text-right font-mono text-[11px] ${
                              isFavorable ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {m.delta_pct > 0 ? `+${m.delta_pct.toFixed(1)}%` : `${m.delta_pct.toFixed(1)}%`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 5x5 Sensitivity Matrix Heatmap */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-slate-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Net Profit (PAT) 2D Sensitivity Matrix</h4>
                <p className="text-[11px] text-slate-400">Loan Advances Expansion (Rows) vs Operating Expense Shift (Columns) in ₹ Crores</p>
              </div>
            </div>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-center text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                    <th className="py-2 px-2 text-left">Loan Growth \ Opex</th>
                    <th className="py-2 px-2 text-teal-400">-10% Opex</th>
                    <th className="py-2 px-2 text-teal-300">-5% Opex</th>
                    <th className="py-2 px-2 text-slate-300">0% Opex</th>
                    <th className="py-2 px-2 text-rose-300">+5% Opex</th>
                    <th className="py-2 px-2 text-rose-400">+10% Opex</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {scenarioData?.sensitivity_table.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-2 text-left font-sans font-semibold text-slate-300">
                        {Number(row.loan_growth_pct) > 0 ? `+${row.loan_growth_pct}%` : `${row.loan_growth_pct}%`}
                      </td>
                      <td className="py-2.5 px-2 font-bold text-emerald-400 bg-emerald-950/20">
                        ₹{Number(row['opex_-10%']).toLocaleString()} Cr
                      </td>
                      <td className="py-2.5 px-2 text-emerald-300 bg-emerald-950/10">
                        ₹{Number(row['opex_-5%']).toLocaleString()} Cr
                      </td>
                      <td className="py-2.5 px-2 text-slate-200">
                        ₹{Number(row['opex_+0%']).toLocaleString()} Cr
                      </td>
                      <td className="py-2.5 px-2 text-rose-300 bg-rose-950/10">
                        ₹{Number(row['opex_+5%']).toLocaleString()} Cr
                      </td>
                      <td className="py-2.5 px-2 font-bold text-rose-400 bg-rose-950/20">
                        ₹{Number(row['opex_+10%']).toLocaleString()} Cr
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Methodology & Limitations Callout */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-2 text-xs">
        <span className="font-semibold text-slate-300 flex items-center space-x-2">
          <Info className="w-4 h-4 text-blue-400" />
          <span>Accounting Model Foundations & Limitations</span>
        </span>
        <p className="text-slate-400 leading-relaxed text-[11px]">
          {scenarioData?.limitations}
        </p>
      </div>
    </div>
  );
};
