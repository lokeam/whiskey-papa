/**
 * Elapsed Time Hook
 *
 * Provides live timer for active workflow runs, updating every second.
 *
 * Edge Case Handling:
 * - Invalid timestamps ('0001-01-01T00:00:00Z'): Uses component mount time as fallback
 * - Unreasonable timestamps (>1 year old or future): Uses fallback to prevent display errors
 * - Inactive workflows: Timer pauses, returns last calculated value
 *
 * Update Frequency: 1 second interval when isActive=true
 *
 * Used by: ActiveWorkflows component for live duration display
 *
 * @param startedAt - ISO timestamp when workflow started
 * @param isActive - Whether workflow is currently running (QUEUED/RUNNING)
 * @returns Elapsed time in milliseconds
 */

import { useEffect, useState } from "react";

export function useElapsedTime(startedAt: string, isActive: boolean) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [fallbackStartTime] = useState(() => Date.now()); // Capture mount time as fallback

  useEffect(() => {
    if (!isActive) return;

    const updatedElapsedTime = () => {
      let start: number;

      // Hatchet returns '0001-01-01T00:00:00Z' for workflows that haven't started yet
      if (!startedAt || startedAt === '0001-01-01T00:00:00Z') {
        // Use the time when this component mounted as the start time
        start = fallbackStartTime;
      } else {
        start = new Date(startedAt).getTime();

        // Sanity check - if timestamp is unreasonably old (> 1 year), use fallback
        const now = Date.now();
        if (start < now - 365 * 24 * 60 * 60 * 1000 || start > now) {
          start = fallbackStartTime;
        }
      }

      const now = Date.now();
      const elapsed = now - start;
      setElapsedTime(elapsed > 0 ? elapsed : 0);
    }

    // Set initial time calculation
    updatedElapsedTime();
    const interval = setInterval(updatedElapsedTime, 1000);

    return () => clearInterval(interval);

  }, [startedAt, isActive, fallbackStartTime]);

  return elapsedTime;
}