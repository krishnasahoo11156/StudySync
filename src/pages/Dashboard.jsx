import { useState, useEffect, useMemo, useRef, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase/config";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import PageShell from "../components/PageShell";

/* ── Subject presets ── */
const SUBJECTS = ["BEE", "EM", "ED", "EP", "PCE", "FEM", "Autocad", "Other"];

/* ── Task Colors ── */
const TASK_COLORS = [
  { id: "emerald",  hex: "#006c49", bg: "bg-emerald-600",  light: "bg-emerald-100  text-emerald-800" },
  { id: "teal",     hex: "#0d9488", bg: "bg-teal-500",     light: "bg-teal-100     text-teal-800"    },
  { id: "sky",      hex: "#0284c7", bg: "bg-sky-600",      light: "bg-sky-100      text-sky-800"     },
  { id: "violet",   hex: "#7c3aed", bg: "bg-violet-600",   light: "bg-violet-100   text-violet-800"  },
  { id: "amber",    hex: "#d97706", bg: "bg-amber-500",    light: "bg-amber-100    text-amber-800"   },
  { id: "rose",     hex: "#e11d48", bg: "bg-rose-600",     light: "bg-rose-100     text-rose-800"    },
  { id: "lime",     hex: "#65a30d", bg: "bg-lime-600",     light: "bg-lime-100     text-lime-800"    },
  { id: "orange",   hex: "#ea580c", bg: "bg-orange-600",   light: "bg-orange-100   text-orange-800"  },
];

/* ── Helpers ── */
function localYMD(d) {
  if (!d) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ── Default empty form ──
   Defined at module level so it never gets
   recreated and never changes identity.
*/
const EMPTY_FORM = {
  title: "", description: "", subject: "BEE",
  startDate: "", startTime: "09:00",
  endDate: "",  endTime: "10:00",
  color: "emerald", priority: "normal", important: false,
  deadline: "",
};

/* ═══════════════════════════════════════════
   TASK MODAL — defined OUTSIDE Dashboard so
   React never remounts it on parent re-renders.
   All data passed via props; onChange uses the
   stable useState setter so focus is never lost.
═══════════════════════════════════════════ */
const TaskModal = memo(function TaskModal({
  isEdit, taskForm, setTaskForm, onClose, onSave, onDelete,
}) {
  const setField = useCallback((field, value) => {
    setTaskForm(prev => ({ ...prev, [field]: value }));
  }, [setTaskForm]);

  return (
    <div
      className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-6" style={{ color: "#1A2621" }}>
          {isEdit ? "Edit Task" : "Add Task"}
        </h3>

        <div className="space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[0.7rem] font-bold uppercase tracking-widest" style={{ color: "#8FA99F" }}>Title</label>
            <input
              className="w-full rounded-xl px-4 py-3 text-sm border-0 focus:ring-2 focus:ring-[#16A34A]/30 outline-none transition-shadow"
              style={{ background: "#F1F5F4", color: "#1A2621" }}
              placeholder="e.g. BEE Assignment"
              autoFocus
              value={taskForm.title}
              onChange={e => setField("title", e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[0.7rem] font-bold uppercase tracking-widest" style={{ color: "#8FA99F" }}>Description / Notes</label>
            <textarea
              className="w-full rounded-xl px-4 py-3 text-sm border-0 focus:ring-2 focus:ring-[#16A34A]/30 outline-none transition-shadow resize-none"
              style={{ background: "#F1F5F4", color: "#1A2621" }}
              placeholder="e.g. Room 402, bring lab journal..."
              rows={2}
              value={taskForm.description}
              onChange={e => setField("description", e.target.value)}
            />
          </div>

          {/* Subject + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[0.7rem] font-bold uppercase tracking-widest" style={{ color: "#8FA99F" }}>Subject</label>
              <select
                className="w-full rounded-xl px-4 py-3 text-sm border-0 focus:ring-2 focus:ring-[#16A34A]/30 outline-none"
                style={{ background: "#F1F5F4", color: "#1A2621" }}
                value={taskForm.subject}
                onChange={e => setField("subject", e.target.value)}
              >
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[0.7rem] font-bold uppercase tracking-widest" style={{ color: "#8FA99F" }}>Priority</label>
              <select
                className="w-full rounded-xl px-4 py-3 text-sm border-0 focus:ring-2 focus:ring-[#16A34A]/30 outline-none"
                style={{ background: "#F1F5F4", color: "#1A2621" }}
                value={taskForm.priority}
                onChange={e => setField("priority", e.target.value)}
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Start Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[0.7rem] font-bold uppercase tracking-widest" style={{ color: "#8FA99F" }}>Start Date</label>
              <input type="date"
                className="w-full rounded-xl px-4 py-3 text-sm border-0 focus:ring-2 focus:ring-[#16A34A]/30 outline-none"
                style={{ background: "#F1F5F4", color: "#1A2621" }}
                value={taskForm.startDate}
                onChange={e => setField("startDate", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[0.7rem] font-bold uppercase tracking-widest" style={{ color: "#8FA99F" }}>Start Time</label>
              <input type="time"
                className="w-full rounded-xl px-4 py-3 text-sm border-0 focus:ring-2 focus:ring-[#16A34A]/30 outline-none"
                style={{ background: "#F1F5F4", color: "#1A2621" }}
                value={taskForm.startTime}
                onChange={e => setField("startTime", e.target.value)}
              />
            </div>
          </div>

          {/* End Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[0.7rem] font-bold uppercase tracking-widest" style={{ color: "#8FA99F" }}>End Date</label>
              <input type="date"
                className="w-full rounded-xl px-4 py-3 text-sm border-0 focus:ring-2 focus:ring-[#16A34A]/30 outline-none"
                style={{ background: "#F1F5F4", color: "#1A2621" }}
                value={taskForm.endDate}
                onChange={e => setField("endDate", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[0.7rem] font-bold uppercase tracking-widest" style={{ color: "#8FA99F" }}>End Time</label>
              <input type="time"
                className="w-full rounded-xl px-4 py-3 text-sm border-0 focus:ring-2 focus:ring-[#16A34A]/30 outline-none"
                style={{ background: "#F1F5F4", color: "#1A2621" }}
                value={taskForm.endTime}
                onChange={e => setField("endTime", e.target.value)}
              />
            </div>
          </div>

          {/* Color Picker */}
          <div className="space-y-1.5">
            <label className="text-[0.7rem] font-bold uppercase tracking-widest" style={{ color: "#8FA99F" }}>Color</label>
            <div className="flex gap-2 flex-wrap">
              {TASK_COLORS.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setField("color", c.id)}
                  className={`w-8 h-8 rounded-xl transition-all hover:scale-110 ${
                    taskForm.color === c.id ? "ring-2 ring-offset-2 scale-110" : ""
                  }`}
                  style={{ backgroundColor: c.hex, ringColor: c.hex }}
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
              <span className="material-symbols-outlined text-amber-500 text-lg">star</span>
              <span className="text-sm font-bold" style={{ color: "#1A2621" }}>Mark as Important</span>
            </div>
            <button
              type="button"
              onClick={() => setField("important", !taskForm.important)}
              className="w-12 h-7 rounded-full transition-all flex-shrink-0"
              style={{ background: taskForm.important ? "#16A34A" : "#C2D4CE" }}
            >
              <div
                className="w-5 h-5 rounded-full bg-white shadow-md transition-all"
                style={{ transform: taskForm.important ? "translateX(24px)" : "translateX(4px)" }}
              />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-8">
          {isEdit && (
            <button
              type="button"
              onClick={onDelete}
              className="px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-1.5 hover:bg-[#FEE2E2]"
              style={{ color: "#EF4444" }}
            >
              <span className="material-symbols-outlined text-base">delete</span> Delete
            </button>
          )}
          <div className={`flex gap-3 ${isEdit ? "" : "ml-auto"}`}>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:bg-[#F1F5F4]"
              style={{ color: "#3D524A" }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              className="px-6 py-2.5 rounded-xl signature-gradient text-white font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-btn"
            >
              {isEdit ? "Save Changes" : "Add Task"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  /* ── Task state ── */
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");

  /* ── Modals ── */
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  /* ── Task form ── */
  const todayYMD = localYMD(new Date());
  const [taskForm, setTaskForm] = useState(() => ({ ...EMPTY_FORM, startDate: localYMD(new Date()), endDate: localYMD(new Date()), deadline: localYMD(new Date()) }));

  /* ── Timer ── */
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef(null);

  /* ══════════════════ Firestore Subscription ══════════════════ */
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "tasks"), where("userId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""));
      setTasks(data);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  /* ══════════════════ Timer Effect ══════════════════ */
  useEffect(() => {
    if (timerRunning && timerSeconds > 0) {
      timerRef.current = setInterval(() => setTimerSeconds((s) => s - 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning, timerSeconds]);

  useEffect(() => {
    document.title = "StudySync - Dashboard";
  }, []);

  /* ══════════════════ CRUD Operations ══════════════════ */
  const addTask = async () => {
    if (!taskForm.title.trim()) return;
    await addDoc(collection(db, "tasks"), {
      ...taskForm,
      deadline: taskForm.startDate,
      userId: user.uid,
      status: "pending",
      createdAt: serverTimestamp(),
    });
    const fresh = { ...EMPTY_FORM, startDate: todayYMD, endDate: todayYMD, deadline: todayYMD };
    setTaskForm(fresh);
    setShowAddModal(false);
  };

  const updateTask = async () => {
    if (!editingTask || !taskForm.title.trim()) return;
    await updateDoc(doc(db, "tasks", editingTask.id), {
      ...taskForm,
      deadline: taskForm.startDate
    });
    setShowEditModal(false);
    setEditingTask(null);
  };

  const removeTask = async (id) => {
    await deleteDoc(doc(db, "tasks", id));
    setDeleteConfirmId(null);
  };

  const toggleComplete = async (task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    await updateDoc(doc(db, "tasks", task.id), {
      status: newStatus,
      ...(newStatus === "completed" ? { completedAt: new Date().toISOString() } : { completedAt: null }),
    });
  };

  const openEdit = useCallback((task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title || "",
      description: task.description || "",
      subject: task.subject || "BEE",
      startDate: task.startDate || task.deadline || "",
      startTime: task.startTime || "09:00",
      endDate: task.endDate || task.startDate || task.deadline || "",
      endTime: task.endTime || "10:00",
      color: task.color || "emerald",
      priority: task.priority || "normal",
      important: task.important || false,
      deadline: task.deadline || task.startDate || "",
    });
    setShowEditModal(true);
  }, []);

  /* ══════════════════ Computed Values ══════════════════ */
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const pending = total - completed;

  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const todayTasks = tasks.filter((t) => t.deadline === today && t.status !== "completed");
  const tomorrowTasks = tasks.filter((t) => t.deadline === tomorrow);

  const subjects = useMemo(() => [...new Set(tasks.map((t) => t.subject))], [tasks]);
  const filteredTasks = activeFilter === "All" ? tasks : tasks.filter((t) => t.subject === activeFilter);

  const formatTimer = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  /* ── Greeting ── */
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const userName = user?.displayName || user?.email?.split("@")[0] || "Student";

  /* ── Weekly chart data (Mon–Sun, always includes today) ── */
  const weeklyData = useMemo(() => {
    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const now = new Date();
    const nowYMD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const dow = now.getDay(); // 0=Sun, 1=Mon … 6=Sat
    // Find this week's Monday
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dow + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    return dayLabels.map((label, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const isToday = ds === nowYMD;
      const isFuture = d > now && !isToday;
      const done = tasks.filter((t) => t.completedAt && t.completedAt.startsWith(ds)).length;
      const due = tasks.filter((t) => t.deadline === ds).length;
      return { label, done, due, isToday, isFuture };
    });
  }, [tasks]);
  const maxWeekly = Math.max(...weeklyData.map((d) => Math.max(d.done, d.due, 1)));

  /* ── Insight text ── */
  const insightText = useMemo(() => {
    if (total === 0) return "Add your first task to get started! 🌱";
    if (tomorrowTasks.length > 0)
      return `You have <strong>${tomorrowTasks.length} task${tomorrowTasks.length > 1 ? "s" : ""} due tomorrow</strong> ⏳. Plan ahead!`;
    if (completed === total) return "All tasks completed! 🎉 You're on fire!";
    if (completed / total >= 0.7)
      return `Great job! You've completed <strong>${completed} of ${total}</strong> tasks 💪`;
    if (pending > 0)
      return `You have <strong>${pending} pending task${pending > 1 ? "s" : ""}</strong>. Stay focused! 🎯`;
    return "Keep going — every task counts! 🌿";
  }, [total, completed, pending, tomorrowTasks]);

  /* ── Stable modal handler callbacks ── */
  const handleOpenAdd = useCallback(() => {
    setTaskForm({ ...EMPTY_FORM, startDate: localYMD(new Date()), endDate: localYMD(new Date()), deadline: localYMD(new Date()) });
    setShowAddModal(true);
  }, []);

  const handleCloseAdd = useCallback(() => setShowAddModal(false), []);

  const handleCloseEdit = useCallback(() => {
    setShowEditModal(false);
    setEditingTask(null);
  }, []);

  const handleDeleteFromModal = useCallback(() => {
    if (editingTask?.id) removeTask(editingTask.id);
  }, [editingTask]);

  /* ══════════════════ Render ══════════════════ */
  return (
    <PageShell
      activePage="sanctuary"
      title="Dashboard"
      subtitle={total > 0 ? `${completed}/${total} tasks completed` : "Your academic command center"}
    >
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <span className="material-symbols-outlined text-6xl text-primary/40 animate-spin">progress_activity</span>
        </div>
      ) : (
        <div className="animate-page-enter max-w-7xl mx-auto">
          {/* Welcome Hero */}
          <section
            className="mb-10 p-8 lg:p-12 rounded-3xl relative overflow-hidden animate-fade-in"
            style={{ background: "linear-gradient(135deg, #F0FDF4 0%, #F5F1E8 55%, #EFF6FF 100%)", border: "1px solid #E4EDEA" }}
          >
            <div className="relative z-10">
              <h2 className="text-3xl lg:text-[3.5rem] font-extrabold tracking-tight leading-tight mb-4" style={{ color: "#1A2621" }}>
                {greeting}, {userName}
              </h2>
              <p className="text-lg lg:text-xl max-w-lg" style={{ color: "#3D524A", opacity: 0.85 }}>
                {total === 0
                  ? "Let's add your first task and get started ✨"
                  : `You're on track — ${completed}/${total} completed ✨`}
              </p>
            </div>
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full -mr-24 -mt-24 blur-3xl opacity-20" style={{ background: "#16A34A" }} />
            <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full -mb-16 blur-3xl opacity-10" style={{ background: "#60A5FA" }} />
          </section>

          {/* 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* ── Left Column ── */}
            <div className="lg:col-span-8">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12 stagger-children">
                {/* Total */}
                <div className="bg-white p-8 rounded-2xl flex flex-col justify-between h-40 animate-slide-up" style={{ border: "1px solid #E4EDEA", boxShadow: "0 2px 12px rgba(22,163,74,0.06)" }}>
                  <span className="font-bold uppercase tracking-widest text-[0.7rem]" style={{ color: "#16A34A" }}>Total Tasks</span>
                  <div className="text-4xl font-extrabold" style={{ color: "#1A2621" }}>{String(total).padStart(2, "0")}</div>
                </div>
                {/* Completed */}
                <div className="p-8 rounded-2xl flex flex-col justify-between h-40 sm:mt-6 animate-slide-up" style={{ background: "#DCFCE7", border: "1px solid #BBF7D0", boxShadow: "0 2px 12px rgba(22,163,74,0.08)" }}>
                  <span className="font-bold uppercase tracking-widest text-[0.7rem]" style={{ color: "#15803D" }}>Completed</span>
                  <div className="text-4xl font-extrabold" style={{ color: "#14532D" }}>{String(completed).padStart(2, "0")}</div>
                </div>
                {/* Pending */}
                <div className="p-8 rounded-2xl flex flex-col justify-between h-40 animate-slide-up" style={{ background: "#F5F1E8", border: "1px solid #D6C7AE", boxShadow: "0 2px 8px rgba(214,199,174,0.2)" }}>
                  <span className="font-bold uppercase tracking-widest text-[0.7rem]" style={{ color: "#F87171" }}>Pending</span>
                  <div className="text-4xl font-extrabold" style={{ color: "#1A2621" }}>{String(pending).padStart(2, "0")}</div>
                </div>
              </div>

              {/* Today's Focus */}
              <div className="mb-10">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-bold text-on-surface">Today's Focus</h3>
                  <span className="text-primary font-bold text-sm">{todayTasks.length} tasks</span>
                </div>
                {todayTasks.length === 0 ? (
                  <div className="p-8 rounded-2xl text-center" style={{ background: "#F5F1E8", border: "1px solid #D6C7AE", color: "#78634A" }}>
                    <span className="material-symbols-outlined text-4xl mb-2 block" style={{ opacity: 0.5 }}>task_alt</span>
                    No tasks due today — enjoy the calm 🌿
                  </div>
                ) : (
                  <div className="space-y-6 stagger-children">
                    {todayTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-white p-6 rounded-2xl relative overflow-hidden group hover:-translate-y-0.5 transition-all duration-300 animate-slide-up"
                        style={{ border: "1px solid #E4EDEA", boxShadow: "0 2px 12px rgba(22,163,74,0.06)" }}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-start gap-4">
                            <button
                              onClick={() => toggleComplete(task)}
                              className="mt-1 w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                              style={{ border: "2px solid #16A34A", background: task.status === "completed" ? "#16A34A" : "transparent" }}
                            >
                              {task.status === "completed" && (
                                <span className="material-symbols-outlined text-white text-[14px] animate-check-pop">check</span>
                              )}
                            </button>
                            <div>
                              <h4 className={`text-lg font-bold mb-2 ${task.status === "completed" ? "line-through opacity-50" : ""}`} style={{ color: "#1A2621" }}>
                                {task.important && <span className="text-amber-400 mr-1">⭐</span>}{task.title}
                              </h4>
                              <div className="flex items-center gap-3">
                                <span className="text-[0.65rem] font-bold uppercase tracking-wider px-3 py-1 rounded-full" style={{ background: "#F5F1E8", color: "#78634A" }}>
                                  {task.subject}
                                </span>
                                <div className="flex items-center gap-1 text-xs" style={{ color: "#8FA99F" }}>
                                  <span className="material-symbols-outlined text-[1rem]">schedule</span>
                                  <span>{fmtDate(task.deadline) || "No deadline"}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {task.priority === "urgent" && (
                              <span className="text-[0.65rem] font-bold uppercase px-3 py-1 rounded-full" style={{ background: "#FEE2E2", color: "#EF4444" }}>Urgent</span>
                            )}
                            <button onClick={() => openEdit(task)} className="opacity-0 group-hover:opacity-100 transition-all p-1 rounded-lg hover:bg-[#DCFCE7]" style={{ color: "#16A34A" }}>
                              <span className="material-symbols-outlined text-xl">edit</span>
                            </button>
                            <button onClick={() => setDeleteConfirmId(task.id)} className="opacity-0 group-hover:opacity-100 transition-all p-1 rounded-lg hover:bg-[#FEE2E2]" style={{ color: "#F87171" }}>
                              <span className="material-symbols-outlined text-xl">delete</span>
                            </button>
                          </div>
                        </div>
                        {task.description && (
                          <p className="text-xs mb-3 pl-10" style={{ color: "#8FA99F" }}>{task.description}</p>
                        )}
                        <div className="w-20 h-1 rounded-full signature-gradient" />
                        {deleteConfirmId === task.id && (
                          <div className="absolute inset-0 backdrop-blur-sm flex items-center justify-center gap-4 rounded-2xl animate-scale-in z-10" style={{ background: "rgba(255,255,255,0.95)" }}>
                            <p className="text-sm font-medium" style={{ color: "#1A2621" }}>Delete this task?</p>
                            <button onClick={() => removeTask(task.id)} className="px-4 py-2 rounded-lg text-white text-xs font-bold" style={{ background: "#EF4444" }}>Yes, Delete</button>
                            <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 rounded-lg text-xs font-bold" style={{ background: "#F1F5F4", color: "#3D524A" }}>Cancel</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* All Tasks & Filters */}
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-8">
                  <h3 className="text-2xl font-bold mr-4" style={{ color: "#1A2621" }}>All Tasks</h3>
                  <button
                    onClick={() => setActiveFilter("All")}
                    className="px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all"
                    style={activeFilter === "All"
                      ? { background: "#16A34A", color: "#FFFFFF" }
                      : { background: "#F1F5F4", color: "#3D524A" }}
                  >
                    All
                  </button>
                  {subjects.map((s) => (
                    <button
                      key={s}
                      onClick={() => setActiveFilter(s)}
                      className="px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all"
                      style={activeFilter === s
                        ? { background: "#16A34A", color: "#FFFFFF" }
                        : { background: "#F1F5F4", color: "#3D524A" }}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {filteredTasks.length === 0 ? (
                  <div className="p-8 rounded-2xl text-center" style={{ background: "#F1F5F4", color: "#8FA99F" }}>
                    No tasks yet — click the + button to add one!
                  </div>
                ) : (
                  <div className="space-y-3 stagger-children">
                    {filteredTasks.map((task) => {
                      const taskColorHex = task.color ? { emerald:"#16A34A",teal:"#0d9488",sky:"#0284c7",violet:"#7c3aed",amber:"#d97706",rose:"#e11d48",lime:"#65a30d",orange:"#ea580c" }[task.color] || "#16A34A" : "#16A34A";
                      return (
                        <div
                          key={task.id}
                          className="bg-white p-5 rounded-2xl flex flex-wrap items-center justify-between group hover:shadow-md transition-all animate-slide-up relative"
                          style={{ border: "1px solid #E4EDEA", borderLeft: `4px solid ${taskColorHex}` }}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleComplete(task)}
                              className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                              style={task.status === "completed"
                                ? { background: "#16A34A", borderColor: "#16A34A" }
                                : { borderColor: "#C2D4CE" }}
                            >
                              {task.status === "completed" && (
                                <span className="material-symbols-outlined text-white text-[12px] animate-check-pop">check</span>
                              )}
                            </button>
                            <div>
                              <span className={`font-semibold text-sm ${task.status === "completed" ? "line-through opacity-50" : ""}`} style={{ color: "#1A2621" }}>
                                {task.important && <span className="text-amber-400 mr-1">⭐</span>}{task.title}
                              </span>
                              {task.description && (
                                <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "#8FA99F" }}>{task.description}</p>
                              )}
                            </div>
                            {task.priority === "urgent" && (
                              <span className="text-[0.6rem] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#EF4444" }}>!</span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 lg:gap-6 mt-1">
                            <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline" style={{ color: "#8FA99F" }}>{task.subject}</span>
                            <span className="text-xs hidden sm:inline" style={{ color: "#8FA99F" }}>{fmtDate(task.deadline)}</span>
                            <div className="flex items-center gap-1">
                              <button onClick={() => openEdit(task)} className="opacity-0 group-hover:opacity-100 transition-all p-1 rounded-lg hover:bg-[#DCFCE7]" style={{ color: "#16A34A" }}>
                                <span className="material-symbols-outlined text-xl">edit</span>
                              </button>
                              <button onClick={() => setDeleteConfirmId(task.id)} className="opacity-0 group-hover:opacity-100 transition-all p-1 rounded-lg hover:bg-[#FEE2E2]" style={{ color: "#F87171" }}>
                                <span className="material-symbols-outlined text-xl">delete</span>
                              </button>
                            </div>
                          </div>
                          {deleteConfirmId === task.id && (
                            <div className="absolute inset-0 backdrop-blur-sm flex items-center justify-center gap-4 rounded-2xl animate-scale-in z-10" style={{ background: "rgba(255,255,255,0.95)" }}>
                              <p className="text-sm font-medium" style={{ color: "#1A2621" }}>Delete?</p>
                              <button onClick={() => removeTask(task.id)} className="px-4 py-1.5 rounded-lg text-white text-xs font-bold" style={{ background: "#EF4444" }}>Yes</button>
                              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-1.5 rounded-lg text-xs font-bold" style={{ background: "#F1F5F4", color: "#3D524A" }}>No</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Right Column: Insights & Stats ── */}
            <div className="lg:col-span-4 space-y-8">
              {/* Weekly Progress */}
              <div className="bg-surface-container-lowest p-8 rounded-2xl ambient-shadow animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-bold text-on-surface">Weekly Progress</h4>
                  <span className="text-xs font-semibold text-on-surface-variant/50">
                    Mon – Sun
                  </span>
                </div>
                <div className="h-56 flex items-end justify-between gap-2">
                  {weeklyData.map((d) => {
                    const barHeightPct = Math.max((Math.max(d.done, d.due) / maxWeekly) * 100, d.isFuture ? 0 : 8);
                    const fillPct = d.due > 0 ? (d.done / d.due) * 100 : d.done > 0 ? 100 : 0;
                    return (
                      <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5">
                        {/* Bar column */}
                        <div className="w-full relative group flex flex-col justify-end" style={{ height: "200px" }}>
                          {/* Background track */}
                          <div
                            className={`w-full rounded-t-xl relative overflow-hidden transition-all duration-700 ${
                              d.isFuture
                                ? "border-2 border-dashed border-emerald-100 bg-transparent"
                                : d.isToday
                                ? "bg-emerald-100 ring-2 ring-emerald-400 ring-offset-1"
                                : "bg-surface-container-low"
                            }`}
                            style={{ height: d.isFuture ? "16px" : `${barHeightPct}%` }}
                          >
                            {/* Fill */}
                            {!d.isFuture && (
                              <div
                                className="absolute bottom-0 w-full signature-gradient rounded-t-xl transition-all duration-700"
                                style={{ height: `${fillPct}%` }}
                              />
                            )}
                            {/* Tooltip */}
                            {!d.isFuture && (
                              <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-emerald-900 text-white text-[0.6rem] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                {d.done} done · {d.due} due
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Day label */}
                        <span className={`text-[0.6rem] font-bold uppercase tracking-wider ${
                          d.isToday
                            ? "text-emerald-600"
                            : d.isFuture
                            ? "text-on-surface-variant/25"
                            : "text-on-surface-variant/40"
                        }`}>
                          {d.label}
                          {d.isToday && (
                            <span className="block w-1 h-1 rounded-full bg-emerald-500 mx-auto mt-0.5" />
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* Legend */}
                <div className="flex items-center gap-4 mt-5 pt-4 border-t border-surface-container-low">
                  <div className="flex items-center gap-1.5 text-[0.65rem] font-semibold text-on-surface-variant/60">
                    <div className="w-2.5 h-2.5 rounded-sm signature-gradient" />
                    Completed
                  </div>
                  <div className="flex items-center gap-1.5 text-[0.65rem] font-semibold text-on-surface-variant/60">
                    <div className="w-2.5 h-2.5 rounded-sm bg-emerald-100" />
                    Due
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 text-[0.65rem] font-semibold text-emerald-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Today
                  </div>
                </div>
              </div>

              {/* Daily Insight */}
              <div className="bg-surface-container-lowest p-8 rounded-2xl ambient-shadow animate-fade-in">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-tertiary-container/20 flex items-center justify-center text-tertiary">
                    <span className="material-symbols-outlined">auto_awesome</span>
                  </div>
                  <h4 className="font-bold text-on-surface">Daily Insight</h4>
                </div>
                <p
                  className="text-on-surface-variant leading-relaxed text-sm"
                  dangerouslySetInnerHTML={{ __html: insightText }}
                />
              </div>

              {/* Focus Session Timer */}
              <div className="bg-surface-container-lowest p-8 rounded-2xl ambient-shadow text-center relative overflow-hidden group animate-fade-in">
                <div className="relative z-10">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant/60 mb-8">
                    Focus Session
                  </h4>
                  <div className={`w-40 h-40 mx-auto rounded-full signature-gradient flex items-center justify-center ambient-shadow mb-6 relative ${timerRunning ? "animate-glow-pulse" : ""}`}>
                    {timerRunning && (
                      <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-pulse" />
                    )}
                    <span className="text-4xl font-bold text-white tracking-tighter">
                      {formatTimer(timerSeconds)}
                    </span>
                  </div>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => setTimerRunning(!timerRunning)}
                      className="bg-on-surface text-surface py-3 px-8 rounded-xl font-bold text-sm hover:bg-primary transition-colors"
                    >
                      {timerRunning ? "Pause" : timerSeconds < 25 * 60 ? "Resume" : "Start Session"}
                    </button>
                    {timerSeconds < 25 * 60 && (
                      <button
                        onClick={() => {
                          setTimerRunning(false);
                          setTimerSeconds(25 * 60);
                        }}
                        className="bg-surface-container-high text-on-surface-variant py-3 px-6 rounded-xl font-bold text-sm hover:bg-surface-container-highest transition-colors"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  {timerSeconds === 0 && (
                    <p className="mt-4 text-primary font-bold animate-scale-in">🎉 Session complete! Great work!</p>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary-fixed opacity-10 rounded-full blur-2xl translate-y-1/2 translate-x-1/2" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FAB: Add Task ── */}
      <button
        onClick={handleOpenAdd}
        className="fixed bottom-10 right-10 w-16 h-16 rounded-full signature-gradient text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all z-50 group"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
        <span className="absolute right-full mr-4 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "#1A2621", color: "#F8FAF9" }}>
          Add New Task
        </span>
      </button>

      {/* ══════════════════ MODALS ══════════════════ */}
      {showAddModal && (
        <TaskModal
          isEdit={false}
          taskForm={taskForm}
          setTaskForm={setTaskForm}
          onClose={handleCloseAdd}
          onSave={addTask}
        />
      )}
      {showEditModal && (
        <TaskModal
          isEdit={true}
          taskForm={taskForm}
          setTaskForm={setTaskForm}
          onClose={handleCloseEdit}
          onSave={updateTask}
          onDelete={handleDeleteFromModal}
        />
      )}
    </PageShell>
  );
}
