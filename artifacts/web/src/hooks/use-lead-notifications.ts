import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface NewLeadPayload {
  type: "new_lead";
  lead: {
    id: number;
    fullName: string;
    email: string | null;
    phone: string | null;
    status: string;
    source: string | null;
    createdAt: string;
  };
}

export function useLeadNotifications(enabled: boolean) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let destroyed = false;

    function connect() {
      if (destroyed) return;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const url = `${protocol}//${window.location.host}/api/ws`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data as string) as NewLeadPayload;

          if (payload.type === "new_lead") {
            toast({
              title: "New lead received!",
              description: `${payload.lead.fullName}${payload.lead.email ? ` — ${payload.lead.email}` : ""}`,
            });

            queryClient.invalidateQueries({ queryKey: ["leads"] });
            queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
          }
        } catch {
        }
      };

      ws.onclose = () => {
        if (!destroyed) {
          reconnectTimerRef.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      destroyed = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [enabled, queryClient, toast]);
}
