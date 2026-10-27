import React, { useState } from 'react';
import {
  Database,
  Upload,
  Download,
  RotateCcw,
  CheckCircle,
  FileSpreadsheet,
  ShieldAlert,
} from 'lucide-react';
import { uploadDatasetFile, resetToDemoBaseline } from '../services/api';
import { DataQualityReport } from '../types';

export const DataManagementPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [report, setReport] = useState<DataQualityReport | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [resetting, setResetting] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.endsWith('.csv') && !selected.name.endsWith('.xlsx')) {
        setStatusMessage('Error: Only .csv and .xlsx files are supported.');
        return;
      }
      if (selected.size > 15 * 1024 * 1024) {
        setStatusMessage('Error: File size exceeds maximum 15 MB limit.');
        return;
      }
      setFile(selected);
      setStatusMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setStatusMessage(null);
    try {
      const res = await uploadDatasetFile(file);
      setReport(res);
      setStatusMessage('File processed and synchronized with database successfully.');
      setFile(null);
    } catch (err: any) {
      setStatusMessage(`Upload failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleResetBaseline = async () => {
    if (!window.confirm('Reset database back to standard reproducible 36-month synthetic baseline?')) {
      return;
    }
    setResetting(true);
    try {
      const res = await resetToDemoBaseline();
      setStatusMessage(res.message);
      setReport(null);
    } catch (err: any) {
      setStatusMessage(`Reset failed: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  const handleDownloadTemplate = () => {
    window.open('/api/data/template', '_blank');
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Database className="w-5 h-5 text-blue-400" />
            <span>Data Management & Quality Diagnostics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ingest external monthly data, execute schema normalization, inspect data completeness, or reset baseline simulations.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700/60 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Download CSV Template</span>
          </button>

          <button
            onClick={handleResetBaseline}
            disabled={resetting}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
            <span>{resetting ? 'Resetting...' : 'Restore 36M Baseline'}</span>
          </button>
        </div>
      </div>

      {/* Synthetic Dataset Notice Banner */}
      <div className="rounded-xl bg-blue-950/40 border border-blue-500/30 p-4 flex items-start space-x-3 text-xs text-blue-200">
        <ShieldAlert className="w-5 h-5 flex-shrink-0 text-blue-400 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold uppercase tracking-wider text-[11px] text-blue-300">
            Prototype Data Integrity Notice
          </span>
          <p className="text-slate-300 leading-relaxed">
            The platform ships with a verified, reproducible 36-month synthetic dataset covering Retail Banking, Wholesale Banking,
            Wealth Management, Treasury & Digital, and Consolidated levels. All figures represent simulated prototype data and are not official HDFC Bank records.
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="glass-panel p-8 rounded-2xl border border-slate-800/80 bg-slate-900/60 space-y-6">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <Upload className="w-5 h-5 text-teal-400" />
          <span>Upload Monthly Operating & Financial Ledger (CSV / Excel)</span>
        </h3>

        <div className="border-2 border-dashed border-slate-700/80 hover:border-blue-500/60 rounded-xl p-8 text-center transition-colors bg-slate-950/40">
          <FileSpreadsheet className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-200">
            {file ? file.name : 'Select or drag & drop CSV or Excel spreadsheet here'}
          </p>
          <p className="text-xs text-slate-500 mt-1">Supports .csv, .xlsx up to 15 MB</p>

          <input
            type="file"
            id="file-upload-input"
            accept=".csv, .xlsx, .xls"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="mt-4 flex items-center justify-center space-x-3">
            <label
              htmlFor="file-upload-input"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors border border-slate-700"
            >
              Browse Files
            </label>

            {file && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-lg shadow-blue-700/30 disabled:opacity-50"
              >
                {uploading ? 'Validating & Uploading...' : 'Execute Ingestion'}
              </button>
            )}
          </div>
        </div>

        {statusMessage && (
          <div
            className={`p-4 rounded-xl text-xs font-medium ${
              statusMessage.startsWith('Error') || statusMessage.startsWith('Upload failed')
                ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
            }`}
          >
            {statusMessage}
          </div>
        )}
      </div>

      {/* Data Quality Report Card */}
      {report && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-slate-900/60 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span>Data Quality & Schema Validation Report</span>
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                report.column_mapping_success
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {report.column_mapping_success ? 'Schema Passed' : 'Schema Warnings'}
            </span>
          </div>

          {/* Metric Diagnostics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400">Total Rows</span>
              <div className="text-xl font-bold font-mono text-white mt-1">{report.total_rows}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400">Valid Rows Ingested</span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{report.valid_rows}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400">Missing Values Imputed</span>
              <div className="text-xl font-bold font-mono text-amber-400 mt-1">{report.missing_values_count}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400">Duplicates Deduplicated</span>
              <div className="text-xl font-bold font-mono text-blue-400 mt-1">{report.duplicate_rows_count}</div>
            </div>
          </div>

          {/* Validation Messages List */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Diagnostic Log:
            </span>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-slate-300 space-y-1">
              {report.validation_messages.map((msg, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <span className="text-teal-400">✓</span>
                  <span>{msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
