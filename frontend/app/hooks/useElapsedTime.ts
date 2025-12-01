
import { useEffect, useState } from "react";

export function useElapsedTime(startedAt: string, isActive: boolean) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    const updatedElapsedTime = () => {
      const start = new Date(startedAt).getTime();
      const now = Date.now();
      setElapsedTime(now - start);
    }

    // Set initial time calculation
    updatedElapsedTime();
    const interval = setInterval(updatedElapsedTime, 1000);

    return () => clearInterval(interval);

  }, [startedAt, isActive]);

  return elapsedTime;
}