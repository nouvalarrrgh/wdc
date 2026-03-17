import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Radar, Bar } from 'react-chartjs-2';
import {
  Activity, LayoutGrid, Sparkles, TrendingUp, FileText, Flame, Zap, CheckCircle2,
  Target, Brain, Clock, BookOpen, Focus, Star, AlertTriangle, ChevronRight,
  Trophy, Calendar, Moon, Sun, Sunset, Sunrise, RefreshCw,
  ShieldCheck, Eye, EyeOff
} from 'lucide-react';
import { generateExecutiveReport } from '../utils/ReportGenerator';
import { NekoMascotMini, NekoMascotFull } from './NekoMascot';

// IMPORT STORAGE DAN CUSTOM HOOK LEVEL DEWA
import { getJson, setJson } from '../utils/storage';
import { useSynergyState } from '../hooks/useSynergyState';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const formatDateStr = (dateObj) => {
  const d = new Date(dateObj);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};

const RocketIllustration = () => (
  <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xl">
    <circle cx="20" cy="20" r="2" fill="white" opacity="0.6" className="animate-pulse" />
    <circle cx="160" cy="15" r="1.5" fill="white" opacity="0.5" />
    <circle cx="180" cy="40" r="2" fill="white" opacity="0.7" className="animate-pulse" />
    <circle cx="40" cy="50" r="1" fill="white" opacity="0.4" />
    <circle cx="140" cy="60" r="1.5" fill="white" opacity="0.5" />
    <ellipse cx="100" cy="70" rx="24" ry="48" fill="white" opacity="0.95" />
    <ellipse cx="100" cy="50" rx="18" ry="32" fill="#EEF2FF" />
    <circle cx="100" cy="60" r="12" fill="white" stroke="#4F46E5" strokeWidth="3" />
    <circle cx="100" cy="60" r="7" fill="#4F46E5" />
    <circle cx="97" cy="57" r="2.5" fill="white" opacity="0.5" />
    <path d="M100 22 Q90 35 100 40 Q110 35 100 22Z" fill="#4F46E5" />
    <path d="M76 100 Q64 115 68 118 Q76 110 80 105Z" fill="#818CF8" />
    <path d="M124 100 Q136 115 132 118 Q124 110 120 105Z" fill="#818CF8" />
    <ellipse cx="100" cy="122" rx="14" ry="8" fill="#F59E0B" opacity="0.9" />
    <ellipse cx="100" cy="128" rx="10" ry="12" fill="#EF4444" opacity="0.7" />
    <ellipse cx="100" cy="134" rx="6" ry="10" fill="#FCD34D" opacity="0.6" />
    <path d="M55 30 L56.5 35 L61.5 36.5 L56.5 38 L55 43 L53.5 38 L48.5 36.5 L53.5 35 Z" fill="#FCD34D" opacity="0.8" />
    <path d="M155 75 L156 79 L160 80 L156 81 L155 85 L154 81 L150 80 L154 79 Z" fill="#A78BFA" opacity="0.7" />
  </svg>
);

const computeImpactScore = (habits, focusSessions, completedTasks, loginStreak, radarScores) => {
  const habitScore = Math.min((habits.doneToday / Math.max(habits.total, 1)) * 100, 100);
  const focusScore = Math.min(focusSessions * 12, 100);
  const taskScore = Math.min(completedTasks * 8, 100);
  const streakScore = Math.min(loginStreak * 10, 100);
  const radarAvg = Object.values(radarScores).reduce((a, b) => a + b, 0) / Object.keys(radarScores).length;

  const weighted = (habitScore * 0.25) + (focusScore * 0.25) + (taskScore * 0.20) + (streakScore * 0.15) + (radarAvg * 0.15);
  return Math.round(weighted);
};

