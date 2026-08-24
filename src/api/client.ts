import type { ApiResponse, CalendarData, PaymentStatus, WorkLog, WorkLogInput } from "../types";
import { mockBackend } from "./mockBackend";

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined;
export const USING_MOCK = !APPS_SCRIPT_URL;

async function callApi<T>(action: string, params: Record<string, unknown> = {}): Promise<T> {
  const isRead = action === "getLogs" || action === "getCalendarData";
  let response: Response;

  if (isRead) {
    const url = new URL(APPS_SCRIPT_URL as string);
    url.searchParams.set("action", action);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v));
    }
    response = await fetch(url.toString());
  } else {
    response = await fetch(APPS_SCRIPT_URL as string, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, ...params }),
    });
  }

  const json = (await response.json()) as ApiResponse<T>;
  if (!json.success) {
    throw new Error(json.error || "Request failed");
  }
  return json.data;
}

export const api = {
  async getLogs(): Promise<WorkLog[]> {
    if (USING_MOCK) return mockBackend.getLogs();
    return callApi<WorkLog[]>("getLogs");
  },

  async createLog(input: WorkLogInput): Promise<WorkLog> {
    if (USING_MOCK) return mockBackend.createLog(input);
    return callApi<WorkLog>("createLog", input as unknown as Record<string, unknown>);
  },

  async updateLog(id: string, patch: Partial<WorkLogInput>): Promise<WorkLog> {
    if (USING_MOCK) return mockBackend.updateLog(id, patch);
    return callApi<WorkLog>("updateLog", { id, ...patch });
  },

  async deleteLog(id: string): Promise<{ success: true }> {
    if (USING_MOCK) return mockBackend.deleteLog(id);
    return callApi<{ success: true }>("deleteLog", { id });
  },

  async getCalendarData(year: number, month: number): Promise<CalendarData> {
    if (USING_MOCK) return mockBackend.getCalendarData(year, month);
    return callApi<CalendarData>("getCalendarData", { year, month: month + 1 });
  },

  async createReservation(input: WorkLogInput): Promise<WorkLog> {
    if (USING_MOCK) return mockBackend.createReservation(input);
    return callApi<WorkLog>("createReservation", input as unknown as Record<string, unknown>);
  },

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<WorkLog> {
    if (USING_MOCK) return mockBackend.updatePaymentStatus(id, paymentStatus);
    return callApi<WorkLog>("updatePaymentStatus", { id, paymentStatus });
  },
};
