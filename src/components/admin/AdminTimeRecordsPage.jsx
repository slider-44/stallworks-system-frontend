import React, { useEffect, useMemo, useState } from "react";
import { Clock, Pencil, Trash2, Loader2, PenLine, Save, X, ShieldAlert } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useAttendance } from "../../context/AttendanceContext";
import { useAccountManagement } from "../../context/AccountManagementContext";
import { todayISO } from "../../lib/dateUtils";

const formatTime12 = (t) => {
  if (!t) return "--:--";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
};

// "HH:mm" (24h, what <input type="time"> gives/wants) <-> "HH:mm AM/PM"
// display are handled separately — this just converts backend "HH:mm:ss"
// into the "HH:mm" shape the time input needs.
const to24h = (t) => (t ? t.slice(0, 5) : "");

const formatDateShort = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

// There's no separate "date" for timeOut in this schema — just the one
// record date plus two clock times. So an overnight shift (clock out
// after midnight) always has timeOut < timeIn as raw clock values. The
// standard convention: treat that as "next day" and add 24h rather than
// clamping to 0 — see crossesMidnight() below for the same check used to
// show it in the UI.
const minutesBetween = (startStr, endStr) => {
  if (!startStr || !endStr) return 0;
  const [sh, sm] = startStr.split(":").map(Number);
  const [eh, em] = endStr.split(":").map(Number);
  let diff = eh * 60 + em - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  return diff;
};

const crossesMidnight = (startStr, endStr) => {
  if (!startStr || !endStr) return false;
  const [sh, sm] = startStr.split(":").map(Number);
  const [eh, em] = endStr.split(":").map(Number);
  return eh * 60 + em < sh * 60 + sm;
};

