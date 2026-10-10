import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Cpu,
} from 'lucide-react';
import { minutesToTimeString } from '../utils/timeUtils';

export default function StepByStepStepper({
  steps = [],
  currentStepIndex,
  onStepChange,
}) {
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const totalSteps = steps.length;
  const currentStep = steps[currentStepIndex] || steps[0];

  useEffect(() => {
    if (!isAutoPlaying) return;

    const timer = setInterval(() => {
      onStepChange((prev) => {
        if (prev >= totalSteps - 1) {
          setIsAutoPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1800);

    return () => clearInterval(timer);
  }, [isAutoPlaying, totalSteps, onStepChange]);

  if (!currentStep) {
    return (
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
        Loading algorithm execution steps...
      </div>
    );
  }

  const {
    stepNumber,
    type,
    currentNode,
    activeEdge,
    candidateNode,
    visitedNodes = [],
    queueSnapshot = [],
    arrivalTimesSnapshot = new Map(),
    explanation,
  } = currentStep;

  const nodeLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

  return (
    <div className="panel-card bg-[#0d1322] border-[#1f293d] flex flex-col gap-4">
      {/* Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
            Algorithm Step-by-Step Tracer
          </span>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Step {stepNumber} of {totalSteps}</span>
            <span
              className={`badge text-[10px] ${
                type === 'RELAX_SUCCESS'
                  ? 'badge-optimal'
                  : type === 'RELAX_REJECT'
                  ? 'badge-warning'
                  : type === 'TARGET_REACHED'
                  ? 'badge-emergency'
                  : 'badge-info'
              }`}
            >
              {type}
            </span>
          </h3>
        </div>

        {/* Stepper Navigation Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsAutoPlaying(false);
              onStepChange(Math.max(0, currentStepIndex - 1));
            }}
            disabled={currentStepIndex === 0}
            className="btn-secondary text-xs px-2.5 py-1.5 disabled:opacity-30"
            title="Previous Algorithmic Step"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
            title="Auto-play all steps"
          >
            {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isAutoPlaying ? 'Pause' : 'Auto-Play'}</span>
          </button>

          <button
            onClick={() => {
              setIsAutoPlaying(false);
              onStepChange(Math.min(totalSteps - 1, currentStepIndex + 1));
            }}
            disabled={currentStepIndex >= totalSteps - 1}
            className="btn-secondary text-xs px-2.5 py-1.5 disabled:opacity-30"
            title="Next Algorithmic Step"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setIsAutoPlaying(false);
              onStepChange(0);
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Reset to Step 1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Plain Language Step Explanation Box */}
      <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed flex items-start gap-2.5">
        <Cpu className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white block mb-0.5 text-xs">
            What is happening right now:
          </span>
          <p className="text-slate-300">{explanation}</p>
        </div>
      </div>

      {/* Internal Algorithm State: Arrival Times Table */}
      <div>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-mono">
          Current Best Arrival Times (arr[v]) at Step {stepNumber}
        </span>
        <div className="grid grid-cols-9 gap-1.5 font-mono text-center text-xs">
          {nodeLabels.map((nodeId) => {
            const time = arrivalTimesSnapshot.get(nodeId);
            const isFinalized = visitedNodes.includes(nodeId);
            const isCurrent = currentNode === nodeId;
            const isCandidate = candidateNode === nodeId;

            return (
              <div
                key={nodeId}
                className={`p-2 rounded-lg border transition ${
                  isCurrent
                    ? 'bg-cyan-950/70 border-cyan-500 text-cyan-300 font-bold'
                    : isCandidate
                    ? 'bg-amber-950/70 border-amber-500 text-amber-300 font-bold'
                    : isFinalized
                    ? 'bg-slate-900 border-slate-700 text-slate-400'
                    : 'bg-slate-950 border-slate-900 text-slate-600'
                }`}
              >
                <div className="text-[11px] font-bold text-white mb-0.5">{nodeId}</div>
                <div className="text-[10px]">
                  {time === Infinity || time === undefined ? '∞' : minutesToTimeString(time, true)}
                </div>
                <div className="text-[9px] mt-0.5 text-slate-500">
                  {isFinalized ? 'Final' : 'Open'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Priority Queue State */}
      <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-mono text-[11px]">Min-Heap Queue:</span>
          {queueSnapshot.length > 0 ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              {queueSnapshot.map((item, idx) => (
                <span
                  key={idx}
                  className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] font-mono border border-slate-700"
                >
                  {item.key}: {minutesToTimeString(item.priority, true)}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-slate-500 font-mono text-[11px]">Empty (Finalized)</span>
          )}
        </div>

        <span className="text-slate-500 text-[11px] font-mono">
          Finalized Nodes: {visitedNodes.join(', ') || 'None'}
        </span>
      </div>
    </div>
  );
}
