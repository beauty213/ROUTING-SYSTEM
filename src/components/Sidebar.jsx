import React from 'react';
import {
  LayoutDashboard,
  Navigation,
  Gauge,
  Scale,
  BrainCircuit,
  Siren,
  X,
  ExternalLink,
  Map,
} from 'lucide-react';

export const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Home Dashboard',
    shortLabel: 'Home',
    icon: LayoutDashboard,
    badge: 'Overview',
    description: 'Quick start & network overview',
  },
  {
    id: 'realtime_map',
    label: 'Hyderabad Google Maps Live',
    shortLabel: 'Google Map',
    icon: Map,
    badge: 'Live Traffic',
    description: 'Real Google Maps traffic & directions',
  },
  {
    id: 'simulator',
    label: 'Route Simulator',
    shortLabel: 'Simulator',
    icon: Navigation,
    badge: 'Main',
    description: 'Working emergency routing simulation',
  },
  {
    id: 'traffic',
    label: 'Traffic Monitor',
    shortLabel: 'Traffic',
    icon: Gauge,
    description: 'Congestion on individual roads',
  },
  {
    id: 'comparison',
    label: 'Route Comparison',
    shortLabel: 'Comparison',
    icon: Scale,
    description: 'Compare 3 routing strategies',
  },
  {
    id: 'algorithm',
    label: 'Algorithm Explorer',
    shortLabel: 'Algorithm',
    icon: BrainCircuit,
    badge: 'Step-by-Step',
    description: 'Interactive execution stepper & math',
  },
];

export default function Sidebar({
  activePage,
  onSelectPage,
  isOpen,
  onCloseMobile,
}) {
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Persistent Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-[#090d16] border-r border-[#1a2333] flex flex-col justify-between z-50 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col">
          {/* Logo & Brand Header */}
          <div className="px-5 py-5 border-b border-[#1a2333] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-950/70 border border-red-500/50 rounded-xl text-red-500 siren-active">
                <Siren className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-white tracking-tight block">
                  Smart EMS Routing
                </span>
                <span className="text-[10px] text-slate-400 font-medium block">
                  Time-Dependent Dijkstra
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 flex flex-col gap-1.5 overflow-y-auto">
            <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              System Modules
            </span>

            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectPage(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl font-medium text-xs flex items-center justify-between transition group ${
                    isActive
                      ? 'bg-red-950/70 text-white border border-red-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition ${
                        isActive
                          ? 'text-red-400 animate-pulse'
                          : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    <span className="font-semibold">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                        isActive
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info box */}
        <div className="p-4 border-t border-[#1a2333] bg-[#0c121e]">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>Algorithm Status:</span>
            <span className="text-emerald-400 font-mono font-bold">ACTIVE</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Grid: 3×3 (9 Nodes, 12 Roads)
          </div>
          <div className="mt-2 text-[10px] text-slate-500">
            FIFO Guaranteed • O((V+E) log V)
          </div>
        </div>
      </aside>
    </>
  );
}
