import React from 'react';
import { Sliders, Play, Clock, Zap, MapPin, Gauge, AlertCircle, Compass } from 'lucide-react';
import { SCENARIO_TYPES, SCENARIO_PRESETS } from '../data/scenarios';
import { minutesToTimeString, timeStringToMinutes } from '../utils/timeUtils';

export default function RouteConfigPanel({
  nodes,
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
  onRunSimulation,
  isSimulating,
  errorMessage,
}) {
  const PRESET_TIMES = [
    { label: '02:00 (Night Free-Flow)', time: '02:00', min: 120 },
    { label: '08:00 (Morning Traffic)', time: '08:00', min: 480 },
    { label: '17:30 (Peak Rush Hour)', time: '17:30', min: 1050 },
    { label: '18:45 (Congestion Clearing)', time: '18:45', min: 1125 },
  ];

  return (
    <div className="panel-card flex flex-col gap-4 bg-[#0d1322] border-[#1f293d]">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-red-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Route Configuration
          </h2>
        </div>
        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
          O((V+E) log V)
        </span>
      </div>

      {/* Origin & Destination Selectors */}
      <div className="grid grid-cols-2 gap-3">
        {/* Source */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
            Ambulance Depot
          </label>
          <select
            value={sourceId}
            onChange={(e) => onSourceChange(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg px-2.5 py-2 focus:ring-1 focus:ring-red-500 outline-none"
          >
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                Intersection {n.id} ({n.name.split(' ')[0]})
              </option>
            ))}
          </select>
        </div>

        {/* Destination */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            Hospital Target
          </label>
          <select
            value={destinationId}
            onChange={(e) => onDestinationChange(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg px-2.5 py-2 focus:ring-1 focus:ring-emerald-500 outline-none"
          >
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                Intersection {n.id} ({n.name.split(' ')[0]})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Departure Time Controls */}
      <div className="flex flex-col gap-2 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            Simulated Departure Time
          </label>
          <span className="text-sm font-mono font-extrabold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
            {minutesToTimeString(departureTimeMinutes)}
          </span>
        </div>

        {/* Time Slider */}
        <input
          type="range"
          min="0"
          max="1439"
          step="15"
          value={departureTimeMinutes}
          onChange={(e) => onDepartureTimeChange(Number(e.target.value))}
          className="w-full accent-cyan-500 cursor-pointer"
        />

        {/* Quick Presets */}
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          {PRESET_TIMES.map((preset) => (
            <button
              key={preset.time}
              type="button"
              onClick={() => onDepartureTimeChange(preset.min)}
              className={`text-[10px] px-2 py-1 rounded text-left transition ${
                departureTimeMinutes === preset.min
                  ? 'bg-cyan-950 border border-cyan-500 text-cyan-200 font-bold'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Traffic Scenario Selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Gauge className="w-3.5 h-3.5 text-amber-400" />
          Traffic Congestion Scenario
        </label>
        <div className="grid grid-cols-2 gap-2">
          {SCENARIO_PRESETS.map((sc) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => onScenarioChange(sc.id)}
              className={`text-xs p-2 rounded-lg text-left border transition flex flex-col justify-between ${
                selectedScenario === sc.id
                  ? 'bg-amber-950/40 border-amber-500 text-amber-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="font-bold text-[11px] block text-white">{sc.name.split('(')[0]}</span>
              <span className="text-[9px] text-slate-400 mt-1 line-clamp-1">{sc.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Scenario Settings if Custom is selected */}
      {selectedScenario === SCENARIO_TYPES.CUSTOM && (
        <div className="p-3 bg-slate-900/80 rounded-lg border border-amber-600/40 flex flex-col gap-2 text-xs">
          <span className="font-bold text-amber-400 text-[11px]">Custom Congestion Parameters</span>

          <div className="flex items-center justify-between">
            <span className="text-slate-300">Congestion Multiplier:</span>
            <span className="font-mono font-bold text-amber-300">{customConfig.multiplier}x</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="4.0"
            step="0.1"
            value={customConfig.multiplier}
            onChange={(e) =>
              onCustomConfigChange({ ...customConfig, multiplier: parseFloat(e.target.value) })
            }
            className="accent-amber-500"
          />

          <div className="grid grid-cols-2 gap-2 mt-1">
            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5">Start Time</span>
              <input
                type="time"
                value={minutesToTimeString(customConfig.startMinutes)}
                onChange={(e) =>
                  onCustomConfigChange({
                    ...customConfig,
                    startMinutes: timeStringToMinutes(e.target.value),
                  })
                }
                className="bg-slate-950 border border-slate-700 text-white text-xs p-1 rounded w-full font-mono"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5">End Time</span>
              <input
                type="time"
                value={minutesToTimeString(customConfig.endMinutes)}
                onChange={(e) =>
                  onCustomConfigChange({
                    ...customConfig,
                    endMinutes: timeStringToMinutes(e.target.value),
                  })
                }
                className="bg-slate-950 border border-slate-700 text-white text-xs p-1 rounded w-full font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Optimization Objective Selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-emerald-400" />
          Optimization Goal
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onObjectiveChange('fastest_time')}
            className={`text-xs p-2 rounded-lg font-semibold border text-center transition ${
              optimizationObjective === 'fastest_time'
                ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            Fastest Travel Time (Time-Dependent)
          </button>
          <button
            type="button"
            onClick={() => onObjectiveChange('shortest_distance')}
            className={`text-xs p-2 rounded-lg font-semibold border text-center transition ${
              optimizationObjective === 'shortest_distance'
                ? 'bg-purple-950/50 border-purple-500 text-purple-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            Shortest Distance (Physical Km)
          </button>
        </div>
      </div>

      {/* Error Message banner */}
      {errorMessage && (
        <div className="p-2.5 bg-red-950/60 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Execute Button */}
      <button
        onClick={onRunSimulation}
        disabled={isSimulating}
        className="btn-primary w-full py-3 mt-1 text-sm font-bold tracking-wide"
      >
        <Play className="w-4 h-4" />
        <span>{isSimulating ? 'Computing Optimal Path...' : 'Compute & Dispatch Ambulance'}</span>
      </button>
    </div>
  );
}
