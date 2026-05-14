import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { db } from "../firebase/config";
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from "firebase/firestore";
import PageShell from "../components/PageShell";
import TaskModal, { EMPTY_TASK } from "../components/TaskModal";

/* ═══════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════ */
const SUBJECTS = ["BEE", "EM", "ED", "EP", "PCE", "FEM", "Autocad", "Other"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
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
const HOURS = Array.from({ length: 24 }, (_, i) => i);

/* ═══════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════ */
function localYMD(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function isSameDay(a, b) { return localYMD(a) === localYMD(b); }
function parseDate(s) { return s ? new Date(s + (s.includes("T") ? "" : "T00:00:00")) : null; }
function formatTime(d) {
  if (!d) return "";
  const h = d.getHours(), m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  return `${((h % 12) || 12)}:${String(m).padStart(2, "0")} ${ampm}`;
}
function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year, month) { return new Date(year, month, 1).getDay(); }

/* get week start (Sunday) for a date */
function getWeekStart(d) {
  const s = new Date(d);
  s.setDate(s.getDate() - s.getDay());
  s.setHours(0, 0, 0, 0);
  return s;
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export default function CalendarPage() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  /* ── State ── */
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("month"); // month | week | day
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTaskInitialData, setNewTaskInitialData] = useState(null);
  const [hoveredTask, setHoveredTask] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [dragState, setDragState] = useState(null);

  const today = useMemo(() => new Date(), []);
  const todayYMD = localYMD(today);

  useEffect(() => { document.title = "StudySync - Calendar"; }, []);

  /* ══════════════════ Firebase ══════════════════ */
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "tasks"), where("userId", "==", user.uid));
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTasks(data);
      setLoading(false);
    });
  }, [user]);

  /* ══════════════════ Notifications ══════════════════ */
  useEffect(() => {
    const notifs = [];
    const now = new Date();
    tasks.forEach((t) => {
      const deadline = parseDate(t.deadline || t.startDate);
      if (!deadline || t.status === "completed") return;
      const diff = deadline - now;
      if (diff > 0 && diff < 24 * 60 * 60 * 1000) {
        notifs.push({ id: t.id, type: "upcoming", title: t.title, time: deadline, message: `Due ${formatTime(deadline)}` });
      }
      if (t.important && diff > 0 && diff < 48 * 60 * 60 * 1000) {
        notifs.push({ id: t.id + "-imp", type: "important", title: t.title, time: deadline, message: "Important deadline approaching" });
      }
    });
    // Conflict detection
    const sorted = [...tasks].filter(t => t.startDate && t.startTime && t.endTime).sort((a, b) => {
      return (`${a.startDate}T${a.startTime}` > `${b.startDate}T${b.startTime}`) ? 1 : -1;
    });
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i], b = sorted[i + 1];
      if (a.startDate === b.startDate && a.endTime > b.startTime) {
        notifs.push({
          id: `conflict-${a.id}-${b.id}`, type: "conflict",
          title: "Schedule Conflict",
          message: `${a.title} overlaps with ${b.title} at ${b.startTime}`,
        });
      }
    }
    setNotifications(notifs);
  }, [tasks]);

  /* ══════════════════ CRUD ══════════════════ */
  const addTask = useCallback(async (data) => {
    await addDoc(collection(db, "tasks"), {
      ...data,
      userId: user.uid,
      status: "pending",
      createdAt: serverTimestamp(),
    });
    setNewTaskInitialData({ ...EMPTY_TASK, startDate: localYMD(selectedDate), endDate: localYMD(selectedDate) });
    setShowAddModal(false);
  }, [user]);

  const updateTask = useCallback(async (data) => {
    if (!editingTask) return;
    await updateDoc(doc(db, "tasks", editingTask.id), data);
    setShowEditModal(false);
    setEditingTask(null);
  }, [editingTask]);

  const deleteTask = useCallback(async (id) => {
    await deleteDoc(doc(db, "tasks", id));
    setShowEditModal(false);
    setEditingTask(null);
  }, []);

  const handleDeleteFromModal = useCallback(() => {
    if (editingTask?.id) deleteTask(editingTask.id);
  }, [editingTask, deleteTask]);

  const toggleComplete = async (task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    await updateDoc(doc(db, "tasks", task.id), {
      status: newStatus,
      ...(newStatus === "completed" ? { completedAt: new Date().toISOString() } : { completedAt: null }),
    });
  };

  const openEdit = useCallback((task) => {
    setEditingTask(task);
    setShowEditModal(true);
  }, []);

  const openAddOnDate = useCallback((dateStr) => {
    setNewTaskInitialData({ ...EMPTY_TASK, startDate: dateStr, endDate: dateStr });
    setShowAddModal(true);
  }, []);

  /* ── Drag & Drop ── */
  const handleDragStart = (e, task) => {
    setDragState(task);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDrop = async (e, dateStr) => {
    e.preventDefault();
    if (!dragState) return;
    await updateDoc(doc(db, "tasks", dragState.id), {
      deadline: dateStr,
      startDate: dateStr,
      endDate: dateStr,
    });
    setDragState(null);
  };
  const handleDragOver = (e) => e.preventDefault();

  /* ══════════════════ Navigation ══════════════════ */
  const goToday = () => { setCurrentDate(new Date()); setSelectedDate(new Date()); };
  const goPrev = () => {
    const d = new Date(currentDate);
    if (view === "month") d.setMonth(d.getMonth() - 1);
    else if (view === "week") d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };
  const goNext = () => {
    const d = new Date(currentDate);
    if (view === "month") d.setMonth(d.getMonth() + 1);
    else if (view === "week") d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  /* ══════════════════ Computed ══════════════════ */
  const getTasksForDate = useCallback((dateStr) => {
    return tasks.filter((t) => {
      const d = t.startDate || t.deadline;
      return d === dateStr;
    });
  }, [tasks]);

  const getColorObj = (id) => TASK_COLORS.find(c => c.id === id) || TASK_COLORS[0];

  /* Heatmap intensity */
  const heatmapData = useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      const d = t.startDate || t.deadline;
      if (d) map[d] = (map[d] || 0) + 1;
    });
    return map;
  }, [tasks]);
  const maxHeat = Math.max(...Object.values(heatmapData), 1);

  /* Conflicts */
  const conflicts = useMemo(() => {
    return notifications.filter(n => n.type === "conflict");
  }, [notifications]);

  /* Upcoming tasks */
  const upcomingTasks = useMemo(() => {
    const now = new Date();
    return tasks
      .filter(t => {
        const d = parseDate(t.startDate || t.deadline);
        return d && d >= now && t.status !== "completed";
      })
      .sort((a, b) => {
        const da = parseDate(a.startDate || a.deadline);
        const db2 = parseDate(b.startDate || b.deadline);
        return da - db2;
      })
      .slice(0, 5);
  }, [tasks]);

  /* Smart suggestion */
  const smartSuggestion = useMemo(() => {
    const hourCounts = {};
    tasks.forEach(t => {
      if (t.startTime && t.status === "completed") {
        const h = parseInt(t.startTime.split(":")[0]);
        hourCounts[h] = (hourCounts[h] || 0) + 1;
      }
    });
    let bestHour = 16; // default 4 PM
    let bestCount = 0;
    Object.entries(hourCounts).forEach(([h, c]) => {
      if (c > bestCount) { bestHour = parseInt(h); bestCount = c; }
    });
    const ampm = bestHour >= 12 ? "PM" : "AM";
    const display = `${(bestHour % 12) || 12}:00 ${ampm}`;
    const endH = bestHour + 2;
    const endAmpm = endH >= 12 ? "PM" : "AM";
    const endDisplay = `${(endH % 12) || 12}:00 ${endAmpm}`;
    return { time: display, endTime: endDisplay, rawHour: bestHour };
  }, [tasks]);

  /* ══════════════════ Month Grid ══════════════════ */
  const monthGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const prevMonthDays = getDaysInMonth(year, month - 1);

    const cells = [];
    // previous month trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      cells.push({ date: d, current: false });
    }
    // current month
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push({ date: new Date(year, month, i), current: true });
    }
    // next month leading days
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      cells.push({ date: new Date(year, month + 1, i), current: false });
    }
    return cells;
  }, [currentDate]);

  /* ══════════════════ Week Grid ══════════════════ */
  const weekDays = useMemo(() => {
    const start = getWeekStart(currentDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [currentDate]);

  /* ═══════════════════════════════════════════
     TOP BAR CHILDREN
  ═══════════════════════════════════════════ */
  const topBarContent = (
    <>
      {/* View Toggle */}
      <div className="hidden md:flex bg-surface-container-high dark:bg-dm-surface rounded-xl p-1 gap-1">
        {["month", "week", "day"].map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
              view === v
                ? isDark ? "bg-dm-surface-elevated text-dm-text-primary shadow-sm" : "bg-white text-on-surface shadow-sm"
                : "text-text-muted dark:text-dm-text-secondary hover:text-on-surface dark:hover:text-dm-text-primary"}`}>
            {v}
          </button>
        ))}
      </div>
      {/* Heatmap toggle */}
      <button onClick={() => setShowHeatmap(!showHeatmap)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
          showHeatmap
            ? isDark ? "bg-dm-primary-bg border-primary/30 text-dm-text-green" : "bg-primary-container border-primary/20 text-primary-dark"
            : isDark ? "bg-dm-surface border-dm-border text-dm-text-secondary" : "bg-white border-border-default text-text-muted"}`}>
        <span className="material-symbols-outlined text-sm">grid_view</span>
        Heatmap
      </button>
      {/* Notification Bell */}
      <div className="relative">
        <button onClick={() => setShowNotifPanel(!showNotifPanel)}
          className="relative p-2 rounded-xl bg-white dark:bg-dm-surface border border-border-default dark:border-dm-border hover:bg-surface-container-low dark:hover:bg-dm-surface-hover transition-all">
          <span className="material-symbols-outlined text-on-surface-variant dark:text-dm-text-secondary text-xl">notifications</span>
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[0.6rem] font-bold flex items-center justify-center">
              {notifications.length}
            </span>
          )}
        </button>
        {/* Dropdown */}
        {showNotifPanel && (
          <div className="absolute right-0 top-12 w-80 bg-white dark:bg-dm-surface-elevated rounded-2xl shadow-2xl border border-emerald-100 dark:border-dm-border z-50 overflow-hidden animate-scale-in">
            <div className="px-5 py-3 border-b border-emerald-50 dark:border-dm-border flex items-center justify-between">
              <h4 className="text-sm font-bold text-emerald-900 dark:text-dm-text-primary">Notifications</h4>
              <span className="text-xs text-emerald-500 dark:text-dm-text-green">{notifications.length} alerts</span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-emerald-400 dark:text-dm-text-tertiary text-sm">All clear! 🎉</div>
              ) : notifications.map(n => (
                <div key={n.id} className="px-5 py-3 border-b border-emerald-50/50 dark:border-dm-border/50 hover:bg-emerald-50/50 dark:hover:bg-dm-surface-hover transition-colors">
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-sm ${n.type === "conflict" ? "text-rose-500" : n.type === "important" ? "text-amber-500" : "text-emerald-500"}`}>
                      {n.type === "conflict" ? "warning" : n.type === "important" ? "priority_high" : "schedule"}
                    </span>
                    <span className="text-xs font-bold text-emerald-900 dark:text-dm-text-primary">{n.title}</span>
                  </div>
                  <p className="text-[0.65rem] text-emerald-600/70 dark:text-dm-text-tertiary mt-0.5 pl-6">{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );

  /* ═══════════════════════════════════════════
     TASK PILL (used in month view cells)
  ═══════════════════════════════════════════ */
  const TaskPill = ({ task }) => {
    const c = getColorObj(task.color);
    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, task)}
        onClick={(e) => { e.stopPropagation(); openEdit(task); }}
        onMouseEnter={() => setHoveredTask(task)}
        onMouseLeave={() => setHoveredTask(null)}
        className={`text-[0.6rem] font-bold px-2 py-0.5 rounded-md truncate cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md ${task.status === "completed" ? "opacity-40 line-through" : ""}`}
        style={{ backgroundColor: c.hex + "20", color: c.hex, borderLeft: `3px solid ${c.hex}` }}
        title={task.title}
      >
        {task.important && "⭐ "}{task.title}
      </div>
    );
  };

  /* ═══════════════════════════════════════════
     TASK BLOCK (used in week/day time grid)
  ═══════════════════════════════════════════ */
  const TaskBlock = ({ task }) => {
    const c = getColorObj(task.color);
    const startH = task.startTime ? parseInt(task.startTime.split(":")[0]) : 9;
    const startM = task.startTime ? parseInt(task.startTime.split(":")[1]) : 0;
    const endH = task.endTime ? parseInt(task.endTime.split(":")[0]) : startH + 1;
    const endM = task.endTime ? parseInt(task.endTime.split(":")[1]) : 0;
    const top = (startH * 60 + startM) * (64 / 60); // 64px per hour
    const height = Math.max(((endH * 60 + endM) - (startH * 60 + startM)) * (64 / 60), 24);

    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, task)}
        onClick={(e) => { e.stopPropagation(); openEdit(task); }}
        className={`absolute left-1 right-1 rounded-lg px-2 py-1 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] z-10 ${task.status === "completed" ? "opacity-40" : ""}`}
        style={{
          top: `${top}px`, height: `${height}px`,
          backgroundColor: c.hex + "18",
          borderLeft: `3px solid ${c.hex}`,
          color: c.hex,
        }}
      >
        <p className="text-[0.6rem] font-bold truncate">{task.important && "⭐ "}{task.title}</p>
        {height > 32 && <p className="text-[0.55rem] opacity-70">{task.startTime} – {task.endTime}</p>}
      </div>
    );
  };



  /* ═══════════════════════════════════════════
     HOVER PREVIEW
  ═══════════════════════════════════════════ */
  const HoverPreview = () => {
    if (!hoveredTask) return null;
    const c = getColorObj(hoveredTask.color);
    return (
      <div className="fixed bottom-6 right-6 w-72 bg-white rounded-2xl shadow-2xl border border-emerald-100 p-5 z-40 animate-scale-in pointer-events-none">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.hex }} />
          <h4 className="text-sm font-bold text-emerald-900">{hoveredTask.title}</h4>
          {hoveredTask.important && <span className="text-amber-500">⭐</span>}
        </div>
        {hoveredTask.description && <p className="text-xs text-emerald-600/70 mb-2">{hoveredTask.description}</p>}
        <div className="flex items-center gap-4 text-[0.65rem] text-emerald-500">
          <span>{hoveredTask.subject}</span>
          <span>{hoveredTask.startTime} – {hoveredTask.endTime}</span>
          <span className={`uppercase font-bold ${hoveredTask.priority === "urgent" ? "text-rose-500" : ""}`}>{hoveredTask.priority}</span>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════ */
  return (
    <PageShell
      activePage="calendar"
      title={`${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
      subtitle="Plan your academic journey with precision"
      topBarChildren={topBarContent}
    >
      <div className="animate-page-enter max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

          {/* ══════════ LEFT PANEL — Intelligence ══════════ */}
          <div className="xl:col-span-3 space-y-5 order-2 xl:order-1">

            {/* Navigation Controls */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-emerald-50">
              <div className="flex items-center justify-between">
                <button onClick={goPrev} className="w-9 h-9 rounded-xl bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center transition-all">
                  <span className="material-symbols-outlined text-emerald-700 text-lg">chevron_left</span>
                </button>
                <button onClick={goToday} className="px-5 py-2 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs hover:bg-emerald-200 transition-all">
                  Today
                </button>
                <button onClick={goNext} className="w-9 h-9 rounded-xl bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center transition-all">
                  <span className="material-symbols-outlined text-emerald-700 text-lg">chevron_right</span>
                </button>
              </div>
              {/* Mini month-year display */}
              <div className="text-center mt-4">
                <h2 className="text-2xl font-extrabold text-emerald-900">{MONTH_NAMES[currentDate.getMonth()]}</h2>
                <p className="text-emerald-500 text-sm font-semibold">{currentDate.getFullYear()}</p>
              </div>
            </div>

            {/* Schedule Study Session */}
            <button onClick={() => {
              setNewTaskInitialData({
                ...EMPTY_TASK,
                title: "Study Session",
                startDate: todayYMD,
                endDate: todayYMD,
                startTime: `${String(smartSuggestion.rawHour).padStart(2, "0")}:00`,
                endTime: `${String(smartSuggestion.rawHour + 2).padStart(2, "0")}:00`,
                color: "emerald",
              });
              setShowAddModal(true);
            }}
              className="w-full py-3 px-5 rounded-xl signature-gradient text-white font-bold text-sm btn-interactive shadow-btn flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-lg">add</span>
              Schedule Study Session
            </button>

            {/* Smart Suggestion */}
            <div className="card-static rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary text-lg">auto_awesome</span>
                <h4 className="type-caption text-text-muted">Smart Suggestion</h4>
              </div>
              <h3 className="text-sm font-semibold text-on-surface mb-1">Optimal Study Slot</h3>
              <p className="text-3xl font-bold text-on-surface">{smartSuggestion.time}</p>
              <p className="text-xs text-text-muted mt-1">{smartSuggestion.endTime} (Today)</p>
              <div className="w-12 h-1 rounded-full signature-gradient mt-3" />
            </div>

            {/* Conflict Detection */}
            {conflicts.length > 0 && (
              <div className="bg-rose-50 rounded-3xl p-6 shadow-sm border border-rose-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-rose-500 text-lg">warning</span>
                  <h4 className="text-[0.65rem] font-bold uppercase tracking-widest text-rose-500">Conflict Detected</h4>
                </div>
                {conflicts.map(c => (
                  <div key={c.id} className="mb-3 last:mb-0">
                    <p className="text-xs text-rose-700 font-medium leading-relaxed">Heads up! {c.message}</p>
                  </div>
                ))}
                <button className="text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors mt-2 flex items-center gap-1">
                  Reschedule Now <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            )}

            {/* Upcoming Tasks */}
            <div className="card-static rounded-2xl p-5">
              <h4 className="type-caption text-text-muted mb-4">Upcoming</h4>
              {upcomingTasks.length === 0 ? (
                <p className="text-sm text-emerald-400 text-center py-4">No upcoming tasks 🎉</p>
              ) : (
                <div className="space-y-3">
                  {upcomingTasks.map(t => {
                    const c = getColorObj(t.color);
                    const d = parseDate(t.startDate || t.deadline);
                    return (
                      <div key={t.id} className="flex items-start gap-3 cursor-pointer hover:bg-emerald-50 rounded-xl p-2 -mx-2 transition-all"
                        onClick={() => openEdit(t)}>
                        <div className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: c.hex }} />
                        <div>
                          <p className="text-sm font-bold text-emerald-900">{t.title}</p>
                          <p className="text-[0.65rem] text-emerald-500">
                            {d?.toLocaleDateString("en-US", { month: "short", day: "numeric" })}{t.startTime ? `, ${t.startTime}` : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ══════════ MAIN CALENDAR AREA ══════════ */}
          <div className="xl:col-span-9 order-1 xl:order-2">

            {/* Mobile View Switcher */}
            <div className="flex md:hidden bg-emerald-100/80 rounded-xl p-1 gap-1 mb-4">
              {["month", "week", "day"].map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${view === v ? "bg-white text-emerald-800 shadow-sm" : "text-emerald-600/70"}`}>
                  {v}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-96">
                <span className="material-symbols-outlined text-6xl text-emerald-200 animate-spin">progress_activity</span>
              </div>
            ) : (
              <>
                {/* ════════ MONTH VIEW ════════ */}
                {view === "month" && (
                  <div className="bg-white rounded-2xl shadow-raised border border-border-default overflow-hidden">
                    {/* Header */}
                    <div className="grid grid-cols-7 border-b border-emerald-50">
                      {DAY_NAMES.map(d => (
                        <div key={d} className="py-3 text-center text-[0.65rem] font-bold uppercase tracking-widest text-emerald-500">{d}</div>
                      ))}
                    </div>
                    {/* Grid */}
                    <div className="grid grid-cols-7">
                      {monthGrid.map((cell, i) => {
                        const ymd = localYMD(cell.date);
                        const isToday = ymd === todayYMD;
                        const cellTasks = getTasksForDate(ymd);
                        const heatVal = heatmapData[ymd] || 0;
                        return (
                          <div key={i}
                            className={`min-h-[6rem] p-1.5 border-b border-r border-emerald-50/60 cursor-pointer transition-all hover:bg-emerald-50/50 relative ${!cell.current ? "bg-emerald-25/30" : ""}`}
                            style={showHeatmap && heatVal > 0 ? { backgroundColor: `rgba(0,108,73,${Math.min(heatVal / maxHeat * 0.25, 0.25)})` } : {}}
                            onClick={() => { setSelectedDate(cell.date); openAddOnDate(ymd); }}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, ymd)}
                          >
                            <span className={`text-xs font-bold inline-flex items-center justify-center w-7 h-7 rounded-full mb-1 ${
                              isToday
                                ? "bg-emerald-600 text-white"
                                : !cell.current
                                ? "text-emerald-300"
                                : "text-emerald-700"
                            }`}>
                              {cell.date.getDate()}
                            </span>
                            <div className="space-y-0.5">
                              {cellTasks.slice(0, 3).map(t => <TaskPill key={t.id} task={t} />)}
                              {cellTasks.length > 3 && (
                                <span className="text-[0.55rem] font-bold text-emerald-400 pl-2">+{cellTasks.length - 3} more</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ════════ WEEK VIEW ════════ */}
                {view === "week" && (
                  <div className="bg-white rounded-3xl shadow-sm border border-emerald-50 overflow-hidden">
                    {/* Header */}
                    <div className="grid grid-cols-8 border-b border-emerald-50">
                      <div className="py-3 px-2 text-center text-[0.6rem] font-bold text-emerald-300"></div>
                      {weekDays.map(d => {
                        const isToday = localYMD(d) === todayYMD;
                        return (
                          <div key={localYMD(d)} className="py-3 text-center">
                            <span className="text-[0.6rem] font-bold uppercase tracking-widest text-emerald-500">{DAY_NAMES[d.getDay()]}</span>
                            <span className={`block text-lg font-extrabold mt-0.5 ${isToday ? "text-emerald-600" : "text-emerald-900"}`}>
                              {d.getDate()}
                            </span>
                            {isToday && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mx-auto mt-1" />}
                          </div>
                        );
                      })}
                    </div>
                    {/* Time Grid */}
                    <div className="relative overflow-y-auto max-h-[600px] scrollbar-thin">
                      <div className="grid grid-cols-8" style={{ height: `${24 * 64}px` }}>
                        {/* Time labels */}
                        <div className="relative">
                          {HOURS.map(h => (
                            <div key={h} className="absolute w-full text-right pr-2 text-[0.6rem] text-emerald-400 font-semibold" style={{ top: `${h * 64}px` }}>
                              {h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`}
                            </div>
                          ))}
                        </div>
                        {/* Day columns */}
                        {weekDays.map(d => {
                          const ymd = localYMD(d);
                          const dayTasks = getTasksForDate(ymd).filter(t => t.startTime);
                          return (
                            <div key={ymd} className="relative border-l border-emerald-50"
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, ymd)}
                              onClick={() => { setSelectedDate(d); openAddOnDate(ymd); }}>
                              {/* Hour lines */}
                              {HOURS.map(h => (
                                <div key={h} className="absolute w-full border-t border-emerald-50/60" style={{ top: `${h * 64}px`, height: "64px" }} />
                              ))}
                              {/* Tasks */}
                              {dayTasks.map(t => <TaskBlock key={t.id} task={t} />)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* ════════ DAY VIEW ════════ */}
                {view === "day" && (
                  <div className="bg-white rounded-3xl shadow-sm border border-emerald-50 overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-emerald-50 flex items-center gap-4">
                      <span className={`text-3xl font-extrabold ${localYMD(currentDate) === todayYMD ? "text-emerald-600" : "text-emerald-900"}`}>
                        {currentDate.getDate()}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-emerald-800">{DAY_NAMES[currentDate.getDay()]}</p>
                        <p className="text-xs text-emerald-500">{MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}</p>
                      </div>
                      {localYMD(currentDate) === todayYMD && (
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[0.65rem] font-bold">Today</span>
                      )}
                    </div>
                    {/* Time Grid */}
                    <div className="relative overflow-y-auto max-h-[600px] scrollbar-thin">
                      <div className="grid grid-cols-[60px_1fr]" style={{ height: `${24 * 64}px` }}>
                        {/* Time labels */}
                        <div className="relative">
                          {HOURS.map(h => (
                            <div key={h} className="absolute w-full text-right pr-3 text-[0.6rem] text-emerald-400 font-semibold" style={{ top: `${h * 64}px` }}>
                              {h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`}
                            </div>
                          ))}
                        </div>
                        {/* Day column */}
                        <div className="relative border-l border-emerald-50"
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, localYMD(currentDate))}
                          onClick={() => openAddOnDate(localYMD(currentDate))}>
                          {HOURS.map(h => (
                            <div key={h} className="absolute w-full border-t border-emerald-50/60" style={{ top: `${h * 64}px`, height: "64px" }} />
                          ))}
                          {getTasksForDate(localYMD(currentDate)).filter(t => t.startTime).map(t => (
                            <TaskBlock key={t.id} task={t} />
                          ))}
                          {/* Current time indicator */}
                          {localYMD(currentDate) === todayYMD && (() => {
                            const now = new Date();
                            const mins = now.getHours() * 60 + now.getMinutes();
                            const top = mins * (64 / 60);
                            return (
                              <div className="absolute left-0 right-0 z-20" style={{ top: `${top}px` }}>
                                <div className="flex items-center">
                                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                                  <div className="flex-1 h-0.5 bg-rose-500" />
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ══════════ FAB ══════════ */}
      <button
        onClick={() => { setNewTaskInitialData({ ...EMPTY_TASK, startDate: todayYMD, endDate: todayYMD }); setShowAddModal(true); }}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-2xl signature-gradient text-white flex items-center justify-center shadow-btn btn-interactive z-40">
        <span className="material-symbols-outlined text-2xl">add</span>
      </button>

      {/* ══════════ MODALS ══════════ */}
      {showAddModal && (
        <TaskModal
          key="add-modal"
          isEdit={false}
          initialData={newTaskInitialData || EMPTY_TASK}
          onClose={() => setShowAddModal(false)}
          onSave={addTask}
        />
      )}

      {showEditModal && editingTask && (
        <TaskModal
          key={`edit-${editingTask.id}`}
          isEdit={true}
          initialData={{
            ...EMPTY_TASK,
            title:       editingTask.title       || "",
            description: editingTask.description || "",
            subject:     editingTask.subject     || "BEE",
            startDate:   editingTask.startDate   || editingTask.deadline || "",
            startTime:   editingTask.startTime   || "09:00",
            endDate:     editingTask.endDate     || editingTask.startDate || editingTask.deadline || "",
            endTime:     editingTask.endTime     || "10:00",
            color:       editingTask.color       || "emerald",
            priority:    editingTask.priority    || "normal",
            important:   editingTask.important   || false,
            deadline:    editingTask.deadline    || editingTask.startDate || "",
          }}
          onClose={() => { setShowEditModal(false); setEditingTask(null); }}
          onSave={updateTask}
          onDelete={handleDeleteFromModal}
        />
      )}

      {/* ══════════ HOVER PREVIEW ══════════ */}
      <HoverPreview />
    </PageShell>
  );
}
