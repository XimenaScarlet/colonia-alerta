import { useEffect, useRef } from 'react';

export function useAutoRefresh(callback: () => Promise<void>, interval: number = 15000) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Ejecutar inmediatamente al montar
    callback();

    // Luego ejecutar cada 'interval' milisegundos
    intervalRef.current = setInterval(() => {
      if (navigator.onLine) {
        callback();
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [callback, interval]);
}
