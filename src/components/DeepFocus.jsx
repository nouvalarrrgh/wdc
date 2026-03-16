import React, { useState, useEffect, useRef, useCallback } from "react";
import Lottie from "lottie-react";
import plantData from "../assets/lottie/plant.json";
import {
  Play, Trees, Volume2, VolumeX, AlertTriangle, Sprout, Skull, X, Flame, Search, Brain
} from "lucide-react";

// IMPORT STORAGE TINGKAT DEWA
import { getJson, setJson } from "../utils/storage";

const DURATION_OPTIONS = [
  { label: '25 Menit', seconds: 25 * 60, desc: 'Pomodoro' },
  { label: '45 Menit', seconds: 45 * 60, desc: 'Deep Work' },
  { label: '90 Menit', seconds: 90 * 60, desc: 'Ultradian' },
];

const FOCUS_SESSION_KEY = 'prodify_deepfocus_session_v1';
const BRAIN_DUMP_KEY = 'prodify_brain_dump_v1';

const getLocalDateKey = (dateObj = new Date()) => {
  const d = new Date(dateObj);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

const DeepFocus = () => {
  const [selectedDuration, setSelectedDuration] = useState(0);
  const TOTAL_TIME = DURATION_OPTIONS[selectedDuration].seconds;
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const fullscreenRef = useRef(null);
  const skipPersistOnceRef = useRef(false);
  const brainDumpToastTimerRef = useRef(null);

  // STATE UNTUK FALLBACK NOTIFICATION (Anti Notif Terblokir)
  const [inAppAlert, setInAppAlert] = useState(null);
  const [brainDumpToast, setBrainDumpToast] = useState(null);
  const [isBrainDumpOpen, setIsBrainDumpOpen] = useState(true);
  const [brainDumpText, setBrainDumpText] = useState(() => {
    try {
      const v = window.sessionStorage.getItem(BRAIN_DUMP_KEY);
      return typeof v === "string" ? v : "";
    } catch {
      return "";
    }
  });

  // Research Mode Tracker
  const researchTimerRef = useRef(null);
  const researchBeepRef = useRef(null);
  const [isResearching, setIsResearching] = useState(false);

  const audioRef = useRef(null);
  const beepCtxRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [preCountdown, setPreCountdown] = useState(null);

  // MENGGUNAKAN getJson (Hardening Level Senior)
  const [appSettings, setAppSettings] = useState(() => getJson("prodify_settings", {}));

  useEffect(() => {
    audioRef.current = new Audio("https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3");
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5;

    // Meminta izin notifikasi OS browser
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  useEffect(() => {
    // Debounced draft persistence without triggering global storage listeners.
    let t = null;
    try {
      t = setTimeout(() => {
        try { window.sessionStorage.setItem(BRAIN_DUMP_KEY, brainDumpText); } catch { }
      }, 250);
    } catch {
      // ignore
    }
    return () => { if (t) clearTimeout(t); };
  }, [brainDumpText]);

  useEffect(() => {
    return () => {
      if (brainDumpToastTimerRef.current) clearTimeout(brainDumpToastTimerRef.current);
      try { beepCtxRef.current?.close?.(); } catch { }
    };
  }, []);

  const createId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `id_${Math.floor(Math.random() * 1e9)}`;

  const parkDistraction = useCallback((rawText) => {
    const text = (rawText || "").trim();
    if (!text) return;

    const existing = getJson("matrix_tasks", []);
    const newTask = {
      id: createId(),
      title: text,
      quadrant: "not-urgent-not-important",
      energy: 1,
      tag: "Distraksi",
      completed: false,
      category: "personal",
      createdAt: new Date().toISOString(),
    };

    setJson("matrix_tasks", [...existing, newTask]);

    setBrainDumpText("");
    setBrainDumpToast("Tersimpan ke Eisenhower Matrix: Tunda/Hapus");
    if (brainDumpToastTimerRef.current) clearTimeout(brainDumpToastTimerRef.current);
    brainDumpToastTimerRef.current = setTimeout(() => setBrainDumpToast(null), 2200);
  }, []);

  // MENGGUNAKAN getJson
  const [stats, setStats] = useState(() => getJson("forest_stats", { planted: 0, dead: 0 }));

  const [treeState, setTreeState] = useState("idle");
  const [showWarning, setShowWarning] = useState(false);
  const todayKey = `forest_today_${getLocalDateKey()}`;

  // Menggunakan default string '0' agar aman saat di-parse
  const [todaySessions, setTodaySessions] = useState(() => parseInt(getJson(todayKey, '0')));

  // MENGGUNAKAN setJson (Bukan setItem biasa)
  useEffect(() => { setJson("forest_stats", stats); }, [stats]);

  // Persist session state so refresh does not reset the timer.
  const removePersistedSession = useCallback(() => {
    try {
      const isDemoMode = typeof window !== 'undefined' && window.sessionStorage.getItem('isDemoMode') === 'true';
      const storageOptions = isDemoMode ? window.sessionStorage : localStorage;
      storageOptions.removeItem(FOCUS_SESSION_KEY);
      window.dispatchEvent(new Event('storage'));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const saved = getJson(FOCUS_SESSION_KEY, null);
    if (!saved) return;

    const durIdx = Number.isFinite(saved.selectedDuration) ? saved.selectedDuration : 0;
    const clampedIdx = Math.min(Math.max(durIdx, 0), DURATION_OPTIONS.length - 1);
    const restoredTimeLeft = Math.max(0, parseInt(saved.timeLeft, 10) || 0);

    // Restore only meaningful sessions (running or mid-state).
    if (saved.isRunning || (saved.treeState && saved.treeState !== 'idle')) {
      skipPersistOnceRef.current = true;
      setSelectedDuration(clampedIdx);
      setTimeLeft(restoredTimeLeft);
      setIsRunning(!!saved.isRunning);
      setTreeState(saved.treeState || 'idle');
      setShowWarning(!!saved.showWarning);
      setIsResearching(!!saved.isResearching);
      setIsMuted(!!saved.isMuted);
      setPreCountdown(null);
    } else {
      removePersistedSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (skipPersistOnceRef.current) {
      skipPersistOnceRef.current = false;
      return;
    }

    const shouldClear =
      !isRunning &&
      treeState === 'idle' &&
      !showWarning &&
      !isResearching &&
      preCountdown === null &&
      timeLeft === TOTAL_TIME;

    if (shouldClear) {
      removePersistedSession();
      return;
    }

    setJson(FOCUS_SESSION_KEY, {
      selectedDuration,
      isRunning,
      timeLeft,
      treeState,
      showWarning,
      isResearching,
      isMuted,
    });
  }, [selectedDuration, isRunning, timeLeft, treeState, showWarning, isResearching, isMuted, preCountdown, TOTAL_TIME, removePersistedSession]);

  const killTree = useCallback(() => {
    setIsRunning(false);
    setShowWarning(false);
    setIsResearching(false);
    if (researchBeepRef.current) {
      clearTimeout(researchBeepRef.current);
      researchBeepRef.current = null;
    }
    setTreeState("dead");
    setStats((s) => ({ ...s, dead: s.dead + 1 }));
    if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
    setTimeout(() => {
      setTimeLeft(TOTAL_TIME);
      setTreeState("idle");
      removePersistedSession();
    }, 5000);
  }, [TOTAL_TIME, removePersistedSession]);

  // ========================================================
  // EXPERT TACTIC: RESEARCH MODE (Dispensasi 2 Menit & Jeda Manual)
  // ========================================================
  const primeBeepAudio = useCallback(() => {
    try {
      const soundEnabled = appSettings.focusSounds !== false;
      if (!soundEnabled || isMuted) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!beepCtxRef.current) beepCtxRef.current = new AudioCtx();
      if (beepCtxRef.current?.state === 'suspended') {
        beepCtxRef.current.resume?.().catch(() => { });
      }
    } catch {
      // ignore
    }
  }, [appSettings.focusSounds, isMuted]);

  const playShortBeep = useCallback(() => {
    try {
      const soundEnabled = appSettings.focusSounds !== false;
      if (!soundEnabled || isMuted) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = beepCtxRef.current || new AudioCtx();
      beepCtxRef.current = ctx;
      if (ctx?.state === 'suspended') ctx.resume?.().catch(() => { });
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 880;
      g.gain.value = 0.0001;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      const now = ctx.currentTime;
      g.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      o.stop(now + 0.13);
      setTimeout(() => {
        try { o.disconnect(); } catch { }
        try { g.disconnect(); } catch { }
      }, 220);
    } catch {
      // ignore
    }
  }, [appSettings.focusSounds, isMuted]);

  const triggerResearchMode = useCallback(() => {
    primeBeepAudio();
    setIsResearching(true);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => { });
    }
    if (researchTimerRef.current) clearTimeout(researchTimerRef.current);
    if (researchBeepRef.current) clearTimeout(researchBeepRef.current);

    // Timer kematian pokok 2 Minit (120000ms) berjalan apabila berada di luar tab
    // Beep warning 10 detik sebelum habis (110000ms).
    researchBeepRef.current = setTimeout(() => {
      playShortBeep();
    }, 110000);

    researchTimerRef.current = setTimeout(() => {
      killTree();

      // 1. Coba Notif OS Asli
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Pohonmu Layu! 🥀", {
          body: "Waktu riset (2 menit) telah habis. Fokusmu terpecah dan pohon indigomu mati.",
        });
      }

      // 2. BACKUP VISUAL (Fallback Modal di layar)
      setInAppAlert({
        title: "🚨 Pohon Mati Kelayuan!",
        message: "Batas waktu riset di luar tab (2 Menit) telah habis. Fokusmu terpecah."
      });

    }, 120000);
  }, [killTree, playShortBeep, primeBeepAudio]);

  const resumeFromResearch = useCallback(() => {
    setIsResearching(false);
    if (researchTimerRef.current) {
      clearTimeout(researchTimerRef.current);
      researchTimerRef.current = null;
    }
    if (researchBeepRef.current) {
      clearTimeout(researchBeepRef.current);
      researchBeepRef.current = null;
    }
    if (appSettings.strictFocusMode !== false && fullscreenRef.current) {
      fullscreenRef.current.requestFullscreen().catch(() => { });
    }
  }, [appSettings.strictFocusMode]);

  useEffect(() => {
    if (appSettings.strictFocusMode === false) return undefined;

    const handleVisibilityChange = () => {
      // Jika pengguna pindah tab, cetuskan Research Mode & mula pemasa kematian 2 minit
      if (document.hidden && isRunning && treeState === "growing") {
        triggerResearchMode();
      }
      // Jika pengguna kembali ke tab, BATALKAN pemasa kematian, TETAPI BIARKAN MOD JEDA
      // Mereka mesti klik "Lanjut Fokus" secara manual untuk menyambung masa
      else if (!document.hidden && isRunning && treeState === "growing" && isResearching) {
        if (researchTimerRef.current) {
          clearTimeout(researchTimerRef.current);
          researchTimerRef.current = null;
        }
        if (researchBeepRef.current) {
          clearTimeout(researchBeepRef.current);
          researchBeepRef.current = null;
        }
        // Nota Pakar: Kita TIDAK memanggil resumeFromResearch() di sini.
        // Dengan itu, skrin kekal kuning dan masa berhenti sehingga butang ditekan.
      }
    };

    const handleFullscreenChange = () => {
      // Amaran HANYA muncul jika skrin dikecilkan secara paksa tanpa izin "Research Mode"
      if (!document.fullscreenElement && isRunning && treeState === "growing" && !showWarning && !document.hidden && !isResearching) {
        setShowWarning(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isRunning, treeState, showWarning, appSettings.strictFocusMode, isResearching, triggerResearchMode]);

  // Kawalan Audio
  useEffect(() => {
    const soundEnabled = appSettings.focusSounds !== false;
    const shouldPlay = soundEnabled && isRunning && !showWarning && treeState === "growing" && !isMuted && !isResearching;
    if (!audioRef.current) return;
    if (shouldPlay) audioRef.current.play().catch(() => { });
    else audioRef.current.pause();
  }, [isRunning, showWarning, treeState, isMuted, appSettings, isResearching]);

  // Kiraan Masa (Timer Tick)
  useEffect(() => {
    let interval;
    // Masa dijeda (berhenti) sepenuhnya semasa isResearching aktif!
    if (isRunning && !showWarning && timeLeft > 0 && !isResearching) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      setTreeState("success");
      setStats((s) => ({ ...s, planted: s.planted + 1 }));

      const newSessionCount = parseInt(getJson(todayKey, '0')) + 1;

      // Untuk data sederhana (string angka), pakai localStorage biasa saja tidak masalah
      // tapi dispatch event storage agar komponen lain tahu
      setJson(todayKey, String(newSessionCount));
      window.dispatchEvent(new Event('storage'));

      setTodaySessions(newSessionCount);

      // Beritahu sukses via OS
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Panen Berhasil! 🌳", { body: "Sesi fokus selesai. Pohonmu tumbuh sempurna!" });
      }

      if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
      setTimeout(() => {
        setTimeLeft(TOTAL_TIME);
        setTreeState("idle");
        removePersistedSession();
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, showWarning, TOTAL_TIME, isResearching, todayKey, removePersistedSession]);

  // Pra-Kiraan (Pre-Countdown)
  useEffect(() => {
    let timer;
    if (preCountdown !== null) {
      if (typeof preCountdown === "number" && preCountdown > 1) {
        timer = setTimeout(() => setPreCountdown(preCountdown - 1), 1000);
      } else if (preCountdown === 1) {
        timer = setTimeout(() => setPreCountdown("Fokus!"), 1000);
      } else if (preCountdown === "Fokus!") {
        timer = setTimeout(() => {
          setPreCountdown(null);
          setIsRunning(true);
          setTreeState("growing");
          setTimeLeft(TOTAL_TIME);
        }, 1000);
      }
    }
    return () => clearTimeout(timer);
  }, [preCountdown, TOTAL_TIME]);

  const handleStart = () => {
    primeBeepAudio();
    setTimeLeft(DURATION_OPTIONS[selectedDuration].seconds);
    if (appSettings.strictFocusMode !== false && fullscreenRef.current) {
      fullscreenRef.current.requestFullscreen().catch(() => { });
    }
    setPreCountdown(3);
  };

  const handleGiveUpClick = () => {
    if (!isRunning) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
    setShowWarning(true);
  };

  const resumeFocus = () => {
    setShowWarning(false);
    if (appSettings.strictFocusMode !== false && fullscreenRef.current) {
      fullscreenRef.current.requestFullscreen().catch(() => { });
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const circleRadius = 138;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = treeState === "idle" ? 0 : circleCircumference - (timeLeft / TOTAL_TIME) * circleCircumference;

  const getAccentColor = () => {
    if (treeState === "dead") return "text-rose-500";
    if (treeState === "success") return "text-violet-400";
    if (isResearching) return "text-amber-400"; // Warna kuning semasa riset
    return "text-indigo-400";
  };

  return (
    <div ref={fullscreenRef} className="min-h-full md:min-h-[calc(100vh-4rem)] rounded-3xl overflow-hidden relative flex items-center justify-center p-4 md:p-8">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-1000"
        style={{
          backgroundImage: `url('/3696aab9266c4104a9aa2a80d4c358dd.jpg')`,
          filter: treeState === "dead" ? "grayscale(100%) brightness(80%) blur(8px)" : "brightness(50%) blur(4px)",
        }}
      />
      <div className={`absolute inset-0 z-0 transition-colors duration-1000 ${treeState === "dead" ? "bg-rose-950/70" : treeState === "success" ? "bg-violet-950/60" : isResearching ? "bg-amber-950/80" : "bg-slate-950/80"}`} />

      <div className="relative z-10 w-full max-w-2xl bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 flex flex-col items-center shadow-2xl spatial-shadow">

        <div className="flex justify-between items-center w-full mb-8">
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 text-indigo-300 font-bold text-xs" title="Pohon Berhasil Ditanam">
              <Trees className="w-4 h-4" /> {stats.planted}
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 text-rose-300 font-bold text-xs" title="Pohon Layu">
              <Skull className="w-4 h-4" /> {stats.dead}
            </div>
          </div>
          <button onClick={() => setIsMuted(!isMuted)} className="bg-white/10 p-2.5 rounded-full border border-white/10 hover:bg-white/20 transition-all text-white cursor-pointer group">
            {isMuted ? <VolumeX className="w-5 h-5 text-slate-400" /> : <Volume2 className="w-5 h-5 text-indigo-300 group-hover:scale-110 transition-transform" />}
          </button>
        </div>

        <div className="relative flex flex-col items-center justify-center mb-8">
          <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-2xl" overflow="visible" viewBox="0 0 288 288">
              <circle cx="144" cy="144" r={circleRadius} stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" />
              <circle cx="144" cy="144" r={circleRadius} stroke="currentColor" strokeWidth="8" fill="transparent" strokeLinecap="round" className={`${getAccentColor()} transition-all duration-1000 ease-linear`} strokeDasharray={circleCircumference} strokeDashoffset={strokeDashoffset} />
            </svg>
            <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-1000 ${treeState === "dead" ? "grayscale opacity-80" : ""}`}>
              {treeState === "growing" || treeState === "success" ? (
                <div className="w-32 h-32 md:w-40 md:h-40 flex items-center justify-center -mb-4 relative">
                  {treeState === "success" && <div className="absolute inset-4 bg-violet-500/30 rounded-full blur-2xl animate-pulse"></div>}
                  {isResearching && <div className="absolute inset-4 bg-amber-500/20 rounded-full blur-xl animate-pulse"></div>}
                  <Lottie animationData={plantData} loop={treeState === "growing" && !isResearching} className="w-full h-full drop-shadow-[0_0_15px_rgba(139,92,246,0.3)] relative z-10" />
                </div>
              ) : treeState === "dead" ? (
                <Skull className="w-20 h-20 text-rose-500 mb-2 drop-shadow-md" />
              ) : (
                <Sprout className="w-20 h-20 text-slate-500 mb-2 drop-shadow-md opacity-50" />
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center">
            <span className={`text-7xl md:text-8xl font-black tracking-tighter tabular-nums ${treeState === "dead" ? "text-rose-400" : isResearching ? "text-amber-300" : "text-white"} drop-shadow-xl`}>
              {formatTime(timeLeft)}
            </span>
            {isResearching ? (
              <span className="flex items-center gap-2 text-xs uppercase font-bold text-amber-400 tracking-widest mt-3 animate-pulse">
                <Search className="w-4 h-4" /> Masa Jeda (Sedia Untuk Lanjut)
              </span>
            ) : isRunning && treeState === "growing" ? (
              <span className="text-xs uppercase font-bold text-indigo-300 tracking-widest mt-3 animate-pulse">Sesi Fokus Indigo</span>
            ) : treeState === "dead" ? (
              <span className="text-xs uppercase font-bold text-rose-400 tracking-widest mt-3">Sesi Terganggu</span>
            ) : treeState === "success" ? (
              <span className="text-xs uppercase font-bold text-violet-300 tracking-widest mt-3">Panen Berhasil! nyaa~</span>
            ) : (
              <span className="text-xs uppercase font-bold text-slate-500 tracking-widest mt-3">Siap Memulai</span>
            )}
          </div>
        </div>

        <div className="w-full flex flex-col items-center gap-6 mt-4">
          {treeState === "idle" || treeState === "success" || treeState === "dead" ? (
            <>
              {treeState === "idle" && (
                <div className="flex bg-white/5 p-1.5 rounded-2xl w-full max-w-sm border border-white/10 backdrop-blur-md">
                  {DURATION_OPTIONS.map((opt, i) => (
                    <button key={i} onClick={() => { setSelectedDuration(i); setTimeLeft(opt.seconds); }} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${selectedDuration === i ? 'bg-indigo-600 text-white shadow-lg transform scale-[1.02]' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}>
                      <div className="mb-0.5">{opt.label}</div>
                      <div className={`text-[9px] font-medium ${selectedDuration === i ? 'text-indigo-200' : 'opacity-50'}`}>{opt.desc}</div>
                    </button>
                  ))}
                </div>
              )}
              <div className="w-full flex flex-col md:flex-row items-center justify-center gap-4 max-w-sm">
                {(treeState === "idle" || treeState === "success" || treeState === "dead") && (
                  <button onClick={handleStart} className={`w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${treeState === "dead" ? "bg-rose-600" : "bg-indigo-600"} text-white hover:brightness-110 shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:-translate-y-1`}>
                    <Play className="w-5 h-5 fill-current" /> {treeState === "idle" ? "Mulai Sesi" : "Mulai Lagi"}
                  </button>
                )}
                {todaySessions > 0 && treeState === "idle" && (
                  <div className="hidden md:flex flex-col items-center justify-center px-6 py-2 bg-white/5 border border-white/10 rounded-2xl h-[60px] shrink-0">
                    <span className="flex items-center gap-1 text-indigo-300 font-bold text-sm"><Flame className="w-4 h-4 fill-current" /> {todaySessions}</span>
                    <span className="text-[9px] text-slate-400 uppercase font-bold">Hari Ini</span>
                  </div>
                )}
              </div>
            </>
          ) : treeState === "growing" ? (
            /* BUTTON SEMASA SESI BERJALAN / DIJEDA */
            isResearching ? (
              <button onClick={resumeFromResearch} className="w-full max-w-sm py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_0_30px_rgba(79,70,229,0.3)] cursor-pointer hover:-translate-y-1">
                <Play className="w-5 h-5 fill-current" /> Lanjut Fokus
              </button>
            ) : (
              <div className="w-full max-w-sm flex gap-3">
                <button onClick={triggerResearchMode} className="flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all flex flex-col items-center justify-center gap-1 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 cursor-pointer hover:-translate-y-0.5">
                  <Search className="w-6 h-6 mb-0.5" /> Jeda Riset
                </button>
                <button onClick={handleGiveUpClick} className="flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all flex flex-col items-center justify-center gap-1 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/30 cursor-pointer hover:-translate-y-0.5">
                  <X className="w-6 h-6 mb-0.5" /> Menyerah
                </button>
              </div>
            )
          ) : null}
        </div>
      </div>

      {preCountdown !== null && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl">
          <span className="text-[5rem] sm:text-[8rem] md:text-[12rem] font-black text-white animate-bounce drop-shadow-[0_0_80px_rgba(79,70,229,0.8)] tracking-tighter tabular-nums">
            {preCountdown}
          </span>
        </div>
      )}

      {showWarning && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in p-6">
          <div className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-[2.5rem] p-8 text-center shadow-2xl flex flex-col items-center spatial-shadow">
            <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mb-6 animate-pulse border border-rose-500/30">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Batalkan Sesi?</h3>
            <p className="text-slate-400 font-medium mb-8 text-sm leading-relaxed">
              Pohon Indigo yang sedang tumbuh akan <strong className="text-rose-400">mati layu</strong> jika Anda keluar sekarang.
            </p>
            <div className="flex gap-3 w-full">
              <button onClick={resumeFocus} className="flex-1 py-3.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer shadow-lg shadow-indigo-600/20">Lanjut Fokus</button>
              <button onClick={killTree} className="flex-1 py-3.5 rounded-xl font-bold bg-slate-800 hover:bg-rose-600 text-rose-300 hover:text-white transition-colors cursor-pointer border border-white/10">Bunuh Pohon</button>
            </div>
          </div>
        </div>
      )}

      {/* FALLBACK IN-APP NOTIFICATION (ANTI JURI MATIKAN NOTIF OS) */}
      {inAppAlert && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-rose-600/95 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl z-[999] animate-bounce min-w-[300px] border border-rose-400 text-center">
          <h4 className="font-black text-lg mb-1">{inAppAlert.title}</h4>
          <p className="text-sm font-medium mb-3">{inAppAlert.message}</p>
          <button
            onClick={() => setInAppAlert(null)}
            className="px-4 py-2 bg-white text-rose-600 font-bold rounded-xl hover:bg-rose-50 transition-colors w-full cursor-pointer shadow-sm"
          >
            Saya Mengerti
          </button>
        </div>
      )}

      {/* ZEIGARNIK INTERCEPTOR: PARKIRAN DISTRAKSI */}
      {brainDumpToast && (
        <div className="fixed top-24 right-6 bg-emerald-600/90 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl z-[40] animate-fade-in-up border border-emerald-400/40">
          <p className="text-xs font-bold">{brainDumpToast}</p>
        </div>
      )}

      {isBrainDumpOpen ? (
        <div className="fixed bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:w-[380px] z-[30] pointer-events-none">
          <div className="pointer-events-auto bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-3 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
                  <Brain className="w-5 h-5 text-indigo-200" />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-black text-sm leading-tight">Parkiran Distraksi</p>
                  <p className="text-[10px] text-slate-300/80 font-semibold leading-tight">Enter untuk kirim ke Matrix (Tunda/Hapus)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBrainDumpOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition-colors cursor-pointer"
                aria-label="Tutup Parkiran Distraksi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              value={brainDumpText}
              onChange={(e) => setBrainDumpText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  parkDistraction(brainDumpText);
                }
              }}
              placeholder="Tulis distraksi singkat, mis: Balas chat dosen..."
              className="w-full bg-slate-950/30 focus:bg-slate-950/40 border border-white/10 focus:border-indigo-400/40 text-white placeholder:text-slate-300/50 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsBrainDumpOpen(true)}
          className="fixed bottom-6 right-6 z-[30] w-12 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 shadow-[0_15px_40px_rgba(79,70,229,0.35)] border border-indigo-400/30 flex items-center justify-center cursor-pointer"
          aria-label="Buka Parkiran Distraksi"
        >
          <Brain className="w-6 h-6 text-white" />
        </button>
      )}
    </div>
  );
};

export default DeepFocus;
