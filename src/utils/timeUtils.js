/**
 * timeUtils.js
 * Utilities for time manipulation and conversion in the emergency routing system.
 * Times are represented internally as floating-point or integer minutes from midnight (0 to 1439).
 */

/**
 * Converts a "HH:MM" or "HH:MM:SS" time string to minutes from midnight.
 * @param {string} timeStr - e.g. "17:30" or "08:15"
 * @returns {number} - minutes from midnight (e.g. 1050 for 17:30)
 */
export function timeStringToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.trim().split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  const seconds = parts[2] ? parseFloat(parts[2]) : 0;
  return hours * 60 + minutes + seconds / 60;
}

/**
 * Converts minutes from midnight to a readable "HH:MM" or "HH:MM:SS" string.
 * Supports values >= 1440 by wrapping around 24 hours.
 * @param {number} totalMinutes
 * @param {boolean} includeSeconds
 * @returns {string} - e.g. "17:38" or "17:38:24"
 */
export function minutesToTimeString(totalMinutes, includeSeconds = false) {
  if (isNaN(totalMinutes)) return '00:00';
  // Normalize to 24-hour cycle
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = Math.floor(normalized % 60);
  const seconds = Math.round((normalized % 1) * 60);

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  
  if (includeSeconds) {
    const ss = String(seconds).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  return `${hh}:${mm}`;
}

/**
 * Formats a duration in minutes into a human-readable format.
 * e.g. 8.4 minutes -> "8 min 24 sec" or "8.40 min"
 * @param {number} durationMinutes
 * @returns {string}
 */
export function formatDuration(durationMinutes) {
  if (durationMinutes === undefined || durationMinutes === null || isNaN(durationMinutes)) {
    return '0 min';
  }
  if (durationMinutes === 0) return '0 min 00 sec';

  const mins = Math.floor(durationMinutes);
  const secs = Math.round((durationMinutes - mins) * 60);

  if (mins === 0) {
    return `${secs} sec`;
  }
  return `${mins} min ${String(secs).padStart(2, '0')} sec`;
}

/**
 * Checks if a given timestamp (in minutes from midnight) falls within a window [startMin, endMin].
 * Supports overnight windows (e.g. 23:00 to 01:00).
 * @param {number} currentMin
 * @param {number} startMin
 * @param {number} endMin
 * @returns {boolean}
 */
export function isTimeInWindow(currentMin, startMin, endMin) {
  const normCurrent = ((currentMin % 1440) + 1440) % 1440;
  const normStart = ((startMin % 1440) + 1440) % 1440;
  const normEnd = ((endMin % 1440) + 1440) % 1440;

  if (normStart <= normEnd) {
    return normCurrent >= normStart && normCurrent <= normEnd;
  } else {
    // Crosses midnight (e.g. 23:00 to 02:00)
    return normCurrent >= normStart || normCurrent <= normEnd;
  }
}
