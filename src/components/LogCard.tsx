import { Trash2 } from "lucide-react";
import type { WorkLog } from "../types";
import { StatusPill } from "./StatusPill";
import { formatCurrency, formatTime } from "../utils/format";

interface LogCardProps {
  log: WorkLog;
  onClick: () => void;
  onDelete?: () => void;
}

export function LogCard({ log, onClick, onDelete }: LogCardProps) {
  return (
    <div
      className="card"
      style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10, cursor: "pointer" }}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>{log.clientName || log.work}</div>
        <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 2 }}>
          {log.clientName ? log.work : "No client name"}
          {log.eventType ? ` · ${log.eventType}` : ""}
          {log.qty > 1 ? ` · ${log.qty} × ${formatCurrency(log.price)}` : ""}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          <StatusPill kind={log.status} />
          <StatusPill kind={log.paymentStatus} />
          <span className="own-tag">
            {log.own ? "Direct" : log.referrerName ? `Referred · ${log.referrerName}` : "Referred"}
          </span>
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{formatCurrency(log.amount)}</div>
        {log.startTime && (
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4 }}>
            {formatTime(log.startTime)}
          </div>
        )}
        {onDelete && (
          <button
            aria-label="Delete log"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={{
              marginTop: 10,
              background: "none",
              border: "none",
              padding: 8,
              color: "var(--color-text-secondary)",
              minWidth: 44,
              minHeight: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
