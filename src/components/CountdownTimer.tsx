
import { useEffect, useState, useRef } from 'react';

export default function CountdownTimer({ intervalMs = 30000 }: { intervalMs?: number }) {
  const [secondsLeft, setSecondsLeft] = useState(Math.floor(intervalMs / 1000));
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          return Math.floor(intervalMs / 1000);
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [intervalMs]);

  return (
    <span className="font-mono font-semibold text-blue-500">{secondsLeft}s</span>
  );
}