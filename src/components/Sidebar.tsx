import React from 'react';
import {
  LayoutDashboard,
  Activity,
  GitCompare,
  AlertTriangle,
  Bot,
  Sliders,
  Database,
  FileSpreadsheet,
  Building2,
  ShieldAlert
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  highRiskCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, highRiskCount = 0 }) => {
  const navItems = [
    { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard },
    { id: 'kpis', label: 'KPI Intelligence', icon: Activity },
    { id: 'drivers', label: 'Driver Analysis', icon: GitCompare },
    { id: 'risks', label: 'Risk Monitor', icon: AlertTriangle, badge: highRiskCount > 0 ? highRiskCount : undefined },
    { id: 'assistant', label: 'AI Executive Assistant', icon: Bot, isAi: true },
    { id: 'scenarios', label: 'Scenario Planner', icon: Sliders },
    { id: 'data', label: 'Data Management', icon: Database },
    { id: 'reports', label: 'Executive Reports', icon: FileSpreadsheet },
  ];

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-30 backdrop-blur-md">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-700 via-blue-600 to-teal-500 flex items-center justify-center shadow-lg shadow-blue-900/40">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-lg tracking-tight text-white">FinSight</span>
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">AI</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">HDFC Bank Decision Intel</p>
          </div>
        </div>

        {/* Prototype notice pill */}
        <div className="mt-3 py-1 px-2 rounded bg-amber-500/10 border border-amber-500/20 flex items-center space-x-1.5 text-[10px] text-amber-300">
          <ShieldAlert className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">Simulated Scenario Prototype</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Decision Platforms
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-700/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.isAi ? 'text-teal-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              
              {item.badge !== undefined && (
                <span className="px-1.5 py-0.5 text-xs font-bold rounded-full bg-rose-500 text-white animate-pulse">
                  {item.badge}
                </span>
              )}
              {item.isAi && !item.badge && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 font-semibold">
                  LLM
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-300">Analytics Engine</span>
          </span>
          <span className="font-mono text-[10px] text-slate-400">v1.0-LIVE</span>
        </div>
      </div>
    </aside>
  );
};
