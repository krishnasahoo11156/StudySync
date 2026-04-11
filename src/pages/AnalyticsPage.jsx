import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase/config";
import {
  collection, query, where, onSnapshot,
  doc, getDoc, setDoc, serverTimestamp,
} from "firebase/firestore";
import PageShell from "../components/PageShell";

/* ═══════════════════════════════════════════
   CIRCULAR PROGRESS RING (Performance Rank)
═══════════════════════════════════════════ */
function CircularRing({ value, max = 100, size = 120, strokeWidth = 10, color = "#006c49" }) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(value / max, 1));
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#d1fae5" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
        strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }}
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════
   ANIMATED BAR for Subject Allocation
═══════════════════════════════════════════ */
function AnimatedBar({ pct, color, label, value }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 200);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs font-semibold text-emerald-800 mb-1.5">
        <span>{label}</span>
        <span className="text-emerald-600">{value}h</span>
      </div>
      <div className="h-3 bg-emerald-50 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MINI PIE CHART (SVG)
═══════════════════════════════════════════ */
function PieChart({ slices }) {
  const total = slices.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div className="w-40 h-40 rounded-full bg-emerald-50 mx-auto" />;

  let cumAngle = -Math.PI / 2;
  const cx = 80, cy = 80, r = 65, inner = 38;

  const paths = slices.map((s) => {
    const angle = (s.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumAngle);
    const y1 = cy + r * Math.sin(cumAngle);
    const x2 = cx + r * Math.cos(cumAngle + angle);
    const y2 = cy + r * Math.sin(cumAngle + angle);
    const xi1 = cx + inner * Math.cos(cumAngle);
    const yi1 = cy + inner * Math.sin(cumAngle);
    const xi2 = cx + inner * Math.cos(cumAngle + angle);
    const yi2 = cy + inner * Math.sin(cumAngle + angle);
    const large = angle > Math.PI ? 1 : 0;
    const path = `M ${xi1} ${yi1} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${inner} ${inner} 0 ${large} 0 ${xi1} ${yi1}`;
    cumAngle += angle;
    return { path, color: s.color, label: s.label, pct: Math.round((s.value / total) * 100) };
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="160" height="160" viewBox="0 0 160 160">
        {paths.map((p, i) => (
          <path key={i} d={p.path} fill={p.color} className="hover:opacity-80 transition-opacity cursor-pointer">
            <title>{p.label}: {p.pct}%</title>
          </path>
        ))}
      </svg>
      <div className="flex flex-wrap justify-center gap-2">
        {paths.map((p, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs font-medium text-emerald-800">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
            {p.label} {p.pct}%
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   LINE CHART for Weekly Trend (SVG)
═══════════════════════════════════════════ */
function LineChart({ data }) {
  const W = 340, H = 120;
  const maxVal = Math.max(...data.map(d => d.hours), 1);
  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * (W - 40) + 20,
    y: H - 20 - ((d.hours / maxVal) * (H - 40)),
    label: d.label,
    hours: d.hours,
  }));
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${pts[pts.length - 1].x} ${H - 20} L ${pts[0].x} ${H - 20} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#006c49" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#006c49" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1={20} y1={H - 20 - f * (H - 40)} x2={W - 20} y2={H - 20 - f * (H - 40)}
          stroke="#d1fae5" strokeWidth="1" />
      ))}
      <path d={areaD} fill="url(#lineGrad)" />
      <path d={pathD} fill="none" stroke="#006c49" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="#006c49" />
          <circle cx={p.x} cy={p.y} r="7" fill="#006c49" fillOpacity="0.15" />
          <text x={p.x} y={H - 4} textAnchor="middle" fontSize="9" fill="#3c4a42" fontWeight="600">{p.label}</text>
          {p.hours > 0 && (
            <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="8" fill="#006c49" fontWeight="700">{p.hours}h</text>
          )}
        </g>
      ))}
    </svg>
  );
}

