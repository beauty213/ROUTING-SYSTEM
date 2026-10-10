import React from 'react';
import { Menu, Clock, Activity, RotateCcw } from 'lucide-react';
import { minutesToTimeString } from '../utils/timeUtils';
import { NAV_ITEMS } from './Sidebar';

export default function Header({
  activePage,
  departureMinutes,
  scenarioName,
  onReset,
  onOpenMobileSidebar,
}) {
  const currentNav = NAV_ITEMS.find((n) => n.id === activePage) || NAV_ITEMS[0];

  return (
    <header className="w-full bg-[#0d1322] border-b border-[#1f293d] px-4 md:px-6 py-3 sticky top-0 z-30 shadow-md">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Mobile menu toggle & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-extrabold text-white tracking-tight">
                {currentNav.label}
              </h1>
              <span className="hidden sm:inline-block badge badge-emergency text-[10px]">
                Academic Case Study
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-400 font-medium">
              {currentNav.description}
            </p>
          </div>
        </div>

        {/* Right: Simulation Badges & Actions */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400 hidden sm:inline">Departure:</span>
            <span className="font-mono font-bold text-white">
              {minutesToTimeString(departureMinutes)}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Traffic:</span>
            <span className="font-semibold text-amber-300">{scenarioName}</span>
          </div>


          <button
            onClick={onReset}
            className="btn-secondary text-xs py-1.5 px-2.5 hover:text-red-400 hover:border-red-500/40"
            title="Reset Simulation to Initial Conditions"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
}
