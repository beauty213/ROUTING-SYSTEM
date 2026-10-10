import React from 'react';
import { GitFork, Clock, Milestone, ArrowRight } from 'lucide-react';
import { formatDuration } from '../utils/timeUtils';

export default function AlternativeRoutes({
  alternatives = [],
  optimalTravelTime = 0,
  onSelectAlternativePreview,
}) {
  if (!alternatives || alternatives.length === 0) {
    return null;
  }

  return (
    <div className="panel-card flex flex-col gap-3 bg-[#0d1322] border-[#1f293d]">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <GitFork className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Alternative Route Candidates (Bounded Path Enumeration)
          </h2>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          Evaluated under identical departure time
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {alternatives.map((alt, index) => {
          const delayMinutes = Math.max(0, alt.totalTravelTimeMinutes - optimalTravelTime);

          return (
            <div
              key={index}
              onClick={() => onSelectAlternativePreview && onSelectAlternativePreview(alt.path)}
              className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="badge badge-info">Option #{index + 2}</span>
                  <span className="text-red-400 font-mono font-bold text-xs">
                    +{formatDuration(delayMinutes)} delay
                  </span>
                </div>

                <div className="font-mono font-bold text-xs text-slate-200 flex items-center flex-wrap gap-1 mb-3">
                  {alt.path.map((node, i) => (
                    <React.Fragment key={i}>
                      <span className="bg-slate-800 px-1.5 py-0.5 rounded text-white border border-slate-700">
                        {node}
                      </span>
                      {i < alt.path.length - 1 && <span className="text-slate-500 text-[10px]">→</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs font-mono">
                <div className="flex items-center gap-1 text-cyan-300">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatDuration(alt.totalTravelTimeMinutes)}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                  <Milestone className="w-3.5 h-3.5" />
                  <span>{alt.totalDistanceKm.toFixed(1)} km</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
