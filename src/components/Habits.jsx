import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Sparkles, Plus, Check, Zap, Brain, Feather, Flame, Star, Moon, Info, X, Target,
  ChevronLeft, ChevronRight, Sun, LayoutGrid, BarChart2, CalendarDays, Trash2
} from "lucide-react";
import { NekoMascotMini, NekoMascotFull } from './NekoMascot';

// IMPORT STORAGE AMAN
import { getJson, setJson } from '../utils/storage';

const formatDateStr = (dateObj) => {
  const d = new Date(dateObj);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};

const Habits = () => {
  const [activeDate, setActiveDate] = useState(formatDateStr(new Date()));

  // 1. Inisialisasi dengan getJson yang kebal crash
  const [habits, setHabits] = useState(() => getJson("prodify_habits_v4", []));

  const [balanceState, setBalanceState] = useState(() => {
    return getJson("prodify_balance_state", "balanced");
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [newHabitIcon, setNewHabitIcon] = useState("🌟");
  const [newHabitPillar, setNewHabitPillar] = useState("cognitive");
  const [newHabitTarget, setNewHabitTarget] = useState(1);

  const [habitNotes, setHabitNotes] = useState(() => getJson("prodify_habit_notes", {}));
  const [weeklyReflections, setWeeklyReflections] = useState(() => getJson("prodify_weekly_reflections_v2", {}));

  const [activeDetailHabit, setActiveDetailHabit] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  // ==============================================================================
  // DOSA 4 DISELESAIKAN: AUTO-VALIDATION STREAK KETIKA HALAMAN DIMUAT
  // ==============================================================================
  useEffect(() => {
    let isModified = false;
    const todayKey = formatDateStr(new Date());

    const updatedHabits = habits.map(h => {
      let currentStreak = 0;
      let checkDate = new Date();

      // Hitung mundur ke belakang untuk memvalidasi streak aktual hari ini
      while (true) {
        const dKey = formatDateStr(checkDate);
        if ((h.history?.[dKey] || 0) >= h.targetCount) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          // Beri toleransi jika hari ini belum selesai, tapi H-1 selesai
          if (dKey === todayKey && currentStreak === 0) {
            checkDate.setDate(checkDate.getDate() - 1);
            const yKey = formatDateStr(checkDate);
            if ((h.history?.[yKey] || 0) >= h.targetCount) {
              currentStreak++;
              checkDate.setDate(checkDate.getDate() - 1);
              continue;
            }
          }
          break; // Streak benar-benar putus!
        }
      }

      // Jika streak yang dihitung berbeda dengan data lama, maka update
      if (h.streak !== currentStreak) {
        isModified = true;
        return { ...h, streak: currentStreak };
      }
      return h;
    });

    // Simpan hanya jika ada habit yang streak-nya hangus/berubah
    if (isModified) {
      setHabits(updatedHabits);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Hanya berjalan SATU KALI saat komponen mount


  // 2. Gunakan setJson agar aman dan sinkron
  useEffect(() => {
    setJson("prodify_habit_notes", habitNotes);
  }, [habitNotes]);

  useEffect(() => {
    setJson("prodify_weekly_reflections_v2", weeklyReflections);
  }, [weeklyReflections]);

  useEffect(() => {
    setJson("prodify_habits_v4", habits);
    const completed = habits.filter((h) => (h.history?.[activeDate] || 0) >= h.targetCount);
    const hasCog = completed.some((h) => h.pillar === "cognitive");
    const hasVit = completed.some((h) => h.pillar === "vitality");
    const hasMind = completed.some((h) => h.pillar === "mindfulness");
    const hasSoc = completed.some((h) => h.pillar === "social");

    let newState = "balanced";
    if (hasVit && (hasMind || hasSoc)) newState = "buffed";
    else if (hasCog && !hasVit && !hasMind && !hasSoc) newState = "debuffed";

    setBalanceState(newState);
    setJson("prodify_balance_state", newState);
  }, [habits, activeDate]);

  const getCurrentCount = (habit, dateStr = activeDate) => {
    return habit.history?.[dateStr] || 0;
  };

  const handleDateChange = (direction) => {
    const currentDateObj = new Date(activeDate);
    currentDateObj.setDate(currentDateObj.getDate() + direction);
    const newDateStr = formatDateStr(currentDateObj);
    const todayStr = formatDateStr(new Date());

    if (newDateStr > todayStr && direction > 0) return;
    setActiveDate(newDateStr);
  };

  const [confirmCompleteId, setConfirmCompleteId] = useState(null);
  const [confirmUndoId, setConfirmUndoId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const getWeeklyStats = (offset) => {
    const days = [];
    const endObj = new Date();
    endObj.setDate(endObj.getDate() - (offset * 7));

    for (let i = 6; i >= 0; i--) {
      const d = new Date(endObj);
      d.setDate(d.getDate() - i);
      days.push({
        dateStr: formatDateStr(d),
        label: d.toLocaleDateString('id-ID', { weekday: 'short' })
      });
    }

    let totalCompleted = 0;
    const totalTargets = habits.length * 7;
    const dailyCompletion = [];
    let pillarCounts = { cognitive: 0, vitality: 0, mindfulness: 0, social: 0 };

    days.forEach(day => {
      let dayCompleted = 0;
      habits.forEach(h => {
        if (getCurrentCount(h, day.dateStr) >= h.targetCount) {
          dayCompleted++;
          totalCompleted++;
          const key = h.pillar || "cognitive";
          if (Object.prototype.hasOwnProperty.call(pillarCounts, key)) pillarCounts[key]++;
        }
      });
      dailyCompletion.push({
        ...day,
        completed: dayCompleted,
        total: habits.length,
        percent: habits.length > 0 ? (dayCompleted / habits.length) * 100 : 0
      });
    });

    const completionRate = totalTargets > 0 ? Math.round((totalCompleted / totalTargets) * 100) : 0;
    return { completionRate, totalCompleted, totalTargets, dailyCompletion, pillarCounts };
  };

  const weeklyStats = getWeeklyStats(weekOffset);
  const weekKey = `${weeklyStats.dailyCompletion[0].dateStr}_to_${weeklyStats.dailyCompletion[6].dateStr}`;

  const POPULAR_ROUTINES = [
    // --- UMUM & KESEHATAN (Mahasiswa Umum) ---
    { id: "pr_u1", icon: "🌅", title: "Bangun Pagi Konsisten", pillar: "vitality", target: 1, desc: "Bangun jam 5 pagi tanpa snooze" },
    { id: "pr_u2", icon: "💧", title: "Hidrasi Penuh", pillar: "vitality", target: 8, desc: "Minum 8 gelas air / hari" },
    { id: "pr_u3", icon: "🧠", title: "Review Flashcard Belajar", pillar: "cognitive", target: 3, desc: "Sesi spaced repetition materi kelas" },
    { id: "pr_u4", icon: "🧘", title: "Meditasi Pagi", pillar: "mindfulness", target: 1, desc: "Duduk tenang 5 menit sebelum ngampus" },

    { id: "pr_u5", icon: "🤝", title: "Check-in Teman Kelas", pillar: "social", target: 1, desc: "Tanya kabar & sync tugas kelompok 5 menit" },
    { id: "pr_u6", icon: "👥", title: "Diskusi Kelompok Ringan", pillar: "social", target: 1, desc: "Ngobrol 10 menit untuk pecah kebuntuan tugas" },

    // --- ANAK IT / ILKOM ---
    { id: "pr_it1", icon: "💻", title: "Latihan Ngoding (Leet)", pillar: "cognitive", target: 1, desc: "Kerjakan 1 algoritma untuk asah logika" },
    { id: "pr_it2", icon: "🚀", title: "EksplorTech Stack", pillar: "cognitive", target: 1, desc: "Baca dokumentasi framework baru 15 menit" },

    // --- ANAK KESENIAN ---
    { id: "pr_art1", icon: "🎨", title: "Sketsa / Doodling", pillar: "cognitive", target: 1, desc: "Latihan gambar 1 sketsa anatomi / observasi" },
    { id: "pr_art2", icon: "🎵", title: "Latihan Instrumen/Vokal", pillar: "cognitive", target: 1, desc: "Main tangga nada / pemanasan vokal 30 menit" },
    { id: "pr_art3", icon: "🕺", title: "Pemanasan Koreografi", pillar: "vitality", target: 1, desc: "Stretching & recall koreografi 15 menit" },
    { id: "pr_art4", icon: "🎭", title: "Cari Referensi Karya", pillar: "mindfulness", target: 1, desc: "Kumpulkan inspirasi visual/audio tanpa distraksi" },

    // --- ANAK EKONOMI & BISNIS ---
    { id: "pr_eco1", icon: "📈", title: "Update Berita Ekonomi/Pasar", pillar: "cognitive", target: 1, desc: "Baca berita makro/saham pagi hari (CNBC, dll)" },
    { id: "pr_eco2", icon: "🧮", title: "Bedah Studi Kasus Bisnis", pillar: "cognitive", target: 1, desc: "Analisis laporan keuangan / strategi 1 brand" },
    { id: "pr_eco3", icon: "💡", title: "Brainstorming Ide Usaha", pillar: "cognitive", target: 1, desc: "Tulis 5 ide pain-point & draf solusi bisnis" },

    // --- ANAK PENDIDIKAN / KEGURUAN ---
    { id: "pr_edu1", icon: "📝", title: "Rancang Lesson Plan", pillar: "cognitive", target: 1, desc: "Buat 1 draf RPP / alat peraga ajar interaktif" },
    { id: "pr_edu2", icon: "🗣️", title: "Latihan Microteaching", pillar: "cognitive", target: 1, desc: "Latihan intonasi & presentasi kelas depan kaca" },
    { id: "pr_edu3", icon: "📚", title: "Review Jurnal Pedagogi", pillar: "cognitive", target: 1, desc: "Baca 1 artikel metode/psikologi pendidikan anak" },

    // --- ANAK KEOLAHRAGAAN (FIK) ---
    { id: "pr_sport1", icon: "🏃‍♂️", title: "Latihan Fisik Inti", pillar: "vitality", target: 1, desc: "Workout 45 menit untuk maintenance kebugaran" },
    { id: "pr_sport2", icon: "💪", title: "Stretching Khusus", pillar: "vitality", target: 2, desc: "Peregangan otot preventif cedera sesudah latihan" },
    { id: "pr_sport3", icon: "🥗", title: "Cek Kalori & Makro Nutrisi", pillar: "vitality", target: 1, desc: "Catat asupan protein presisi agar target tercapai" },
    { id: "pr_sport4", icon: "🧊", title: "Cold Exposure / Recovery", pillar: "vitality", target: 1, desc: "Mandi es/air dingin untuk meredakan inflamasi otot" },

    // --- ANAK TEKNIK ---
    { id: "pr_eng1", icon: "📐", title: "Latihan Kalkulus/Fisika", pillar: "cognitive", target: 1, desc: "Selesaikan 2 soal hitungan mekanika/arus numerik" },
    { id: "pr_eng2", icon: "🏗️", title: "Eksplor Software CAD/BIM", pillar: "cognitive", target: 1, desc: "Latihan tool set di AutoCAD, SolidWorks, Revit, dll" },
    { id: "pr_eng3", icon: "🔌", title: "Oprek Mikrokontroler", pillar: "cognitive", target: 1, desc: "Simulasi Arduino/Proteus atau solder mini project" },

    // --- ANAK HUKUM ---
    { id: "pr_law1", icon: "⚖️", title: "Bedah Ratio Decidendi", pillar: "cognitive", target: 1, desc: "Analisis landasan hukum dari 1 putusan pengadilan" },
    { id: "pr_law2", icon: "辩", title: "Latihan Legal Drafting", pillar: "cognitive", target: 1, desc: "Susun kerangka argumen legal standing isu terkini" },
    { id: "pr_law3", icon: "📖", title: "Hafalan Pasal Krusial", pillar: "cognitive", target: 2, desc: "Review mendalam 5 pasal penting (KUHPer, KUHP, dll)" },

    // --- ANAK FISIP ---
    { id: "pr_soc1", icon: "📰", title: "Analisis Isu Geopolitik", pillar: "cognitive", target: 1, desc: "Kritis bedah 1 artikel opini kebijakan publik/global" },
    { id: "pr_soc2", icon: "✍️", title: "Latihan Menulis Opini", pillar: "cognitive", target: 1, desc: "Drafting 300 kata tanggapan fenomena komunikasi/sosial" },
    { id: "pr_soc3", icon: "🗣️", title: "Praktik Negosiasi", pillar: "cognitive", target: 1, desc: "Simulasi roleplay Model UN (MUN) atau argumen kelompok" },

    // --- ANAK FMIPA ---
    { id: "pr_sci1", icon: "🔬", title: "Review Teorema", pillar: "cognitive", target: 1, desc: "Tulis & buktikan ulang 1 rumus sakti / jalur metabolisme" },
    { id: "pr_sci2", icon: "🧪", title: "Bedah Jurnal Sains", pillar: "cognitive", target: 1, desc: "Analisis setup eksperimen & hasil dari 1 paper riset Q1" },
    { id: "pr_sci3", icon: "📊", title: "Latihan Olah Data", pillar: "cognitive", target: 1, desc: "Visualisasi dataset eksperimen menggunakan R / Python / SPSS" },

    // --- ANAK KESEHATAN ---
    { id: "pr_med1", icon: "⚕️", title: "Review Anatomi", pillar: "cognitive", target: 2, desc: "Hafalkan sistem jaringan, letak tulang / list dosis obat" },
    { id: "pr_med2", icon: "🩺", title: "Simulasi Anamnesis Kasus", pillar: "cognitive", target: 1, desc: "Baca, diagnosis, & buat timeline dari 1 clinical case" },

    // --- MINDFULNESS & ME-TIME ---
    { id: "pr_mind1", icon: "📓", title: "Gratitude Journaling", pillar: "mindfulness", target: 1, desc: "Tulis 3 pencapaian kecil & hal yang membuatmu tersenyum" },
    { id: "pr_mind2", icon: "📵", title: "Digital Detox Malam", pillar: "mindfulness", target: 1, desc: "1 jam sebelum tidur stop scrolling medsos" },
    { id: "pr_mind3", icon: "☕", title: "Savoring Pagi Hari", pillar: "mindfulness", target: 1, desc: "Nikmati perlahan hangatnya sarapan tanpa pegang HP" },
  ];

  const handleApplyRoutine = (routine) => {
    const newHabit = {
      id: "routine_" + Date.now().toString() + Math.random().toString(36).substr(2, 5),
      title: routine.title,
      icon: routine.icon,
      streak: 0,
      history: {},
      targetCount: routine.target,
      pillar: routine.pillar,
    };
    setHabits([...habits, newHabit]);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 2000);
  };

  const handleHabitClick = (id) => {
    const habit = habits.find((h) => h.id === id);
    if (getCurrentCount(habit) >= habit.targetCount) {
      setConfirmUndoId(id);
      return;
    }
    setConfirmCompleteId(id);
  };

  const executeCompletion = () => {
    if (confirmCompleteId) {
      incrementHabitCount(confirmCompleteId);
      setConfirmCompleteId(null);
    }
  };

  const cancelCompletion = () => setConfirmCompleteId(null);

  const executeUndo = () => {
    if (confirmUndoId) {
      decrementHabitCount(confirmUndoId);
      setConfirmUndoId(null);
    }
  };

  const cancelUndo = () => setConfirmUndoId(null);

  const executeDelete = () => {
    if (confirmDeleteId) {
      setHabits(habits.filter((h) => h.id !== confirmDeleteId));
      setConfirmDeleteId(null);
    }
  };

  const decrementHabitCount = (id) => {
    setHabits(
      habits.map((habit) => {
        if (habit.id === id) {
          const currentCount = getCurrentCount(habit);
          if (currentCount <= 0) return habit;
          const newCount = currentCount - 1;
          const wasJustCompleted = currentCount === habit.targetCount;
          return {
            ...habit,
            history: { ...habit.history, [activeDate]: newCount },
            streak: wasJustCompleted ? Math.max(0, habit.streak - 1) : habit.streak,
          };
        }
        return habit;
      })
    );
  };

  const incrementHabitCount = (id) => {
    setHabits(
      habits.map((habit) => {
        if (habit.id === id) {
          const newCount = getCurrentCount(habit) + 1;
          const isJustCompleted = newCount === habit.targetCount;
          if (isJustCompleted) {
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 2500);
          }
          return {
            ...habit,
            history: { ...habit.history, [activeDate]: newCount },
            streak: isJustCompleted ? habit.streak + 1 : habit.streak,
          };
        }
        return habit;
      })
    );
  };

  const handleAddHabit = (e) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;
    const newHabit = {
      id: Date.now().toString(),
      title: newHabitTitle,
      icon: newHabitIcon,
      streak: 0,
      history: {},
      targetCount: parseInt(newHabitTarget) || 1,
      pillar: newHabitPillar,
    };
    setHabits([...habits, newHabit]);
    setNewHabitTitle("");
    setNewHabitTarget(1);
    setShowAddModal(false);
  };

  const completedToday = habits.filter((h) => getCurrentCount(h) >= h.targetCount);
  const allowedPillars = new Set(["cognitive", "vitality", "mindfulness", "social"]);
  const completedPillarCount = new Set(
    completedToday.map((h) => (allowedPillars.has(h.pillar) ? h.pillar : "cognitive"))
  ).size;
  const constellationReady = completedPillarCount >= 4;
  // Progress card shows when user has habits; "Terhubung" requires 4 unique pillars completed today.
  const showConstellation = habits.length > 0;

  const renderHabitItem = (habit) => {
    const isCompleted = getCurrentCount(habit) >= habit.targetCount;
    let strokeColor = "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600";
    let textChecked = "text-slate-900 dark:text-white";
    let iconColor = "text-slate-400 dark:text-slate-500";
    let ringColor = "text-slate-300 dark:text-slate-600";

    if (habit.pillar === "cognitive") {
      strokeColor = isCompleted ? "border-blue-300 dark:border-blue-500/50 shadow-md bg-blue-50/50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-500/30 shadow-sm";
      textChecked = isCompleted ? "text-blue-900 dark:text-blue-200" : "text-slate-700 dark:text-slate-200";
      iconColor = isCompleted ? "text-blue-200 dark:text-blue-500" : "text-blue-400 dark:text-blue-400";
      ringColor = "text-blue-500 dark:text-blue-400";
    } else if (habit.pillar === "vitality") {
      strokeColor = isCompleted ? "border-emerald-300 dark:border-emerald-500/50 shadow-md bg-emerald-50/50 dark:bg-emerald-900/20" : "border-slate-200 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-500/30 shadow-sm";
      textChecked = isCompleted ? "text-emerald-900 dark:text-emerald-200" : "text-slate-700 dark:text-slate-200";
      iconColor = isCompleted ? "text-emerald-200 dark:text-emerald-500" : "text-emerald-400 dark:text-emerald-400";
      ringColor = "text-emerald-500 dark:text-emerald-400";
    } else if (habit.pillar === "mindfulness") {
      strokeColor = isCompleted ? "border-amber-300 dark:border-amber-500/50 shadow-md bg-amber-50/50 dark:bg-amber-900/20" : "border-slate-200 dark:border-slate-700 hover:border-amber-200 dark:hover:border-amber-500/30 shadow-sm";
      textChecked = isCompleted ? "text-amber-900 dark:text-amber-200" : "text-slate-700 dark:text-slate-200";
      iconColor = isCompleted ? "text-amber-200 dark:text-amber-500" : "text-amber-400 dark:text-amber-400";
      ringColor = "text-amber-500 dark:text-amber-400";
    } else if (habit.pillar === "social") {
      strokeColor = isCompleted ? "border-rose-300 dark:border-rose-500/50 shadow-md bg-rose-50/50 dark:bg-rose-900/20" : "border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-500/30 shadow-sm";
      textChecked = isCompleted ? "text-rose-900 dark:text-rose-200" : "text-slate-700 dark:text-slate-200";
      iconColor = isCompleted ? "text-rose-200 dark:text-rose-500" : "text-rose-400 dark:text-rose-400";
      ringColor = "text-rose-500 dark:text-rose-400";
    }

    const progressPercent = (getCurrentCount(habit) / habit.targetCount) * 100;

    return (
      <div key={habit.id} className={`liquid-glass p-3.5 rounded-2xl border transition-all flex items-center gap-4 relative overflow-hidden select-none spatial-hover group ${strokeColor}`}>
        <div className="relative w-12 h-12 shrink-0 flex items-center justify-center cursor-pointer active:scale-95 transition-transform" onClick={() => handleHabitClick(habit.id)}>
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle cx="24" cy="24" r="20" className="fill-none stroke-slate-200 dark:stroke-slate-700" strokeWidth="4" />
            <circle cx="24" cy="24" r="20" className={`fill-none ${ringColor} transition-all duration-300 ease-out`} strokeWidth="4" strokeDasharray={2 * Math.PI * 20} strokeDashoffset={2 * Math.PI * 20 - (progressPercent / 100) * (2 * Math.PI * 20)} strokeLinecap="round" />
          </svg>
          <div className={`absolute inset-0 flex items-center justify-center`}>
            {isCompleted ? <Check className={`w-5 h-5 ${iconColor}`} strokeWidth={4} /> : <span className={`text-[11px] font-black ${textChecked}`}>{getCurrentCount(habit)}/{habit.targetCount}</span>}
          </div>
        </div>

        <div className="flex-1 min-w-0 cursor-pointer flex justify-between items-center pr-1" onClick={() => setActiveDetailHabit(habit)}>
          <div className="min-w-0">
            <h3 className={`text-[15px] font-bold transition-colors break-words [overflow-wrap:anywhere] line-clamp-2 ${textChecked}`}>{habit.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1">
                <Flame className={`w-3.5 h-3.5 ${habit.streak > 0 ? "text-orange-400" : "text-slate-300 dark:text-slate-600"}`} />
                {habit.streak} Hari Berturut
              </span>
              {habit.targetCount > 1 && !isCompleted && (
                <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-md font-bold border border-slate-200 dark:border-slate-700">Target: {habit.targetCount}x</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-2xl opacity-80">{habit.icon}</div>
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(habit.id); }}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
              title="Hapus Habit"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="min-h-full flex flex-col p-4 md:p-8 animate-fade-in pb-32">
        <div className="max-w-6xl mx-auto w-full space-y-8">
          <div className="animated-gradient-border liquid-glass p-6 md:p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 spatial-shadow dark:bg-slate-900/60 dark:border-slate-700/50">
            <div className="flex items-center gap-5 text-center md:text-left z-10 relative">
              <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center border-2 border-indigo-200 dark:border-indigo-500/30 shadow-inner">
                <Sun className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">Habit Tracker</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Bangun kebiasaan baik setiap harinya.</p>
              </div>
            </div>
            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all w-full md:w-auto justify-center cursor-pointer shadow-lg shadow-indigo-600/20">
              <Plus className="w-5 h-5" /> Habit Baru
            </button>
          </div>

          <div className="flex flex-col xl:flex-row gap-8">
            <div className="w-full xl:w-2/3 flex flex-col gap-6">

              {showConstellation && (
                <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[2rem] p-6 relative overflow-hidden border border-indigo-500/20 shadow-xl animate-fade-in-up">
                  <div className="absolute inset-0 opacity-50 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent" />
                  <div className="relative z-10 flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-14 h-14 shrink-0 bg-indigo-500/20 backdrop-blur-md rounded-2xl border border-indigo-400/30 flex items-center justify-center shadow-inner">
                        {constellationReady ? <Star className="w-7 h-7 text-indigo-200" /> : <Moon className="w-7 h-7 text-indigo-300" />}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-white text-lg tracking-wide">{constellationReady ? "Konstelasi Terhubung" : "Konstelasi Belum Lengkap"}</h3>
                        <p className="text-indigo-200 text-xs font-medium mt-1">{completedPillarCount}/4 pilar menyala hari ini.</p>
                        <p className="text-indigo-200/80 text-[11px] font-semibold mt-1 break-words leading-relaxed">
                          Syarat: 4 habit selesai dari 4 pilar berbeda (Kognitif, Vitalitas, Mindfulness, Sosial).
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 opacity-80 pointer-events-none hidden sm:block">
                      <svg className="w-[160px] md:w-[200px] h-auto" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 50 L80 20 L140 70 L180 30" stroke="rgba(199, 210, 254, 0.1)" strokeWidth="2" />
                        <path d="M20 50 L80 20" stroke="#818CF8" strokeWidth="2" className={`transition-all duration-1000 ${completedPillarCount >= 2 ? 'opacity-100' : 'opacity-0'}`} />
                        <path d="M80 20 L140 70" stroke="#818CF8" strokeWidth="2" className={`transition-all duration-1000 ${completedPillarCount >= 3 ? 'opacity-100' : 'opacity-0'}`} />
                        <path d="M140 70 L180 30" stroke="#818CF8" strokeWidth="2" className={`transition-all duration-1000 ${completedPillarCount >= 4 ? 'opacity-100' : 'opacity-0'}`} />
                        <circle cx="20" cy="50" r="4" fill={completedPillarCount >= 1 ? "#C7D2FE" : "#312E81"} className={`transition-all duration-500 ${completedPillarCount >= 1 ? 'drop-shadow-[0_0_8px_rgba(199,210,254,0.8)]' : ''}`} />
                        <circle cx="80" cy="20" r="5" fill={completedPillarCount >= 2 ? "#C7D2FE" : "#312E81"} className={`transition-all duration-500 ${completedPillarCount >= 2 ? 'drop-shadow-[0_0_8px_rgba(199,210,254,0.8)] animate-pulse' : ''}`} />
                        <circle cx="140" cy="70" r="4" fill={completedPillarCount >= 3 ? "#C7D2FE" : "#312E81"} className={`transition-all duration-500 ${completedPillarCount >= 3 ? 'drop-shadow-[0_0_8px_rgba(199,210,254,0.8)]' : ''}`} />
                        <circle cx="180" cy="30" r="6" fill={completedPillarCount >= 4 ? "#C7D2FE" : "#312E81"} className={`transition-all duration-500 ${completedPillarCount >= 4 ? 'drop-shadow-[0_0_8px_rgba(199,210,254,0.8)] animate-pulse' : ''}`} />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              <div className="liquid-glass dark:bg-slate-900/60 border border-orange-100/50 dark:border-slate-700/50 rounded-3xl p-6 spatial-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/20 dark:bg-orange-500/10 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none"></div>

                <div className="flex items-center justify-between mb-6 relative z-10">
                  <h3 className="font-bold text-lg flex items-center gap-2 text-orange-700 dark:text-orange-500">
                    <Sun className="w-5 h-5" /> Rutinitas Harian
                  </h3>
                  <span className="text-xs font-bold bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full shadow-sm border border-orange-100 dark:border-orange-500/20">
                    Total: {habits.length}
                  </span>
                </div>

                {habits.length === 0 ? (
                  <div className="text-center py-8 px-4 flex flex-col items-center gap-4 relative z-10">
                    <div className="animate-float opacity-100 dark:opacity-80" style={{ animationDuration: '4s' }}>
                      <svg viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-44 h-auto mx-auto">
                        <rect x="40" y="40" width="110" height="130" rx="10" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
                        <rect x="40" y="40" width="18" height="130" rx="10" fill="#F59E0B" opacity="0.8" />
                        {[60, 80, 100, 120, 140].map(y => <circle key={y} cx="49" cy={y} r="4" fill="white" stroke="#D97706" strokeWidth="1.5" />)}
                        <line x1="68" y1="70" x2="138" y2="70" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" />
                        <line x1="68" y1="85" x2="138" y2="85" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" />
                        <line x1="68" y1="100" x2="118" y2="100" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" />
                        <line x1="68" y1="115" x2="128" y2="115" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" />
                        <path d="M68 71 L72 75 L80 65" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M68 86 L72 90 L80 80" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M130 55 L131.5 60 L136 61.5 L131.5 63 L130 68 L128.5 63 L124 61.5 L128.5 60 Z" fill="#F59E0B" />
                        <circle cx="155" cy="80" r="20" fill="#FBBF24" />
                        <path d="M137 72 Q142 56 155 60 Q168 56 173 72" fill="#1E293B" />
                        <circle cx="149" cy="80" r="4" fill="white" />
                        <circle cx="161" cy="80" r="4" fill="white" />
                        <circle cx="149.5" cy="80.5" r="2" fill="#1E293B" />
                        <circle cx="161.5" cy="80.5" r="2" fill="#1E293B" />
                        <circle cx="150" cy="79.5" r="0.7" fill="white" />
                        <circle cx="162" cy="79.5" r="0.7" fill="white" />
                        <path d="M149 88 Q155 94 161 88" stroke="#92400E" strokeWidth="2" fill="none" strokeLinecap="round" />
                        <rect x="138" y="98" width="34" height="45" rx="12" fill="#4F46E5" />
                        <path d="M138 115 Q110 125 95 135" stroke="#FBBF24" strokeWidth="10" strokeLinecap="round" />
                        <rect x="78" y="128" width="28" height="7" rx="3" fill="#EF4444" transform="rotate(-35 78 128)" />
                        <polygon points="70,148 73,140 79,145" fill="#1E293B" transform="rotate(-35 70 148)" />
                        <path d="M20 50 L21 54 L25 55 L21 56 L20 60 L19 56 L15 55 L19 54 Z" fill="#A78BFA" opacity="0.8" />
                        <path d="M175 130 L176 133 L179 134 L176 135 L175 138 L174 135 L171 134 L174 133 Z" fill="#F472B6" opacity="0.8" />
                        <circle cx="25" cy="130" r="3" fill="#4F46E5" opacity="0.3" />
                        <circle cx="180" cy="60" r="4" fill="#FCD34D" opacity="0.5" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 dark:text-white text-lg mb-1">Mulai Kebiasaan Pertamamu! 🌟</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">Belum ada rutinitas harianmu. Tambahkan habit baru atau pilih dari daftar paket rutinitas di bawah.</p>
                    </div>
                    <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold btn-magnetic spatial-hover shadow-[0_8px_20px_-6px_rgba(79,70,229,0.5)] z-10 cursor-pointer">
                      <Plus className="w-4 h-4" /> Tambah Habit Pertama
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 relative z-10">
                    {habits.map(renderHabitItem)}
                  </div>
                )}
              </div>
            </div>

            <div className="w-full xl:w-1/3 flex flex-col gap-6 items-center xl:items-end">

              <div className="relative z-10 w-full flex flex-col items-center xl:items-end animate-fade-in">
                <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-[0_15px_40px_rgba(0,0,0,0.1)] overflow-hidden w-full max-w-[260px] aspect-[4/5] flex flex-col relative transform transition-transform hover:scale-105 duration-500">
                  <div className="absolute top-3 left-1/4 w-2.5 h-6 bg-zinc-800 rounded-full shadow-inner z-20"></div>
                  <div className="absolute top-3 right-1/4 w-2.5 h-6 bg-zinc-800 rounded-full shadow-inner z-20"></div>
                  <div className="bg-red-600 pt-8 pb-4 px-5 flex flex-col items-center justify-center relative border-b-[3px] border-red-700">
                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>
                    <div className="w-full flex justify-between items-center z-10">
                      <h2 className="text-xl font-black text-white tracking-widest uppercase shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
                        {new Date(activeDate).toLocaleDateString("id-ID", { month: "long" })}
                      </h2>
                    </div>
                    <div className="w-full flex justify-between mt-1.5 z-10">
                      <span className="text-red-100 font-black text-xs">{new Date(activeDate).getFullYear()}</span>
                      <span className="text-white font-bold text-xs uppercase tracking-wider">{new Date(activeDate).toLocaleDateString("en-US", { weekday: "long" })}</span>
                    </div>
                  </div>
                  <div className="bg-[#f8f9fa] dark:bg-slate-900 flex-1 flex flex-col items-center justify-center relative inner-shadow-sm">
                    <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
                    <h1 className="text-[80px] leading-none font-black text-zinc-900 dark:text-white tracking-tighter drop-shadow-md">{new Date(activeDate).getDate()}</h1>
                  </div>
                  <div className="absolute bottom-0 w-full bg-white/50 dark:bg-slate-900/80 backdrop-blur-md p-3 flex justify-between items-center border-t border-slate-200 dark:border-slate-800">
                    <button onClick={() => handleDateChange(-1)} className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full shadow-md transition-all active:scale-95 cursor-pointer"><ChevronLeft className="w-5 h-5" /></button>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      {activeDate === formatDateStr(new Date()) ? "Hari Ini" : "Riwayat"}
                    </span>
                    <button onClick={() => handleDateChange(1)} disabled={activeDate === formatDateStr(new Date())} className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"><ChevronRight className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => { setWeekOffset(0); setShowWeeklyReport(true); }}
                disabled={habits.length === 0}
                className={`w-full max-w-[260px] p-5 rounded-3xl flex flex-col gap-2 shadow-sm border transition-all group ${habits.length === 0 ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed' : 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-500/30 hover:border-indigo-400 dark:hover:border-indigo-400 hover:shadow-md cursor-pointer'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${habits.length === 0 ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30 group-hover:scale-110 transition-transform'}`}>
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h3 className={`font-black text-sm ${habits.length === 0 ? 'text-slate-500 dark:text-slate-500' : 'text-slate-800 dark:text-white'}`}>Evaluasi Habit</h3>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">Arsip & Analitik</p>
                  </div>
                </div>
              </button>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 p-5 rounded-3xl flex flex-col gap-4 shadow-sm w-full max-w-[260px]">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl border ${balanceState === "buffed" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20" : balanceState === "debuffed" ? "bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-100 dark:border-rose-500/20" : "bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-100 dark:border-blue-500/20"}`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-tight">Status Keselarasan</p>
                    <p className={`font-black text-sm flex items-center gap-1 ${balanceState === "buffed" ? "text-emerald-600 dark:text-emerald-400" : balanceState === "debuffed" ? "text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-slate-200"}`}>
                      {balanceState === "buffed" && "ASCENDED STRIKE!"}
                      {balanceState === "balanced" && "STABIL"}
                      {balanceState === "debuffed" && "BURNOUT WARNING"}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 flex items-center justify-between">
                    Efek Besok <Info className="w-3 h-3" />
                  </p>
                  {balanceState === "buffed" && <p className="font-bold text-xs text-emerald-600 dark:text-emerald-400">+3 Extra Koin Energi</p>}
                  {balanceState === "balanced" && <p className="font-bold text-xs text-slate-500 dark:text-slate-400">Batas Normal (10 Koin)</p>}
                  {balanceState === "debuffed" && <p className="font-bold text-xs text-rose-600 dark:text-rose-400">-3 Penalti Energi</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-[200px]">
            <h3 className="font-bold text-sm mb-4 text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" /> Paket Rutinitas Populer
            </h3>
            <div className="flex overflow-x-auto gap-4 pb-4 snap-x custom-scrollbar">
              {POPULAR_ROUTINES.map((routine) => {
                const borderHoverColor = routine.pillar === "cognitive"
                  ? "hover:border-blue-300 dark:hover:border-blue-500/50"
                  : routine.pillar === "vitality"
                    ? "hover:border-emerald-300 dark:hover:border-emerald-500/50"
                    : routine.pillar === "mindfulness"
                      ? "hover:border-amber-300 dark:hover:border-amber-500/50"
                      : "hover:border-rose-300 dark:hover:border-rose-500/50";
                const textPillarColor = routine.pillar === "cognitive"
                  ? "text-blue-500 dark:text-blue-400"
                  : routine.pillar === "vitality"
                    ? "text-emerald-500 dark:text-emerald-400"
                    : routine.pillar === "mindfulness"
                      ? "text-amber-500 dark:text-amber-400"
                      : "text-rose-500 dark:text-rose-400";
                const labelPillarColor = routine.pillar === "cognitive"
                  ? "bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20"
                  : routine.pillar === "vitality"
                    ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20"
                    : routine.pillar === "mindfulness"
                      ? "bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20"
                      : "bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20";

                return (
                  <div key={routine.id} className={`shrink-0 w-64 border border-slate-200/50 dark:border-slate-700/50 liquid-glass dark:bg-slate-800/60 rounded-2xl p-5 snap-center spatial-hover transition-all cursor-pointer group ${borderHoverColor}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-xl shadow-inner">{routine.icon}</div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${labelPillarColor} ${textPillarColor}`}>{routine.pillar} ({routine.target}x)</span>
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1 break-words [overflow-wrap:anywhere] line-clamp-2">{routine.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 h-8 line-clamp-2">{routine.desc}</p>
                    <button onClick={() => handleApplyRoutine(routine)} className="w-full py-2 bg-slate-800 dark:bg-slate-700 text-white text-xs font-bold rounded-xl btn-magnetic spatial-hover transition-colors shadow-[0_4px_10px_-2px_rgba(30,41,59,0.4)] flex items-center justify-center gap-2 relative overflow-hidden">
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <Plus className="w-3 h-3 relative z-10" /> <span className="relative z-10">Terapkan Habit</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL LAPORAN EVALUASI MINGGUAN (DENGAN ARSIP) */}
      {showWeeklyReport && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 animate-fade-in bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] md:max-h-[85vh] flex flex-col animate-fade-in-up border border-slate-200 dark:border-slate-700 overflow-hidden relative">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-5 md:p-6 flex justify-between items-start relative shrink-0">
              <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
              <div className="w-full flex flex-col md:flex-row md:items-center justify-between relative z-10 gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border border-white/20">
                      {weekOffset === 0 ? "Minggu Ini" : weekOffset === 1 ? "Minggu Lalu" : `${weekOffset} Minggu Lalu`}
                    </span>
                    <span className="text-indigo-100 text-xs font-medium bg-black/10 px-2 py-0.5 rounded">
                      {weeklyStats.dailyCompletion[0].dateStr} s/d {weeklyStats.dailyCompletion[6].dateStr}
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3 drop-shadow-sm">
                    Laporan Habit
                  </h2>
                </div>
                <div className="flex items-center gap-3 self-end md:self-auto">
                  <div className="flex bg-black/20 rounded-lg p-1 backdrop-blur-md border border-white/10">
                    <button onClick={() => setWeekOffset(prev => Math.min(5, prev + 1))} disabled={weekOffset === 5} className="p-1.5 text-white hover:bg-white/20 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer" title="Mundur (Minggu Sebelumnya)">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="px-3 flex items-center text-[10px] uppercase tracking-widest font-bold text-indigo-100 border-x border-white/10">
                      Arsip
                    </div>
                    <button onClick={() => setWeekOffset(prev => Math.max(0, prev - 1))} disabled={weekOffset === 0} className="p-1.5 text-white hover:bg-white/20 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer" title="Maju (Minggu Berikutnya)">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <button onClick={() => setShowWeeklyReport(false)} className="p-2 bg-black/20 hover:bg-black/30 rounded-full text-white transition-colors cursor-pointer shrink-0">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-5 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 dark:bg-slate-900 overflow-y-auto custom-scrollbar flex-1">
              <div className="space-y-5">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                  <div className="w-14 h-14 shrink-0 relative flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle cx="28" cy="28" r="24" className="fill-none stroke-slate-100 dark:stroke-slate-700" strokeWidth="5" />
                      <circle cx="28" cy="28" r="24" className={`fill-none transition-all duration-1000 ease-out ${weeklyStats.completionRate >= 80 ? 'stroke-emerald-500' : weeklyStats.completionRate >= 50 ? 'stroke-amber-500' : 'stroke-rose-500'}`} strokeWidth="5" strokeDasharray={2 * Math.PI * 24} strokeDashoffset={2 * Math.PI * 24 - (weeklyStats.completionRate / 100) * (2 * Math.PI * 24)} strokeLinecap="round" />
                    </svg>
                    <span className="text-xs font-black text-slate-700 dark:text-white">{weeklyStats.completionRate}%</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-base">Tingkat Konsistensi</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 leading-relaxed">Selesai <strong>{weeklyStats.totalCompleted}</strong> dari {weeklyStats.totalTargets} target rentang minggu ini.</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><BarChart2 className="w-4 h-4" /> Grafik Aktivitas</h4>
                  <div className="flex items-end justify-between gap-1.5 h-28 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 relative shadow-sm">
                    {weeklyStats.dailyCompletion.map((day, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-1.5 flex-1 group relative">
                        <div className="w-full relative h-16 bg-slate-100 dark:bg-slate-700 rounded-md overflow-hidden flex items-end">
                          <div
                            className="w-full bg-indigo-500 rounded-md transition-all duration-700 relative group-hover:bg-indigo-400"
                            style={{ height: `${day.percent}%` }}
                          ></div>
                        </div>
                        <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400">{day.label}</span>
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-10">
                          {day.completed}/{day.total} Selesai
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Target className="w-4 h-4" /> Pencapaian Pilar</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-center shadow-sm">
                      <span className="block text-lg font-black text-blue-600 dark:text-blue-400">{weeklyStats.pillarCounts.cognitive}</span>
                      <span className="text-[8px] font-bold uppercase text-slate-400 dark:text-slate-500 mt-1">Kognitif</span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-center shadow-sm">
                      <span className="block text-lg font-black text-emerald-600 dark:text-emerald-400">{weeklyStats.pillarCounts.vitality}</span>
                      <span className="text-[8px] font-bold uppercase text-slate-400 dark:text-slate-500 mt-1">Vitalitas</span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-center shadow-sm">
                      <span className="block text-lg font-black text-amber-600 dark:text-amber-400">{weeklyStats.pillarCounts.mindfulness}</span>
                      <span className="text-[8px] font-bold uppercase text-slate-400 dark:text-slate-500 mt-1">Mindful</span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-center shadow-sm">
                      <span className="block text-lg font-black text-rose-600 dark:text-rose-400">{weeklyStats.pillarCounts.social}</span>
                      <span className="text-[8px] font-bold uppercase text-slate-400 dark:text-slate-500 mt-1">Sosial</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col h-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm min-h-[250px]">
                <div className="flex items-center gap-3 mb-3 border-b border-slate-100 dark:border-slate-700 pb-3 shrink-0">
                  <div className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg"><Feather className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /></div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm">Jurnal Evaluasi</h3>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">Tulis refleksimu untuk minggu yang bersangkutan.</p>
                  </div>
                </div>
                <textarea
                  value={weeklyReflections[weekKey] || ""}
                  onChange={(e) => setWeeklyReflections(prev => ({ ...prev, [weekKey]: e.target.value }))}
                  placeholder={weekOffset === 0 ? "Apa yang berjalan baik minggu ini? Apa kendala terbesarmu? Tulis komitmen perbaikan untuk minggu depan di sini..." : "Tidak ada catatan evaluasi untuk minggu ini."}
                  className="w-full flex-1 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs md:text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 resize-none transition-colors"
                />
                <div className="mt-3 flex justify-between items-center shrink-0">
                  <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /> Tersimpan Otomatis</p>
                  <button onClick={() => setShowWeeklyReport(false)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg shadow-md transition-colors cursor-pointer">
                    Tutup Arsip
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        , document.body)}

      {/* OTHER MODALS */}
      {confirmDeleteId && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 animate-fade-in bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto custom-scrollbar animate-fade-in-up border border-slate-200 dark:border-slate-700 text-center p-6 md:p-8">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Trash2 className="w-8 h-8 text-rose-500 dark:text-rose-400" strokeWidth={2.5} />
            </div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2">Hapus Habit?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-6">
              Habit "{habits.find((h) => h.id === confirmDeleteId)?.title}" beserta riwayat pelacakannya akan dihapus secara permanen.
            </p>
            <div className="flex gap-3 justify-center">
              <button type="button" onClick={() => setConfirmDeleteId(null)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-full cursor-pointer text-sm">Batal</button>
              <button type="button" onClick={executeDelete} className="px-5 py-2.5 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-md transition-all w-full cursor-pointer text-sm">Hapus</button>
            </div>
          </div>
        </div>
        , document.body)}

      {showCelebration && createPortal(
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 px-8 py-4 rounded-2xl shadow-[0_10px_40px_rgba(34,197,94,0.3)] border border-emerald-100 dark:border-emerald-900 flex items-center gap-4 z-50 animate-bounce">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center"><Check className="w-6 h-6 text-emerald-600 dark:text-emerald-400" /></div>
          <div>
            <h4 className="font-black text-slate-800 dark:text-white text-lg">Habit Terlaksana!</h4>
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Synergy point bertambah.</p>
          </div>
        </div>
        , document.body)}

      {confirmUndoId && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 animate-fade-in bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto custom-scrollbar animate-fade-in-up border border-slate-200 dark:border-slate-700 text-center p-6 md:p-8">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner"><X className="w-8 h-8 text-rose-500 dark:text-rose-400" strokeWidth={3} /></div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2">Batalkan Checklist?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-6">Tandai "{habits.find((h) => h.id === confirmUndoId)?.title}" sebagai belum selesai hari ini.</p>
            <div className="flex gap-3 justify-center">
              <button type="button" onClick={cancelUndo} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-full cursor-pointer text-sm">Batal</button>
              <button type="button" onClick={executeUndo} className="px-5 py-2.5 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-md transition-all w-full cursor-pointer text-sm">Ulangi</button>
            </div>
          </div>
        </div>
        , document.body)}

      {confirmCompleteId && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 animate-fade-in bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto custom-scrollbar animate-fade-in-up border border-slate-200 dark:border-slate-700 text-center p-6 md:p-8">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner"><Check className="w-8 h-8 text-emerald-500 dark:text-emerald-400" strokeWidth={3} /></div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2">Selesaikan Habit?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-6">Tandai "{habits.find((h) => h.id === confirmCompleteId)?.title}" telah dilakukan hari ini.</p>
            <div className="flex gap-3 justify-center">
              <button type="button" onClick={cancelCompletion} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-full cursor-pointer text-sm">Batal</button>
              <button type="button" onClick={executeCompletion} className="px-5 py-2.5 rounded-xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-md transition-all w-full cursor-pointer text-sm">Selesai</button>
            </div>
          </div>
        </div>
        , document.body)}

      {showAddModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in p-4 sm:p-6">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-fade-in-up border border-white dark:border-slate-700 spatial-shadow relative flex flex-col max-h-[90vh]">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 shrink-0"><Star className="w-5 h-5 text-amber-400" /> Buat Kebiasaan Baru</h3>
            <form onSubmit={handleAddHabit} className="overflow-y-auto custom-scrollbar flex-1 pr-1">
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Nama Kebiasaan</label>
                  <input type="text" required value={newHabitTitle} onChange={(e) => setNewHabitTitle(e.target.value)} placeholder="Contoh: Baca Jurnal" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white text-sm" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Ikon (Emoji)</label>
                  <input type="text" maxLength="2" value={newHabitIcon} onChange={(e) => setNewHabitIcon(e.target.value)} className="w-16 text-center text-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Target (Kali/Hari)</label>
                  <input type="number" min="1" max="20" value={newHabitTarget} onChange={(e) => setNewHabitTarget(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 dark:text-white text-sm" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Pillar Keseimbangan</label>
                  <select value={newHabitPillar} onChange={(e) => setNewHabitPillar(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-white font-bold text-sm cursor-pointer">
                    <option value="cognitive">Kognitif (Belajar/Skill)</option>
                    <option value="vitality">Vitalitas (Fisik/Olahraga)</option>
                    <option value="mindfulness">Mindfulness (Mental)</option>
                    <option value="social">Sosial (Relasi/Kolaborasi)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-sm">Batal</button>
                <button type="submit" className="px-5 py-2 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md flex items-center gap-2 cursor-pointer text-sm"><Plus className="w-4 h-4" /> Simpan</button>
              </div>
            </form>
          </div>
        </div>
        , document.body)}

      {activeDetailHabit && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setActiveDetailHabit(null)}></div>
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up border border-slate-200 dark:border-slate-700">
            <div className={`p-5 md:p-6 pb-6 text-white shrink-0 ${
              activeDetailHabit.pillar === "cognitive"
                ? "bg-blue-600"
                : activeDetailHabit.pillar === "vitality"
                  ? "bg-emerald-500"
                  : activeDetailHabit.pillar === "social"
                    ? "bg-rose-500"
                    : "bg-amber-500"
            }`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl shadow-inner backdrop-blur-sm">{activeDetailHabit.icon}</div>
                  <div>
                    <h2 className="text-lg md:text-xl font-black drop-shadow-sm">{activeDetailHabit.title}</h2>
                    <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider mt-0.5">Pilar: {activeDetailHabit.pillar}</p>
                  </div>
                </div>
                <button onClick={() => setActiveDetailHabit(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"><X className="w-4 h-4 md:w-5 md:h-5" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="bg-black/10 rounded-2xl p-3 flex items-center gap-3">
                  <Flame className="w-6 h-6 md:w-8 md:h-8 text-white opacity-80" />
                  <div>
                    <p className="text-[9px] uppercase font-bold text-white/70">Streak Saat Ini</p>
                    <p className="text-lg md:text-xl font-black">{activeDetailHabit.streak} <span className="text-xs font-medium opacity-80">Hari</span></p>
                  </div>
                </div>
                <div className="bg-black/10 rounded-2xl p-3 flex items-center gap-3">
                  <Target className="w-6 h-6 md:w-8 md:h-8 text-white opacity-80" />
                  <div>
                    <p className="text-[9px] uppercase font-bold text-white/70">Target Harian</p>
                    <p className="text-lg md:text-xl font-black">{getCurrentCount(activeDetailHabit)}<span className="text-xs font-medium opacity-80">/{activeDetailHabit.targetCount}</span></p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-5 md:p-6 bg-slate-50 dark:bg-slate-800 flex-1 overflow-y-auto custom-scrollbar flex flex-col">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5 flex items-center gap-2"><Feather className="w-4 h-4 text-slate-400" /> Jurnal & Catatan (Opsional)</h3>
              <textarea value={habitNotes[activeDetailHabit.id] || ""} onChange={(e) => setHabitNotes({ ...habitNotes, [activeDetailHabit.id]: e.target.value })} placeholder="Ada insight, mood, atau refleksi menarik? Catat di sini..." className="w-full min-h-[100px] flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 resize-none shadow-sm" />
              <p className="text-[9px] text-slate-400 font-medium text-right mt-2 shrink-0">*Catatan ini tersimpan lokal</p>
            </div>
          </div>
        </div>
        , document.body)}
    </>
  );
};

export default Habits;
