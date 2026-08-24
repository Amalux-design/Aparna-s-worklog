import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { PaymentStatus, WorkLog, WorkLogInput, WorkStatus } from "../types";
import { isPastOrToday, todayISO } from "../utils/format";
import { TimeInput } from "./TimeInput";

interface LogFormProps {
  initial?: WorkLog | null;
  defaultDate?: string;
  forceStatus?: WorkStatus;
  title: string;
  onSubmit: (input: WorkLogInput) => Promise<void>;
  onClose: () => void;
}

const EVENT_TYPES = ["", "Bridal", "Bridal Party", "Photoshoot", "Party", "Gala", "Other"];
const WORK_TYPES = [
  "Saree Draping",
  "Hair Style",
  "Makeup",
  "Saree Pre Pleating",
  "Assisting",
  "Travel",
  "Shop Work",
  "Other",
];

export function LogForm({ initial, defaultDate, forceStatus, title, onSubmit, onClose }: LogFormProps) {
  const [date, setDate] = useState(initial?.date ?? defaultDate ?? todayISO());
  const [clientName, setClientName] = useState(initial?.clientName ?? "");
  const initialWorkIsCustom = !!initial?.work && !WORK_TYPES.slice(0, -1).includes(initial.work);
  const [work, setWork] = useState(initialWorkIsCustom ? "Other" : initial?.work ?? "");
  const [customWork, setCustomWork] = useState(initialWorkIsCustom ? initial?.work ?? "" : "");
  const [eventType, setEventType] = useState(initial?.eventType ?? "");
  const [startTime, setStartTime] = useState(initial?.startTime ?? "");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "");
  const [qty, setQty] = useState(initial ? String(initial.qty) : "1");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [amountTouched, setAmountTouched] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(initial?.paymentStatus ?? "PENDING");
  const [own, setOwn] = useState(initial?.own ?? true);
  const [referrerName, setReferrerName] = useState(initial?.referrerName ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [statusOverride, setStatusOverride] = useState<WorkStatus | null>(initial?.status ?? forceStatus ?? null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (amountTouched) return;
    const q = Number(qty) || 0;
    const p = Number(price) || 0;
    if (q && p) setAmount(String(q * p));
  }, [qty, price, amountTouched]);

  const autoStatus: WorkStatus = isPastOrToday(date) ? "WORKED" : "RESERVED";
  const effectiveStatus = forceStatus ?? statusOverride ?? autoStatus;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const workValue = work === "Other" ? customWork.trim() : work;
    if (!workValue || !date) {
      setError("Please fill in work and date.");
      return;
    }
    if (!own && !referrerName.trim()) {
      setError("Please enter who referred this work.");
      return;
    }
    if (startTime && endTime && endTime <= startTime) {
      setError("End time must be after start time.");
      return;
    }
    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        date,
        clientName: clientName.trim(),
        work: workValue,
        eventType,
        qty: Number(qty) || 1,
        price: Number(price) || amountNum,
        startTime,
        endTime,
        amount: amountNum,
        paymentStatus,
        status: effectiveStatus,
        own,
        referrerName: own ? "" : referrerName.trim(),
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="inline-error">{error}</div>}

          <label className="field-label">Date</label>
          <input
            type="date"
            className="field-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <label className="field-label">Client name (optional)</label>
          <input
            type="text"
            className="field-input"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="e.g. Sarah Nguyen"
          />

          <label className="field-label">Work</label>
          <select
            className="field-input"
            value={work}
            onChange={(e) => setWork(e.target.value)}
            required
          >
            <option value="" disabled>
              Select work
            </option>
            {WORK_TYPES.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>

          <div className={`reveal-field ${work === "Other" ? "open" : ""}`}>
            <div className="reveal-field-inner">
              <label className="field-label">Work name</label>
              <input
                type="text"
                className="field-input"
                value={customWork}
                onChange={(e) => setCustomWork(e.target.value)}
                placeholder="e.g. Nail Art"
                required={work === "Other"}
              />
            </div>
          </div>

          <label className="field-label">Event type (optional)</label>
          <select className="field-input" value={eventType} onChange={(e) => setEventType(e.target.value)}>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t || "None"}
              </option>
            ))}
          </select>

          <label className="field-label">Start time (optional)</label>
          <TimeInput value={startTime} onChange={setStartTime} />

          <label className="field-label">End time (optional)</label>
          <TimeInput value={endTime} onChange={setEndTime} />

          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label className="field-label">Qty</label>
              <input
                type="number"
                min="1"
                step="1"
                className="field-input"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="field-label">Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="field-input"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="per unit"
              />
            </div>
          </div>

          <label className="field-label">Amount</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="field-input"
            value={amount}
            onChange={(e) => {
              setAmountTouched(true);
              setAmount(e.target.value);
            }}
            placeholder="0"
            required
          />

          <label className="field-label">Work type</label>
          <div className="segmented">
            <button
              type="button"
              className={`segmented-btn ${own ? "active" : ""}`}
              onClick={() => setOwn(true)}
            >
              Direct
            </button>
            <button
              type="button"
              className={`segmented-btn ${!own ? "active" : ""}`}
              onClick={() => setOwn(false)}
            >
              Referred
            </button>
          </div>

          <div className={`reveal-field ${!own ? "open" : ""}`}>
            <div className="reveal-field-inner">
              <label className="field-label">Referred by</label>
              <input
                type="text"
                className="field-input"
                value={referrerName}
                onChange={(e) => setReferrerName(e.target.value)}
                placeholder="e.g. Meera (event planner)"
                required={!own}
              />
            </div>
          </div>

          <label className="field-label">Payment status</label>
          <div className="segmented">
            <button
              type="button"
              className={`segmented-btn ${paymentStatus === "PAID" ? "active" : ""}`}
              onClick={() => setPaymentStatus("PAID")}
            >
              Paid
            </button>
            <button
              type="button"
              className={`segmented-btn ${paymentStatus === "PENDING" ? "active" : ""}`}
              onClick={() => setPaymentStatus("PENDING")}
            >
              Pending
            </button>
          </div>

          {!forceStatus && (
            <>
              <label className="field-label">Status</label>
              <div className="segmented">
                <button
                  type="button"
                  className={`segmented-btn ${effectiveStatus === "WORKED" ? "active" : ""}`}
                  onClick={() => setStatusOverride("WORKED")}
                >
                  Worked
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${effectiveStatus === "RESERVED" ? "active" : ""}`}
                  onClick={() => setStatusOverride("RESERVED")}
                >
                  Reserved
                </button>
              </div>
            </>
          )}

          <label className="field-label">Notes</label>
          <textarea
            className="field-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Optional notes..."
          />

          <button type="submit" className="primary-btn" disabled={submitting}>
            {submitting ? "Saving..." : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}
