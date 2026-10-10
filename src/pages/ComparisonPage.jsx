import React from 'react';
import {
  Scale,
  Award,
  CheckCircle,
  Clock,
  Milestone,
  ArrowRight,
  TrendingUp,
  Info,
} from 'lucide-react';
import { formatDuration, minutesToTimeString } from '../utils/timeUtils';
import HelpTooltip from '../components/HelpTooltip';

export default function ComparisonPage({
  timeDependentResult,
  shortestDistanceResult,
  staticSnapshotResult,
  departureTimeMinutes,
}) {
  if (!timeDependentResult || !shortestDistanceResult || !staticSnapshotResult) {
    return (
      <div className="panel-card p-6 text-center text-xs text-slate-400">
        Run a simulation to generate comparative benchmark data.
      </div>
    );
  }

  const optimalTime = timeDependentResult.totalTravelTimeMinutes;

  const strategies = [
    {
      id: 'time_dependent',
      name: 'Time-Dependent Dijkstra (Primary)',
      shortName: 'Time-Dependent',
      route: timeDependentResult.path.join(' → '),
      distance: timeDependentResult.totalDistanceKm,
      time: timeDependentResult.totalTravelTimeMinutes,
      arrival: timeDependentResult.arrivalTimeMinutes,
      delay: 0,
      improvementPct: 0,
      description: 'Dynamically calculates road travel times using the exact clock time the ambulance arrives at each intersection.',
      isBest: true,
      color: '#10b981',
    },
    {
      id: 'shortest_distance',
      name: 'Shortest-Distance Dijkstra (Baseline 2)',
      shortName: 'Shortest Distance',
      route: shortestDistanceResult.path.join(' → '),
      distance: shortestDistanceResult.totalDistanceKm,
      time: shortestDistanceResult.totalTravelTimeMinutes,
      arrival: shortestDistanceResult.arrivalTimeMinutes,
      delay: Math.max(0, shortestDistanceResult.totalTravelTimeMinutes - optimalTime),
      improvementPct:
        shortestDistanceResult.totalTravelTimeMinutes > 0
          ? ((shortestDistanceResult.totalTravelTimeMinutes - optimalTime) /
              shortestDistanceResult.totalTravelTimeMinutes) *
            100
          : 0,
      description: 'Minimizes physical kilometers without accounting for road speed limits or rush-hour traffic slowdowns.',
      isBest: shortestDistanceResult.totalTravelTimeMinutes <= optimalTime + 0.001,
      color: '#a855f7',
    },
    {
      id: 'static_snapshot',
      name: 'Static Fastest-Route Baseline (Baseline 3)',
      shortName: 'Static Snapshot',
      route: staticSnapshotResult.path.join(' → '),
      distance: staticSnapshotResult.totalDistanceKm,
      time: staticSnapshotResult.totalTravelTimeMinutes,
      arrival: staticSnapshotResult.arrivalTimeMinutes,
      delay: Math.max(0, staticSnapshotResult.totalTravelTimeMinutes - optimalTime),
      improvementPct:
        staticSnapshotResult.totalTravelTimeMinutes > 0
          ? ((staticSnapshotResult.totalTravelTimeMinutes - optimalTime) /
              staticSnapshotResult.totalTravelTimeMinutes) *
            100
          : 0,
      description: 'Freezes traffic conditions at departure time T₀ and assumes road conditions will never change during the trip.',
      isBest: staticSnapshotResult.totalTravelTimeMinutes <= optimalTime + 0.001,
      color: '#f59e0b',
    },
  ];

  const maxDuration = Math.max(...strategies.map((s) => s.time), 1);
  const maxDistance = Math.max(...strategies.map((s) => s.distance), 1);

  return (
    <div className="flex flex-col gap-6 max-w-[1500px] mx-auto w-full">
      {/* 1. Module Overview Banner */}
      <div className="panel-card bg-[#0d1322] border-[#1f293d] p-5 flex flex-col gap-3">
        <div className="flex items-center gap-3 pb-2 border-b border-slate-800">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">
              Routing Strategy Comparison & Evaluation
            </h2>
            <p className="text-xs text-slate-400">
              Evaluates all three strategies under identical graph conditions and departure timestamps.
            </p>
          </div>
        </div>

        {/* Clear Finding Box */}
        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed flex items-start gap-2.5">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-white">Academic Key Finding: </strong>
            The shortest route is not necessarily the fastest. During heavy traffic, avoiding a
            congested road can reduce the estimated journey time, even if the alternative route is
            longer in physical distance. Time-Dependent Dijkstra continuously adapts to road-entry
            times, preventing emergency vehicles from getting trapped in rush-hour bottlenecks.
          </p>
        </div>
      </div>

      {/* 2. Primary Comparison Table */}
      <div className="panel-card bg-[#0d1322] border-[#1f293d] p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[11px] font-mono">
              <tr>
                <th className="py-3 px-4">Strategy</th>
                <th className="py-3 px-4">Computed Route</th>
                <th className="py-3 px-4">Distance (km)</th>
                <th className="py-3 px-4">Actual Travel Time</th>
                <th className="py-3 px-4">Estimated Arrival</th>
                <th className="py-3 px-4">Delay vs Optimal</th>
                <th className="py-3 px-4">Improvement</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {strategies.map((strat) => (
                <tr
                  key={strat.id}
                  className={`transition ${
                    strat.isBest
                      ? 'bg-emerald-950/20 text-emerald-200 font-semibold'
                      : 'hover:bg-slate-900/40 text-slate-300'
                  }`}
                >
                  <td className="py-3 px-4 font-sans">
                    <div className="font-bold text-white text-xs">{strat.name}</div>
                    <div className="text-[10.5px] text-slate-400 font-normal mt-0.5 max-w-xs">
                      {strat.description}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                    {strat.route}
                  </td>
                  <td className="py-3 px-4 text-indigo-300">{strat.distance.toFixed(1)} km</td>
                  <td className="py-3 px-4 text-cyan-300 font-extrabold text-sm">
                    {formatDuration(strat.time)}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {minutesToTimeString(strat.arrival, true)}
                  </td>
                  <td className="py-3 px-4">
                    {strat.delay > 0.05 ? (
                      <span className="text-red-400 font-bold">
                        +{formatDuration(strat.delay)}
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-bold">0.00 min (Optimal)</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {strat.improvementPct > 0.1 ? (
                      <span className="text-emerald-400 font-extrabold bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-800">
                        +{strat.improvementPct.toFixed(1)}% Faster
                      </span>
                    ) : (
                      <span className="text-slate-500 font-sans">Benchmark</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {strat.isBest ? (
                      <span className="badge badge-optimal">Fastest</span>
                    ) : (
                      <span className="badge badge-warning">Sub-optimal</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Visual Charts Grid (Travel Time & Distance Comparison) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Travel Time Bar Chart */}
        <div className="panel-card bg-[#0d1322] border-[#1f293d] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Evaluated Travel Time (Lower is Better)
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">In Minutes</span>
          </div>

          <div className="flex flex-col gap-3 my-2">
            {strategies.map((strat) => {
              const pct = Math.round((strat.time / maxDuration) * 100);
              return (
                <div key={strat.id} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-semibold">{strat.shortName}</span>
                    <span className="font-mono font-bold text-cyan-300">
                      {formatDuration(strat.time)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: strat.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-emerald-400 font-semibold">
            ✓ Time-Dependent Dijkstra minimizes emergency patient delivery time
          </div>
        </div>

        {/* Physical Distance Bar Chart */}
        <div className="panel-card bg-[#0d1322] border-[#1f293d] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Physical Road Distance
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">In Kilometers</span>
          </div>

          <div className="flex flex-col gap-3 my-2">
            {strategies.map((strat) => {
              const pct = Math.round((strat.distance / maxDistance) * 100);
              return (
                <div key={strat.id} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-semibold">{strat.shortName}</span>
                    <span className="font-mono font-bold text-indigo-300">
                      {strat.distance.toFixed(1)} km
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: strat.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            Notice: Shortest physical distance does not equal fastest travel time in traffic!
          </div>
        </div>
      </div>
    </div>
  );
}
