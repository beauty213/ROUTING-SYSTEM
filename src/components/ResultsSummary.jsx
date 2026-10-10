import React from 'react';
import { Clock, Route, Milestone, Flag, ShieldAlert, Cpu, CheckCircle2 } from 'lucide-react';
import { formatDuration, minutesToTimeString } from '../utils/timeUtils';

export default function ResultsSummary({ result, activeObjective }) {
  if (!result || !result.success) {
    return (
      <div className="panel-card bg-[#0d1322] border-[#1f293d] flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-8 h-8 text-amber-500 mb-2" />
        <h3 className="text-sm font-bold text-slate-200">No Valid Route Computed</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          {result?.error || 'Configure source, destination and click Compute & Dispatch.'}
        </p>
      </div>
    );
  }

  const {
    path,
    totalTravelTimeMinutes,
    totalDistanceKm,
    departureTimeMinutes,
    arrivalTimeMinutes,
    edgeDetails = [],
    exploredCount = 0,
    congestedSegmentsCount = 0,
    strategy,
  } = result;

  const hopCount = Math.max(0, path.length - 1);

  return (
    <div className="panel-card flex flex-col gap-4 bg-[#0d1322] border-[#1f293d]">
      {/* Route Header Banner */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">
              {strategy === 'time_dependent'
                ? 'Time-Dependent Dijkstra Optimal Path'
                : 'Shortest Distance Path'}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
              {path.map((node, index) => (
                <React.Fragment key={index}>
                  <span className="font-mono font-extrabold text-sm text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    {node}
                  </span>
                  {index < path.length - 1 && (
                    <span className="text-emerald-400 font-bold text-xs">→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <span className="badge badge-optimal">
          {congestedSegmentsCount > 0 ? `${congestedSegmentsCount} Congested Edge(s)` : 'Clear Route'}
        </span>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Estimated Travel Time */}
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span>Travel Time</span>
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="font-mono font-extrabold text-lg text-cyan-300">
            {formatDuration(totalTravelTimeMinutes)}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {totalTravelTimeMinutes.toFixed(2)} min
          </span>
        </div>

        {/* Total Physical Distance */}
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span>Total Distance</span>
            <Milestone className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="font-mono font-extrabold text-lg text-indigo-300">
            {totalDistanceKm.toFixed(1)} km
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Physical road length</span>
        </div>

        {/* Departure Time */}
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span>Departure</span>
            <Flag className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="font-mono font-extrabold text-base text-slate-200">
            {minutesToTimeString(departureTimeMinutes)}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Depot dispatch</span>
        </div>

        {/* Arrival Time */}
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span>ETA at Hospital</span>
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="font-mono font-extrabold text-base text-emerald-300">
            {minutesToTimeString(arrivalTimeMinutes, true)}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Hospital check-in</span>
        </div>

        {/* Road Segments / Hops */}
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span>Road Hops</span>
            <Route className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="font-mono font-extrabold text-lg text-amber-300">
            {hopCount} {hopCount === 1 ? 'segment' : 'segments'}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Intersections crossed</span>
        </div>

        {/* Explored Nodes Search Space */}
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span>Explored Nodes</span>
            <Cpu className="w-3.5 h-3.5 text-fuchsia-400" />
          </div>
          <div className="font-mono font-extrabold text-lg text-fuchsia-300">
            {exploredCount} / 9
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Min-heap pops</span>
        </div>
      </div>

      {/* Step-by-Step Traversal Itinerary */}
      {edgeDetails.length > 0 && (
        <div className="mt-1">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Dynamic Edge-by-Edge Execution Itinerary
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-800 rounded-lg overflow-hidden">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[11px] font-mono">
                <tr>
                  <th className="py-2 px-3">Segment</th>
                  <th className="py-2 px-3">Road Name</th>
                  <th className="py-2 px-3">Distance</th>
                  <th className="py-2 px-3">Speed Limit</th>
                  <th className="py-2 px-3">Congestion</th>
                  <th className="py-2 px-3">Effective Speed</th>
                  <th className="py-2 px-3">Entry Time</th>
                  <th className="py-2 px-3">Duration</th>
                  <th className="py-2 px-3">Exit Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {edgeDetails.map((seg, i) => (
                  <tr
                    key={i}
                    className={`hover:bg-slate-900/40 transition ${
                      seg.isCongested ? 'bg-amber-950/20 text-amber-200' : 'text-slate-300'
                    }`}
                  >
                    <td className="py-2 px-3 font-bold text-white">
                      {seg.from} → {seg.to}
                    </td>
                    <td className="py-2 px-3 font-sans text-slate-300">{seg.roadName}</td>
                    <td className="py-2 px-3">{seg.distanceKm} km</td>
                    <td className="py-2 px-3">{seg.speedLimitKmH} km/h</td>
                    <td className="py-2 px-3">
                      {seg.isCongested ? (
                        <span className="text-amber-400 font-bold">
                          {seg.multiplier.toFixed(1)}x
                        </span>
                      ) : (
                        <span className="text-slate-500">1.0x (Free)</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-cyan-300 font-semibold">
                      {seg.effectiveSpeedKmH.toFixed(1)} km/h
                    </td>
                    <td className="py-2 px-3 text-slate-400">
                      {minutesToTimeString(seg.entryTimeMinutes, true)}
                    </td>
                    <td className="py-2 px-3 text-emerald-400 font-semibold">
                      {formatDuration(seg.durationMinutes)}
                    </td>
                    <td className="py-2 px-3 text-slate-400">
                      {minutesToTimeString(seg.exitTimeMinutes, true)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
