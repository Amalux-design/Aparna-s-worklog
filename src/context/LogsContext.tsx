import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { PaymentStatus, WorkLog, WorkLogInput } from "../types";
import { api } from "../api/client";

interface LogsContextValue {
  logs: WorkLog[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addLog: (input: WorkLogInput) => Promise<WorkLog>;
  addReservation: (input: WorkLogInput) => Promise<WorkLog>;
  editLog: (id: string, patch: Partial<WorkLogInput>) => Promise<WorkLog>;
  removeLog: (id: string) => Promise<void>;
  markPaid: (id: string) => Promise<void>;
}

const LogsContext = createContext<LogsContextValue | undefined>(undefined);

export function LogsProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getLogs();
      setLogs(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addLog = useCallback(async (input: WorkLogInput) => {
    const created = await api.createLog(input);
    setLogs((prev) => [created, ...prev]);
    return created;
  }, []);

  const addReservation = useCallback(async (input: WorkLogInput) => {
    const created = await api.createReservation(input);
    setLogs((prev) => [created, ...prev]);
    return created;
  }, []);

  const editLog = useCallback(async (id: string, patch: Partial<WorkLogInput>) => {
    const updated = await api.updateLog(id, patch);
    setLogs((prev) => prev.map((l) => (l.id === id ? updated : l)));
    return updated;
  }, []);

  const removeLog = useCallback(async (id: string) => {
    const prevLogs = logs;
    setLogs((prev) => prev.filter((l) => l.id !== id));
    try {
      await api.deleteLog(id);
    } catch (e) {
      setLogs(prevLogs);
      throw e;
    }
  }, [logs]);

  const markPaid = useCallback(async (id: string) => {
    const prevLogs = logs;
    setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, paymentStatus: "PAID" as PaymentStatus } : l)));
    try {
      await api.updatePaymentStatus(id, "PAID");
    } catch (e) {
      setLogs(prevLogs);
      throw e;
    }
  }, [logs]);

  const value = useMemo(
    () => ({ logs, loading, error, refetch, addLog, addReservation, editLog, removeLog, markPaid }),
    [logs, loading, error, refetch, addLog, addReservation, editLog, removeLog, markPaid]
  );

  return <LogsContext.Provider value={value}>{children}</LogsContext.Provider>;
}

export function useLogs(): LogsContextValue {
  const ctx = useContext(LogsContext);
  if (!ctx) throw new Error("useLogs must be used within LogsProvider");
  return ctx;
}
