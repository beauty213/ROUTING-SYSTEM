import React from 'react';
import { Award, TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { formatDuration } from '../utils/timeUtils';

export default function StrategyComparison({
  timeDependentResult,
  shortestDistanceResult,
  staticSnapshotResult,
}) {
  if (!timeDependentResult || !shortestDistanceResult || !staticSnapshotResult) {
    return null;
  }

  const optimalTime = timeDependentResult.totalTravelTimeMinutes;

  const strategies = [
    {
      name: 'Time-Dependent Dijkstra (Primary)',
      type: 'optimal',
      route: timeDependentResult.path.join(' → '),
      distance: timeDependentResult.totalDistanceKm,
      time: timeDependentResult.totalTravelTimeMinutes,
      description: 'Dynamically evaluates road congestion at exact intersection arrival times.',
      isBest: true,
      improvementPct: 0,
      penaltyMinutes: 0,
    },
    {
      name: 'Shortest-Distance Dijkstra',
      type: 'baseline_distance',
      route: shortestDistanceResult.path.join(' → '),
      distance: shortestDistanceResult.totalDistanceKm,
      time: shortestDistanceResult.totalTravelTimeMinutes,
      description: 'Minimizes physical kilometers without accounting for road speed or congestion.',
      isBest: shortestDistanceResult.totalTravelTimeMinutes <= optimalTime + 0.001,
      improvementPct:
        shortestDistanceResult.totalTravelTimeMinutes > 0
          ? ((shortestDistanceResult.totalTravelTimeMinutes - optimalTime) /
              shortestDistanceResult.totalTravelTimeMinutes) *
            100
          : 0,
      penaltyMinutes: Math.max(
        0,
        shortestDistanceResult.totalTravelTimeMinutes - optimalTime
      ),
    },
    {
      name: 'Static Fastest-Route Baseline',
      type: 'baseline_static',
      route: staticSnapshotResult.path.join(' → '),
      distance: staticSnapshotResult.totalDistanceKm,
      time: staticSnapshotResult.totalTravelTimeMinutes,
      description: 'Freezes traffic conditions at departure time T₀; ignores downstream time delays.',
      isBest: staticSnapshotResult.totalTravelTimeMinutes <= optimalTime + 0.001,
      improvementPct:
        staticSnapshotResult.totalTravelTimeMinutes > 0
          ? ((staticSnapshotResult.totalTravelTimeMinutes - optimalTime) /
              staticSnapshotResult.totalTravelTimeMinutes) *
            100
          : 0,
      penaltyMinutes: Math.max(
        0,
        staticSnapshotResult.totalTravelTimeMinutes - optimalTime
      ),
    },
  ];

  return (
    <div className="panel-card flex flex-col gap-4 bg-[#0d1322] border-[#1f293d]">
      <div className="flex flex-wrap items-center justify-between pb-2 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Routing Strategy Comparison & Evaluation
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800 font-mono">
          <span>Formula:</span>
          <span className="text-emerald-400">
            Improvement % = ((Baseline − Optimal) / Baseline) × 100
          </span>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border border-slate-800 rounded-lg overflow-hidden">
          <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[11px]">
            <tr>
              <th className="py-2.5 px-3">Strategy</th>
              <th className="py-2.5 px-3">Computed Path</th>
              <th className="py-2.5 px-3">Distance (km)</th>
              <th className="py-2.5 px-3">Actual Travel Time</th>
              <th className="py-2.5 px-3">Delay vs Optimal</th>
              <th className="py-2.5 px-3">Improvement</th>
              <th className="py-2.5 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70 font-mono text-xs">
            {strategies.map((strat, i) => (
              <tr
                key={i}
                className={`transition ${
                  strat.isBest
                    ? 'bg-emerald-950/20 font-semibold text-emerald-200'
                    : 'hover:bg-slate-900/40 text-slate-300'
                }`}
              >
                <td className="py-2.5 px-3 font-sans">
                  <div className="font-bold text-white text-xs">{strat.name}</div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                    {strat.description}
                  </div>
                </td>
                <td className="py-2.5 px-3 font-bold text-white whitespace-nowrap">
                  {strat.route}
                </td>
                <td className="py-2.5 px-3 text-indigo-300">{strat.distance.toFixed(1)} km</td>
                <td className="py-2.5 px-3 font-extrabold text-sm text-cyan-300">
                  {formatDuration(strat.time)}
                </td>
                <td className="py-2.5 px-3">
                  {strat.penaltyMinutes > 0.05 ? (
                    <span className="text-red-400 font-bold">
                      +{formatDuration(strat.penaltyMinutes)}
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-bold">0.00 min (Optimal)</span>
                  )}
                </td>
                <td className="py-2.5 px-3">
                  {strat.improvementPct > 0.1 ? (
                    <span className="text-emerald-400 font-extrabold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                      +{strat.improvementPct.toFixed(1)}% Faster
                    </span>
                  ) : (
                    <span className="text-slate-500 font-sans">Benchmark</span>
                  )}
                </td>
                <td className="py-2.5 px-3">
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

      {/* Academic Explanatory Note Callout */}
      <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 flex items-start gap-2.5 text-xs text-slate-300">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-white">Academic Key Finding: </strong>
          In traffic-constrained networks, minimizing physical road distance does not minimize
          travel time. Under rush hour conditions, the shortest-distance route can be significantly
          slower due to bottleneck congestion on central segments. Time-dependent Dijkstra dynamically
          adapts to road entry timestamps, saving critical emergency response time.
        </p>
      </div>
    </div>
  );
}
