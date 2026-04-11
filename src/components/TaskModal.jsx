import { useState, useCallback, memo } from "react";

/* ═══════════════════════════════════════════
   SUBJECTS & COLORS — module-level constants
═══════════════════════════════════════════ */
export const SUBJECTS = ["BEE", "EM", "ED", "EP", "PCE", "FEM", "Autocad", "Other"];

export const TASK_COLORS = [
  { id: "emerald", hex: "#16A34A" },
  { id: "teal",    hex: "#0d9488" },
  { id: "sky",     hex: "#0284c7" },
  { id: "violet",  hex: "#7c3aed" },
  { id: "amber",   hex: "#d97706" },
  { id: "rose",    hex: "#e11d48" },
  { id: "lime",    hex: "#65a30d" },
  { id: "orange",  hex: "#ea580c" },
];

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const EMPTY_TASK = {
  title: "",
  description: "",
  subject: "BEE",
  priority: "normal",
  startDate: today(),
  startTime: "09:00",
  endDate: today(),
  endTime: "10:00",
  color: "emerald",
  important: false,
};

/* ── Reusable field components — stable references, no re-creation ── */
const InputField = memo(({ label, value, onChange, ...rest }) => (
  <div className="space-y-1.5">
    <label className="block text-[0.7rem] font-bold uppercase tracking-widest" style={{ color: "#8FA99F" }}>
      {label}
    </label>
    <input
      className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-[#16A34A]/25"
      style={{ background: "#F1F5F4", color: "#1A2621", border: "none" }}
      value={value}
      onChange={onChange}
      {...rest}
    />
  </div>
));

const TextareaField = memo(({ label, value, onChange, ...rest }) => (
  <div className="space-y-1.5">
    <label className="block text-[0.7rem] font-bold uppercase tracking-widest" style={{ color: "#8FA99F" }}>
      {label}
    </label>
    <textarea
      className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-[#16A34A]/25 resize-none"
      style={{ background: "#F1F5F4", color: "#1A2621", border: "none" }}
      value={value}
      onChange={onChange}
      {...rest}
    />
  </div>
));

const SelectField = memo(({ label, value, onChange, children }) => (
  <div className="space-y-1.5">
    <label className="block text-[0.7rem] font-bold uppercase tracking-widest" style={{ color: "#8FA99F" }}>
      {label}
    </label>
    <select
      className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#16A34A]/25"
      style={{ background: "#F1F5F4", color: "#1A2621", border: "none" }}
      value={value}
      onChange={onChange}
    >
      {children}
    </select>
  </div>
));

/* ═══════════════════════════════════════════
   MAIN MODAL COMPONENT

   Props:
     isEdit       - boolean, show "Edit" vs "Add" copy
     initialData  - object, seed values (pass EMPTY_TASK for new)
     onSave(data) - called with final form data object
     onClose()    - close without saving
     onDelete()   - (edit only) delete the task
═══════════════════════════════════════════ */
const TaskModal = memo(function TaskModal({ isEdit, initialData, onSave, onClose, onDelete }) {
  /* ── Own isolated state: parent re-renders never touch this ── */
  const [form, setForm] = useState(() => ({ ...EMPTY_TASK, ...initialData }));

  /* Stable field updater — uses functional update so no stale closure */
  const set = useCallback((field) => (e) => {
    const val = e.target.value;
    setForm(prev => ({ ...prev, [field]: val }));
  }, []);

  const setColor = useCallback((id) => {
    setForm(prev => ({ ...prev, color: id }));
  }, []);

  const toggleImportant = useCallback(() => {
    setForm(prev => ({ ...prev, important: !prev.important }));
  }, []);

  const handleSave = useCallback(() => {
    if (!form.title.trim()) return;
    onSave({ ...form, deadline: form.startDate });
  }, [form, onSave]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-scale-in overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header stripe */}
        <div className="h-1 w-full signature-gradient" />

        <div className="p-8 max-h-[88vh] overflow-y-auto">
          <h3 className="text-xl font-extrabold mb-6" style={{ color: "#1A2621" }}>
            {isEdit ? "Edit Task" : "New Task"}
          </h3>

          <div className="space-y-4">
            {/* Title */}
            <InputField
              label="Title"
              placeholder="e.g. BEE Assignment"
              autoFocus
              value={form.title}
              onChange={set("title")}
            />

            {/* Description */}
            <TextareaField
              label="Description / Notes"
              placeholder="e.g. Room 402, bring lab journal..."
              rows={2}
              value={form.description}
              onChange={set("description")}
            />

            {/* Subject + Priority */}
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Subject" value={form.subject} onChange={set("subject")}>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </SelectField>
              <SelectField label="Priority" value={form.priority} onChange={set("priority")}>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </SelectField>
            </div>

            {/* Start Date + Time */}
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Start Date" type="date" value={form.startDate} onChange={set("startDate")} />
              <InputField label="Start Time" type="time" value={form.startTime} onChange={set("startTime")} />
            </div>

            {/* End Date + Time */}
            <div className="grid grid-cols-2 gap-3">
              <InputField label="End Date" type="date" value={form.endDate} onChange={set("endDate")} />
              <InputField label="End Time" type="time" value={form.endTime} onChange={set("endTime")} />
            </div>

            {/* Color Picker */}
            <div className="space-y-1.5">
              <label className="block text-[0.7rem] font-bold uppercase tracking-widest" style={{ color: "#8FA99F" }}>Color</label>
              <div className="flex gap-2 flex-wrap">
                {TASK_COLORS.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    className="w-8 h-8 rounded-xl transition-all hover:scale-110 focus:outline-none"
                    style={{
                      backgroundColor: c.hex,
                      transform: form.color === c.id ? "scale(1.15)" : undefined,
                      boxShadow: form.color === c.id ? `0 0 0 3px white, 0 0 0 5px ${c.hex}` : undefined,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Important Toggle */}
            <div
              className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: "#F5F1E8", border: "1px solid #D6C7AE" }}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg" style={{ color: "#FACC15" }}>star</span>
                <span className="text-sm font-bold" style={{ color: "#1A2621" }}>Mark as Important</span>
              </div>
              <button
                type="button"
                onClick={toggleImportant}
                className="relative w-12 h-7 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0"
                style={{ background: form.important ? "#16A34A" : "#C2D4CE" }}
              >
                <span
                  className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200"
                  style={{ left: 4, transform: form.important ? "translateX(20px)" : "translateX(0)" }}
                />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-7 pt-5" style={{ borderTop: "1px solid #F1F5F4" }}>
            {isEdit ? (
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:bg-[#FEE2E2]"
                style={{ color: "#EF4444" }}
              >
                <span className="material-symbols-outlined text-base">delete</span>
                Delete
              </button>
            ) : <div />}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-[#F1F5F4]"
                style={{ color: "#3D524A" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!form.title.trim()}
                className="px-6 py-2.5 rounded-xl signature-gradient text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 shadow-btn disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isEdit ? "Save Changes" : "Add Task"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default TaskModal;
