import React from 'react';
import { Sparkles, Play, Info, ArrowRight, CheckCircle2 } from 'lucide-react';
import { SCENARIO_TYPES } from '../data/scenarios';
import { timeStringToMinutes } from '../utils/timeUtils';

export const LIVE_EXAMPLES = [
  {
    id: 'rush_hour_paradox',
    badge: 'Core Academic Proof',
    title: 'The Rush-Hour Paradox',
    time: '17:30',
    source: 'A',
    destination: 'I',
    scenario: SCENARIO_TYPES.RUSH_HOUR,
    objective: 'fastest_time',
    narrative:
      'Demonstrates that the 7.6 km shortest-distance route takes 16.8 min, whereas Time-Dependent Dijkstra redirects the ambulance to the 11.0 km Southern Expressway, arriving in only 11.0 min—saving 5 min 48 sec (34.5% faster)!',
    expectedOutcome: 'Fastest Route: A → D → G → H → I (11.0 km in 11.0 min vs 7.6 km in 16.8 min)',
  },
  {
    id: 'downstream_trap',
    badge: 'Time-Dependence Proof',
    title: 'The Downstream Congestion Trap',
    time: '16:56',
    source: 'A',
    destination: 'I',
    scenario: SCENARIO_TYPES.RUSH_HOUR,
    objective: 'fastest_time',
    narrative:
      'At 16:56 all roads are currently free-flowing! A static snapshot sends the vehicle into the city center, where rush hour hits at 17:00 and traps it (13.2 min). Time-Dependent Dijkstra anticipates downstream arrival times and detours early (11.0 min).',
    expectedOutcome: 'Static Route fails at downstream bottleneck (13.2 min). Time-Dependent saves 2m 12s.',
  },
  {
    id: 'free_flow_baseline',
    badge: 'Baseline Control',
    title: 'Night Shift Free-Flow (02:00)',
    time: '02:00',
    source: 'A',
    destination: 'I',
    scenario: SCENARIO_TYPES.FREE_FLOW,
    objective: 'fastest_time',
    narrative:
      'Establishes the ideal baseline: with congestion multiplier 1.0x everywhere, physical distance minimization and travel time minimization coincide. Both select A → B → E → F → I (7.6 km in 9.6 min).',
    expectedOutcome: 'Shortest Distance = Fastest Time (9.6 min). No delay penalty.',
  },
  {
    id: 'cross_diagonal',
    badge: 'Network Topology',
    title: 'Diagonal Cross-City Emergency (G to C)',
    time: '17:30',
    source: 'G',
    destination: 'C',
    scenario: SCENARIO_TYPES.RUSH_HOUR,
    objective: 'fastest_time',
    narrative:
      'An emergency from the South-West Outer Hub (G) to the North-East Crossing (C). During rush hour, the central square (E) is avoided in favor of the western/northern perimeter.',
    expectedOutcome: 'Dynamic perimeter routing avoids bottleneck intersection E.',
  },
];

export default function LiveExamplesBar({
  activeExampleId,
  onSelectExample,
  onRunSimulation,
}) {
  const currentExample = LIVE_EXAMPLES.find((e) => e.id === activeExampleId) || LIVE_EXAMPLES[0];

  return (
    <div className="w-full bg-[#0c121e] border-b border-[#1f293d] px-6 py-3">
      <div className="max-w-[1600px] mx-auto flex flex-col gap-2.5">
        {/* Header row with selector pills */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
              Guided Live Case Studies:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {LIVE_EXAMPLES.map((ex) => {
              const isSelected = activeExampleId === ex.id;
              return (
                <button
                  key={ex.id}
                  onClick={() => onSelectExample(ex)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm shadow-amber-500/30'
                      : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <span>{ex.title}</span>
                  <span className={`text-[10px] font-mono px-1 py-0.2 rounded ${
                    isSelected ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {ex.time}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Narrative Card for Active Example */}
        {currentExample && (
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5 max-w-4xl">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-white text-xs">{currentExample.title}</span>
                  <span className="badge badge-warning text-[10px]">{currentExample.badge}</span>
                  <span className="font-mono text-cyan-400 text-[11px]">
                    Departure: {currentExample.time} | Route: {currentExample.source} → {currentExample.destination}
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">{currentExample.narrative}</p>
                <div className="text-emerald-400 font-mono text-[11px] font-semibold mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{currentExample.expectedOutcome}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onRunSimulation}
              className="btn-primary text-xs py-2 px-3.5 self-center whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Simulate Example</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