const formatHoursMinutes = (totalMinutes) => `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;

// Admin tool: look up any day's clock in/out logs (optionally narrowed by
// branch/crew), correct a wrong time with a required audit reason, or
// delete a record outright. Separate from AdminAttendancePage (that one's
// just "who's clocked in right now" with a quick clock-out action).
export default function AdminTimeRecordsPage() {
  const { employeeId: loggedInEmployeeId, isAdmin } = useAuth();
  const { adminRecords, adminRecordsLoading, loadAdminRecords, updateRecord, deleteRecord } = useAttendance();
  const { branches, employees } = useAccountManagement();

  const [date, setDate] = useState(todayISO());
  const [branchId, setBranchId] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editTimeIn, setEditTimeIn] = useState("");
  const [editTimeOut, setEditTimeOut] = useState("");
  const [editReason, setEditReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAdminRecords(date, branchId || undefined, employeeId || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, branchId, employeeId]);

  const nameFor = (id) => {
    const emp = employees.find((e) => String(e.id) === String(id));
    return emp ? `${emp.firstName} ${emp.lastName}` : `#${id}`;
  };
  const branchNameFor = (id) => branches.find((b) => String(b.id) === String(id))?.name || `#${id}`;

  const editingRecord = useMemo(
    () => adminRecords.find((r) => r.id === editingId) || null,
    [adminRecords, editingId]
  );

  const startEdit = (record) => {
    setError(null);
    setEditingId(record.id);
    setEditTimeIn(to24h(record.timeIn));
    setEditTimeOut(to24h(record.timeOut));
    setEditReason("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTimeIn("");
    setEditTimeOut("");
    setEditReason("");
    setError(null);
  };

  const handleSave = async () => {
    if (!editTimeIn || !editReason.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await updateRecord(editingId, {
        timeIn: editTimeIn,
        timeOut: editTimeOut || null,
        reason: editReason.trim(),
        updatedBy: Number(loggedInEmployeeId),
      });
      cancelEdit();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this time record? This can't be undone.")) return;
    setDeletingId(id);
    setError(null);
    try {
      await deleteRecord(id);
      if (editingId === id) cancelEdit();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const canSave = editTimeIn && editReason.trim().length > 0;

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
        <ShieldAlert size={28} className="mx-auto text-amber-500 mb-2" />
        <p className="text-slate-600 font-medium">Admin or Manager access required.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#8f1d1d] flex items-center justify-center shrink-0">
            <Clock size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Time Records</h2>
            <p className="text-xs text-slate-400">Review staff clock in/out logs. Edit or remove a record when it's wrong.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-[#b3362c] whitespace-nowrap">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 border border-slate-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f2c2be]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-[#b3362c] whitespace-nowrap">Branch</label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="h-11 border border-slate-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f2c2be] min-w-[150px]"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-[#b3362c] whitespace-nowrap">Crew</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="h-11 border border-slate-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f2c2be] min-w-[150px]"
            >
              <option value="">All Crew</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-5">{error}</div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-5">
        {adminRecordsLoading ? (
          <div className="py-10 text-center text-slate-400">
            <Loader2 size={20} className="inline animate-spin mr-2" /> Loading…
          </div>
        ) : adminRecords.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-10">No attendance records for this filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wide">
                  <th className="text-left font-semibold px-5 py-2.5">Date</th>
                  <th className="text-left font-semibold px-5 py-2.5">Crew</th>
                  <th className="text-left font-semibold px-5 py-2.5">Branch</th>
                  <th className="text-left font-semibold px-5 py-2.5">Time In</th>
                  <th className="text-left font-semibold px-5 py-2.5">Time Out</th>
                  <th className="text-left font-semibold px-5 py-2.5">Hours</th>
                  <th className="text-left font-semibold px-5 py-2.5">Status</th>
                  <th className="px-5 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {adminRecords.map((r) => {
                  const edited = !!r.editReason;
                  const isEditingRow = editingId === r.id;
                  const mins = minutesBetween(r.timeIn, r.timeOut);
                  const overnight = crossesMidnight(r.timeIn, r.timeOut);
                  return (
                    <tr key={r.id} className={`border-t border-slate-100 ${isEditingRow ? "bg-red-50/60" : ""}`}>
                      <td className="px-5 py-3 font-semibold text-slate-800">{formatDateShort(r.date)}</td>
                      <td className="px-5 py-3 text-slate-700">{nameFor(r.employeeId)}</td>
                      <td className="px-5 py-3 text-slate-600">{branchNameFor(r.branchId)}</td>
                      <td className="px-5 py-3 text-slate-600">{formatTime12(r.timeIn)}</td>
                      <td className="px-5 py-3 text-slate-600">
                        {r.timeOut ? formatTime12(r.timeOut) : "—"}
                        {overnight && (
                          <span className="ml-1.5 inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded px-1 py-0.5 align-middle">
                            +1d
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-800">{formatHoursMinutes(mins)}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center text-xs font-semibold rounded-full px-2.5 py-1 ${
                            edited ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {edited ? "Edited" : "Normal"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => startEdit(r)}
                            className="w-8 h-8 rounded-md border border-slate-200 text-[#8f1d1d] flex items-center justify-center hover:bg-[#fff8f6] shrink-0"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            disabled={deletingId === r.id}
                            className="w-8 h-8 rounded-md border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50 disabled:opacity-60 shrink-0"
                          >
                            {deletingId === r.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingRecord && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 border border-red-100 rounded-full px-3 py-1 mb-3">
            <PenLine size={12} /> Editing Record
          </span>
          <h3 className="text-lg font-bold text-slate-900">
            {nameFor(editingRecord.employeeId)} — {formatDateShort(editingRecord.date)}
          </h3>
          <p className="text-xs text-slate-400 mb-5">
            {branchNameFor(editingRecord.branchId)} · Original: {formatTime12(editingRecord.timeIn)} –{" "}
            {editingRecord.timeOut ? formatTime12(editingRecord.timeOut) : "—"}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="text-xs font-semibold text-[#b3362c] mb-1 block">Time In</label>
              <input
                type="time"
                value={editTimeIn}
                onChange={(e) => setEditTimeIn(e.target.value)}
                className="w-full h-11 border border-red-200 bg-red-50/40 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#b3362c] mb-1 block flex items-center gap-1.5">
                Time Out
                {crossesMidnight(editTimeIn, editTimeOut) && (
                  <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                    Next day
                  </span>
                )}
              </label>
              <input
                type="time"
                value={editTimeOut}
                onChange={(e) => setEditTimeOut(e.target.value)}
                className="w-full h-11 border border-red-200 bg-red-50/40 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              />
              {crossesMidnight(editTimeIn, editTimeOut) && (
                <p className="text-xs text-amber-700 mt-1">
                  Treated as clocking out the day after {formatDateShort(editingRecord.date)}, since this time is earlier than Time In.
                </p>
              )}
            </div>
          </div>

          <div className="border border-slate-100 rounded-xl p-4 mb-5">
            <label className="text-sm font-bold text-slate-800 mb-2 block">
              Reason for Edit <span className="text-slate-400 font-normal">(required, visible to crew)</span>
            </label>
            <textarea
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              placeholder="e.g. Crew forgot to clock in on time; confirmed with manager on duty."
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f2c2be]"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-400">Edits and deletions are logged with your name, timestamp, and reason for audit.</p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleDelete(editingRecord.id)}
                disabled={deletingId === editingRecord.id}
                className="flex items-center gap-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg px-4 py-2.5 hover:bg-red-50 disabled:opacity-60"
              >
                <Trash2 size={14} /> Delete Record
              </button>
              <button
                onClick={cancelEdit}
                className="flex items-center gap-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg px-4 py-2.5 hover:bg-slate-50"
              >
                <X size={14} /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !canSave}
                title={!canSave ? "Time In and a reason are required" : ""}
                className="flex items-center gap-2 text-sm font-semibold text-white bg-[#8f1d1d] hover:bg-[#7a1414] rounded-lg px-4 py-2.5 disabled:opacity-60"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
