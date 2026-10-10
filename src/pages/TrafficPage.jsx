import React, { useState } from 'react';
import {
  Gauge,
  Filter,
  Info,
  Clock,
  Milestone,
  CheckCircle,
  AlertTriangle,
  X,
  Database,
} from 'lucide-react';
import { isEdgeCongestedAtTime } from '../algorithms/travelTimeModel';
import { minutesToTimeString, formatDuration } from '../utils/timeUtils';
import HelpTooltip from '../components/HelpTooltip';

export default function TrafficPage({
  edges,
  departureTimeMinutes,
}) {
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'FREE' | 'MODERATE' | 'HEAVY'
  const [selectedRoad, setSelectedRoad] = useState(null);

  // Classify road congestion status
  const getRoadTrafficStatus = (edge) => {
    const isCongested = isEdgeCongestedAtTime(edge, departureTimeMinutes);
    if (!isCongested || !edge.congestionMultiplier || edge.congestionMultiplier <= 1.0) {
      return { status: 'FREE', label: 'Free Flow', color: 'emerald', mult: 1.0 };
    }
    if (edge.congestionMultiplier >= 2.0) {
      return {
        status: 'HEAVY',
        label: 'Heavy Traffic',
        color: 'red',
        mult: edge.congestionMultiplier,
      };
    }
    return {
      status: 'MODERATE',
      label: 'Moderate Traffic',
      color: 'amber',
      mult: edge.congestionMultiplier,
    };
  };

  const filteredEdges = edges.filter((edge) => {
    if (statusFilter === 'ALL') return true;
    const { status } = getRoadTrafficStatus(edge);
    return status === statusFilter;
  });

  return (
    <div className="flex flex-col gap-5 max-w-[1500px] mx-auto w-full">
      {/* 1. Module Header & Simulated Disclaimer */}
      <div className="panel-card bg-[#0d1322] border-[#1f293d] p-5 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                Urban Traffic Monitor
              </h2>
              <p className="text-xs text-slate-400">
                Inspect simulated speed limits, distances, active congestion multipliers, and traversal delays across all 12 street segments.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-mono bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Clock: {minutesToTimeString(departureTimeMinutes)}</span>
          </div>
        </div>

        {/* Academic Simulated Disclaimer */}
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-white">Academic Simulation Notice: </strong>
            These traffic conditions are mathematically generated using time-dependent rush-hour
            windows and congestion multipliers for study and algorithmic validation. They do not
            represent live satellite or municipal sensor observations.
          </p>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Filter by Traffic Status:
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: 'ALL', label: 'All Roads (12)' },
            { id: 'FREE', label: 'Free Flow' },
            { id: 'MODERATE', label: 'Moderate Traffic' },
            { id: 'HEAVY', label: 'Heavy Traffic (Bottlenecks)' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
                statusFilter === f.id
                  ? 'bg-red-600 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Road Segment Table */}
      <div className="panel-card bg-[#0d1322] border-[#1f293d] p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[11px] font-mono">
              <tr>
                <th className="py-3 px-4">Segment</th>
                <th className="py-3 px-4">Road Name</th>
                <th className="py-3 px-4">Connected Intersections</th>
                <th className="py-3 px-4">Distance</th>
                <th className="py-3 px-4">Speed Limit</th>
                <th className="py-3 px-4">Congestion Multiplier</th>
                <th className="py-3 px-4">Estimated Travel Time</th>
                <th className="py-3 px-4">Rush-Hour Window</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {filteredEdges.map((edge) => {
                const info = getRoadTrafficStatus(edge);
                const baseTime = (edge.distance / edge.speedLimit) * 60;
                const effSpeed = edge.speedLimit / info.mult;
                const currentTime = (edge.distance / effSpeed) * 60;

                return (
                  <tr
                    key={edge.id}
                    onClick={() => setSelectedRoad(edge)}
                    className="hover:bg-slate-900/60 transition cursor-pointer text-slate-300"
                  >
                    <td className="py-3 px-4 font-bold text-white">{edge.id}</td>
                    <td className="py-3 px-4 font-sans text-slate-200">{edge.name}</td>
                    <td className="py-3 px-4">
                      {edge.from} ↔ {edge.to}
                    </td>
                    <td className="py-3 px-4">{edge.distance.toFixed(1)} km</td>
                    <td className="py-3 px-4">{edge.speedLimit} km/h</td>
                    <td className="py-3 px-4">
                      {info.mult > 1.0 ? (
                        <span className="text-amber-400 font-bold">{info.mult.toFixed(1)}x</span>
                      ) : (
                        <span className="text-slate-500">1.0x (Normal)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-cyan-300 font-bold">
                      {formatDuration(currentTime)}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-sans">
                      {edge.congestionStart !== undefined && edge.congestionEnd !== undefined
                        ? '17:00 – 19:00'
                        : 'None'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`badge text-[10px] ${
                          info.color === 'red'
                            ? 'badge-emergency'
                            : info.color === 'amber'
                            ? 'badge-warning'
                            : 'badge-optimal'
                        }`}
                      >
                        {info.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Clicked Road Details Modal */}
      {selectedRoad && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md bg-slate-900 border border-slate-700 p-5 rounded-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-extrabold text-white text-sm">
                Road Details: {selectedRoad.name} ({selectedRoad.id})
              </span>
              <button
                onClick={() => setSelectedRoad(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2.5 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800/60 font-mono">
                <span>Intersections Connected:</span>
                <strong className="text-white">{selectedRoad.from} and {selectedRoad.to}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60 font-mono">
                <span>Physical Distance:</span>
                <strong className="text-indigo-300">{selectedRoad.distance.toFixed(1)} km</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60 font-mono">
                <span>Posted Speed Limit:</span>
                <strong className="text-white">{selectedRoad.speedLimit} km/h</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60 font-mono">
                <span>Free-Flow Duration:</span>
                <strong className="text-cyan-300">
                  {formatDuration((selectedRoad.distance / selectedRoad.speedLimit) * 60)}
                </strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60 font-mono">
                <span>Current Simulated Multiplier:</span>
                <strong className="text-amber-400">
                  {getRoadTrafficStatus(selectedRoad).mult.toFixed(1)}x
                </strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60 font-mono">
                <span>Rush-Hour Schedule:</span>
                <span className="text-slate-300">
                  {selectedRoad.congestionStart !== undefined
                    ? '17:00 – 19:00 Daily'
                    : 'No scheduled slowdown'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRoad(null)}
                className="btn-primary text-xs px-4 py-1.5"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
