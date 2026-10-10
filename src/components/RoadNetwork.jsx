import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Navigation,
  Clock,
  Info,
  X,
  Gauge,
  Milestone,
} from 'lucide-react';
import { isEdgeCongestedAtTime } from '../algorithms/travelTimeModel';
import { minutesToTimeString, formatDuration } from '../utils/timeUtils';

export default function RoadNetwork({
  nodes,
  edges,
  sourceId,
  destinationId,
  onSelectSource,
  onSelectDestination,
  optimalResult,
  departureTimeMinutes,
  // Optional Stepper Highlight Overrides (for Module 5)
  activeStepNode,
  activeStepEdge,
  candidateNode,
  visitedStepNodes = [],
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [animProgress, setAnimProgress] = useState(0); // 0 to 1
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedElement, setSelectedElement] = useState(null); // { type: 'node' | 'edge', data: any }
  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(null);

  const optimalPath = optimalResult?.path || [];
  const edgeDetails = optimalResult?.edgeDetails || [];
  const totalTravelTime = optimalResult?.totalTravelTimeMinutes || 0;

  const nodeMap = new Map();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  // Reset animation when path changes
  useEffect(() => {
    setIsPlaying(false);
    setAnimProgress(0);
    lastTimeRef.current = null;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  }, [optimalPath.join('-'), departureTimeMinutes]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || optimalPath.length <= 1 || totalTravelTime <= 0) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const animate = (timestamp) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaSec = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      const baseDurationSec = Math.max(4, Math.min(10, totalTravelTime * 0.7));
      const step = (deltaSec * playbackSpeed) / baseDurationSec;

      setAnimProgress((prev) => {
        const next = prev + step;
        if (next >= 1.0) {
          setIsPlaying(false);
          return 1.0;
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, playbackSpeed, totalTravelTime, optimalPath.length]);

  // Calculate vehicle coordinates
  const calculateVehiclePosition = () => {
    if (optimalPath.length <= 1 || edgeDetails.length === 0) {
      const srcNode = nodeMap.get(sourceId);
      return {
        x: srcNode?.x || 120,
        y: srcNode?.y || 120,
        simulatedMinutes: departureTimeMinutes,
      };
    }

    const currentMinuteInJourney = animProgress * totalTravelTime;
    const currentSimulatedTime = departureTimeMinutes + currentMinuteInJourney;

    let accumulatedTime = 0;
    for (let i = 0; i < edgeDetails.length; i++) {
      const detail = edgeDetails[i];
      const segmentDuration = detail.durationMinutes;

      if (
        currentMinuteInJourney <= accumulatedTime + segmentDuration ||
        i === edgeDetails.length - 1
      ) {
        const segProgress = Math.max(
          0,
          Math.min(1, (currentMinuteInJourney - accumulatedTime) / segmentDuration)
        );
        const fromNode = nodeMap.get(detail.from);
        const toNode = nodeMap.get(detail.to);

        const x = fromNode.x + (toNode.x - fromNode.x) * segProgress;
        const y = fromNode.y + (toNode.y - fromNode.y) * segProgress;

        return {
          x,
          y,
          simulatedMinutes: currentSimulatedTime,
        };
      }
      accumulatedTime += segmentDuration;
    }

    const lastNode = nodeMap.get(optimalPath[optimalPath.length - 1]);
    return {
      x: lastNode?.x || 560,
      y: lastNode?.y || 520,
      simulatedMinutes: departureTimeMinutes + totalTravelTime,
    };
  };

  const vehiclePos = calculateVehiclePosition();

  const isEdgeInPath = (u, v) => {
    if (!optimalPath || optimalPath.length < 2) return false;
    for (let i = 0; i < optimalPath.length - 1; i++) {
      if (
        (optimalPath[i] === u && optimalPath[i + 1] === v) ||
        (optimalPath[i] === v && optimalPath[i + 1] === u)
      ) {
        return true;
      }
    }
    return false;
  };

  return (
    <div className="panel-card flex flex-col h-full relative overflow-hidden bg-[#0c121e] border-[#1e293b]">
      {/* Visual Controls Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-100">
            Road Network Visualization
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            (Click any road or intersection for details)
          </span>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => {
              if (animProgress >= 1.0) setAnimProgress(0);
              setIsPlaying(!isPlaying);
            }}
            disabled={optimalPath.length <= 1}
            className="text-[11px] font-semibold px-2 py-1 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white rounded flex items-center gap-1 transition"
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{isPlaying ? 'Pause' : animProgress > 0 ? 'Resume' : 'Play Route'}</span>
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setAnimProgress(0);
            }}
            disabled={animProgress === 0}
            className="text-slate-400 hover:text-slate-200 disabled:opacity-30 p-1"
            title="Rewind Route"
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          <div className="flex items-center gap-1 border-l border-slate-700 pl-2">
            {[1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded transition ${
                  playbackSpeed === spd
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <div className="border-l border-slate-700 pl-2 text-[11px] font-mono text-cyan-300 flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span>{minutesToTimeString(vehiclePos.simulatedMinutes, true)}</span>
          </div>
        </div>
      </div>

      {/* Interactive SVG Canvas */}
      <div className="relative w-full flex-1 min-h-[460px] flex items-center justify-center p-2 select-none">
        <svg
          viewBox="0 0 680 640"
          className="w-full h-full max-w-[680px] max-h-[640px]"
        >
          <defs>
            <filter id="glow-optimal" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-congested" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-siren" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines */}
          <g opacity="0.12">
            <line x1="60" y1="120" x2="620" y2="120" stroke="#334155" strokeDasharray="3 3" />
            <line x1="60" y1="320" x2="620" y2="320" stroke="#334155" strokeDasharray="3 3" />
            <line x1="60" y1="520" x2="620" y2="520" stroke="#334155" strokeDasharray="3 3" />
            <line x1="120" y1="60" x2="120" y2="580" stroke="#334155" strokeDasharray="3 3" />
            <line x1="340" y1="60" x2="340" y2="580" stroke="#334155" strokeDasharray="3 3" />
            <line x1="560" y1="60" x2="560" y2="580" stroke="#334155" strokeDasharray="3 3" />
          </g>

          {/* 1. Road Edges */}
          {edges.map((edge) => {
            const uNode = nodeMap.get(edge.from);
            const vNode = nodeMap.get(edge.to);
            if (!uNode || !vNode) return null;

            const isCongested = isEdgeCongestedAtTime(edge, departureTimeMinutes);
            const inOptimal = isEdgeInPath(edge.from, edge.to);

            // Step-by-Step highlighting (Module 5)
            const isStepActive =
              activeStepEdge &&
              ((activeStepEdge.from === edge.from && activeStepEdge.to === edge.to) ||
                (activeStepEdge.from === edge.to && activeStepEdge.to === edge.from));

            const midX = (uNode.x + vNode.x) / 2;
            const midY = (uNode.y + vNode.y) / 2;
            const dx = vNode.x - uNode.x;
            const dy = vNode.y - uNode.y;
            const isHorizontal = Math.abs(dx) > Math.abs(dy);
            const labelX = midX + (isHorizontal ? 0 : 28);
            const labelY = midY + (isHorizontal ? -14 : 0);

            return (
              <g
                key={edge.id}
                className="cursor-pointer group"
                onClick={() => setSelectedElement({ type: 'edge', data: edge })}
              >
                {/* Underlying Edge Line */}
                <line
                  x1={uNode.x}
                  y1={uNode.y}
                  x2={vNode.x}
                  y2={vNode.y}
                  stroke={isCongested ? '#f59e0b' : '#334155'}
                  strokeWidth={isCongested ? 7 : 5}
                  strokeOpacity={isCongested ? 0.85 : 0.6}
                  strokeDasharray={isCongested ? '8 4' : 'none'}
                />

                {/* Congestion Glow */}
                {isCongested && (
                  <line
                    x1={uNode.x}
                    y1={uNode.y}
                    x2={vNode.x}
                    y2={vNode.y}
                    stroke="#f59e0b"
                    strokeWidth={14}
                    strokeOpacity={0.25}
                    filter="url(#glow-congested)"
                  />
                )}

                {/* Stepper Active Edge */}
                {isStepActive && (
                  <line
                    x1={uNode.x}
                    y1={uNode.y}
                    x2={vNode.x}
                    y2={vNode.y}
                    stroke="#38bdf8"
                    strokeWidth={8}
                    strokeOpacity={0.9}
                    strokeDasharray="4 4"
                  />
                )}

                {/* Optimal Route Highlight */}
                {inOptimal && (
                  <>
                    <line
                      x1={uNode.x}
                      y1={uNode.y}
                      x2={vNode.x}
                      y2={vNode.y}
                      stroke="#10b981"
                      strokeWidth={12}
                      strokeOpacity={0.35}
                      filter="url(#glow-optimal)"
                    />
                    <line
                      x1={uNode.x}
                      y1={uNode.y}
                      x2={vNode.x}
                      y2={vNode.y}
                      stroke="#10b981"
                      strokeWidth={6}
                      className="animate-dash"
                    />
                  </>
                )}

                {/* Metric Label */}
                <g transform={`translate(${labelX}, ${labelY})`}>
                  <rect
                    x="-26"
                    y="-9"
                    width="52"
                    height="18"
                    rx="4"
                    fill="#0f172a"
                    stroke={isCongested ? '#b45309' : inOptimal ? '#059669' : '#1e293b'}
                    strokeWidth="1"
                    opacity="0.95"
                    className="group-hover:stroke-cyan-400"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill={isCongested ? '#fcd34d' : inOptimal ? '#6ee7b7' : '#94a3b8'}
                    fontSize="8.5"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="600"
                  >
                    {edge.distance}km•{edge.speedLimit}
                  </text>

                  {/* Congestion Multiplier Badge */}
                  {isCongested && (
                    <g transform="translate(0, 14)">
                      <rect x="-18" y="-6" width="36" height="12" rx="3" fill="#b45309" />
                      <text
                        x="0"
                        y="3"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="7.5"
                        fontFamily="JetBrains Mono, monospace"
                        fontWeight="700"
                      >
                        {edge.congestionMultiplier}x CONG
                      </text>
                    </g>
                  )}
                </g>
              </g>
            );
          })}

          {/* 2. Intersections (Nodes A-I) */}
          {nodes.map((node) => {
            const isSource = node.id === sourceId;
            const isDestination = node.id === destinationId;
            const inOptimal = optimalPath.includes(node.id);

            // Stepper state overrides (Module 5)
            const isCurrentStepNode = activeStepNode === node.id;
            const isCandidateStepNode = candidateNode === node.id;
            const isVisitedStepNode = visitedStepNodes.includes(node.id);

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                className="cursor-pointer group"
                onClick={() => setSelectedElement({ type: 'node', data: node })}
              >
                {/* Ping rings for endpoints */}
                {isSource && (
                  <circle
                    r="32"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeOpacity="0.4"
                    className="animate-ping"
                  />
                )}
                {isDestination && (
                  <circle
                    r="32"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeOpacity="0.4"
                    className="animate-ping"
                  />
                )}

                {/* Outer Ring */}
                <circle
                  r={isSource || isDestination ? 24 : 18}
                  fill={
                    isCurrentStepNode
                      ? '#0284c7'
                      : isCandidateStepNode
                      ? '#d97706'
                      : isSource
                      ? '#7f1d1d'
                      : isDestination
                      ? '#064e3b'
                      : inOptimal
                      ? '#065f46'
                      : isVisitedStepNode
                      ? '#1e293b'
                      : '#111827'
                  }
                  stroke={
                    isCurrentStepNode
                      ? '#38bdf8'
                      : isCandidateStepNode
                      ? '#fbbf24'
                      : isSource
                      ? '#ef4444'
                      : isDestination
                      ? '#10b981'
                      : inOptimal
                      ? '#34d399'
                      : '#475569'
                  }
                  strokeWidth={isSource || isDestination || isCurrentStepNode ? 3 : 2}
                  className="transition-all duration-300 group-hover:stroke-cyan-400 group-hover:scale-105"
                />

                {/* Inner Core */}
                <circle
                  r={isSource || isDestination ? 17 : 12}
                  fill={
                    isSource
                      ? '#dc2626'
                      : isDestination
                      ? '#059669'
                      : inOptimal
                      ? '#10b981'
                      : '#0f172a'
                  }
                />

                {/* Letter */}
                <text
                  x="0"
                  y={isSource || isDestination ? 6 : 4}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={isSource || isDestination ? 15 : 12}
                  fontWeight="800"
                  fontFamily="Inter, sans-serif"
                >
                  {node.id}
                </text>

                {/* Descriptive label pill below node */}
                <g transform={`translate(0, ${isSource || isDestination ? 34 : 26})`}>
                  <rect
                    x="-30"
                    y="-8"
                    width="60"
                    height="16"
                    rx="4"
                    fill="#0a0f1d"
                    stroke={isSource ? '#ef4444' : isDestination ? '#10b981' : '#334155'}
                    strokeWidth="1"
                    opacity="0.95"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill={isSource ? '#f87171' : isDestination ? '#34d399' : '#cbd5e1'}
                    fontSize="8.5"
                    fontWeight="700"
                    fontFamily="Inter, sans-serif"
                  >
                    {isSource ? 'DEPOT' : isDestination ? 'HOSPITAL' : node.name.split(' ')[0]}
                  </text>
                </g>
              </g>
            );
          })}

          {/* 3. Animated Ambulance */}
          {optimalPath.length > 1 && (
            <g
              transform={`translate(${vehiclePos.x}, ${vehiclePos.y})`}
              filter="url(#glow-siren)"
              className="pointer-events-none transition-transform duration-75"
            >
              <circle r="18" fill="rgba(239, 68, 68, 0.4)" className="animate-pulse" />
              <rect
                x="-14"
                y="-9"
                width="28"
                height="18"
                rx="4"
                fill="#ffffff"
                stroke="#dc2626"
                strokeWidth="2"
              />
              <path
                d="M -3 -5 L 3 -5 L 3 -2 L 6 -2 L 6 2 L 3 2 L 3 5 L -3 5 L -3 2 L -6 2 L -6 -2 L -3 -2 Z"
                fill="#dc2626"
              />
              <circle cx="-8" cy="-11" r="2.5" fill="#ef4444" className="animate-ping" />
              <circle cx="8" cy="-11" r="2.5" fill="#3b82f6" className="animate-ping" />
            </g>
          )}
        </svg>

        {/* Selected Element Inspection Card / Modal */}
        {selectedElement && (
          <div className="absolute top-4 right-4 bg-slate-900 border border-slate-700 p-4 rounded-xl max-w-xs w-full shadow-2xl z-40">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
              <span className="font-bold text-white text-xs">
                {selectedElement.type === 'node'
                  ? `Intersection ${selectedElement.data.id}`
                  : `Road Segment ${selectedElement.data.id}`}
              </span>
              <button
                onClick={() => setSelectedElement(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedElement.type === 'node' ? (
              <div className="flex flex-col gap-2.5 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Full Name:</span>
                  <span className="text-white font-semibold">{selectedElement.data.name}</span>
                </div>
                <div className="flex items-center justify-between font-mono text-[11px] text-slate-300">
                  <span>Coordinates:</span>
                  <span>({selectedElement.data.x}, {selectedElement.data.y})</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => {
                      onSelectSource(selectedElement.data.id);
                      setSelectedElement(null);
                    }}
                    className="btn-primary text-xs py-1.5 justify-center"
                  >
                    Set as Depot
                  </button>
                  <button
                    onClick={() => {
                      onSelectDestination(selectedElement.data.id);
                      setSelectedElement(null);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-1.5 rounded-lg text-xs transition"
                  >
                    Set as Hospital
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Road Name:</span>
                  <span className="text-white font-semibold">{selectedElement.data.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px] text-slate-300">
                  <div>Length: {selectedElement.data.distance} km</div>
                  <div>Limit: {selectedElement.data.speedLimit} km/h</div>
                </div>
                <div className="pt-2 border-t border-slate-800 text-[11px]">
                  <span className="text-slate-400 block mb-0.5">Congestion State:</span>
                  {isEdgeCongestedAtTime(selectedElement.data, departureTimeMinutes) ? (
                    <span className="text-amber-300 font-bold">
                      {selectedElement.data.congestionMultiplier}x Active Delay (Rush Hour)
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-semibold">Free Flow (Normal Speed)</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend Bar */}
      <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-600 border border-red-400"></span>
            <span className="text-slate-300 font-medium">Depot ({sourceId})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600 border border-emerald-400"></span>
            <span className="text-slate-300 font-medium">Hospital ({destinationId})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-1.5 bg-emerald-500 rounded"></span>
            <span className="text-emerald-400 font-semibold">Optimal Route</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-1.5 bg-amber-500 rounded border border-amber-300 border-dashed"></span>
            <span className="text-amber-300 font-medium">Congested Road</span>
          </div>
        </div>
      </div>
    </div>
  );
}
