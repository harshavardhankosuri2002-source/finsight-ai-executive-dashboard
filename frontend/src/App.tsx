import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ExecutiveOverviewPage } from './pages/ExecutiveOverviewPage';
import { KpiIntelligencePage } from './pages/KpiIntelligencePage';
import { DriverAnalysisPage } from './pages/DriverAnalysisPage';
import { RiskMonitorPage } from './pages/RiskMonitorPage';
import { AiExecutiveAssistantPage } from './pages/AiExecutiveAssistantPage';
import { ScenarioPlannerPage } from './pages/ScenarioPlannerPage';
import { DataManagementPage } from './pages/DataManagementPage';
import { ReportsPage } from './pages/ReportsPage';
import { fetchRiskAlerts } from './services/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [businessUnit, setBusinessUnit] = useState<string>('Consolidated');
  const [asOfPeriod, setAsOfPeriod] = useState<string>('2026-09');
  const [highRiskCount, setHighRiskCount] = useState<number>(0);

  // Fetch risk alert count periodically or when business unit changes
  useEffect(() => {
    fetchRiskAlerts(businessUnit)
      .then((res) => {
        setHighRiskCount(res.high_count);
        setAsOfPeriod(res.as_of_period);
      })
      .catch(() => {
        // Silently handle on initial render
      });
  }, [businessUnit]);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        highRiskCount={highRiskCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        {/* Top Header */}
        <Header
          businessUnit={businessUnit}
          setBusinessUnit={setBusinessUnit}
          asOfPeriod={asOfPeriod}
          onOpenAssistant={() => setActiveTab('assistant')}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
          {activeTab === 'overview' && (
            <ExecutiveOverviewPage
              businessUnit={businessUnit}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'kpis' && (
            <KpiIntelligencePage businessUnit={businessUnit} />
          )}

          {activeTab === 'drivers' && (
            <DriverAnalysisPage businessUnit={businessUnit} />
          )}

          {activeTab === 'risks' && (
            <RiskMonitorPage businessUnit={businessUnit} />
          )}

          {activeTab === 'assistant' && (
            <AiExecutiveAssistantPage businessUnit={businessUnit} />
          )}

          {activeTab === 'scenarios' && (
            <ScenarioPlannerPage businessUnit={businessUnit} />
          )}

          {activeTab === 'data' && (
            <DataManagementPage />
          )}

          {activeTab === 'reports' && (
            <ReportsPage businessUnit={businessUnit} />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
