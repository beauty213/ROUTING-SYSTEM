import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  Sparkles,
  Clock,
  Milestone,
  Route,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Scale,
  BrainCircuit,
  X,
  Gauge,
  Sliders,
} from 'lucide-react';
import RoadNetwork from '../components/RoadNetwork';
import MetricCard from '../components/MetricCard';
import HelpTooltip from '../components/HelpTooltip';
import { SCENARIO_TYPES, SCENARIO_PRESETS } from '../data/scenarios';
import { minutesToTimeString, formatDuration, timeStringToMinutes } from '../utils/timeUtils';

export default function SimulatorPage({
  nodes,
  edges,
  sourceId,
  destinationId,
  onSourceChange,
  onDestinationChange,
  departureTimeMinutes,
  onDepartureTimeChange,
  selectedScenario,
  onScenarioChange,
  customConfig,
  onCustomConfigChange,
  optimizationObjective,
  onObjectiveChange,
  optimalResult,
  shortestDistanceResult,
  staticSnapshotResult,
  onRunSimulation,
  onReset,
  onNavigatePage,
}) {
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  const {
    path = [],
    totalTravelTimeMinutes = 0,
    totalDistanceKm = 0,
    arrivalTimeMinutes = departureTimeMinutes,
    edgeDetails = [],
    congestedSegmentsCount = 0,
  } = optimalResult || {};

  const hopCount = Math.max(0, path.length - 1);

  // Live Working Example Quick Actions
  const handleRunFreeFlow = () => {
    onSourceChange('A');
    onDestinationChange('I');
    onDepartureTimeChange(120); // 02:00
    onScenarioChange(SCENARIO_TYPES.FREE_FLOW);
    onObjectiveChange('fastest_time');
    onRunSimulation();
  };

  const handleRunRushHour = () => {
    onSourceChange('A');
    onDestinationChange('I');
    onDepartureTimeChange(1050); // 17:30
    onScenarioChange(SCENARIO_TYPES.RUSH_HOUR);
    onObjectiveChange('fastest_time');
    onRunSimulation();
  };

  return (
    <div className="flex flex-col gap-5 max-w-[1550px] mx-auto w-full">
      {/* 1. Live Working Example: Rush Hour vs Free Flow Action Bar */}
      <div className="panel-card bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900 border-red-500/30 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white">
                Live Working Example: Rush Hour vs Free Flow
              </span>
              <span className="badge badge-warning text-[10px]">Ready to Run</span>
            </div>
            <p className="text-xs text-slate-300">
              One-click demonstration comparing unconstrained night flow against peak 17:30 rush-hour bottlenecks.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRunFreeFlow}
            className="text-xs font-semibold px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition flex items-center gap-1.5"
          >
            <span>Run Free Flow (02:00)</span>
          </button>

          <button
            onClick={handleRunRushHour}
            className="text-xs font-semibold px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-sm transition flex items-center gap-1.5"
          >
            <span>Run Rush Hour (17:30)</span>
          </button>

          <button
            onClick={() => setShowComparisonModal(true)}
            className="text-xs font-semibold px-3 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 rounded-lg transition flex items-center gap-1.5"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Compare Both</span>
          </button>

          <button
            onClick={onReset}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Main Simulator Grid: Controls on Left, Road Network on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Route Configuration Panel */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="panel-card bg-[#0d1322] border-[#1f293d] p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-red-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                  Route Controls
                </h3>
              </div>
              <HelpTooltip termKey="dijkstra" />
            </div>

            {/* Source & Destination */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Ambulance Depot (Source)
                </label>
                <select
                  value={sourceId}
                  onChange={(e) => onSourceChange(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-lg px-2.5 py-2 w-full outline-none focus:border-red-500"
                >
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.id} — {n.name.split(' ')[0]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Hospital (Destination)
                </label>
                <select
                  value={destinationId}
                  onChange={(e) => onDestinationChange(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-lg px-2.5 py-2 w-full outline-none focus:border-emerald-500"
                >
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.id} — {n.name.split(' ')[0]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Departure Time */}
            <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1">
                  Departure Time
                  <HelpTooltip termKey="time_dependent" />
                </span>
                <span className="font-mono font-bold text-cyan-300 text-sm">
                  {minutesToTimeString(departureTimeMinutes)}
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="1439"
                step="15"
                value={departureTimeMinutes}
                onChange={(e) => onDepartureTimeChange(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {[
                  { label: '02:00 (Night Flow)', min: 120 },
                  { label: '08:00 (Morning Traffic)', min: 480 },
                  { label: '17:30 (Peak Rush Hour)', min: 1050 },
                  { label: '18:45 (Clearing Traffic)', min: 1125 },
                ].map((p) => (
                  <button
                    key={p.min}
                    type="button"
                    onClick={() => onDepartureTimeChange(p.min)}
                    className={`text-[10px] px-2 py-1 rounded text-left transition ${
                      departureTimeMinutes === p.min
                        ? 'bg-cyan-950 border border-cyan-500 text-cyan-200 font-bold'
                        : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Traffic Scenario */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                Traffic Scenario
                <HelpTooltip termKey="congestion_multiplier" />
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SCENARIO_PRESETS.map((sc) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => onScenarioChange(sc.id)}
                    className={`text-xs p-2 rounded-lg text-left border transition ${
                      selectedScenario === sc.id
                        ? 'bg-amber-950/40 border-amber-500 text-amber-200 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="block text-white text-[11px] font-bold">
                      {sc.name.split('(')[0]}
                    </span>
                    <span className="text-[9.5px] text-slate-400 line-clamp-1 mt-0.5">
                      {sc.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Optimization Objective */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                Optimization Objective
                <HelpTooltip termKey="weight" />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onObjectiveChange('fastest_time')}
                  className={`text-xs p-2 rounded-lg font-semibold border text-center transition ${
                    optimizationObjective === 'fastest_time'
                      ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  Fastest Time (Time-Dependent)
                </button>
                <button
                  type="button"
                  onClick={() => onObjectiveChange('shortest_distance')}
                  className={`text-xs p-2 rounded-lg font-semibold border text-center transition ${
                    optimizationObjective === 'shortest_distance'
                      ? 'bg-purple-950/50 border-purple-500 text-purple-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  Shortest Distance (Physical Km)
                </button>
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={onRunSimulation}
              className="btn-primary text-xs sm:text-sm py-3 mt-1 font-bold w-full"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Run Simulation & Find Route</span>
            </button>
          </div>
        </div>

        {/* Right Column: Road Network Map */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <RoadNetwork
            nodes={nodes}
            edges={edges}
            sourceId={sourceId}
            destinationId={destinationId}
            onSelectSource={onSourceChange}
            onSelectDestination={onDestinationChange}
            optimalResult={optimalResult}
            departureTimeMinutes={departureTimeMinutes}
          />
        </div>
      </div>

      {/* 3. The 4 Primary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          title="Estimated Journey Time"
          value={formatDuration(totalTravelTimeMinutes)}
          subvalue={`${totalTravelTimeMinutes.toFixed(2)} minutes total`}
          icon={Clock}
          accentColor="cyan"
          tooltip={<HelpTooltip termKey="time_dependent" />}
        />

        <MetricCard
          title="Route Distance"
          value={`${totalDistanceKm.toFixed(1)} km`}
          subvalue="Total road length"
          icon={Milestone}
          accentColor="indigo"
          tooltip={<HelpTooltip termKey="edge" />}
        />

        <MetricCard
          title="Estimated Arrival"
          value={minutesToTimeString(arrivalTimeMinutes, true)}
          subvalue={`Departure at ${minutesToTimeString(departureTimeMinutes)}`}
          icon={CheckCircle2}
          accentColor="emerald"
        />

        <MetricCard
          title="Road Segments"
          value={`${hopCount} Segments`}
          subvalue={`${congestedSegmentsCount} congested road(s)`}
          icon={Route}
          accentColor={congestedSegmentsCount > 0 ? 'amber' : 'emerald'}
          tooltip={<HelpTooltip termKey="congestion_multiplier" />}
        />
      </div>

      {/* 4. Step-by-Step Route Explanation & Decision Analysis */}
      <div className="panel-card bg-[#0d1322] border-[#1f293d] p-5 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
            <span>Route Decision & Explanation</span>
            <span className="badge badge-optimal text-[10px]">Computed Path</span>
          </h3>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigatePage('comparison')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              <span>Compare Strategies</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigatePage('algorithm')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 ml-2"
            >
              <span>Inspect Algorithm</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Path Traversal Pills */}
        <div className="flex items-center gap-2 flex-wrap py-1">
          {path.map((node, i) => (
            <React.Fragment key={i}>
              <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono font-bold text-xs">
                {node}
              </span>
              {i < path.length - 1 && <span className="text-emerald-400 font-bold text-xs">→</span>}
            </React.Fragment>
          ))}
        </div>

        {/* Decision Rationale */}
        <p className="text-xs text-slate-300 leading-relaxed">
          {selectedScenario === SCENARIO_TYPES.RUSH_HOUR && sourceId === 'A' && destinationId === 'I' ? (
            <>
              <strong>Why this route was chosen: </strong>
              During the 17:00–19:00 rush hour, the direct central roads (<strong>B–E and E–F</strong>)
              are bottlenecked with a 2.5x traffic multiplier. Taking the direct route would require{' '}
              <strong>16.80 minutes</strong>. By routing through the southern expressway corridor (
              <strong>A → D → G → H → I</strong>), the ambulance travels 11.0 km at 60 km/h in only{' '}
              <strong>11.00 minutes</strong>, saving <strong>5 minutes 48 seconds (34.5% faster)</strong>!
            </>
          ) : (
            <>
              <strong>Why this route was chosen: </strong>
              The algorithm evaluated candidate arrival times at each intersection. In the current
              scenario, path <strong>{path.join(' → ')}</strong> guarantees the earliest arrival time at
              hospital intersection <strong>{destinationId}</strong>.
            </>
          )}
        </p>
      </div>

      {/* 5. "Compare Both" Side-by-Side Modal */}
      {showComparisonModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-2xl bg-slate-900 border border-slate-700 p-6 rounded-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-white text-base">
                  Side-by-Side Comparison: Rush Hour vs Free Flow
                </h3>
              </div>
              <button
                onClick={() => setShowComparisonModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Free Flow Column */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                <span className="badge badge-info text-[10px] self-start">Free Flow (02:00)</span>
                <div className="font-mono font-bold text-white text-sm">A → B → E → F → I</div>
                <div className="text-xs text-slate-400">Physical Distance: <strong className="text-white">7.6 km</strong></div>
                <div className="text-xs text-slate-400">Travel Time: <strong className="text-emerald-400">9.60 min (9m 36s)</strong></div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Under light traffic, the shortest-distance route through the city center is also the fastest.
                </p>
              </div>

              {/* Rush Hour Column */}
              <div className="bg-slate-950 p-4 rounded-xl border border-red-500/30 flex flex-col gap-2">
                <span className="badge badge-emergency text-[10px] self-start">Rush Hour (17:30)</span>
                <div className="font-mono font-bold text-white text-sm">A → D → G → H → I</div>
                <div className="text-xs text-slate-400">Physical Distance: <strong className="text-white">11.0 km</strong></div>
                <div className="text-xs text-slate-400">Travel Time: <strong className="text-cyan-400">11.00 min (11m 00s)</strong></div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Center is bottlenecked (would take 16.80 min). Rerouting via the longer expressway saves 5m 48s.
                </p>
              </div>
            </div>

            {/* Plain-Language Takeaway */}
            <div className="p-3.5 bg-amber-950/20 border border-amber-500/30 rounded-xl text-xs text-amber-200 leading-relaxed">
              <strong>Core Academic Finding: </strong>
              The shortest route is not necessarily the fastest. During heavy traffic, avoiding a
              congested road can reduce the estimated journey time, even if the alternative route is
              longer in physical distance.
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowComparisonModal(false)}
                className="btn-primary text-xs px-5 py-2"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
