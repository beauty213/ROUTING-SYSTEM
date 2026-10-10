import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

/**
 * Glossary of beginner-friendly plain language explanations.
 */
export const GLOSSARY = {
  dijkstra: {
    term: "Dijkstra's Algorithm",
    text: "A famous computer science method to find the lowest-cost path between two points by always exploring the earliest reachable intersection next.",
  },
  time_dependent: {
    term: "Time-Dependent Shortest Path",
    text: "A routing method where road transit times change depending on the exact clock time you enter each road, rather than staying constant all day.",
  },
  node: {
    term: "Intersection (Node)",
    text: "A street junction where two or more roads connect. In this system, intersections are labeled A through I.",
  },
  edge: {
    term: "Road Segment (Edge)",
    text: "A section of street connecting two adjacent intersections. Each road has a length in km, speed limit, and traffic condition.",
  },
  weight: {
    term: "Cost / Weight",
    text: "The value the algorithm minimizes. In this emergency system, cost is travel time in minutes, not physical distance.",
  },
  priority_queue: {
    term: "Priority Queue (Min-Heap)",
    text: "A smart waiting list that instantly provides the intersection with the earliest arrival time, speeding up the search to O((V+E) log V).",
  },
  congestion_multiplier: {
    term: "Congestion Multiplier",
    text: "How much traffic slows down traffic. 1.0 means free-flowing traffic. 2.5 means speed is divided by 2.5, making the trip take 2.5 times longer.",
  },
  fifo: {
    term: "FIFO (First-In, First-Out) Property",
    text: "The common-sense rule that departing later can never cause you to arrive earlier. Necessary for Dijkstra's algorithm to work correctly.",
  },
};

export default function HelpTooltip({ termKey, customText, position = 'top' }) {
  const [isVisible, setIsVisible] = useState(false);
  const info = GLOSSARY[termKey] || { term: 'Information', text: customText };

  return (
    <span className="relative inline-flex items-center align-middle ml-1">
      <button
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        className="text-slate-400 hover:text-cyan-400 transition cursor-help p-0.5 rounded focus:outline-none"
        aria-label={`Learn more about ${info.term}`}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {isVisible && (
        <span
          className={`absolute z-50 w-64 p-2.5 bg-slate-900 border border-slate-700 rounded-lg shadow-xl text-xs text-slate-200 pointer-events-none transition-opacity duration-200 ${
            position === 'top'
              ? 'bottom-full left-1/2 -translate-x-1/2 mb-2'
              : 'top-full left-1/2 -translate-x-1/2 mt-2'
          }`}
        >
          <span className="font-bold text-white block mb-1 text-[11px] text-cyan-300">
            {info.term}
          </span>
          <span className="text-[11px] text-slate-300 leading-normal block">
            {info.text || customText}
          </span>
        </span>
      )}
    </span>
  );
}
