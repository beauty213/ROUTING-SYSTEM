import React from 'react';

export default function MetricCard({
  title,
  value,
  subvalue,
  icon: Icon,
  accentColor = 'cyan', // 'cyan' | 'indigo' | 'emerald' | 'amber' | 'red'
  tooltip,
}) {
  const colorMap = {
    cyan: {
      text: 'text-cyan-300',
      icon: 'text-cyan-400',
      border: 'border-cyan-500/20',
      bg: 'bg-cyan-950/20',
    },
    indigo: {
      text: 'text-indigo-300',
      icon: 'text-indigo-400',
      border: 'border-indigo-500/20',
      bg: 'bg-indigo-950/20',
    },
    emerald: {
      text: 'text-emerald-300',
      icon: 'text-emerald-400',
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-950/20',
    },
    amber: {
      text: 'text-amber-300',
      icon: 'text-amber-400',
      border: 'border-amber-500/20',
      bg: 'bg-amber-950/20',
    },
    red: {
      text: 'text-red-300',
      icon: 'text-red-400',
      border: 'border-red-500/20',
      bg: 'bg-red-950/20',
    },
  };

  const scheme = colorMap[accentColor] || colorMap.cyan;

  return (
    <div className={`p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between transition hover:border-slate-700 ${scheme.bg}`}>
      <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
        <span className="font-medium flex items-center gap-1">
          {title}
          {tooltip}
        </span>
        {Icon && <Icon className={`w-4 h-4 ${scheme.icon}`} />}
      </div>

      <div className={`font-mono font-extrabold text-xl ${scheme.text} my-0.5`}>
        {value}
      </div>

      {subvalue && (
        <span className="text-[11px] text-slate-400 font-mono">
          {subvalue}
        </span>
      )}
    </div>
  );
}
