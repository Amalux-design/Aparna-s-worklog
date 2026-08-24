import { useMemo, useState } from "react";
import { useLogs } from "../context/LogsContext";
import { LogCard } from "../components/LogCard";
import { LogForm } from "../components/LogForm";
import { FAB } from "../components/FAB";
import { formatDateHeading } from "../utils/format";
import type { WorkLog, WorkLogInput } from "../types";

export function LogsPage() {
  const { logs, loading, error, addLog, editLog, removeLog } = useLogs();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<WorkLog | null>(null);

  const grouped = useMemo(() => {
    const groups: { date: string; items: WorkLog[] }[] = [];
    for (const log of logs) {
      const g = groups.find((g) => g.date === log.date);
      if (g) g.items.push(log);
      else groups.push({ date: log.date, items: [log] });
    }
    return groups;
  }, [logs]);

  async function handleDelete(id: string) {
    if (confirm("Delete this log entry?")) {
      await removeLog(id).catch((e) => alert(e.message));
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">Work Logs</h1>

      {error && <div className="inline-error">{error}</div>}

      {loading && <div className="spinner" />}

      {!loading && logs.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-title">Your diary is empty</div>
          <div>Tap the + button to log your first booking.</div>
        </div>
      )}

      {!loading &&
        grouped.map((group) => (
          <div key={group.date}>
            <div className="section-heading">{formatDateHeading(group.date)}</div>
            {group.items.map((log) => (
              <LogCard
                key={log.id}
                log={log}
                onClick={() => setEditing(log)}
                onDelete={() => handleDelete(log.id)}
              />
            ))}
          </div>
        ))}

      <FAB onClick={() => setShowAdd(true)} />

      {showAdd && (
        <LogForm
          title="Add Log"
          onSubmit={async (input: WorkLogInput) => {
            await addLog(input);
          }}
          onClose={() => setShowAdd(false)}
        />
      )}

      {editing && (
        <LogForm
          title="Edit Log"
          initial={editing}
          onSubmit={async (input: WorkLogInput) => {
            await editLog(editing.id, input);
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
