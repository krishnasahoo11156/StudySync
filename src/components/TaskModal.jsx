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

/* ── Field components ── */
const inputBase =
  "w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all " +
  "bg-surface-container-low dark:bg-dm-bg " +
  "text-on-surface dark:text-dm-text-primary " +
  "border border-border-default dark:border-dm-border " +
  "placeholder:text-text-muted dark:placeholder:text-dm-text-tertiary " +
  "focus:border-primary focus:ring-2 focus:ring-primary/20 " +
  "dark:focus:border-primary dark:focus:ring-primary/20";

const InputField = memo(({ label, value, onChange, ...rest }) => (
  <div className="space-y-1.5">
    <label className="type-caption block text-text-muted dark:text-dm-text-secondary">{label}</label>
    <input className={inputBase} value={value} onChange={onChange} {...rest} />
  </div>
));

const TextareaField = memo(({ label, value, onChange, ...rest }) => (
  <div className="space-y-1.5">
    <label className="type-caption block text-text-muted dark:text-dm-text-secondary">{label}</label>
    <textarea className={`${inputBase} resize-none`} value={value} onChange={onChange} {...rest} />
  </div>
));

const SelectField = memo(({ label, value, onChange, children }) => (
  <div className="space-y-1.5">
    <label className="type-caption block text-text-muted dark:text-dm-text-secondary">{label}</label>
    <select className={inputBase} value={value} onChange={onChange}>
      {children}
    </select>
  </div>
));

/* ═══════════════════════════════════════════
   MAIN MODAL COMPONENT
═══════════════════════════════════════════ */
const TaskModal = memo(function TaskModal({ isEdit, initialData, onSave, onClose, onDelete }) {
  const [form, setForm] = useState(() => ({ ...EMPTY_TASK, ...initialData }));

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop dark:bg-black/70 dark:backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-dm-surface rounded-2xl w-full max-w-lg shadow-modal dark:shadow-[0_24px_64px_rgba(0,0,0,0.5)] animate-scale-in overflow-hidden border border-transparent dark:border-dm-border transition-colors duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header gradient accent */}
        <div className="h-1 w-full signature-gradient" />

        <div className="p-7 max-h-[85vh] overflow-y-auto scroll-on-hover">
          {/* Title row */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-on-surface dark:text-dm-text-primary">
              {isEdit ? "Edit Task" : "New Task"}
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted dark:text-dm-text-secondary hover:text-on-surface dark:hover:text-dm-text-primary hover:bg-surface-container-high dark:hover:bg-dm-surface-hover transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          <div className="space-y-4">
            <InputField label="Title" placeholder="e.g. BEE Assignment" autoFocus value={form.title} onChange={set("title")} />
            <TextareaField label="Description" placeholder="e.g. Room 402, bring lab journal..." rows={2} value={form.description} onChange={set("description")} />

            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Subject" value={form.subject} onChange={set("subject")}>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </SelectField>
              <SelectField label="Priority" value={form.priority} onChange={set("priority")}>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </SelectField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <InputField label="Start Date" type="date" value={form.startDate} onChange={set("startDate")} />
              <InputField label="Start Time" type="time" value={form.startTime} onChange={set("startTime")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="End Date" type="date" value={form.endDate} onChange={set("endDate")} />
              <InputField label="End Time" type="time" value={form.endTime} onChange={set("endTime")} />
            </div>

            {/* Color Picker */}
            <div className="space-y-1.5">
              <label className="type-caption block text-text-muted dark:text-dm-text-secondary">Color</label>
              <div className="flex gap-2 flex-wrap">
                {TASK_COLORS.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    className="w-7 h-7 rounded-lg transition-all duration-200 hover:scale-110 focus:outline-none"
                    style={{
                      backgroundColor: c.hex,
                      transform: form.color === c.id ? "scale(1.15)" : undefined,
                      boxShadow: form.color === c.id
                        ? `0 0 0 2px #111a12, 0 0 0 4px ${c.hex}`
                        : undefined,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Important Toggle */}
            <div className="flex items-center justify-between rounded-xl px-4 py-3 bg-sand dark:bg-dm-bg border border-stone dark:border-dm-border transition-colors duration-300">
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-lg ${form.important ? "text-warning dark:text-amber-400" : "text-text-muted dark:text-dm-text-tertiary"}`}>star</span>
                <span className="text-sm font-semibold text-on-surface dark:text-dm-text-primary">Mark as Important</span>
              </div>
              <button
                type="button"
                onClick={toggleImportant}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0 ${form.important ? "bg-primary" : "bg-outline-variant dark:bg-dm-surface-hover"}`}
              >
                <span
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200"
                  style={{ left: 2, transform: form.important ? "translateX(20px)" : "translateX(0)" }}
                />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-border-default dark:border-dm-border">
            {isEdit ? (
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-error-dark dark:text-dm-error hover:bg-error-container dark:hover:bg-dm-error-bg transition-colors"
              >
                <span className="material-symbols-outlined text-base">delete</span>
                Delete
              </button>
            ) : <div />}

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant dark:text-dm-text-secondary hover:bg-surface-container-high dark:hover:bg-dm-surface-hover transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!form.title.trim()}
                className="px-6 py-2.5 rounded-xl signature-gradient text-white text-sm font-bold btn-interactive shadow-btn disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
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
