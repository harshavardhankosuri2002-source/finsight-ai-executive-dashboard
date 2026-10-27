import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { fetchExecutiveReport } from '../services/api';
import { ExecutiveReport } from '../types';

interface ReportsProps {
  businessUnit: string;
}

export const ReportsPage: React.FC<ReportsProps> = ({ businessUnit }) => {
  const [report, setReport] = useState<ExecutiveReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchExecutiveReport(businessUnit)
      .then((res) => {
        if (isMounted) {
          setReport(res);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to generate executive report.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [businessUnit]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-400" />
            <span>Executive Decision Intelligence Briefing</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Formal board-level performance briefing summarizing core financials, transmission bottlenecks, and strategic actions.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-700/30 transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Export PDF</span>
        </button>
      </div>

      {loading ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3 animate-pulse">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Synthesizing executive report from verified ledger records...</p>
        </div>
      ) : error || !report ? (
        <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
          {error}
        </div>
      ) : (
        /* Printable Report Document */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-12 space-y-8 shadow-2xl print:border-none print:shadow-none print:p-0 print:bg-white print:text-black">
          {/* Document Header */}
          <div className="border-b border-slate-800 pb-6 print:border-slate-300">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-teal-400 uppercase tracking-widest print:text-blue-800">
                  FinSight AI • Executive Board Memorandum
                </span>
                <h1 className="text-2xl font-extrabold text-white mt-1 print:text-slate-900">
                  Monthly Performance & Risk Intelligence Briefing
                </h1>
                <p className="text-xs text-slate-400 mt-1 print:text-slate-600">
                  Business Scope: <strong className="text-slate-200 print:text-black">{report.business_unit}</strong> • Reporting Cycle: <strong className="text-slate-200 print:text-black">{report.period}</strong>
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Generated</span>
                <span className="text-xs font-mono text-slate-300 print:text-slate-600">{report.generated_at}</span>
              </div>
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider print:text-slate-700">
              1. Executive Summary & Macro Position
            </h3>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 print:bg-slate-50 print:border-slate-200">
              <p className="text-xs text-slate-200 leading-relaxed print:text-slate-800 font-normal">
                {report.executive_summary}
              </p>
            </div>
          </div>

          {/* Section 2: Financial Core Highlights */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5 print:text-slate-700">
              <TrendingUp className="w-3.5 h-3.5 text-teal-400 print:text-blue-600" />
              <span>2. Core Financial Ledger Highlights</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {report.financial_highlights.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs text-slate-300 flex items-start space-x-2 print:bg-slate-50 print:border-slate-200 print:text-slate-800"
                >
                  <span className="text-teal-400 font-bold">•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Operational Vulnerabilities */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5 print:text-slate-700">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 print:text-rose-600" />
              <span>3. Operational Bottlenecks & Transmission Risks</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {report.operational_vulnerabilities.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs text-slate-300 flex items-start space-x-2 print:bg-slate-50 print:border-slate-200 print:text-slate-800"
                >
                  <span className="text-rose-400 font-bold">!</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Actionable Recommendations */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5 print:text-slate-700">
              <CheckCircle className="w-3.5 h-3.5 text-blue-400 print:text-blue-600" />
              <span>4. Prioritized Executive Action Plan</span>
            </h3>
            <div className="space-y-3">
              {report.actionable_recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 print:bg-slate-50 print:border-slate-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs print:text-black">{rec.action}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 print:bg-blue-100 print:text-blue-800">
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed print:text-slate-700">
                    {rec.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Governance Notice */}
          <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-500 print:border-slate-300 print:text-slate-500 leading-relaxed">
            {report.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
};