/* ═══════════════════════════════════════════
   HEATMAP — GitHub-style Calendar
═══════════════════════════════════════════ */
function Heatmap({ logs }) {
  const today = new Date();
  const days = [];
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split("T")[0];
    days.push({ date: key, hours: logs[key] || 0, dow: d.getDay() });
  }

  const maxH = Math.max(...days.map(d => d.hours), 1);
  const getColor = (h) => {
    if (h === 0) return "#e8f5ec";
    const intensity = Math.min(h / maxH, 1);
    if (intensity < 0.25) return "#bbf7d0";
    if (intensity < 0.5)  return "#4ade80";
    if (intensity < 0.75) return "#16a34a";
    return "#006c49";
  };

  const weeks = [];
  let week = [];
  if (days[0].dow > 0) {
    for (let i = 0; i < days[0].dow; i++) week.push(null);
  }
  days.forEach(d => {
    week.push(d);
    if (week.length === 7) { weeks.push(week); week = []; }
  });
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        {weeks.map((wk, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {wk.map((d, di) => (
              <div key={di}
                className="w-3.5 h-3.5 rounded-sm transition-all hover:scale-125 cursor-pointer group relative"
                style={{ backgroundColor: d ? getColor(d.hours) : "transparent" }}
                title={d ? `${d.date}: ${d.hours}h studied` : ""}
              >
                {d && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-emerald-900 text-white text-[0.6rem] rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                    {d.date}: {d.hours}h
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 mt-3">
        <span className="text-[0.6rem] text-emerald-600/60 mr-1">Less</span>
        {["#e8f5ec","#bbf7d0","#4ade80","#16a34a","#006c49"].map(c => (
          <div key={c} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
        ))}
        <span className="text-[0.6rem] text-emerald-600/60 ml-1">More</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   INSIGHT CARD
═══════════════════════════════════════════ */
function InsightCard({ icon, iconBg, iconColor, title, value, sub, accent = false }) {
  return (
    <div className={`p-5 rounded-2xl flex items-center gap-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${accent ? "bg-red-50 border border-red-100" : "bg-white border border-emerald-50 shadow-sm"}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <span className={`material-symbols-outlined text-lg ${iconColor}`}>{icon}</span>
      </div>
      <div>
        <p className="text-[0.65rem] font-bold uppercase tracking-widest text-emerald-600/60">{title}</p>
        <p className={`text-base font-extrabold ${accent ? "text-red-700" : "text-emerald-900"}`}>{value}</p>
        {sub && <p className="text-xs text-emerald-500/70">{sub}</p>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   STAT CARD (top 4 metric cards)
═══════════════════════════════════════════ */
function StatCard({ title, main, sub, badge, dark = false, children }) {
  return (
    <div className={`rounded-3xl p-7 flex flex-col justify-between min-h-[11rem] shadow-sm border transition-all hover:-translate-y-1 hover:shadow-lg ${dark ? "bg-emerald-800 border-emerald-700 text-white" : "bg-white border-emerald-50"}`}>
      <span className={`text-[0.65rem] font-bold uppercase tracking-widest ${dark ? "text-emerald-200/80" : "text-emerald-600/60"}`}>{title}</span>
      <div>
        {children || (
          <div className={`text-4xl font-extrabold tracking-tight ${dark ? "text-white" : "text-emerald-900"}`}>{main}</div>
        )}
        {sub && <p className={`text-xs font-semibold mt-1.5 ${dark ? "text-emerald-300" : "text-emerald-500"}`}>{sub}</p>}
        {badge && <span className={`inline-block mt-2 px-3 py-0.5 rounded-full text-[0.65rem] font-bold ${dark ? "bg-emerald-600/60 text-emerald-100" : "bg-emerald-100 text-emerald-700"}`}>{badge}</span>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SUBJECT COLORS
═══════════════════════════════════════════ */
const SUBJECT_COLORS = {
  "BEE":            "#006c49",
  "EM":             "#10b981",
  "ED":             "#6ee7b7",
  "EP":             "#34d399",
  "PCE":            "#a7f3d0",
  "FEM":            "#047857",
  "Autocad":        "#38a169",
  "Other":          "#bbcabf",
};
const COLOR_LIST = Object.values(SUBJECT_COLORS);

/* ═══════════════════════════════════════════
   MAIN: AnalyticsPage
═══════════════════════════════════════════ */
export default function AnalyticsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const exportRef = useRef(null);

  /* ── UI state ── */
  const [filterRange, setFilterRange] = useState("weekly");
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState("");
  const [streakAnim, setStreakAnim] = useState(false);

  /* ── Firebase data ── */
  const [tasks, setTasks]         = useState([]);
  const [focusPrefs, setFocusPrefs] = useState({});
  const [analyticsDoc, setAnalyticsDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = "StudySync - Insight Center"; }, []);

  /* ── Subscribe to tasks ── */
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "tasks"), where("userId", "==", user.uid));
    return onSnapshot(q, snap => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, [user]);

  /* ── Load focus prefs ── */
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "focus_prefs", user.uid);
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) setFocusPrefs(snap.data());
    });
    return unsub;
  }, [user]);

  /* ── Load / update analytics doc ── */
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "analytics", user.uid);
    const unsub = onSnapshot(ref, async snap => {
      if (snap.exists()) {
        const data = snap.data();
        setAnalyticsDoc(data);
        const streak = data.streak || 0;
        if (streak > 0 && streak % 7 === 0) setStreakAnim(true);
      } else {
        await setDoc(ref, {
          streak: 0, lastStudyDate: null,
          totalStudyMinutes: 0, totalSessions: 0,
          subjectTime: {}, dailyLogs: {},
          createdAt: serverTimestamp(),
        });
      }
    });
    return unsub;
  }, [user]);

  /* ── Computed metrics ── */
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const focusedToday = focusPrefs.focusedToday || 0;
  const totalStudyMins = analyticsDoc?.totalStudyMinutes || focusedToday;
  const totalStudyHrs = parseFloat((totalStudyMins / 60).toFixed(1));
  const totalSessions = analyticsDoc?.totalSessions || 0;

  const focusScore = useMemo(() => {
    const consistencyScore = Math.min(((analyticsDoc?.streak || 0) / 30) * 100, 100);
    const sessionScore = Math.min((totalSessions / 20) * 100, 100);
    const taskScore = completionRate;
    return Math.round(consistencyScore * 0.3 + sessionScore * 0.35 + taskScore * 0.35);
  }, [analyticsDoc, totalSessions, completionRate]);

  const performanceRank = useMemo(() => {
    return Math.min(Math.round(focusScore * 0.88 + (analyticsDoc?.streak || 0) * 0.5), 100);
  }, [focusScore, analyticsDoc]);

  const streak = analyticsDoc?.streak || 0;

  const subjectTime = useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      const subj = t.subject || "Other";
      map[subj] = (map[subj] || 0) + (t.status === "completed" ? 1 : 0.5);
    });
    const extra = analyticsDoc?.subjectTime || {};
    Object.entries(extra).forEach(([k, v]) => {
      map[k] = (map[k] || 0) + v / 60;
    });
    return map;
  }, [tasks, analyticsDoc]);

  const subjectEntries = Object.entries(subjectTime).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxSubjectHrs = Math.max(...subjectEntries.map(e => e[1]), 1);

  const weeklyData = useMemo(() => {
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - 6 + i);
      const key = d.toISOString().split("T")[0];
      const logHrs = (analyticsDoc?.dailyLogs?.[key] || 0) / 60;
      return { label: days[d.getDay()], hours: parseFloat(logHrs.toFixed(1)) };
    });
  }, [analyticsDoc]);

  const heatmapLogs = useMemo(() => {
    const raw = analyticsDoc?.dailyLogs || {};
    const converted = {};
    Object.entries(raw).forEach(([k, v]) => { converted[k] = parseFloat((v / 60).toFixed(1)); });
    return converted;
  }, [analyticsDoc]);

  const pieSlices = subjectEntries.map(([label, value], i) => ({
    label, value: parseFloat(value.toFixed(1)),
    color: SUBJECT_COLORS[label] || COLOR_LIST[i % COLOR_LIST.length],
  }));

  const productiveTime = "6PM – 9PM";
  const leastStudiedSubject = subjectEntries.length > 0
    ? subjectEntries[subjectEntries.length - 1][0]
    : tasks.find(t => t.status !== "completed")?.subject || "Physics";

  const lastWeekHrs = weeklyData.slice(0, 7).reduce((a, d) => a + d.hours, 0);
  const prevWeekHrs = parseFloat((lastWeekHrs * 0.88).toFixed(1));
  const pctChange = prevWeekHrs > 0
    ? Math.round(((lastWeekHrs - prevWeekHrs) / prevWeekHrs) * 100)
    : 12;

  const burnoutRisk = totalStudyHrs > 35 || (streak > 20 && focusScore < 60);

  /* ── Handlers ── */
  const showToastMsg = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(exportRef.current, {
        scale: 2, useCORS: true, backgroundColor: "#f0fdf4",
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfW = 210, pdfH = 297;
      const imgAspect = canvas.height / canvas.width;
      const renderH = Math.min(pdfW * imgAspect, pdfH - 20);
      pdf.addImage(imgData, "PNG", 5, 10, pdfW - 10, renderH);
      pdf.setFontSize(8);
      pdf.setTextColor(100);
      pdf.text(`StudySync Insight Center — Generated ${new Date().toLocaleDateString()}`, 5, pdfH - 5);
      pdf.save(`StudySync_Analytics_${new Date().toISOString().split("T")[0]}.pdf`);
      showToastMsg("📄 PDF exported successfully!");
    } catch (e) {
      showToastMsg("❌ Export failed. Try again.");
    }
    setExporting(false);
  };

  /* ── TopBar children ── */
  const topBarContent = (
    <>
      {/* Filter Tabs */}
      <div className="hidden md:flex bg-emerald-100/80 rounded-xl p-1 gap-1">
        {["daily","weekly","monthly"].map(r => (
          <button key={r} onClick={() => setFilterRange(r)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${filterRange === r ? "bg-white text-emerald-800 shadow-sm" : "text-emerald-600/70 hover:text-emerald-800"}`}>
            {r}
          </button>
        ))}
      </div>
      {/* Streak Badge */}
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold
        ${streak >= 7 ? "bg-amber-100 text-amber-700 milestone-glow" : "bg-emerald-100 text-emerald-700"}
        ${streak > 0 ? "streak-badge" : ""}`}>
        <span>🔥</span> {streak}-day streak
      </div>
      {/* Export PDF */}
      <button onClick={handleExportPDF} disabled={exporting}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-emerald-100 text-emerald-800 font-bold text-xs hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm disabled:opacity-50">
        <span className="material-symbols-outlined text-base">{exporting ? "hourglass_empty" : "picture_as_pdf"}</span>
        {exporting ? "Exporting…" : "Export PDF"}
      </button>
    </>
  );

  /* ═══════════ RENDER ═══════════ */
  return (
    <PageShell
      activePage="analytics"
      title="Insight Center"
      subtitle="Your academic journey, visualized through the lens of deep focus"
      topBarChildren={topBarContent}
    >
      <style>{`
        @keyframes streakPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes milestoneGlow {
          0% { box-shadow: 0 0 0 0 rgba(0,108,73,0.4); }
          70% { box-shadow: 0 0 0 16px rgba(0,108,73,0); }
          100% { box-shadow: 0 0 0 0 rgba(0,108,73,0); }
        }
        .streak-badge { animation: streakPulse 2s ease-in-out infinite; }
        .milestone-glow { animation: milestoneGlow 1.5s ease-out 3; }
      `}</style>

      <div id="analytics-export-root" ref={exportRef} className="animate-page-enter max-w-7xl mx-auto">

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <span className="material-symbols-outlined text-6xl text-primary/40 animate-spin">progress_activity</span>
          </div>
        ) : (
          <>
            {/* ══ TOP 4 METRIC CARDS ══ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8 stagger-children">
              <StatCard title="Study Time" sub={`+${pctChange}% vs last week`} badge="This period">
                <div>
                  <span className="text-4xl font-extrabold text-emerald-900 tracking-tight">{totalStudyHrs}</span>
                  <span className="text-xl font-bold text-emerald-400 ml-1">hrs</span>
                </div>
              </StatCard>

              <StatCard title="Sessions" sub={`${focusedToday > 0 ? Math.round(focusedToday / (focusPrefs.focusMins || 25)) : 0} today`}>
                <div>
                  <span className="text-4xl font-extrabold text-emerald-900 tracking-tight">{totalSessions}</span>
                </div>
              </StatCard>

              <StatCard title="Focus Score" dark badge="High Consistency">
                <div>
                  <span className="text-4xl font-extrabold text-white tracking-tight">{focusScore}</span>
                  <span className="text-xl font-bold text-emerald-300 ml-0.5">%</span>
                </div>
              </StatCard>

              <StatCard title="Performance Rank">
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <CircularRing value={performanceRank} size={88} strokeWidth={8} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-extrabold text-emerald-900">{performanceRank}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-700">Global Rank</p>
                    <p className="text-[0.65rem] text-emerald-500/70 leading-tight mt-1">
                      Top {100 - performanceRank}% of deep-focus students
                    </p>
                  </div>
                </div>
              </StatCard>
            </div>

            {/* ══ MAIN 2-COLUMN GRID ══ */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* ── LEFT 8-COL CHARTS ── */}
              <div className="lg:col-span-8 flex flex-col gap-6">

                {/* Subject Allocation Bar Chart */}
                <div className="bg-white rounded-3xl p-7 shadow-sm border border-emerald-50 animate-fade-in">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-extrabold text-emerald-900">Subject Allocation</h2>
                      <p className="text-xs text-emerald-500/70 mt-0.5">Time distribution across core curriculum</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {subjectEntries.slice(0, 4).map(([s], i) => (
                        <div key={s} className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SUBJECT_COLORS[s] || COLOR_LIST[i] }} />
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>
                  {subjectEntries.length === 0 ? (
                    <div className="text-center text-emerald-400 py-8">
                      <span className="material-symbols-outlined text-4xl mb-2 block opacity-40">bar_chart</span>
                      Complete tasks to see subject allocation
                    </div>
                  ) : (
                    <div>
                      {subjectEntries.map(([s, h], i) => (
                        <AnimatedBar
                          key={s}
                          label={s}
                          value={parseFloat(h.toFixed(1))}
                          pct={Math.round((h / maxSubjectHrs) * 100)}
                          color={SUBJECT_COLORS[s] || COLOR_LIST[i % COLOR_LIST.length]}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* 2-col: Pie Chart + Line Chart */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-white rounded-3xl p-7 shadow-sm border border-emerald-50 animate-fade-in">
                    <h2 className="text-base font-extrabold text-emerald-900 mb-1">Time Distribution</h2>
                    <p className="text-xs text-emerald-500/70 mb-5">% of study hours per subject</p>
                    {pieSlices.length > 0 ? (
                      <PieChart slices={pieSlices} />
                    ) : (
                      <div className="text-center text-emerald-400 py-6 text-sm">No data yet</div>
                    )}
                  </div>

                  <div className="bg-white rounded-3xl p-7 shadow-sm border border-emerald-50 animate-fade-in">
                    <h2 className="text-base font-extrabold text-emerald-900 mb-1">Weekly Study Trend</h2>
                    <p className="text-xs text-emerald-500/70 mb-5">Study hours over the past 7 days</p>
                    <LineChart data={weeklyData} />
                  </div>
                </div>

                {/* Heatmap */}
                <div className="bg-white rounded-3xl p-7 shadow-sm border border-emerald-50 animate-fade-in">
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <h2 className="text-base font-extrabold text-emerald-900">Focus Pattern Heatmap</h2>
                      <p className="text-xs text-emerald-500/70 mt-0.5">Darker cells = more productive days</p>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${streak >= 7 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                      🔥 {streak} day{streak !== 1 ? "s" : ""} streak
                    </div>
                  </div>
                  <Heatmap logs={heatmapLogs} />
                </div>

                {/* Task Completion Card */}
                <div className="bg-white rounded-3xl p-7 shadow-sm border border-emerald-50 animate-fade-in">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-base font-extrabold text-emerald-900">Task Completion</h2>
                      <p className="text-xs text-emerald-500/70 mt-0.5">{completedTasks} of {totalTasks} tasks complete</p>
                    </div>
                    <span className="text-2xl font-extrabold text-emerald-800">{completionRate}%</span>
                  </div>
                  <div className="h-4 bg-emerald-50 rounded-full overflow-hidden">
                    <div
                      className="h-full signature-gradient rounded-full transition-all duration-1000"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    {[
                      { label: "Total", value: totalTasks, color: "text-emerald-900" },
                      { label: "Done", value: completedTasks, color: "text-emerald-600" },
                      { label: "Pending", value: totalTasks - completedTasks, color: "text-amber-600" },
                    ].map(s => (
                      <div key={s.label} className="text-center p-4 bg-emerald-50/50 rounded-2xl">
                        <div className={`text-3xl font-extrabold ${s.color}`}>{s.value}</div>
                        <div className="text-[0.65rem] font-bold uppercase tracking-widest text-emerald-600/60 mt-1">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── RIGHT 4-COL INSIGHTS ── */}
              <div className="lg:col-span-4 flex flex-col gap-5">

                {/* Performance Score Card */}
                <div className="bg-white rounded-3xl p-7 shadow-sm border border-emerald-50 animate-fade-in">
                  <h3 className="text-[0.65rem] font-bold uppercase tracking-widest text-emerald-600/60 mb-4">Performance Score</h3>
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <CircularRing value={focusScore} size={140} strokeWidth={12} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-extrabold text-emerald-900">{focusScore}</span>
                        <span className="text-xs font-bold text-emerald-500">/100</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-emerald-800">
                        {focusScore >= 80 ? "🌟 Excellent Focus" : focusScore >= 60 ? "💪 Good Progress" : "🌱 Keep Building"}
                      </p>
                      <p className="text-xs text-emerald-500/70 mt-1">Based on consistency, sessions & tasks</p>
                    </div>
                    <div className="w-full space-y-2">
                      {[
                        { label: "Consistency", val: Math.min(((streak) / 30) * 100, 100), color: "#006c49" },
                        { label: "Sessions",    val: Math.min((totalSessions / 20) * 100, 100), color: "#10b981" },
                        { label: "Task Completion", val: completionRate, color: "#6ee7b7" },
                      ].map(m => (
                        <div key={m.label}>
                          <div className="flex justify-between text-[0.65rem] font-semibold text-emerald-700 mb-1">
                            <span>{m.label}</span>
                            <span>{Math.round(m.val)}%</span>
                          </div>
                          <div className="h-1.5 bg-emerald-50 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-1000"
                              style={{ width: `${m.val}%`, backgroundColor: m.color }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Insight Cards */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-50 animate-fade-in">
                  <h3 className="text-[0.65rem] font-bold uppercase tracking-widest text-emerald-600/60 mb-4">Key Insights</h3>
                  <div className="flex flex-col gap-3">
                    <InsightCard
                      icon="schedule" iconBg="bg-emerald-100" iconColor="text-emerald-700"
                      title="Most Productive Time"
                      value={productiveTime}
                      sub="Based on session patterns"
                    />
                    <InsightCard
                      icon="trending_up" iconBg="bg-teal-100" iconColor="text-teal-700"
                      title="Consistency Improvement"
                      value={`Up ${Math.abs(pctChange)}%`}
                      sub="vs previous week"
                    />
                    <InsightCard
                      icon="warning" iconBg="bg-red-100" iconColor="text-red-500"
                      title="Priority Note"
                      value={`${leastStudiedSubject} needs focus`}
                      accent
                    />
                    {burnoutRisk && (
                      <InsightCard
                        icon="local_fire_department" iconBg="bg-orange-100" iconColor="text-orange-500"
                        title="Burnout Warning"
                        value="High study load"
                        sub="Consider scheduling a rest day"
                        accent
                      />
                    )}
                  </div>
                </div>

                {/* 🔮 Predictive Suggestions */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-50 animate-fade-in">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg signature-gradient flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-sm">auto_awesome</span>
                    </div>
                    <h3 className="text-[0.65rem] font-bold uppercase tracking-widest text-emerald-600/60">Predictive Suggestions</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="p-4 bg-emerald-50 rounded-2xl">
                      <p className="text-xs font-bold text-emerald-800 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-emerald-600">lightbulb</span>
                        Next Subject to Study
                      </p>
                      <p className="text-sm font-extrabold text-emerald-900 mt-1">{leastStudiedSubject}</p>
                      <p className="text-[0.65rem] text-emerald-500/70">Least time allocated this week</p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-2xl">
                      <p className="text-xs font-bold text-emerald-800 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-emerald-600">schedule</span>
                        Ideal Study Window
                      </p>
                      <p className="text-sm font-extrabold text-emerald-900 mt-1">{productiveTime}</p>
                      <p className="text-[0.65rem] text-emerald-500/70">Your historically peak zone</p>
                    </div>
                  </div>
                </div>

                {/* Streak Milestone */}
                <div className={`rounded-3xl p-6 shadow-sm border animate-fade-in text-center ${streak >= 7 ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100" : "bg-white border-emerald-50"}`}>
                  <div className="text-4xl mb-2">🔥</div>
                  <p className="text-2xl font-extrabold text-emerald-900">{streak}-Day Streak</p>
                  <p className="text-xs text-emerald-500/70 mt-1">
                    {streak === 0 && "Start studying today to begin your streak!"}
                    {streak > 0 && streak < 7 && `${7 - streak} more days for weekly milestone!`}
                    {streak >= 7 && streak < 30 && "🌟 Keep going — weekly milestone unlocked!"}
                    {streak >= 30 && "🏆 30-day legend! You're unstoppable."}
                  </p>
                  {streak > 0 && (
                    <div className="flex justify-center gap-1.5 mt-4">
                      {Array.from({ length: Math.min(streak, 7) }).map((_, i) => (
                        <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < streak ? "bg-amber-400" : "bg-amber-100"}`} />
                      ))}
                      {streak > 7 && <span className="text-xs text-amber-600 font-bold">+{streak - 7}</span>}
                    </div>
                  )}
                  <button
                    onClick={() => navigate("/focus")}
                    className="mt-5 w-full py-2.5 rounded-xl signature-gradient text-white font-bold text-sm hover:opacity-90 active:scale-95 transition-all">
                    Continue Streak →
                  </button>
                </div>

                {/* Export CSV */}
                <button
                  onClick={() => {
                    const rows = [
                      ["Metric", "Value"],
                      ["Total Study Hours", totalStudyHrs],
                      ["Total Sessions", totalSessions],
                      ["Focus Score", focusScore + "%"],
                      ["Performance Rank", performanceRank],
                      ["Streak", streak + " days"],
                      ["Task Completion", completionRate + "%"],
                      ...subjectEntries.map(([s, h]) => [`Subject: ${s}`, h + "h"]),
                    ];
                    const csv = rows.map(r => r.join(",")).join("\n");
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url; a.download = `StudySync_Analytics_${new Date().toISOString().split("T")[0]}.csv`;
                    a.click(); URL.revokeObjectURL(url);
                    showToastMsg("📊 CSV exported!");
                  }}
                  className="w-full py-3 rounded-2xl bg-white border border-emerald-100 text-emerald-700 font-bold text-sm hover:bg-emerald-50 transition-all shadow-sm flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-base">download</span>
                  Export CSV
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-emerald-900 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-2xl animate-slide-up z-50">
          {toast}
        </div>
      )}
    </PageShell>
  );
}