const getImpactLabel = (score) => {
  if (score >= 85) return { label: 'Luar Biasa 🏆', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20' };
  if (score >= 70) return { label: 'Sangat Produktif ⭐', color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-500/10', border: 'border-indigo-200 dark:border-indigo-500/20' };
  if (score >= 50) return { label: 'Berkembang 📈', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20' };
  return { label: 'Perlu Dorongan 💪', color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/20' };
};

const generateDynamicInsight = (habits, focusSessions, deadlineCount, radarScores) => {
  const weakest = Object.entries(radarScores).sort((a, b) => a[1] - b[1])[0];
  const insights = [];

  if (habits.doneToday === habits.total && habits.total > 0)
    insights.push({ icon: '🎉', text: `Semua ${habits.total} habit hari ini sudah selesai! Kamu luar biasa.`, color: 'text-orange-700 dark:text-orange-400' });
  else if (habits.doneToday === 0 && habits.total > 0)
    insights.push({ icon: '⏰', text: `Belum ada rutinitas yang dikerjakan hari ini. Mulai dari yang termudah!`, color: 'text-orange-600 dark:text-orange-500' });

  if (focusSessions >= 3)
    insights.push({ icon: '🧠', text: `${focusSessions} sesi fokus hari ini. Flow state indigo tercapai!`, color: 'text-indigo-700 dark:text-indigo-400' });
  else if (focusSessions === 0)
    insights.push({ icon: '🌿', text: 'Coba satu sesi Deep Focus untuk menanam pohon indigomu hari ini.', color: 'text-indigo-600 dark:text-indigo-500' });

  if (deadlineCount > 3)
    insights.push({ icon: '🚨', text: `${deadlineCount} deadline aktif! Prioritaskan menggunakan Eisenhower Matrix.`, color: 'text-rose-700 dark:text-rose-400' });

  if (weakest && weakest[1] < 40) {
    const labels = { akademik: 'Akademik', organisasi: 'Organisasi', istirahat: 'Istirahat', sosial: 'Sosial', tugas: 'Penyelesaian Tugas' };
    insights.push({ icon: '💡', text: `Area "${labels[weakest[0]] || weakest[0]}" butuh perhatian lebih minggu ini.`, color: 'text-slate-700 dark:text-slate-300' });
  }

  if (insights.length === 0)
    insights.push({ icon: '✨', text: 'Semua indikator hijau! Pertahankan momentum ini!', color: 'text-emerald-700 dark:text-emerald-400' });

  return insights[0];
};

const CATEGORY_META = {
  academic: { label: 'Akademik', color: 'text-sky-600', dot: 'bg-sky-500' },
  organization: { label: 'Organisasi', color: 'text-violet-600', dot: 'bg-violet-500' },
  committee: { label: 'Kepanitiaan', color: 'text-fuchsia-600', dot: 'bg-fuchsia-500' },
  work: { label: 'Kerja Part-time', color: 'text-emerald-600', dot: 'bg-emerald-500' },
  personal: { label: 'Pribadi/Keluarga', color: 'text-amber-600', dot: 'bg-amber-500' },
  project: { label: 'Project/Skripsi', color: 'text-rose-600', dot: 'bg-rose-500' },
};

const QUOTES = [
  {
    id: 'discipline-bridge',
    text: 'Disiplin adalah jembatan antara tujuan dan pencapaian. Kebiasaan kecil hari ini adalah investasi terbesar untuk masa depanmu.',
    author: 'Jim Rohn',
  },
  {
    id: 'progress-1',
    text: 'Kemajuan kecil yang konsisten setiap hari selalu mengalahkan ledakan produktivitas satu malam.',
    author: 'Prodify Coach',
  },
  {
    id: 'focus-1',
    text: 'Fokus pada satu hal penting hari ini lebih bernilai daripada mencentang sepuluh hal yang tidak krusial.',
    author: 'Prodify Insight',
  },
  {
    id: 'student-identity',
    text: 'Tugas, rapat, dan proyek hanyalah medium. Misi utamamu adalah tumbuh menjadi versi dirimu yang lebih matang setiap semester.',
    author: 'Prodify',
  },
  {
    id: 'rest-balance',
    text: 'Istirahat yang terencana adalah bagian dari strategi, bukan kemalasan. Otak yang segar melipatgandakan kualitas jam belajarmu.',
    author: 'Neuro Focus Note',
  },
];

const Dashboard = ({ onNavigate, onTriggerCognitiveGuard } = {}) => {
  // MENGGUNAKAN CUSTOM HOOKS BARU
  const { energyCoins } = useSynergyState();

  const [zenDashboardMode, setZenDashboardMode] = useState(() => {
    const settings = getJson('prodify_settings', {});
    return !!settings.dashboardZenMode;
  });

  const [loginStreak, setLoginStreak] = useState(0);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [completedTaskCount, setCompletedTaskCount] = useState(0);
  const [activeDeadlineCount, setActiveDeadlineCount] = useState(0);
  const [habitsData, setHabitsData] = useState({ total: 0, doneToday: 0, weekCompletion: [] });
  const [focusSessionsToday, setFocusSessionsToday] = useState(0);
  const [impactScore, setImpactScore] = useState(0);
  const [dynamicInsight, setDynamicInsight] = useState(null);
  const [weeklyBarData, setWeeklyBarData] = useState([]);
  const [categorySummary, setCategorySummary] = useState({});
  const [projectProgress, setProjectProgress] = useState({ total: 0, completed: 0, percentage: 0 });

  const radarChartRef = useRef(null);
  const barChartRef = useRef(null);
  const syncDebounceRef = useRef(null);

  // Evaluation
  const [evaluationState, setEvaluationState] = useState('idle');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState(() => getJson('prodify_radar_scores', { akademik: 50, organisasi: 50, istirahat: 50, sosial: 50, tugas: 50 }));
  const [insightText, setInsightText] = useState('');
  const [finalInsight, setFinalInsight] = useState('');

  // Heatmap
  const [heatmap, setHeatmap] = useState(() => Array.from({ length: 48 }, (_, i) => ({
    id: i, date: formatDateStr(new Date(new Date().setDate(new Date().getDate() - (47 - i)))), active: false, intensity: 0, count: 0
  })));

  // =========================================================
  // DOSA 3 DISELESAIKAN: ANTI NULL POINTER EXCEPTION
  // =========================================================
  const userObj = getJson('prodify_user', { name: 'Mahasiswa' });
  const userName = userObj?.name || 'Mahasiswa';
  // =========================================================

  const [customQuote, setCustomQuote] = useState(() => getJson('prodify_custom_quote', ''));
  const [useCustomQuote, setUseCustomQuote] = useState(() => getJson('prodify_use_custom_quote', false));
  const [quoteDayIndex, setQuoteDayIndex] = useState(0);

  useEffect(() => {
    setQuoteDayIndex(Math.floor(Date.now() / (1000 * 60 * 60 * 24)));
  }, []);

  const todayQuote = useMemo(() => {
    if (useCustomQuote && customQuote.trim()) {
      return { text: customQuote.trim(), author: 'Quote Pribadi' };
    }
    const idx = quoteDayIndex % QUOTES.length;
    const q = QUOTES[idx];
    return { text: q.text, author: q.author };
  }, [useCustomQuote, customQuote, quoteDayIndex]);

  const greetingMeta = useMemo(() => {
    const h = new Date().getHours();
    if (h < 6) return { greeting: 'Selamat Dini Hari', icon: '🌙' };
    if (h < 12) return { greeting: 'Selamat Pagi', icon: '🌤️' };
    if (h < 15) return { greeting: 'Selamat Siang', icon: '☀️' };
    if (h < 19) return { greeting: 'Selamat Sore', icon: '🌅' };
    return { greeting: 'Selamat Malam', icon: '🌙' };
  }, []);

  const loadAllData = useCallback(() => {
    const todayLocal = formatDateStr(new Date());
    const todayUTC = new Date().toISOString().split('T')[0];

    const streakData = getJson('prodify_login_streak', { lastLogin: '', streak: 0 });
    setLoginStreak(streakData.streak);
    if (streakData.lastLogin !== todayLocal) setShowCheckInModal(true);

    const deadlineTasks = getJson('prodify_tasks', []);
    const matrixTasks = getJson('matrix_tasks', []);
    const timeBlocks = getJson('time_blocks', {});

    const completedCount = deadlineTasks.filter(t => t.completed).length + matrixTasks.filter(t => t.completed).length;
    setCompletedTaskCount(completedCount);

    const activeDeadlines = deadlineTasks.filter(t => !t.completed && new Date(t.deadline) > new Date()).length;
    setActiveDeadlineCount(activeDeadlines);

    // KALKULASI PROGRESS PROJECT/SKRIPSI
    const allTasks = [...deadlineTasks, ...matrixTasks];
    const pTasks = allTasks.filter(t => t.category === 'project');
    const completedPTasks = pTasks.filter(t => t.completed).length;
    setProjectProgress({
      total: pTasks.length,
      completed: completedPTasks,
      percentage: pTasks.length > 0 ? Math.round((completedPTasks / pTasks.length) * 100) : 0
    });

    const allHabits = getJson('prodify_habits_v4', []);
    const doneTodayHabits = allHabits.filter(h => (h.history?.[todayLocal] || 0) >= h.targetCount).length;
    setHabitsData({ total: allHabits.length, doneToday: doneTodayHabits });

    let todaySessions = parseInt(getJson(`forest_today_${todayUTC}`, '0'));
    if (todaySessions === 0 && todayLocal !== todayUTC) {
      todaySessions = parseInt(getJson(`forest_today_${todayLocal}`, '0'));
    }
    setFocusSessionsToday(todaySessions);

    const weekBar = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const ds = formatDateStr(d);
      const blocksCount = (timeBlocks[ds] || []).length;
      const deadlinesOnDay = deadlineTasks.filter(t => t.completed && (t.completedAt?.startsWith(ds) || t.createdAt?.startsWith(ds))).length;
      return { day: d.toLocaleDateString('id-ID', { weekday: 'short' }), value: blocksCount + deadlinesOnDay };
    });
    setWeeklyBarData(weekBar);

    // RINGKASAN PERAN
    const categoryCounts = {};
    Object.keys(timeBlocks || {}).forEach(date => {
      const dateObj = new Date(date);
      const now = new Date();
      const diffDays = Math.round((now - dateObj) / (1000 * 60 * 60 * 24));
      if (diffDays <= 6 && diffDays >= 0) {
        (timeBlocks[date] || []).forEach(b => {
          const key = b.category || 'academic';
          categoryCounts[key] = (categoryCounts[key] || 0) + 1;
        });
      }
    });
    setCategorySummary(categoryCounts);

    const completedDates = [];
    deadlineTasks.forEach(t => {
      if (t.completed) {
        if (t.completedAt) completedDates.push(t.completedAt.split('T')[0]);
        else if (t.createdAt) completedDates.push(t.createdAt.split('T')[0]);
      }
    });
    matrixTasks.forEach(t => { if (t.completed) completedDates.push(t.completedAt?.split('T')[0] || todayLocal); });
    Object.keys(timeBlocks).forEach(date => timeBlocks[date].forEach(b => { if (b.completed) completedDates.push(date); }));
    const dateCounts = completedDates.reduce((acc, d) => { acc[d] = (acc[d] || 0) + 1; return acc; }, {});
    const todayDate = new Date();

    setHeatmap(Array.from({ length: 48 }, (_, i) => {
      const d = new Date(todayDate); d.setDate(todayDate.getDate() - (47 - i));
      const ds = formatDateStr(d);
      const count = dateCounts[ds] || 0;
      return { id: i, date: ds, count, active: count > 0, intensity: count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : 3 };
    }));

    const savedScores = getJson('prodify_radar_scores', { akademik: 50, organisasi: 50, istirahat: 50, sosial: 50, tugas: 50 });
    setScores(savedScores);

    const is = computeImpactScore(
      { doneToday: doneTodayHabits, total: allHabits.length },
      todaySessions, completedCount, streakData.streak, savedScores
    );
    setImpactScore(is);
    setDynamicInsight(generateDynamicInsight(
      { doneToday: doneTodayHabits, total: allHabits.length },
      todaySessions, activeDeadlines, savedScores
    ));
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const toggleZenDashboardMode = useCallback(() => {
    setZenDashboardMode((prev) => {
      const next = !prev;
      const settings = getJson('prodify_settings', {});
      setJson('prodify_settings', { ...settings, dashboardZenMode: next });
      return next;
    });
  }, []);

  useEffect(() => {
    const DASHBOARD_SYNC_KEYS = new Set([
      'prodify_login_streak',
      'prodify_tasks',
      'matrix_tasks',
      'time_blocks',
      'prodify_habits_v4',
      'forest_stats',
      'prodify_radar_scores',
      'prodify_settings',
      'prodify_balance_state',
      'prodify_user',
      'prodify_profileInfo',
      'prodify_custom_quote',
      'prodify_use_custom_quote',
    ]);

    const scheduleReload = () => {
      if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
      syncDebounceRef.current = setTimeout(() => loadAllData(), 120);
    };

    const handleSync = (e) => {
      const changedKey = e?.key || e?.detail?.key;
      if (!changedKey || DASHBOARD_SYNC_KEYS.has(changedKey) || String(changedKey).startsWith('forest_today_')) {
        scheduleReload();
      }
      if (!changedKey || changedKey === 'prodify_settings') {
        const settings = getJson('prodify_settings', {});
        setZenDashboardMode(!!settings.dashboardZenMode);
      }
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('prodify-sync', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('prodify-sync', handleSync);
      if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
    };
  }, [loadAllData]);

  useEffect(() => {
    return () => {
      try { radarChartRef.current?.destroy?.(); } catch { /* ignore */ }
      try { barChartRef.current?.destroy?.(); } catch { /* ignore */ }
    };
  }, []);

  useEffect(() => {
    if (!zenDashboardMode) return;
    try { radarChartRef.current?.destroy?.(); } catch { /* ignore */ }
    try { barChartRef.current?.destroy?.(); } catch { /* ignore */ }
  }, [zenDashboardMode]);

  const evaluationQuestions = [
    { type: 'choice', text: 'Gimana kualitas tidurmu seminggu ini?', options: [{ text: 'Nyenyak 7-8 jam, bangun segar! 🌅', effect: { istirahat: 30, akademik: 10 } }, { text: 'Cukup tapi sering kebangun 🥱', effect: { istirahat: 0 } }, { text: 'Begadang ngerjain tugas 🦉', effect: { istirahat: -25, tugas: 15 } }, { text: 'Begadang scroll/main game 🎮', effect: { istirahat: -30, sosial: 10 } }] },
    { type: 'choice', text: 'Gimana fokus studi dan belajarmu belakangan ini?', options: [{ text: 'Sangat fokus, catatan rapi! 🤓', effect: { akademik: 30, tugas: 10 } }, { text: 'Biasa, kadang ngelamun 😅', effect: { akademik: 0 } }, { text: 'Keteteran, banyak skip 🤯', effect: { akademik: -25 } }] },
    { type: 'choice', text: 'Bagaimana strategi menyelesaikan tugasmu minggu ini?', options: [{ text: 'Dicicil, selesai sebelum deadline 😎', effect: { tugas: 30, istirahat: 10 } }, { text: 'On track, masih proses 🏃', effect: { tugas: 10 } }, { text: 'SKS! Kebut semalam 😱', effect: { tugas: -20, istirahat: -15, akademik: -10 } }, { text: 'Ada yang telat/kelewat 😭', effect: { tugas: -35 } }] },
    { type: 'choice', text: 'Seberapa aktif di organisasi/BEM/UKM minggu ini?', options: [{ text: 'Super sibuk, rapat mulu 🔥', effect: { organisasi: 30, istirahat: -15 } }, { text: 'Ada event, masih balance ⚖️', effect: { organisasi: 15 } }, { text: 'Lagi santai 🏖️', effect: { organisasi: -5 } }, { text: 'Fokus kuliah aja 📚', effect: { organisasi: 0, akademik: 10 } }] },
    { type: 'choice', text: 'Me-time dan sosial sama teman-teman gimana?', options: [{ text: 'Sering nongkrong, seru! 🎉', effect: { sosial: 30, tugas: -10 } }, { text: 'Ada me-time pas weekend ☕', effect: { sosial: 15, istirahat: 10 } }, { text: 'Sama sekali nggak sempat 😿', effect: { sosial: -25, istirahat: -10 } }] },
    { type: 'choice', text: 'Secara mental, seberapa berat perjalananmu seminggu ini?', options: [{ text: "I'm good and productive! ✨", effect: { istirahat: 10, akademik: 10, tugas: 10 } }, { text: 'Agak capek, tapi oke 💪', effect: { istirahat: -5 } }, { text: 'Sangat stress & overwhelmed 🌧️', effect: { istirahat: -30, sosial: -15, akademik: -20 } }] },
    { type: 'essay', text: 'Tulis insight atau evaluasi singkatmu tentang minggu ini (Opsional)' }
  ];

  const handleAnswer = (effect) => {
    if (effect) {
      setScores(prev => {
        const newScores = { ...prev };
        for (const key in effect) newScores[key] = Math.max(0, Math.min(100, newScores[key] + effect[key]));
        setJson('prodify_radar_scores', newScores);
        return newScores;
      });
    }
    if (currentQuestion < evaluationQuestions.length - 1) setCurrentQuestion(prev => prev + 1);
    else { setFinalInsight(insightText); setEvaluationState('result'); }
  };

  const startEvaluation = () => {
    setEvaluationState('evaluating'); setCurrentQuestion(0);
    const init = { akademik: 50, organisasi: 50, istirahat: 50, sosial: 50, tugas: 50 };
    setScores(init); setJson('prodify_radar_scores', init);
    setInsightText(''); setFinalInsight('');
  };

  const getRecommendation = () => {
    const min = Object.keys(scores).reduce((a, b) => scores[a] < scores[b] ? a : b);
    if (Object.values(scores).every(v => v >= 70)) return '🌟 Luar biasa! Semua aspek hidupmu seimbang sempurna minggu ini. 🥇';
    const advice = { istirahat: '⚠️ Istirahatmu kurang. Tidur 7-8 jam itu investasi produktivitas! 😴', akademik: '⚠️ Fokus belajarmu menurun. Coba review catatan sebelum kelas. 📚', sosial: '⚠️ Terlalu sibuk sendirian! Manusia butuh koneksi sosial. 🎮', organisasi: '⚠️ Soft skill lewat organisasi penting untuk karir. Aktif lagi! 🤝', tugas: '⚠️ Tugas mulai menumpuk! Cicil dengan Pomodoro timer sekarang. ⏰' };
    return advice[min] || '✨ Pertahankan keseimbanganmu!';
  };

  const handleCheckIn = () => {
    const todayLocal = formatDateStr(new Date());
    const streakData = getJson('prodify_login_streak', { lastLogin: '', streak: 0 });
    let newStreak = streakData.streak;
    if (streakData.lastLogin) {
      const diff = Math.ceil(Math.abs(new Date(todayLocal) - new Date(streakData.lastLogin)) / (1000 * 60 * 60 * 24));
      newStreak = diff === 1 ? newStreak + 1 : diff > 1 ? 1 : newStreak;
    } else newStreak = 1;
    setLoginStreak(newStreak);
    setJson('prodify_login_streak', { lastLogin: todayLocal, streak: newStreak });
    setShowCheckInModal(false);
    loadAllData();
  };

  const getHeatmapColor = (intensity) => ['bg-slate-100 dark:bg-slate-800', 'bg-indigo-200 dark:bg-indigo-900', 'bg-indigo-400 dark:bg-indigo-600', 'bg-indigo-600 dark:bg-indigo-400'][intensity] || 'bg-slate-100 dark:bg-slate-800';

  const impactMeta = getImpactLabel(impactScore);

  const radarData = useMemo(() => ({
    labels: ['Akademik', 'Organisasi', 'Istirahat', 'Sosial', 'Tugas'],
    datasets: [{
      label: 'Keseimbangan',
      data: [scores.akademik, scores.organisasi, scores.istirahat, scores.sosial, scores.tugas],
      backgroundColor: 'rgba(79,70,229,0.15)',
      borderColor: 'rgba(79,70,229,1)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(79,70,229,1)',
      pointRadius: 4
    }]
  }), [scores.akademik, scores.organisasi, scores.istirahat, scores.sosial, scores.tugas]);

  const radarOptions = useMemo(() => ({
    scales: {
      r: {
        suggestedMin: 0,
        suggestedMax: 100,
        grid: { color: 'rgba(148,163,184,0.2)' },
        ticks: { display: false },
        pointLabels: { font: { size: 10, weight: 'bold' }, color: '#64748b' }
      }
    },
    plugins: { legend: { display: false } }
  }), []);

  const barData = useMemo(() => ({
    labels: weeklyBarData.map(d => d.day),
    datasets: [{
      label: 'Aktivitas',
      data: weeklyBarData.map(d => d.value),
      backgroundColor: weeklyBarData.map((_, i) => i === 6 ? 'rgba(79,70,229,0.9)' : 'rgba(79,70,229,0.3)'),
      borderRadius: 6,
      borderSkipped: false
    }]
  }), [weeklyBarData]);

  const barOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.raw} aktivitas` } } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' }, color: '#94a3b8' } },
      y: { display: false, grid: { display: false } }
    }
  }), []);

  const zenActionItems = useMemo(() => {
    const items = [];

    if (activeDeadlineCount > 0) {
      items.push({
        title: 'Cek Deadline Terdekat',
        desc: `Ada ${activeDeadlineCount} deadline aktif yang perlu kamu amankan.`,
        target: 'time_manager',
      });
    }

    if (habitsData.total > 0 && habitsData.doneToday < habitsData.total) {
      const pending = Math.max(0, habitsData.total - habitsData.doneToday);
      items.push({
        title: 'Selesaikan Habit Hari Ini',
        desc: `Masih ada ${pending} habit yang belum selesai.`,
        target: 'habits',
      });
    }

    if (focusSessionsToday <= 0) {
      items.push({
        title: 'Mulai 1 Sesi Deep Focus',
        desc: '1 sesi fokus kecil hari ini sudah cukup untuk menjaga momentum.',
        target: 'focus',
      });
    }

    if (projectProgress.total > 0 && projectProgress.percentage < 100) {
      items.push({
        title: 'Lanjutkan Project / Skripsi',
        desc: `Progress project: ${projectProgress.percentage}%. Lanjutkan 1 target kecil sekarang.`,
        target: 'time_manager',
      });
    }

    if (!items.length) {
      items.push({
        title: 'Semua Aman',
        desc: 'Dashboard Zen aktif. Pilih 1 hal kecil untuk dikerjakan, lalu lanjutkan harimu.',
        target: 'time_manager',
      });
    }

    return items.slice(0, 3);
  }, [activeDeadlineCount, habitsData.total, habitsData.doneToday, focusSessionsToday, projectProgress.total, projectProgress.percentage]);

  return (
    <>
      <div id="dashboard-report-content" className="space-y-6 pb-32 animate-fade-in">

        {/* ===== WELCOME BANNER ===== */}
        <div className="relative overflow-hidden animated-gradient-bg rounded-3xl p-6 md:p-8 text-white spatial-shadow">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-4 w-fit shadow-sm">
                <span className="text-base">{greetingMeta.icon}</span>
                <span className="text-xs font-bold text-white/90 uppercase tracking-widest">{greetingMeta.greeting}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                Halo, <span className="text-yellow-300 drop-shadow-md">{userName.charAt(0).toUpperCase() + userName.slice(1)}</span>! 👋
              </h1>
              <p className="text-indigo-100 mt-2 text-sm font-medium max-w-md leading-relaxed">
                Pusat kendali produktivitasmu. Data real-time dari seluruh modul Prodify tersinkronisasi di sini.
              </p>

              {/* Quick Stats Row */}
              <div className="flex gap-3 mt-6 flex-wrap">
                {[
                  { icon: '🔥', label: 'Streak', value: `${loginStreak} Hari` },
                  { icon: '✅', label: 'Tugas Selesai', value: `${completedTaskCount}` },
                  { icon: '⚡', label: 'Koin Energi', value: `${energyCoins}` },
                  { icon: '⏰', label: 'Deadline Aktif', value: `${activeDeadlineCount}`, alert: activeDeadlineCount > 3 },
                ].map(stat => (
                  <div key={stat.label} className={`bg-white/10 backdrop-blur-md border ${stat.alert ? 'border-rose-400/60 bg-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'border-white/20'} rounded-2xl px-5 py-3 text-center transition-all hover:-translate-y-1`}>
                    <div className="text-lg mb-0.5">{stat.icon}</div>
                    <div className={`text-lg font-black leading-tight ${stat.alert ? 'text-rose-200' : 'text-white'}`}>{stat.value}</div>
                    <div className="text-[9px] text-indigo-100 font-bold uppercase tracking-wide opacity-80">{stat.label}</div>
                  </div>
                ))}
                <button
                  data-html2canvas-ignore="true"
                  onClick={generateExecutiveReport}
                  className="bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-slate-700 rounded-2xl px-5 py-3 text-center transition-all shadow-xl flex items-center justify-center gap-2 hover:-translate-y-1 hover:bg-indigo-50 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <FileText className="w-5 h-5" />
                  <div className="text-left leading-tight">
                    <div className="text-xs font-black whitespace-nowrap">Export PDF</div>
                    <div className="text-[9px] font-bold uppercase tracking-wide opacity-70">Laporan</div>
                  </div>
                </button>

                <button
                  data-html2canvas-ignore="true"
                  onClick={toggleZenDashboardMode}
                  className={`bg-white dark:bg-slate-800 border rounded-2xl px-5 py-3 text-center transition-all shadow-xl flex items-center justify-center gap-2 hover:-translate-y-1 cursor-pointer ${zenDashboardMode ? 'text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20 hover:bg-emerald-50 dark:hover:bg-slate-700' : 'text-slate-700 dark:text-slate-200 border-indigo-100 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-700'}`}
                  title={zenDashboardMode ? 'Matikan Zen Dashboard' : 'Aktifkan Zen Dashboard'}
                >
                  {zenDashboardMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  <div className="text-left leading-tight">
                    <div className="text-xs font-black whitespace-nowrap">Zen View</div>
                    <div className="text-[9px] font-bold uppercase tracking-wide opacity-70">Toggle</div>
                  </div>
                </button>
              </div>
            </div>
            <div className="hidden md:flex w-40 h-36 shrink-0 animate-float">
              <RocketIllustration />
            </div>
          </div>
        </div>

        {/* ===== COGNITIVE GUARD TRIGGER CARD ===== */}
        <div className="bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border border-teal-500/20 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 spatial-shadow mb-6">
          <div className="p-4 bg-teal-500/20 rounded-full shrink-0 relative">
            <div className="absolute inset-0 bg-teal-400 blur-xl opacity-30 rounded-full animate-pulse" />
            <Brain className="w-10 h-10 text-teal-600 dark:text-teal-400 relative z-10" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Pikiran Terasa Penuh dan Overload?</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm font-medium leading-relaxed max-w-3xl">
              Sebagai mahasiswa, wajar merasa kewalahan dengan beban tugas akademik dan organisasi. Kapasitas mentalmu saat ini terekam di angka <strong className="text-amber-500">{energyCoins} Koin</strong>. Beri jeda untuk otakmu sejenak, masuk ke zona relaksasi pernapasan 4-7-8 selama 1 menit untuk meregenerasi fokusmu!
            </p>
          </div>
          <button
            onClick={() => (typeof onTriggerCognitiveGuard === 'function' ? onTriggerCognitiveGuard() : null)}
            className="shrink-0 px-6 py-3.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-2xl shadow-lg shadow-teal-500/30 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" /> Ambil Waktu Jeda
          </button>
        </div>

        {zenDashboardMode ? (
          <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/50 rounded-3xl p-6 md:p-8 spatial-shadow">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white">Zen Dashboard</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Mode tenang aktif. Metrik kompleks (chart, radar, heatmap) disembunyikan — fokus ke aksi paling penting sekarang.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => (typeof onNavigate === 'function' ? onNavigate('time_manager') : null)}
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/25 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <Calendar className="w-5 h-5" /> Buka Time Manager
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {zenActionItems.map((item) => (
                <div key={item.title} className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 flex flex-col gap-3">
                  <div>
                    <p className="text-[11px] font-black text-indigo-500 dark:text-indigo-300 uppercase tracking-widest">Action Item</p>
                    <h4 className="text-base font-black text-slate-800 dark:text-white mt-1">{item.title}</h4>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => (typeof onNavigate === 'function' ? onNavigate(item.target) : null)}
                    className="mt-auto w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    Kerjakan Sekarang <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* ===== INTELLIGENCE HUB ROW 1 ===== */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Impact Score Card */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 p-6 rounded-3xl spatial-shadow flex flex-col items-center justify-center text-center gap-3 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-violet-50/50 dark:from-indigo-900/20 dark:to-violet-900/20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
            <Trophy className="w-8 h-8 text-indigo-400 drop-shadow-sm" />
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Skor Dampak Mingguan</p>
              <div className="text-6xl font-black text-slate-800 dark:text-white leading-none tracking-tighter">{impactScore}</div>
            </div>
            <div className={`px-4 py-1.5 rounded-xl border text-xs font-bold ${impactMeta.bg} ${impactMeta.color} ${impactMeta.border} shadow-sm`}>
              {impactMeta.label}
            </div>
            {/* Progress bar */}
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner mt-1">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${impactScore}%` }}>
                <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/30 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Dynamic Insight Card */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 p-6 rounded-3xl spatial-shadow flex flex-col gap-4 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-xl shadow-sm"><Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" /></div>
              <h3 className="font-bold text-slate-700 dark:text-slate-100 text-sm">Insight Hari Ini</h3>
              <button onClick={loadAllData} className="ml-auto p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer" title="Refresh Data">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {dynamicInsight && (
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-4 flex-1 shadow-sm flex flex-col justify-center">
                <span className="text-2xl block mb-1.5">{dynamicInsight.icon}</span>
                <p className={`text-sm font-semibold leading-relaxed ${dynamicInsight.color}`}>{dynamicInsight.text}</p>
              </div>
            )}

            {/* Hari ini ringkasan & Skripsi */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="bg-indigo-50/80 dark:bg-indigo-500/10 border border-indigo-100/50 dark:border-indigo-500/20 rounded-xl p-3 text-center transition-transform hover:scale-[1.02] shadow-sm">
                <Moon className="w-4 h-4 text-indigo-500 mx-auto mb-1.5" />
                <div className="text-xl font-black text-indigo-700 dark:text-indigo-400 leading-none">{focusSessionsToday}</div>
                <div className="text-[9px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-widest mt-1">Sesi Fokus</div>
              </div>
              <div className="bg-orange-50/80 dark:bg-orange-500/10 border border-orange-100/50 dark:border-orange-500/20 rounded-xl p-3 text-center transition-transform hover:scale-[1.02] shadow-sm">
                <Sun className="w-4 h-4 text-orange-500 mx-auto mb-1.5" />
                <div className="text-xl font-black text-orange-700 dark:text-orange-400 leading-none">{habitsData.doneToday}<span className="text-sm text-orange-400">/{habitsData.total}</span></div>
                <div className="text-[9px] font-bold text-orange-400 dark:text-orange-500 uppercase tracking-widest mt-1">Habit Selesai</div>
              </div>
            </div>

            {/* TRACKER SKRIPSI / PROJECT */}
            <div className="mt-3 bg-rose-50/80 dark:bg-rose-500/10 border border-rose-100/50 dark:border-rose-500/20 rounded-xl p-4 shadow-sm transition-transform hover:scale-[1.01]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <Target className="w-4 h-4" /> Progress Skripsi / Project
                </span>
                <span className="text-[11px] font-bold text-white bg-rose-500 px-2 py-0.5 rounded-md">{projectProgress.percentage}%</span>
              </div>
              <div className="w-full h-2.5 bg-rose-200/50 dark:bg-rose-900/50 rounded-full overflow-hidden mb-3 shadow-inner">
                <div className="h-full bg-gradient-to-r from-rose-400 to-rose-600 transition-all duration-1000" style={{ width: `${projectProgress.percentage}%` }}></div>
              </div>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                  {projectProgress.completed} dari {projectProgress.total} Tugas Selesai
                </p>
                <button
                  onClick={() => (typeof onNavigate === 'function' ? onNavigate('zennotes') : null)}
                  className="text-[10px] bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/20 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md">
                  Lanjutkan Menulis ✍️
                </button>
              </div>
            </div>
          </div>

          {/* Weekly Activity Bar Chart */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 p-6 rounded-3xl spatial-shadow flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl shadow-sm"><TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /></div>
              <h3 className="font-bold text-slate-700 dark:text-slate-100 text-sm">Aktivitas 7 Hari Terakhir</h3>
            </div>
            <div className="flex-1 relative w-full min-h-[140px]">
              <div className="absolute inset-0">
                {weeklyBarData.length > 0 && <Bar ref={barChartRef} redraw={false} data={barData} options={barOptions} />}
              </div>
            </div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 text-center mt-2">
              Distribusi produktivitas mingguan
            </div>
            {Object.keys(categorySummary || {}).filter(k => categorySummary[k] > 0).length > 0 && (
              <div className="mt-1 flex flex-wrap justify-center gap-2">
                {Object.entries(categorySummary)
                  .filter(([, count]) => count > 0)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 4)
                  .map(([key, count]) => {
                    const meta = CATEGORY_META[key] || CATEGORY_META.academic;
                    return (
                      <span
                        key={key}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-800 text-[9px] font-bold ${meta.color}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}: {count}
                      </span>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* ===== BENTO GRID: Radar + Heatmap ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

          {/* Radar / Evaluation (The Wellness Check) */}
          <div className="lg:col-span-1 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 p-6 rounded-3xl spatial-shadow flex flex-col items-center relative overflow-hidden h-full">
            <div className="w-full flex items-center gap-2 mb-4 relative z-10">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl shadow-sm"><Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /></div>
              <h3 className="font-bold text-slate-700 dark:text-slate-100 text-sm">Radar Keseimbangan</h3>
            </div>

            {/* Efek glow background saat evaluasi */}
            {evaluationState === 'evaluating' && <div className="absolute inset-0 bg-gradient-to-t from-indigo-50/80 dark:from-indigo-900/40 to-transparent pointer-events-none animate-fade-in" />}

            <div className="w-full flex-1 flex flex-col items-center justify-center z-10">

              {evaluationState === 'idle' && (
                <div className="flex flex-col items-center text-center animate-fade-in-up w-full">
                  <NekoMascotMini className="w-32 h-32 object-contain relative z-10 animate-bounce drop-shadow-sm" />

                  <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm w-full relative z-0 mt-2">
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[10px] border-b-white dark:border-b-slate-800" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1">"Mau tahu sejauh mana keseimbangan hidupmu minggu ini? Yuk ngobrol, Nyaa~!"</p>
                  </div>

                  <button data-html2canvas-ignore="true" onClick={startEvaluation}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-600/30 text-sm cursor-pointer mt-5">
                    Mulai Evaluasi Cepat
                  </button>
                </div>
              )}

              {evaluationState === 'evaluating' && (
                <div className="flex flex-col items-center w-full animate-fade-in-up h-full justify-between pb-2">
                  <div className="flex flex-col items-center w-full">
                    <NekoMascotMini className="w-20 h-20 object-contain relative z-10 animate-bounce drop-shadow-sm" />

                    <div className="bg-white/90 dark:bg-slate-800/90 shadow-sm rounded-2xl p-4 border border-indigo-100 dark:border-indigo-900/50 w-full text-center relative mb-5 z-0 mt-2">
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[10px] border-b-white dark:border-b-slate-800" />
                      <p className="text-sm font-bold text-indigo-900 dark:text-indigo-200 leading-snug mt-1">{evaluationQuestions[currentQuestion].text}</p>
                    </div>
                  </div>

                  <div className="w-full flex flex-col gap-2.5 overflow-y-auto max-h-[180px] custom-scrollbar pr-1">
                    {evaluationQuestions[currentQuestion].type === 'choice' ? (
                      evaluationQuestions[currentQuestion].options.map((opt, idx) => (
                        <button key={idx} onClick={() => handleAnswer(opt.effect)}
                          className="w-full text-left bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 text-xs md:text-sm font-semibold py-3 px-4 rounded-xl transition-colors cursor-pointer shadow-sm">
                          {opt.text}
                        </button>
                      ))
                    ) : (
                      <div className="w-full flex flex-col gap-3">
                        <textarea value={insightText} onChange={(e) => setInsightText(e.target.value)} placeholder="Tulis curhatan/insight di sini..." className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm text-slate-700 dark:text-slate-200 resize-none h-24 outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm" />
                        <button onClick={() => handleAnswer(null)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all text-sm shadow-md cursor-pointer">Simpan & Lihat Hasil</button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1.5 mt-5 shrink-0">{evaluationQuestions.map((_, i) => <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === currentQuestion ? 'bg-indigo-500 scale-125' : i < currentQuestion ? 'bg-indigo-200 dark:bg-indigo-900' : 'bg-slate-200 dark:bg-slate-700'}`} />)}</div>
                </div>
              )}

              {evaluationState === 'result' && (
                <div className="flex flex-col items-center w-full animate-fade-in-up h-full">
                  <div className="w-full flex-1 min-h-[180px] relative flex justify-center">
                    <div className="absolute inset-0 max-w-[240px] mx-auto">
                      <Radar ref={radarChartRef} redraw={false} data={radarData} options={radarOptions} />
                    </div>
                  </div>
                  <div className="mt-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 w-full text-center shadow-sm">
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-400 leading-relaxed">{getRecommendation()}</p>
                  </div>
                  {finalInsight && (
                    <div className="mt-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-4 w-full shadow-sm">
                      <p className="text-[10px] uppercase font-black text-indigo-400 mb-1 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Catatan Refleksimu</p>
                      <p className="text-xs text-slate-700 dark:text-slate-300 italic font-medium">"{finalInsight}"</p>
                    </div>
                  )}
                  <button data-html2canvas-ignore="true" onClick={() => setEvaluationState('idle')} className="mt-4 text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5" /> Evaluasi Ulang
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Heatmap */}
          <div className="lg:col-span-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 p-6 rounded-3xl spatial-shadow relative overflow-hidden flex flex-col h-full">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />

            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl shadow-sm"><LayoutGrid className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-base">Heatmap Aktivitas</h3>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">Konsistensi 48 Hari Terakhir</p>
                </div>
              </div>
              <div className="text-right hidden md:block">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-0.5">Total Aktivitas</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{heatmap.reduce((a, c) => a + c.count, 0)}</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <div className="grid grid-cols-7 md:grid-cols-12 gap-1 md:gap-2 relative z-10 w-full overflow-x-auto custom-scrollbar pb-2 md:max-w-2xl md:mx-auto">
                {heatmap.map((item, i) => (
                  <div key={i} className={`w-full aspect-square rounded-[6px] md:rounded-lg ${getHeatmapColor(item.intensity)} hover:ring-2 hover:ring-indigo-400 hover:scale-110 transition-all cursor-pointer shadow-sm`}
                    title={`${new Date(item.date + 'T00:00:00').toLocaleDateString('id-ID', { dateStyle: 'medium' })}: ${item.count} aktivitas`} />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 relative z-10">
              <div className="flex items-center gap-3 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 px-4 py-2 rounded-xl">
                <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
                <div>
                  <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest leading-none mb-1">Streak Aktif</p>
                  <p className="text-lg font-black text-orange-700 dark:text-orange-500 leading-none">{loginStreak} Hari</p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Sedikit</span>
                <div className="flex gap-1">
                  {['bg-slate-100 dark:bg-slate-700', 'bg-indigo-200 dark:bg-indigo-900', 'bg-indigo-400 dark:bg-indigo-600', 'bg-indigo-600 dark:bg-indigo-400'].map((c, i) => (
                    <div key={i} className={`w-3 h-3 rounded-[3px] ${c}`} />
                  ))}
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Banyak</span>
              </div>
            </div>
          </div>
        </div>

          </>
        )}

        {/* ===== MOTIVATIONAL QUOTE ===== */}
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6 spatial-shadow group hover:scale-[1.01] transition-transform">
          <div className="shrink-0 text-7xl font-black text-indigo-100 dark:text-indigo-900 leading-none select-none group-hover:text-indigo-200 transition-colors">"</div>
          <div className="flex-1">
            <p className="text-slate-700 dark:text-slate-200 font-bold italic text-base md:text-lg leading-relaxed">
              {todayQuote.text}
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-10 h-1 bg-indigo-400 rounded-full" />
              <p className="text-indigo-600 dark:text-indigo-400 font-black text-sm uppercase tracking-wider">
                {todayQuote.author} <span className="text-slate-300 dark:text-slate-600 font-normal ml-1">via Prodify</span>
              </p>
            </div>
          </div>
          <div className="w-full md:w-64 mt-4 md:mt-0">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
              Quote Pribadi
            </p>
            <textarea
              value={customQuote}
              onChange={(e) => {
                const v = e.target.value;
                setCustomQuote(v);
                setJson('prodify_custom_quote', v);
              }}
              placeholder="Tulis kalimat penyemangat versimu sendiri..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-20"
            />
            <label className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useCustomQuote}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setUseCustomQuote(checked);
                  setJson('prodify_use_custom_quote', checked);
                }}
                className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Gunakan sebagai quote utama harian
            </label>
          </div>
        </div>

      </div>

      {/* ===== DAILY CHECK-IN MODAL ===== */}
      {showCheckInModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 max-w-sm w-full shadow-2xl spatial-shadow flex flex-col items-center text-center relative overflow-hidden animate-fade-in-up border border-indigo-50 dark:border-slate-700">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50 dark:bg-indigo-500/10 rounded-full -mr-10 -mt-10 blur-3xl pointer-events-none" />
            <div className="text-7xl mb-6 relative z-10 animate-bounce drop-shadow-xl">📅</div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-3 relative z-10 tracking-tight">Check-in Harian!</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 relative z-10 leading-relaxed">
              Selamat datang kembali, <strong className="text-slate-700 dark:text-slate-200">{userName}</strong>! Klaim kehadiranmu untuk menjaga <strong className="text-orange-500">Streak Aktif</strong> 🔥
            </p>
            <button onClick={handleCheckIn} className="w-full relative z-10 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-6 rounded-2xl transition-all active:scale-95 shadow-[0_10px_25px_-6px_rgba(79,70,229,0.6)] cursor-pointer text-lg flex items-center justify-center gap-2">
              Klaim Kehadiran <Flame className="w-5 h-5 fill-current text-yellow-300" />
            </button>
          </div>
        </div>
        , document.body)}
    </>
  );
};

export default Dashboard;
