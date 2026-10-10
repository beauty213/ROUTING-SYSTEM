import React from 'react';
import {
  Navigation,
  Play,
  BrainCircuit,
  MapPin,
  Clock,
  Gauge,
  Milestone,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import RoadNetwork from '../components/RoadNetwork';

export default function DashboardPage({
  nodes,
  edges,
  sourceId,
  destinationId,
  optimalResult,
  departureTimeMinutes,
  scenarioName,
  onNavigatePage,
}) {
  return (
    <div className="flex flex-col gap-6 max-w-[1500px] mx-auto w-full">
      {/* 1. Hero Banner: 10-Second Clear Understanding */}
      <div className="panel-card bg-gradient-to-r from-[#0d1322] via-[#111827] to-[#0d1322] border-[#1f293d] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-emergency text-xs font-bold">
              Emergency Dispatch Case Study
            </span>
            <span className="badge badge-info text-xs">
              Time-Dependent Dijkstra
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-snug">
            Fastest Emergency Routing, Even in Peak Rush-Hour Traffic
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Standard navigation algorithms assume road travel times are constant. In reality, urban
            traffic changes constantly. This system dynamically calculates the fastest ambulance route
            to a hospital based on road speed limits, distances, and changing traffic congestion.
          </p>

          {/* Call to Action Buttons */}
          <div className="flex items-center gap-3 mt-5 flex-wrap">
            <button
              onClick={() => onNavigatePage('realtime_map')}
              className="btn-primary text-xs sm:text-sm py-2.5 px-5 flex items-center gap-2"
            >
              <Navigation className="w-4 h-4 fill-white" />
              <span>Open Hyderabad Google Maps Live</span>
            </button>

            <button
              onClick={() => onNavigatePage('simulator')}
              className="btn-secondary text-xs sm:text-sm py-2.5 px-4 flex items-center gap-2"
            >
              <Play className="w-4 h-4 text-emerald-400" />
              <span>Route Simulator</span>
            </button>

            <button
              onClick={() => onNavigatePage('algorithm')}
              className="btn-secondary text-xs sm:text-sm py-2.5 px-4 flex items-center gap-2"
            >
              <BrainCircuit className="w-4 h-4 text-cyan-400" />
              <span>Algorithm Explorer</span>
            </button>
          </div>
        </div>

        {/* Quick Live Traffic Badge Card */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex flex-col gap-2 min-w-[240px]">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
            Current Network State
          </span>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">Active Scenario:</span>
            <span className="font-bold text-amber-300">{scenarioName}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">Fastest Route Time:</span>
            <span className="font-mono font-bold text-cyan-300">
              {optimalResult?.totalTravelTimeMinutes.toFixed(2)} min
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">Route Distance:</span>
            <span className="font-mono font-bold text-indigo-300">
              {optimalResult?.totalDistanceKm} km
            </span>
          </div>
        </div>
      </div>

      {/* 2. Three-Step Simple Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="panel-card bg-[#0d1322] border-[#1f293d] p-5 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-red-600/20 text-red-400 flex items-center justify-center font-bold text-xs font-mono">
              1
            </span>
            <h3 className="font-bold text-sm text-white">Choose Route</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Select an ambulance depot origin (such as Station Alpha, Node A) and target emergency
            hospital (such as General Hospital, Node I).
          </p>
        </div>

        <div className="panel-card bg-[#0d1322] border-[#1f293d] p-5 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-600/20 text-amber-400 flex items-center justify-center font-bold text-xs font-mono">
              2
            </span>
            <h3 className="font-bold text-sm text-white">Analyze Traffic</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Apply simulated peak rush-hour conditions (17:00–19:00) where central roads slow down by
            2.5x, or test unconstrained night traffic.
          </p>
        </div>

        <div className="panel-card bg-[#0d1322] border-[#1f293d] p-5 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-xs font-mono">
              3
            </span>
            <h3 className="font-bold text-sm text-white">View Best Route</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Time-Dependent Dijkstra automatically reroutes around bottlenecks, saving critical
            minutes compared to standard shortest-distance navigation.
          </p>
        </div>
      </div>

      {/* 3. Quick Network Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">Road Intersections</span>
          <span className="text-xl font-extrabold text-white font-mono">9 Nodes</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Grid layout A through I</span>
        </div>

        <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">Road Segments</span>
          <span className="text-xl font-extrabold text-white font-mono">12 Segments</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Bidirectional street network</span>
        </div>

        <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">Central Bottlenecks</span>
          <span className="text-xl font-extrabold text-amber-400 font-mono">Corridors B-E & E-F</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">2.5x traffic slowdown</span>
        </div>

        <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">Algorithm Complexity</span>
          <span className="text-xl font-extrabold text-cyan-400 font-mono">O((V+E) log V)</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Binary Min-Heap Queue</span>
        </div>
      </div>

      {/* 4. Road Network Map Preview */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Road Network Interactive Preview
          </h3>
          <button
            onClick={() => onNavigatePage('simulator')}
            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold"
          >
            <span>Open Full Simulator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <RoadNetwork
          nodes={nodes}
          edges={edges}
          sourceId={sourceId}
          destinationId={destinationId}
          onSelectSource={() => onNavigatePage('simulator')}
          onSelectDestination={() => onNavigatePage('simulator')}
          optimalResult={optimalResult}
          departureTimeMinutes={departureTimeMinutes}
        />
      </div>
    </div>
  );
}
