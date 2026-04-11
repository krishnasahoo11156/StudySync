import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase/config";
import {
  collection, query, where, onSnapshot,
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
} from "firebase/firestore";
import PageShell from "../components/PageShell";

/* ═══════════════════════════════════════════
   WEB AUDIO AMBIENT SOUND ENGINE
   Generates all sounds programmatically —
   no external files, no CORS issues.
═══════════════════════════════════════════ */
class AmbientEngine {
  constructor() {
    this.ctx = null;
    this.nodes = [];
    this.gainNode = null;
    this.volume = 0.4;
  }

  _ensure() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === "suspended") this.ctx.resume();
  }

  stop() {
    this.nodes.forEach(n => { try { n.stop(); } catch (_) {} });
    if (this.gainNode) { try { this.gainNode.disconnect(); } catch (_) {} }
    this.nodes = [];
    this.gainNode = null;
  }

  _masterGain() {
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    this.gainNode.connect(this.ctx.destination);
    return this.gainNode;
  }

  /* White noise buffer */
  _whiteNoiseBuffer(seconds = 2) {
    const rate = this.ctx.sampleRate;
    const buf  = this.ctx.createBuffer(1, rate * seconds, rate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  _playNoise(buf) {
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    this.nodes.push(src);
    return src;
  }

  playForestRain() {
    this._ensure(); this.stop();
    const master = this._masterGain();
    const buf = this._whiteNoiseBuffer();
    const src = this._playNoise(buf);
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 600; lp.Q.value = 0.5;
    const mod = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    mod.frequency.value = 2.5;
    modGain.gain.value = 0.15;
    mod.connect(modGain); modGain.connect(lp.gain);
    mod.start();
    src.connect(lp); lp.connect(master);
    src.start();
    this.nodes.push(mod);
  }

  playLibrary() {
    this._ensure(); this.stop();
    const master = this._masterGain();
    master.gain.setValueAtTime(this.volume * 0.35, this.ctx.currentTime);
    const buf = this._whiteNoiseBuffer();
    const src = this._playNoise(buf);
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 180; lp.Q.value = 0.2;
    const lp2 = this.ctx.createBiquadFilter();
    lp2.type = "lowpass"; lp2.frequency.value = 180;
    src.connect(lp); lp.connect(lp2); lp2.connect(master);
    src.start();
  }

  playMorningBirds() {
    this._ensure(); this.stop();
    const master = this._masterGain();
    master.gain.setValueAtTime(this.volume * 0.5, this.ctx.currentTime);
    const buf = this._whiteNoiseBuffer();
    const src = this._playNoise(buf);
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 3000; lp.Q.value = 1;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.value = 0.05;
    src.connect(lp); lp.connect(noiseGain); noiseGain.connect(master);
    src.start();
    const chirpFreqs = [2200, 2800, 3200, 1800, 2600];
    chirpFreqs.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const g   = this.ctx.createGain();
      osc.type = "sine"; osc.frequency.value = freq;
      g.gain.setValueAtTime(0, this.ctx.currentTime);
      const period = 3 + i * 1.7;
      for (let t = i * 0.4; t < 120; t += period) {
        const st = this.ctx.currentTime + t;
        g.gain.setValueAtTime(0, st);
        g.gain.linearRampToValueAtTime(0.12, st + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, st + 0.35);
        osc.frequency.setValueAtTime(freq, st);
        osc.frequency.linearRampToValueAtTime(freq * 1.08, st + 0.15);
        osc.frequency.linearRampToValueAtTime(freq, st + 0.35);
      }
      osc.connect(g); g.connect(master);
      osc.start();
      this.nodes.push(osc);
    });
  }

  playWhiteNoise() {
    this._ensure(); this.stop();
    const master = this._masterGain();
    const buf = this._whiteNoiseBuffer();
    const src = this._playNoise(buf);
    src.connect(master); src.start();
  }

  playCafe() {
    this._ensure(); this.stop();
    const master = this._masterGain();
    master.gain.setValueAtTime(this.volume * 0.45, this.ctx.currentTime);
    const buf = this._whiteNoiseBuffer();
    const src = this._playNoise(buf);
    const bp  = this.ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 800; bp.Q.value = 0.4;
    const lp  = this.ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 1200;
    const mod  = this.ctx.createOscillator();
    const modG = this.ctx.createGain();
    mod.frequency.value = 0.3; modG.gain.value = 300;
    mod.connect(modG); modG.connect(bp.frequency);
    mod.start();
    src.connect(bp); bp.connect(lp); lp.connect(master);
    src.start();
    this.nodes.push(mod);
  }

  setVolume(v) {
    this.volume = v;
    if (this.gainNode) this.gainNode.gain.setValueAtTime(v, this.ctx?.currentTime ?? 0);
  }
}

