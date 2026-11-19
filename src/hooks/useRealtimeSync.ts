import { useEffect, useRef } from 'react';
import { getAccessToken } from '../services/api';

interface UseRealtimeSyncOptions {
  enabled?: boolean;
  onEvent: (eventType: string, payload: any) => void;
}

export function useRealtimeSync({ enabled = true, onEvent }: UseRealtimeSyncOptions) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled) return;
    const token = getAccessToken();
    if (!token) return;

    let es: EventSource | null = null;
    let reconnectTimer: number | null = null;
    let closed = false;

    const connect = () => {
      if (closed) return;
      const latestToken = getAccessToken();
      if (!latestToken) return;

      es = new EventSource(`/api/events/stream?token=${encodeURIComponent(latestToken)}`);

      const eventNames = [
        'booking:created',
        'booking:updated',
        'operator:location',
        'operator:duty',
      ];

      eventNames.forEach((evt) => {
        es?.addEventListener(evt, (e: MessageEvent) => {
          try {
            const parsed = JSON.parse(e.data || '{}');
            onEventRef.current(evt, parsed);
          } catch {
            onEventRef.current(evt, {});
          }
        });
      });

      es.onerror = () => {
        es?.close();
        es = null;
        if (!closed) {
          reconnectTimer = window.setTimeout(connect, 4000);
        }
      };
    };

    connect();

    return () => {
      closed = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      es?.close();
    };
  }, [enabled]);
}

