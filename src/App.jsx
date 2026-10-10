import React, { useState, useMemo, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Pages / Modules
import DashboardPage from './pages/DashboardPage';
import RealTimeMapPage from './pages/RealTimeMapPage';
import SimulatorPage from './pages/SimulatorPage';
import TrafficPage from './pages/TrafficPage';
import ComparisonPage from './pages/ComparisonPage';
import AlgorithmPage from './pages/AlgorithmPage';

import { RoutingService } from './services/routingService';
import { SCENARIO_TYPES, SCENARIO_PRESETS } from './data/scenarios';
import './App.css';

export default function App() {
  // Navigation: 'dashboard' | 'realtime_map' | 'simulator' | 'traffic' | 'comparison' | 'algorithm' | 'analytics' | 'casestudy'
  const [activePage, setActivePage] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Core Simulation State
  const nodes = RoutingService.getNodes();
  const [sourceId, setSourceId] = useState('A');
  const [destinationId, setDestinationId] = useState('I');
  const [departureTimeMinutes, setDepartureTimeMinutes] = useState(1050); // 17:30 Rush Hour

  // Scenario & Objective
  const [selectedScenario, setSelectedScenario] = useState(SCENARIO_TYPES.RUSH_HOUR);
  const [customConfig, setCustomConfig] = useState({
    multiplier: 2.5,
    startMinutes: 1020, // 17:00
    endMinutes: 1140,   // 19:00
    targetEdges: ['B-E', 'E-F'],
  });
  const [optimizationObjective, setOptimizationObjective] = useState('fastest_time');

  // Configured Edges from single source of truth
  const configuredEdges = useMemo(() => {
    return RoutingService.getEdges(selectedScenario, customConfig);
  }, [selectedScenario, customConfig]);

  // Compute all algorithms deterministically
  const results = useMemo(() => {
    if (sourceId === destinationId) {
      const trivial = RoutingService.computeTimeDependentRoute(
        configuredEdges,
        sourceId,
        destinationId,
        departureTimeMinutes
      );
      return {
        timeDep: trivial,
        shortestDist: trivial,
        staticSnap: trivial,
      };
    }

    const timeDep = RoutingService.computeTimeDependentRoute(
      configuredEdges,
      sourceId,
      destinationId,
      departureTimeMinutes
    );
    const shortestDist = RoutingService.computeShortestDistanceRoute(
      configuredEdges,
      sourceId,
      destinationId,
      departureTimeMinutes
    );
    const staticSnap = RoutingService.computeStaticSnapshotRoute(
      configuredEdges,
      sourceId,
      destinationId,
      departureTimeMinutes
    );

    return { timeDep, shortestDist, staticSnap };
  }, [configuredEdges, sourceId, destinationId, departureTimeMinutes]);

  const { timeDep, shortestDist, staticSnap } = results;
  const activeResult = optimizationObjective === 'fastest_time' ? timeDep : shortestDist;

  // Reset to initial conditions
  const handleReset = useCallback(() => {
    setSourceId('A');
    setDestinationId('I');
    setDepartureTimeMinutes(1050); // 17:30
    setSelectedScenario(SCENARIO_TYPES.RUSH_HOUR);
    setOptimizationObjective('fastest_time');
  }, []);

  const scenarioMeta = SCENARIO_PRESETS.find((s) => s.id === selectedScenario);

  return (
    <div className="flex min-h-screen bg-[#080c14] text-slate-100 font-sans selection:bg-red-500 selection:text-white">
      {/* 1. Persistent Sidebar (Desktop) & Collapsible Drawer (Mobile) */}
      <Sidebar
        activePage={activePage}
        onSelectPage={setActivePage}
        isOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Main Application Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <Header
          activePage={activePage}
          departureMinutes={departureTimeMinutes}
          scenarioName={scenarioMeta ? scenarioMeta.name.split('(')[0] : 'Custom'}
          onReset={handleReset}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* Page Views Container */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {activePage === 'dashboard' && (
            <DashboardPage
              nodes={nodes}
              edges={configuredEdges}
              sourceId={sourceId}
              destinationId={destinationId}
              optimalResult={activeResult}
              departureTimeMinutes={departureTimeMinutes}
              scenarioName={scenarioMeta ? scenarioMeta.name.split('(')[0] : 'Custom'}
              onNavigatePage={setActivePage}
            />
          )}

          {activePage === 'realtime_map' && (
            <RealTimeMapPage
              nodes={nodes}
              edges={configuredEdges}
              sourceId={sourceId}
              destinationId={destinationId}
              onSourceChange={setSourceId}
              onDestinationChange={setDestinationId}
              departureTimeMinutes={departureTimeMinutes}
              onDepartureTimeChange={setDepartureTimeMinutes}
              selectedScenario={selectedScenario}
              onScenarioChange={setSelectedScenario}
            />
          )}

          {activePage === 'simulator' && (
            <SimulatorPage
              nodes={nodes}
              edges={configuredEdges}
              sourceId={sourceId}
              destinationId={destinationId}
              onSourceChange={setSourceId}
              onDestinationChange={setDestinationId}
              departureTimeMinutes={departureTimeMinutes}
              onDepartureTimeChange={setDepartureTimeMinutes}
              selectedScenario={selectedScenario}
              onScenarioChange={setSelectedScenario}
              customConfig={customConfig}
              onCustomConfigChange={setCustomConfig}
              optimizationObjective={optimizationObjective}
              onObjectiveChange={setOptimizationObjective}
              optimalResult={activeResult}
              shortestDistanceResult={shortestDist}
              staticSnapshotResult={staticSnap}
              onRunSimulation={() => {}}
              onReset={handleReset}
              onNavigatePage={setActivePage}
            />
          )}

          {activePage === 'traffic' && (
            <TrafficPage
              edges={configuredEdges}
              departureTimeMinutes={departureTimeMinutes}
            />
          )}

          {activePage === 'comparison' && (
            <ComparisonPage
              timeDependentResult={timeDep}
              shortestDistanceResult={shortestDist}
              staticSnapshotResult={staticSnap}
              departureTimeMinutes={departureTimeMinutes}
            />
          )}

          {activePage === 'algorithm' && (
            <AlgorithmPage
              nodes={nodes}
              edges={configuredEdges}
              sourceId={sourceId}
              destinationId={destinationId}
              departureTimeMinutes={departureTimeMinutes}
              optimalResult={activeResult}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="w-full bg-[#0d1322] border-t border-[#1f293d] py-3.5 px-6 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <span>
            Smart Emergency Vehicle Routing System • Time-Dependent Dijkstra Case Study
          </span>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="text-emerald-400">FIFO Monotonicity Enforced</span>
            <span>•</span>
            <span className="text-cyan-400">Binary Min-Heap O((V+E) log V)</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