const engine = new AmbientEngine();

/* ═══════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════ */
const SOUNDS = [
  { id: "rain",    label: "Forest Rain",     icon: "water_drop",   color: "text-blue-500",    bg: "bg-blue-50"    },
  { id: "library", label: "Library",          icon: "auto_stories", color: "text-amber-600",   bg: "bg-amber-50"   },
  { id: "birds",   label: "Morning Birds",    icon: "eco",          color: "text-emerald-600", bg: "bg-emerald-50" },
  { id: "white",   label: "White Noise",      icon: "blur_on",      color: "text-gray-500",    bg: "bg-gray-50"    },
  { id: "cafe",    label: "Café Ambience",    icon: "local_cafe",   color: "text-orange-500",  bg: "bg-orange-50"  },
];

const CIRCUMFERENCE = 2 * Math.PI * 110; // r=110

/* ═══════════════════════════════════════════
   CIRCULAR PROGRESS RING
═══════════════════════════════════════════ */
function TimerRing({ progress, isRunning, mode, displayTime }) {
  const offset = CIRCUMFERENCE * (1 - progress);
  return (
    <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
      {/* Glow when running */}
      {isRunning && (
        <div className={`absolute inset-0 rounded-full blur-2xl opacity-20 transition-all duration-1000 ${
          mode === "focus" ? "bg-emerald-400" : "bg-blue-400"
        }`} />
      )}
      <svg width="280" height="280" style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle cx="140" cy="140" r="110" fill="none" stroke="#d1fae5" strokeWidth="10" />
        {/* Progress */}
        <circle
          cx="140" cy="140" r="110" fill="none"
          stroke={mode === "focus" ? "#006c49" : "#0ea5e9"}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s ease" }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute flex flex-col items-center gap-1">
        <span className={`text-6xl font-extrabold tracking-tighter tabular-nums ${mode === "focus" ? "text-emerald-900" : "text-sky-700"}`}>
          {displayTime}
        </span>
        <span className={`text-xs font-bold uppercase tracking-widest ${mode === "focus" ? "text-emerald-500" : "text-sky-400"}`}>
          {mode === "focus" ? "Flow State" : "Rest & Recharge"}
        </span>
        {isRunning && (
          <span className="flex gap-1 mt-1">
            {[0,1,2].map(i => (
              <span key={i} className={`w-1.5 h-1.5 rounded-full ${mode === "focus" ? "bg-emerald-400" : "bg-sky-400"}`}
                style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </span>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   DURATION CONTROL KNOB
═══════════════════════════════════════════ */
function DurationControl({ label, value, onDec, onInc, unit = "min", min = 1, max = 120 }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[0.6rem] font-bold uppercase tracking-widest text-emerald-600/60">{label}</span>
      <div className="flex items-center gap-2">
        <button onClick={onDec} disabled={value <= min}
          className="w-8 h-8 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-lg flex items-center justify-center disabled:opacity-30 transition-all active:scale-90">
          −
        </button>
        <div className="w-14 text-center">
          <span className="text-2xl font-extrabold text-emerald-900 tabular-nums">{value}</span>
          <span className="text-xs text-emerald-500 ml-0.5">{unit}</span>
        </div>
        <button onClick={onInc} disabled={value >= max}
          className="w-8 h-8 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-lg flex items-center justify-center disabled:opacity-30 transition-all active:scale-90">
          +
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SOUND CARD
═══════════════════════════════════════════ */
function SoundCard({ sound, active, onClick }) {
  return (
    <button onClick={() => onClick(sound.id)}
      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 w-full hover:-translate-y-0.5 ${
        active
          ? "border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-100"
          : "border-transparent bg-white hover:border-emerald-200 hover:bg-emerald-50/50"
      }`}>
      <div className={`w-10 h-10 rounded-xl ${sound.bg} flex items-center justify-center`}>
        <span className={`material-symbols-outlined ${sound.color} text-xl`}>{sound.icon}</span>
      </div>
      <span className="text-xs font-semibold text-emerald-800 text-center leading-tight">{sound.label}</span>
      {active && (
        <div className="flex gap-0.5">
          {[0,1,2,3].map(i => (
            <div key={i} className="w-0.5 bg-emerald-500 rounded-full"
              style={{ height: 12, animation: `soundBar 0.8s ease-in-out ${i * 0.15}s infinite alternate` }} />
          ))}
        </div>
      )}
    </button>
  );
}

/* ═══════════════════════════════════════════
   CIRCULAR GOAL RING
═══════════════════════════════════════════ */
function GoalRing({ progress }) {
  const r = 36, c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(progress, 1));
  return (
    <svg width="88" height="88" style={{ transform: "rotate(-90deg)" }}>
      <circle cx="44" cy="44" r={r} fill="none" stroke="#d1fae5" strokeWidth="7" />
      <circle cx="44" cy="44" r={r} fill="none" stroke="#006c49" strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.6s ease" }} />
    </svg>
  );
}

/* ═══════════════════════════════════════════
   MAIN: FocusPage
═══════════════════════════════════════════ */
export default function FocusPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  /* ── Timer settings (with defaults) ── */
  const [focusMins,  setFocusMins]  = useState(25);
  const [breakMins,  setBreakMins]  = useState(5);
  const [laps,       setLaps]       = useState(4);
  const [currentLap, setCurrentLap] = useState(1);
  const [mode,       setMode]       = useState("focus"); // "focus" | "break"
  const [isRunning,  setIsRunning]  = useState(false);
  const [autoStart,  setAutoStart]  = useState(false);

  /* Seconds remaining */
  const totalSecs = mode === "focus" ? focusMins * 60 : breakMins * 60;
  const [secsLeft, setSecsLeft] = useState(focusMins * 60);
  const timerRef = useRef(null);

  /* ── Audio ── */
  const [activeSound,  setActiveSound]  = useState(null);
  const [volume,       setVolume]       = useState(0.4);

  /* ── Task tethering ── */
  const [tasks,        setTasks]        = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskPicker, setShowTaskPicker] = useState(false);

  /* ── Daily goal ── */
  const [dailyGoal,      setDailyGoal]      = useState(120);
  const [focusedToday,   setFocusedToday]   = useState(0);
  const [editingGoal,    setEditingGoal]    = useState(false);
  const [goalInput,      setGoalInput]      = useState("120");
  const focusedTodayRef = useRef(0);

  /* ── Session completed count ── */
  const [completedSessions, setCompletedSessions] = useState(0);

  /* ── Notifications ── */
  const [toast, setToast] = useState("");

  /* ════════════════ effects ════════════════ */
  useEffect(() => { document.title = "StudySync - Focus"; }, []);

  /* Persist / load preferences from Firestore */
  useEffect(() => {
    if (!user) return;
    const pref = doc(db, "focus_prefs", user.uid);
    getDoc(pref).then(snap => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.focusMins)    setFocusMins(d.focusMins);
        if (d.breakMins)    setBreakMins(d.breakMins);
        if (d.laps)         setLaps(d.laps);
        if (d.dailyGoal)    setDailyGoal(d.dailyGoal);
        if (d.focusedToday !== undefined) {
          setFocusedToday(d.focusedToday);
          focusedTodayRef.current = d.focusedToday * 60;
        }
        if (d.goalInput)    setGoalInput(String(d.dailyGoal ?? 120));
      }
    }).catch(() => {});
  }, [user]);

  /* Load tasks */
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "tasks"), where("userId", "==", user.uid));
    return onSnapshot(q, snap => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user]);

  /* Sync secsLeft when focusMins changes (only when not running) */
  useEffect(() => {
    if (!isRunning) setSecsLeft(mode === "focus" ? focusMins * 60 : breakMins * 60);
  }, [focusMins, breakMins, mode]); // eslint-disable-line

  /* Timer tick */
  useEffect(() => {
    if (isRunning && secsLeft > 0) {
      timerRef.current = setInterval(() => {
        setSecsLeft(s => s - 1);
        if (mode === "focus") {
          focusedTodayRef.current += 1;
          if (focusedTodayRef.current % 60 === 0) {
            const mins = Math.round(focusedTodayRef.current / 60);
            setFocusedToday(mins);
            if (user) {
              const pref = doc(db, "focus_prefs", user.uid);
              setDoc(pref, { focusedToday: mins }, { merge: true }).catch(() => {});
            }
          }
        }
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, secsLeft, mode, user]);

  /* Session complete */
  useEffect(() => {
    if (secsLeft > 0 || !isRunning) return;
    if (mode === "focus") {
      setCompletedSessions(c => c + 1);
      showToastMsg("🎉 Focus session complete! Take a break.");
      if (currentLap < laps) {
        setMode("break");
        setSecsLeft(breakMins * 60);
        if (!autoStart) setIsRunning(false);
      } else {
        showToastMsg("🌿 All sessions done! Excellent work.");
        setIsRunning(false);
        setMode("focus");
        setCurrentLap(1);
        setSecsLeft(focusMins * 60);
      }
    } else {
      showToastMsg("⏱️ Break over — back to focus!");
      setMode("focus");
      setCurrentLap(l => l + 1);
      setSecsLeft(focusMins * 60);
      if (!autoStart) setIsRunning(false);
    }
  }, [secsLeft]); // eslint-disable-line

  /* ════════════════ handlers ════════════════ */
  const showToastMsg = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const handleStartPause = () => {
    if (window.AudioContext || window.webkitAudioContext) {
      engine._ensure?.();
    }
    setIsRunning(r => !r);
  };

  const handleReset = () => {
    setIsRunning(false);
    setMode("focus");
    setCurrentLap(1);
    setSecsLeft(focusMins * 60);
  };

  const handleSound = (id) => {
    if (activeSound === id) {
      engine.stop();
      setActiveSound(null);
      return;
    }
    setActiveSound(id);
    switch (id) {
      case "rain":    engine.playForestRain(); break;
      case "library": engine.playLibrary();    break;
      case "birds":   engine.playMorningBirds(); break;
      case "white":   engine.playWhiteNoise(); break;
      case "cafe":    engine.playCafe();        break;
    }
  };

  const handleVolume = (v) => {
    setVolume(v);
    engine.setVolume(v);
  };

  const savePrefs = useCallback(async (overrides = {}) => {
    if (!user) return;
    await setDoc(doc(db, "focus_prefs", user.uid), {
      focusMins, breakMins, laps, dailyGoal,
      focusedToday,
      updatedAt: serverTimestamp(),
      ...overrides,
    }, { merge: true });
  }, [user, focusMins, breakMins, laps, dailyGoal, focusedToday]);

  const handleFocusDec = () => { if (focusMins > 1) { const v = focusMins - 1; setFocusMins(v); savePrefs({ focusMins: v }); } };
  const handleFocusInc = () => { if (focusMins < 120) { const v = focusMins + 1; setFocusMins(v); savePrefs({ focusMins: v }); } };
  const handleBreakDec = () => { if (breakMins > 1) { const v = breakMins - 1; setBreakMins(v); savePrefs({ breakMins: v }); } };
  const handleBreakInc = () => { if (breakMins < 60) { const v = breakMins + 1; setBreakMins(v); savePrefs({ breakMins: v }); } };
  const handleLapsDec  = () => { if (laps > 1) { const v = laps - 1; setLaps(v); savePrefs({ laps: v }); } };
  const handleLapsInc  = () => { if (laps < 12) { const v = laps + 1; setLaps(v); savePrefs({ laps: v }); } };

  const handleSaveGoal = async () => {
    const g = parseInt(goalInput) || 120;
    setDailyGoal(g);
    setEditingGoal(false);
    await savePrefs({ dailyGoal: g });
  };

  /* ── Display ── */
  const mm = String(Math.floor(secsLeft / 60)).padStart(2, "0");
  const ss = String(secsLeft % 60).padStart(2, "0");
  const displayTime = `${mm}:${ss}`;
  const progress = secsLeft / totalSecs;
  const goalProgress = dailyGoal > 0 ? focusedToday / dailyGoal : 0;

  /* ── TopBar children: lap indicator ── */
  const topBarContent = (
    <div className="hidden sm:flex items-center gap-2">
      {Array.from({ length: laps }).map((_, i) => (
        <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${
          i < completedSessions ? "bg-emerald-500" :
          i === currentLap - 1 && mode === "focus" ? "bg-emerald-300 ring-2 ring-emerald-400" :
          "bg-emerald-100"
        }`} />
      ))}
      <span className="text-xs text-emerald-600 font-semibold ml-1">
        Lap {currentLap}/{laps}
      </span>
    </div>
  );

  /* ════════════════ RENDER ════════════════ */
  return (
    <PageShell
      activePage="focus"
      title="Focus Sanctuary"
      subtitle="Breathe in. Immerse yourself. Begin your flow."
      topBarChildren={topBarContent}
    >
      <style>{`
        @keyframes soundBar {
          from { transform: scaleY(0.3); }
          to   { transform: scaleY(1); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-4px); }
        }
      `}</style>

      <div className="animate-page-enter max-w-6xl mx-auto">

        {/* 3-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

          {/* ── LEFT PANEL ── */}
          <div className="lg:col-span-3 flex flex-col gap-5">

            {/* Duration Controls */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-50">
              <h3 className="text-[0.65rem] font-bold uppercase tracking-widest text-emerald-600/60 mb-6">Session Settings</h3>
              <div className="flex flex-col gap-6">
                <DurationControl label="Focus Time" value={focusMins}
                  onDec={handleFocusDec} onInc={handleFocusInc} max={120} />
                <div className="h-px bg-emerald-50" />
                <DurationControl label="Break Time" value={breakMins}
                  onDec={handleBreakDec} onInc={handleBreakInc} max={60} />
                <div className="h-px bg-emerald-50" />
                <DurationControl label="Laps" value={laps}
                  onDec={handleLapsDec} onInc={handleLapsInc} unit="×" min={1} max={12} />
              </div>
            </div>

            {/* Auto-start toggle */}
            <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-emerald-50 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-900">Auto-start</p>
                <p className="text-xs text-emerald-500/70">Next session starts automatically</p>
              </div>
              <button
                onClick={() => setAutoStart(a => !a)}
                className={`relative w-11 h-6 rounded-full transition-colors ${autoStart ? "bg-emerald-600" : "bg-emerald-100"}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoStart ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>

            {/* Daily Goal */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-50">
              <h3 className="text-[0.65rem] font-bold uppercase tracking-widest text-emerald-600/60 mb-4">Daily Goal</h3>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <GoalRing progress={goalProgress} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-emerald-800">{Math.round(goalProgress * 100)}%</span>
                  </div>
                </div>
                <div className="flex-1">
                  {editingGoal ? (
                    <div className="flex gap-2">
                      <input
                        type="number" value={goalInput} min={10} max={480}
                        onChange={e => setGoalInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSaveGoal()}
                        className="w-16 border border-emerald-200 rounded-lg px-2 py-1 text-sm text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                        autoFocus
                      />
                      <button onClick={handleSaveGoal}
                        className="px-2 py-1 rounded-lg signature-gradient text-white text-xs font-bold">OK</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingGoal(true); setGoalInput(String(dailyGoal)); }}
                      className="text-left group">
                      <p className="text-lg font-extrabold text-emerald-900 group-hover:text-emerald-600 transition-colors">{focusedToday}<span className="text-sm font-semibold text-emerald-400">/{dailyGoal}</span></p>
                      <p className="text-xs text-emerald-500/60">minutes • tap to edit</p>
                    </button>
                  )}
                </div>
              </div>
              {/* Thin progress bar */}
              <div className="mt-4 h-1.5 bg-emerald-50 rounded-full overflow-hidden">
                <div className="h-full signature-gradient rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(goalProgress * 100, 100)}%` }} />
              </div>
            </div>
          </div>

          {/* ── CENTER PANEL ── */}
          <div className="lg:col-span-6 flex flex-col items-center gap-6">

            {/* Timer card */}
            <div className={`w-full bg-white rounded-[2.5rem] shadow-sm border transition-all duration-500 p-10 flex flex-col items-center gap-6 ${
              isRunning && mode === "focus"
                ? "border-emerald-200 shadow-emerald-100 shadow-lg"
                : isRunning && mode === "break"
                ? "border-sky-200 shadow-sky-100 shadow-lg"
                : "border-emerald-50"
            }`}>
              {/* Mode badge */}
              <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${
                mode === "focus"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-sky-100 text-sky-700"
              }`}>
                {mode === "focus" ? "🍅 Focus Session" : "☕ Break Time"}
              </div>

              {/* The ring */}
              <TimerRing
                progress={progress}
                isRunning={isRunning}
                mode={mode}
                displayTime={displayTime}
              />

              {/* Controls */}
              <div className="flex items-center gap-4">
                <button onClick={handleReset}
                  className="w-12 h-12 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition-all active:scale-90">
                  <span className="material-symbols-outlined">restart_alt</span>
                </button>
                <button
                  id="focus-start-pause-btn"
                  onClick={handleStartPause}
                  className={`h-14 px-10 rounded-2xl font-bold text-base flex items-center gap-3 transition-all active:scale-95 shadow-md ${
                    isRunning
                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                      : "signature-gradient text-white hover:opacity-90 shadow-emerald-200"
                  }`}>
                  <span className="material-symbols-outlined">
                    {isRunning ? "pause" : "play_arrow"}
                  </span>
                  {isRunning ? "Pause" : "Start Focus Session"}
                </button>
                <button onClick={() => { setMode(m => m === "focus" ? "break" : "focus"); setIsRunning(false); setSecsLeft(mode === "focus" ? breakMins * 60 : focusMins * 60); }}
                  className="w-12 h-12 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition-all active:scale-90"
                  title="Switch mode">
                  <span className="material-symbols-outlined">swap_horiz</span>
                </button>
              </div>
            </div>

            {/* Task Tethering */}
            <div className="w-full bg-white rounded-3xl p-6 shadow-sm border border-emerald-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[0.65rem] font-bold uppercase tracking-widest text-emerald-600/60">Task Tethering</h3>
                <button onClick={() => setShowTaskPicker(true)}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-800 transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">swap_horiz</span>
                  Change Task
                </button>
              </div>
              {selectedTask ? (
                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-2xl">
                  <div className="w-9 h-9 rounded-xl signature-gradient flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-white text-base">task_alt</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-emerald-900 text-sm truncate">{selectedTask.title}</p>
                    <p className="text-xs text-emerald-500/70">{selectedTask.subject} • {selectedTask.deadline || "No deadline"}</p>
                  </div>
                  <button onClick={() => setSelectedTask(null)}
                    className="p-1 rounded-lg hover:bg-emerald-100 text-emerald-500 transition-colors">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowTaskPicker(true)}
                  className="w-full flex items-center gap-3 p-3 border-2 border-dashed border-emerald-200 rounded-2xl hover:border-emerald-400 hover:bg-emerald-50/50 transition-all group">
                  <span className="material-symbols-outlined text-emerald-300 group-hover:text-emerald-500 transition-colors">add_circle</span>
                  <span className="text-sm text-emerald-500 font-medium">Tether a task to this session</span>
                </button>
              )}
            </div>

            {/* Stats row */}
            <div className="w-full grid grid-cols-3 gap-4">
              {[
                { label: "Sessions", value: completedSessions, icon: "check_circle" },
                { label: "Focused", value: `${focusedToday}m`, icon: "schedule" },
                { label: "Current Lap", value: `${currentLap}/${laps}`, icon: "repeat" },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-2xl p-4 text-center shadow-sm border border-emerald-50">
                  <span className="material-symbols-outlined text-emerald-400 text-lg">{stat.icon}</span>
                  <p className="text-xl font-extrabold text-emerald-900 mt-1">{stat.value}</p>
                  <p className="text-[0.6rem] font-bold uppercase tracking-widest text-emerald-500/60">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="lg:col-span-3 flex flex-col gap-5">

            {/* Ambient Sounds */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-50">
              <h3 className="text-[0.65rem] font-bold uppercase tracking-widest text-emerald-600/60 mb-1">Ambient Soundscapes</h3>
              <p className="text-xs text-emerald-500/60 mb-5">Generated in-browser — no files needed</p>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {SOUNDS.map(s => (
                  <SoundCard key={s.id} sound={s} active={activeSound === s.id} onClick={handleSound} />
                ))}
                {/* Stop button — takes last cell */}
                {activeSound && (
                  <button onClick={() => { engine.stop(); setActiveSound(null); }}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-red-100 bg-red-50 hover:border-red-200 transition-all w-full">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-red-400 text-xl">stop_circle</span>
                    </div>
                    <span className="text-xs font-semibold text-red-500">Stop</span>
                  </button>
                )}
              </div>

              {/* Volume slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[0.6rem] font-bold uppercase tracking-widest text-emerald-600/60">Volume</span>
                  <span className="text-xs font-bold text-emerald-700">{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range" min={0} max={1} step={0.02} value={volume}
                  onChange={e => handleVolume(parseFloat(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: "#006c49" }}
                />
              </div>
            </div>

            {/* Tips */}
            <div className="bg-emerald-700 rounded-3xl p-6 text-white">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-emerald-300 text-lg">auto_awesome</span>
                <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-200">Flow Tips</h3>
              </div>
              <ul className="space-y-3 text-xs text-emerald-100/80 leading-relaxed">
                <li className="flex gap-2"><span className="text-emerald-400 font-bold">01</span> Put your phone in another room</li>
                <li className="flex gap-2"><span className="text-emerald-400 font-bold">02</span> Drink water before starting</li>
                <li className="flex gap-2"><span className="text-emerald-400 font-bold">03</span> One task at a time</li>
                <li className="flex gap-2"><span className="text-emerald-400 font-bold">04</span> Take your full break — you've earned it</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ══ Task Picker Modal ══ */}
      {showTaskPicker && (
        <div className="fixed inset-0 modal-backdrop z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowTaskPicker(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-scale-in max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-emerald-900 mb-1">Select a Task</h3>
            <p className="text-xs text-emerald-500/70 mb-4">Tether a task to stay focused</p>
            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              <button
                onClick={() => { setSelectedTask(null); setShowTaskPicker(false); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 transition-colors text-left border border-emerald-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-emerald-400 text-base">block</span>
                </div>
                <span className="text-sm font-medium text-emerald-700">No Task (free flow)</span>
              </button>
              {tasks.filter(t => t.status !== "completed").length === 0 ? (
                <p className="text-center text-sm text-emerald-400/70 py-6">No pending tasks. Add some on the Dashboard!</p>
              ) : (
                tasks.filter(t => t.status !== "completed").map(t => (
                  <button key={t.id}
                    onClick={() => { setSelectedTask(t); setShowTaskPicker(false); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 transition-colors text-left border ${selectedTask?.id === t.id ? "border-emerald-400 bg-emerald-50" : "border-emerald-100"}`}>
                    <div className="w-8 h-8 rounded-lg signature-gradient flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-white text-base">task_alt</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-emerald-900 truncate">{t.title}</p>
                      <p className="text-xs text-emerald-500/60">{t.subject}</p>
                    </div>
                    {t.priority === "urgent" && (
                      <span className="text-[0.55rem] font-bold uppercase bg-red-100 text-red-500 px-2 py-0.5 rounded-full">Urgent</span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ Toast ══ */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-emerald-900 text-white px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-slide-up">
          {toast}
        </div>
      )}
    </PageShell>
  );
}
