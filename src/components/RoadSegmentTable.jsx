import React from 'react';
import { Database, AlertTriangle, CheckCircle, Ban } from 'lucide-react';
import { isEdgeCongestedAtTime } from '../algorithms/travelTimeModel';
import { formatDuration } from '../utils/timeUtils';

export default function RoadSegmentTable({
  edges,
  departureTimeMinutes,
  blockedEdgeIds = [],
  onToggleBlockEdge,
}) {
  return (
    <div className="panel-card bg-[#0d1322] border-[#1f293d]">
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 mb-4 gap-2">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
              Road Network Catalog & Live Inspector (12 Segments)
            </h3>
            <p className="text-xs text-slate-400">
              Inspect segment geometry, speeds, active congestion, or simulate accidents/closures.
            </p>
          </div>
        </div>

        {blockedEdgeIds.length > 0 && (
          <span className="badge badge-emergency text-[10px]">
            {blockedEdgeIds.length} Road(s) Blocked by Incident
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border border-slate-800 rounded-lg overflow-hidden">
          <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[11px] sticky top-0">
            <tr>
              <th className="py-2.5 px-3">Segment</th>
              <th className="py-2.5 px-3">Road Name</th>
              <th className="py-2.5 px-3">Distance</th>
              <th className="py-2.5 px-3">Speed Limit</th>
              <th className="py-2.5 px-3">Free-Flow Duration</th>
              <th className="py-2.5 px-3">Congestion Window</th>
              <th className="py-2.5 px-3">Traffic State</th>
              <th className="py-2.5 px-3 text-center">Accident / Closure</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
            {edges.map((edge) => {
              const isBlocked = blockedEdgeIds.includes(edge.id);
              const isCongested = !isBlocked && isEdgeCongestedAtTime(edge, departureTimeMinutes);
              const baseTime = (edge.distance / edge.speedLimit) * 60;

              return (
                <tr
                  key={edge.id}
                  className={`hover:bg-slate-900/40 transition ${
                    isBlocked
                      ? 'bg-red-950/25 text-red-300'
                      : isCongested
                      ? 'bg-amber-950/20 text-amber-200'
                      : 'text-slate-300'
                  }`}
                >
                  <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                    {isBlocked && <Ban className="w-3.5 h-3.5 text-red-500" />}
                    <span>{edge.id}</span>
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-200">{edge.name}</td>
                  <td className="py-2.5 px-3">{edge.distance.toFixed(1)} km</td>
                  <td className="py-2.5 px-3">{edge.speedLimit} km/h</td>
                  <td className="py-2.5 px-3 text-cyan-300">{formatDuration(baseTime)}</td>
                  <td className="py-2.5 px-3 text-slate-400 font-sans">
                    {edge.congestionStart !== undefined && edge.congestionEnd !== undefined
                      ? '17:00 – 19:00'
                      : 'None'}
                  </td>
                  <td className="py-2.5 px-3">
                    {isBlocked ? (
                      <span className="badge badge-emergency text-[10px]">Road Closed</span>
                    ) : isCongested ? (
                      <span className="badge badge-warning text-[10px]">
                        {edge.congestionMultiplier}x Delay Active
                      </span>
                    ) : (
                      <span className="badge badge-optimal text-[10px]">Free Flow (1.0x)</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => onToggleBlockEdge && onToggleBlockEdge(edge.id)}
                      className={`text-[10px] font-sans font-semibold px-2 py-1 rounded transition ${
                        isBlocked
                          ? 'bg-red-600 hover:bg-red-500 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {isBlocked ? 'Reopen Road' : 'Simulate Blockage'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
