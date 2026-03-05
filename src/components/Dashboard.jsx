import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { Activity, LayoutGrid, Sparkles, TrendingUp, FileText } from 'lucide-react';
import { generateExecutiveReport } from '../utils/ReportGenerator';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

// ========= SVG Decorations =========
const SparkleIcon = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" />
  </svg>
);

const RocketIllustration = () => (
  <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Stars */}
    <circle cx="20" cy="20" r="2" fill="white" opacity="0.6" />
    <circle cx="160" cy="15" r="1.5" fill="white" opacity="0.5" />
    <circle cx="180" cy="40" r="2" fill="white" opacity="0.7" />
    <circle cx="40" cy="50" r="1" fill="white" opacity="0.4" />
    <circle cx="140" cy="60" r="1.5" fill="white" opacity="0.5" />
    {/* Rocket body */}
    <ellipse cx="100" cy="70" rx="24" ry="48" fill="white" opacity="0.95" />
    <ellipse cx="100" cy="50" rx="18" ry="32" fill="#EEF2FF" />
    {/* Rocket window */}
    <circle cx="100" cy="60" r="12" fill="white" stroke="#4F46E5" strokeWidth="3" />
    <circle cx="100" cy="60" r="7" fill="#4F46E5" />
    <circle cx="97" cy="57" r="2.5" fill="white" opacity="0.5" />
    {/* Rocket tip */}
    <path d="M100 22 Q90 35 100 40 Q110 35 100 22Z" fill="#4F46E5" />
    {/* Side fins */}
    <path d="M76 100 Q64 115 68 118 Q76 110 80 105Z" fill="#818CF8" />
    <path d="M124 100 Q136 115 132 118 Q124 110 120 105Z" fill="#818CF8" />
    {/* Exhaust flame */}
    <ellipse cx="100" cy="122" rx="14" ry="8" fill="#F59E0B" opacity="0.9" />
    <ellipse cx="100" cy="128" rx="10" ry="12" fill="#EF4444" opacity="0.7" />
    <ellipse cx="100" cy="134" rx="6" ry="10" fill="#FCD34D" opacity="0.6" />
    {/* Sparkles */}
    <path d="M55 30 L56.5 35 L61.5 36.5 L56.5 38 L55 43 L53.5 38 L48.5 36.5 L53.5 35 Z" fill="#FCD34D" opacity="0.8" />
    <path d="M155 75 L156 79 L160 80 L156 81 L155 85 L154 81 L150 80 L154 79 Z" fill="#A78BFA" opacity="0.7" />
  </svg>
);

const Dashboard = () => {
  // Sync States
  const [loginStreak, setLoginStreak] = useState(0);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [completedTaskCount, setCompletedTaskCount] = useState(0);
  const [energyCoins, setEnergyCoins] = useState(10);

  // Evaluation Mascot States
  const [evaluationState, setEvaluationState] = useState('idle');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState(() => {
    const saved = localStorage.getItem('stuprod_radar_scores');
    return saved ? JSON.parse(saved) : {
      akademik: 50, organisasi: 50, istirahat: 50, sosial: 50, tugas: 50
    };
  });
  const [insightText, setInsightText] = useState("");
  const [finalInsight, setFinalInsight] = useState("");

  const evaluationQuestions = [
    {
      type: "choice",
      text: "Meow! 🐾 Gimana kualitas dan kuantitas tidurmu seminggu ini? Jujur ya sama si meng!",
      options: [
        { text: "Nyenyak 7-8 jam, bangun seger pol! 🌅", effect: { istirahat: 30, akademik: 10 } },
        { text: "Durasi cukup, tapi sering kebangun/kurang nyenyak 🥱", effect: { istirahat: 0 } },
        { text: "Tidur berantakan, sering begadang ngerjain tugas 🦉", effect: { istirahat: -25, tugas: 15 } },
        { text: "Begadang buat scroll sosmed/main game 🎮", effect: { istirahat: -30, sosial: 10 } }
      ]
    },
    {
      type: "choice",
      text: "Terus, gimana fokus studimu di kelas atau pas belajar mandiri belakangan ini?",
      options: [
        { text: "Sangat fokus, paham materi & catetan rapi! 🤓", effect: { akademik: 30, tugas: 10 } },
        { text: "Biasa aja, kadang paham kadang ngelamun 😅", effect: { akademik: 0 } },
        { text: "Keteteran parah, banyak materi yang skip 🤯", effect: { akademik: -25 } }
      ]
    },
    {
      type: "choice",
      text: "Masalah tumpukan tugas, gimana strategimu nyelesaiinnya minggu ini?",
      options: [
        { text: "Udah dicicil & kelar semua sebelum deadline 😎", effect: { tugas: 30, istirahat: 10 } },
        { text: "Lagi proses ngerjain sih, lumayan on track 🏃", effect: { tugas: 10 } },
        { text: "SKS! Kebut semalam bikin deg-degan parah 😱", effect: { tugas: -20, istirahat: -15, akademik: -10 } },
        { text: "Ada yang kelewat/telat kumpul 😭", effect: { tugas: -35 } }
      ]
    },
    {
      type: "choice",
      text: "Purrr... Buat yang ikut BEM/Kepanitiaan/UKM, seberapa sibuk kamu minggu ini?",
      options: [
        { text: "Super sibuk, rapat mulu tapi seru! 🔥", effect: { organisasi: 30, istirahat: -15 } },
        { text: "Ada event sih, tapi masih gampang diatur ⚖️", effect: { organisasi: 15 } },
        { text: "Lagi santai nggak banyak proker 🏖️", effect: { organisasi: -5 } },
        { text: "Nggak ikut begituan, fokus kuliah aja 📚", effect: { organisasi: 0, akademik: 10 } }
      ]
    },
    {
      type: "choice",
      text: "Healing atau sosialisasi sama temen-temen gimana nih? Udah sempet main?",
      options: [
        { text: "Sering banget main/nongkrong! 🎉", effect: { sosial: 30, tugas: -10 } },
        { text: "Ada me-time dan main bentar pas weekend ☕", effect: { sosial: 15, istirahat: 10 } },
        { text: "Sama sekali nggak sempet, nolep abis 😿", effect: { sosial: -25, istirahat: -10 } }
      ]
    },
    {
      type: "choice",
      text: "Secara mental, seberapa berat kamu ngerasa ngejalanin kehidupan seminggu terakhir ini?",
      options: [
        { text: "Aman kok, I'm feeling good and productive! ✨", effect: { istirahat: 10, akademik: 10, tugas: 10 } },
        { text: "Agak capek, tapi masih bisa di-handle 💪", effect: { istirahat: -5 } },
        { text: "Stress banget, rasanya pengen hilang aja 🌧️", effect: { istirahat: -30, sosial: -15, akademik: -20 } }
      ]
    },
    {
      type: "essay",
      text: "Biar aku makin ngerti... Boleh tulis insight, curhatan, atau evaluasi singkatmu tentang minggu ini? (Opsional juga gapapa😺)",
    }
  ];

  const handleAnswer = (effect) => {
    if (effect) {
      setScores(prev => {
        const newScores = { ...prev };
        for (const key in effect) {
          newScores[key] = Math.max(0, Math.min(100, newScores[key] + effect[key]));
        }
        localStorage.setItem('stuprod_radar_scores', JSON.stringify(newScores));
        // Trigger event custom to alert App.jsx
        window.dispatchEvent(new Event('radarScoreUpdated'));
        return newScores;
      });
    }

    if (currentQuestion < evaluationQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setFinalInsight(insightText);
      setEvaluationState('result');
    }
  };

  const startEvaluation = () => {
    setEvaluationState('evaluating');
    setCurrentQuestion(0);
    const initialScores = { akademik: 50, organisasi: 50, istirahat: 50, sosial: 50, tugas: 50 };
    setScores(initialScores);
    localStorage.setItem('stuprod_radar_scores', JSON.stringify(initialScores));
    window.dispatchEvent(new Event('radarScoreUpdated'));
    setInsightText("");
    setFinalInsight("");
  };

  const getRecommendation = () => {
    const minCategory = Object.keys(scores).reduce((a, b) => scores[a] < scores[b] ? a : b);
    switch (minCategory) {
      case 'istirahat': return "⚠️ Waktu istirahatmu kurang. Sempatkan tidur lebih awal ya, purr! 😴";
      case 'akademik': return "⚠️ Fokus belajarmu menurun. Coba review materi catetan besok! 📚";
      case 'sosial': return "⚠️ Kamu terlalu sibuk! Sempetin ngerjain hobi atau main sama temen bentar. 🎮";
      case 'organisasi': return "⚠️ Soft skill lewat organisasi juga penting lho. Coba sapa temen-temen BEM-mu! 🤝";
      case 'tugas': return "⚠️ Awas numpuk! Cicil tugasmu pakai Pomodoro timer sekarang. ⏰";
      default: return "✨ Keseimbanganmu cukup baik minggu ini! Miau! 😺";
    }
  };

  const [heatmap, setHeatmap] = useState(() => {
    const saved = localStorage.getItem('dashboard_heatmap');
    return saved ? JSON.parse(saved) : Array.from({ length: 48 }, (_, i) => ({
      id: i,
      active: i % 7 === 0 || i % 3 === 0 || i % 5 === 0,
      intensity: i % 7 === 0 ? 3 : i % 3 === 0 ? 1 : i % 5 === 0 ? 2 : 0
    }));
  });

  const [greeting, setGreeting] = useState('');
  const [hour, setHour] = useState(new Date().getHours());

  // Data Synchronization Effects
  useEffect(() => {
    // 1. Tugas Selesai Sync
    const savedTasks = JSON.parse(localStorage.getItem('stuprod_tasks') || '[]');
    const completedCount = savedTasks.filter(t => t.completed).length;
    setCompletedTaskCount(completedCount);

    // 2. Koin Energi Sync
    const synergy = localStorage.getItem('stuprod_balance_state') || 'balanced';
    if (synergy === 'buffed') setEnergyCoins(13);
    else if (synergy === 'debuffed') setEnergyCoins(7);
    else setEnergyCoins(10);

    // 3. Streak Login Checking
    const today = new Date().toISOString().split('T')[0];
    const streakData = JSON.parse(localStorage.getItem('stuprod_login_streak') || '{"lastLogin": "", "streak": 0}');

    setLoginStreak(streakData.streak);

    if (streakData.lastLogin !== today) {
      setShowCheckInModal(true);
    }
  }, []);

  const handleCheckIn = () => {
    const today = new Date().toISOString().split('T')[0];
    const streakData = JSON.parse(localStorage.getItem('stuprod_login_streak') || '{"lastLogin": "", "streak": 0}');

    let newStreak = streakData.streak;

    if (streakData.lastLogin) {
      const lastDate = new Date(streakData.lastLogin);
      const todayDate = new Date(today);
      const diffTime = Math.abs(todayDate - lastDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreak += 1; // Consecutive day
      } else if (diffDays > 1) {
        newStreak = 1; // Streak broken
      }
      // If diffDays === 0, it means it was already checked in today somehow, no change needed.
    } else {
      newStreak = 1; // First time ever
    }

    setLoginStreak(newStreak);
    localStorage.setItem('stuprod_login_streak', JSON.stringify({
      lastLogin: today,
      streak: newStreak
    }));
    setShowCheckInModal(false);
  };

  useEffect(() => {
    localStorage.setItem('dashboard_heatmap', JSON.stringify(heatmap));
  }, [heatmap]);

  useEffect(() => {
    const h = new Date().getHours();
    setHour(h);
    if (h < 12) setGreeting('Selamat Pagi');
    else if (h < 15) setGreeting('Selamat Siang');
    else if (h < 19) setGreeting('Selamat Sore');
    else setGreeting('Selamat Malam');
  }, []);

  const toggleHeatmap = (idx) => {
    setHeatmap(prev => prev.map((item, i) => {
      if (i === idx) {
        let newIntensity = (item.intensity + 1) % 4;
        return { ...item, active: newIntensity > 0, intensity: newIntensity };
      }
      return item;
    }));
  };

  const getHeatmapColor = (intensity) => {
    switch (intensity) {
      case 3: return 'bg-emerald-600';
      case 2: return 'bg-emerald-400';
      case 1: return 'bg-emerald-300';
      default: return 'bg-slate-100';
    }
  };

  const radarData = {
    labels: ['Belajar Akademik', 'Organisasi BEM', 'Istirahat/Tidur', 'Sosial/Hobi', 'Mengerjakan Tugas'],
    datasets: [{
      label: 'Keseimbangan Minggu Ini',
      data: [scores.akademik, scores.organisasi, scores.istirahat, scores.sosial, scores.tugas],
      backgroundColor: 'rgba(79, 70, 229, 0.2)',
      borderColor: 'rgba(79, 70, 229, 1)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(79, 70, 229, 1)',
      pointRadius: 4,
    }],
  };

  const radarOptions = {
    scales: { r: { suggestedMin: 0, suggestedMax: 100, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { display: false } } },
    plugins: { legend: { display: false } }
  };

  const savedUser = JSON.parse(localStorage.getItem('stuprod_user') || '{}');
  const userName = savedUser?.name || 'Mahasiswa';

  return (
    <div id="dashboard-report-content" className="space-y-6 pb-32">

      {/* =============== WELCOME BANNER =============== */}
      <div className="relative overflow-hidden animated-gradient-bg rounded-3xl p-6 md:p-8 text-white spatial-shadow">
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            {/* Greeting chip */}
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 mb-3 w-fit">
              <span className="text-lg">{hour < 12 ? '🌤' : hour < 19 ? '☀️' : '🌙'}</span>
              <span className="text-xs font-bold text-white/90 uppercase tracking-widest">{greeting}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
              Halo, <span className="text-yellow-300">{userName.charAt(0).toUpperCase() + userName.slice(1)}</span>! 👋
            </h1>
            <p className="text-indigo-200 mt-2 text-sm font-medium max-w-md leading-relaxed">
              Evaluasi keseimbangan hidupmu dan terus bangun produktivitas harianmu bersama <strong>StuProd</strong>.
            </p>
            {/* Quick stats row */}
            <div className="flex gap-4 mt-5 flex-wrap">
              {[
                { icon: '🔥', label: 'Streak Aktif', value: `${loginStreak} Hari` },
                { icon: '✅', label: 'Tugas Selesai', value: `${completedTaskCount}` },
                { icon: '⚡', label: 'Koin Energi', value: `${energyCoins}` },
              ].map(stat => (
                <div key={stat.label} className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-2.5 text-center spatial-hover transition-all cursor-default relative overflow-hidden group">
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-lg">{stat.icon}</div>
                  <div className="text-lg font-black text-white leading-tight">{stat.value}</div>
                  <div className="text-[10px] text-indigo-200 font-bold uppercase tracking-wide">{stat.label}</div>
                </div>
              ))}

              <button
                onClick={generateExecutiveReport}
                className="bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/50 rounded-2xl px-4 py-2.5 text-center spatial-hover transition-all shadow-lg flex items-center justify-center gap-2 group"
              >
                <FileText className="w-5 h-5 text-indigo-200 group-hover:text-white transition-colors" />
                <div className="text-left leading-tight">
                  <div className="text-sm font-black whitespace-nowrap">Export PDF</div>
                  <div className="text-[10px] text-indigo-200 font-bold uppercase tracking-wide">Weekly Report</div>
                </div>
              </button>
            </div>
          </div>

          {/* Rocket illustration */}
          <div className="hidden md:flex w-40 h-36 shrink-0 animate-float">
            <RocketIllustration />
          </div>
        </div>
      </div>

      {/* =============== BENTO GRID =============== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Radar Chart / Evaluation Mascot */}
        <div className="lg:col-span-1 liquid-glass p-6 rounded-3xl border border-white/40 spatial-shadow flex flex-col items-center relative overflow-hidden spatial-hover transition-all min-h-[350px] justify-center">
          {/* Decorative sparkle */}
          <SparkleIcon className="absolute top-4 right-4 w-5 h-5 text-indigo-200 animate-spin-slow" />
          <h3 className="w-full font-bold text-slate-700 flex items-center gap-2 mb-4 absolute top-6 left-6">
            <Activity className="w-5 h-5 text-indigo-500" /> Radar Keseimbangan
          </h3>

          <div className="w-full h-full flex flex-col items-center justify-center mt-8 z-10 w-full">
            {evaluationState === 'idle' && (
              <div className="flex flex-col items-center text-center animate-fade-in-up w-full">
                <div className="text-6xl mb-4 animate-bounce">😸</div>
                <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-indigo-100 shadow-sm relative mb-6 w-full">
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/60 border-r border-b border-indigo-100 rotate-45" />
                  <p className="text-sm font-semibold text-slate-700">Meow! Mau tahu sejauh mana keseimbangan hidupmu minggu ini? Yuk ngobrol bentar!</p>
                </div>
                <button
                  onClick={startEvaluation}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-600/30">
                  Mulai Evaluasi
                </button>
              </div>
            )}

            {evaluationState === 'evaluating' && (
              <div className="flex flex-col items-center w-full animate-fade-in-up">
                <div className="text-4xl mb-3">🐱</div>
                <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-indigo-100 shadow-sm relative mb-5 w-full text-center max-h-[100px] overflow-y-auto">
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/60 border-r border-b border-indigo-100 rotate-45" />
                  <p className="text-sm font-semibold text-slate-700 leading-snug">{evaluationQuestions[currentQuestion].text}</p>
                </div>

                <div className="w-full flex flex-col gap-2 relative z-20">
                  {evaluationQuestions[currentQuestion].type === 'choice' ? (
                    evaluationQuestions[currentQuestion].options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAnswer(option.effect)}
                        className="w-full text-left bg-white/50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 text-[11px] font-semibold py-2.5 px-3 rounded-xl transition-colors">
                        {option.text}
                      </button>
                    ))
                  ) : (
                    <div className="w-full flex flex-col gap-3">
                      <textarea
                        value={insightText}
                        onChange={(e) => setInsightText(e.target.value)}
                        placeholder="Tulis curhatan/insight minggu ini di sini..."
                        className="w-full bg-white/50 border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 rounded-xl p-3 text-sm text-slate-700 resize-none h-24 outline-none transition-all placeholder:text-slate-400 custom-scrollbar"
                      />
                      <button
                        onClick={() => handleAnswer(null)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-indigo-600/30">
                        Selesai & Lihat Hasil
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex gap-1 items-center justify-center flex-wrap max-w-[150px]">
                  {evaluationQuestions.map((_, idx) => (
                    <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentQuestion ? 'bg-indigo-500 scale-125' : idx < currentQuestion ? 'bg-indigo-200' : 'bg-slate-200'}`} />
                  ))}
                </div>
              </div>
            )}

            {evaluationState === 'result' && (
              <div className="flex flex-col items-center w-full animate-fade-in-up">
                <div className="w-full max-w-[200px] aspect-square">
                  <Radar data={radarData} options={radarOptions} />
                </div>
                <div className="mt-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5 w-full text-center">
                  <p className="text-[11px] font-semibold text-amber-700 flex items-center justify-center gap-1.5 leading-relaxed">
                    {getRecommendation()}
                  </p>
                </div>
                {finalInsight && (
                  <div className="mt-3 bg-indigo-50/80 border border-indigo-100 rounded-2xl px-3 py-2.5 w-full text-left">
                    <p className="text-[9px] uppercase font-bold text-indigo-400 mb-0.5">📝 Catatan Mingguanmu:</p>
                    <p className="text-[11px] font-medium text-slate-600 italic leading-snug">"{finalInsight}"</p>
                  </div>
                )}
                <button
                  onClick={() => setEvaluationState('idle')}
                  className="mt-4 text-xs font-bold text-indigo-500 hover:text-indigo-700 transition-colors">
                  Evaluasi Ulang
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Weekly Heatmap */}
        <div className="lg:col-span-2 liquid-glass p-6 rounded-3xl border border-white/40 spatial-shadow relative overflow-hidden spatial-hover transition-all">
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-6 relative z-10">
            <LayoutGrid className="w-5 h-5 text-emerald-500" /> Weekly Heatmap
            <span className="ml-auto text-xs text-slate-400 font-medium">Klik kotak untuk ubah aktivitas</span>
          </h3>
          <div className="grid grid-cols-12 gap-1.5 relative z-10">
            {heatmap.map((item, i) => (
              <div key={i} onClick={() => toggleHeatmap(i)}
                className={`w-full aspect-square rounded-md ${getHeatmapColor(item.intensity)} hover:ring-2 hover:ring-indigo-400 cursor-pointer transition-all hover:scale-110`}
                title="Klik untuk mengubah aktivitas harian" />
            ))}
          </div>
          <div className="flex justify-between items-center mt-6 relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <div>
                <p className="text-sm font-bold text-slate-700 leading-tight">Streak Aktif</p>
                <p className="text-lg font-black text-orange-500 leading-tight">
                  {heatmap.filter(h => h.active).length > 20 ? '12 Hari' : '3 Hari'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 font-medium">Total bulan ini</p>
              <p className="text-2xl font-black text-slate-800">{heatmap.filter(h => h.active).length} <span className="text-sm font-medium text-slate-400">tugas</span></p>
            </div>
          </div>

          {/* Heatmap legend */}
          <div className="flex items-center gap-2 mt-4 relative z-10">
            <span className="text-xs text-slate-400 font-medium">Kurang</span>
            {['bg-slate-100', 'bg-emerald-300', 'bg-emerald-400', 'bg-emerald-600'].map((c, i) => (
              <div key={i} className={`w-3.5 h-3.5 rounded-sm ${c}`} />
            ))}
            <span className="text-xs text-slate-400 font-medium">Lebih</span>
          </div>
        </div>
      </div>

      {/* =============== MOTIVATIONAL QUOTE SECTION =============== */}
      <div className="animated-gradient-border liquid-glass rounded-3xl p-6 flex items-center gap-5 spatial-shadow">
        {/* Large quote SVG */}
        <div className="shrink-0 text-7xl font-black text-indigo-100 leading-none select-none">"</div>
        <div>
          <p className="text-slate-700 font-semibold italic text-lg leading-relaxed">
            Disiplin adalah jembatan antara tujuan dan pencapaian. Setiap kebiasaan kecil yang kamu bangun hari ini adalah investasi terbesar untuk masa depanmu.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-8 h-0.5 bg-indigo-400 rounded-full" />
            <p className="text-indigo-500 font-bold text-sm">Jim Rohn — via StuProd</p>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
        </div>
      </div>

      {/* =============== DAILY CHECK-IN MODAL =============== */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl spatial-shadow flex flex-col items-center text-center relative overflow-hidden animate-fade-in-up">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <div className="text-6xl mb-4 relative z-10 animate-bounce">📅</div>
            <h2 className="text-2xl font-black text-slate-800 mb-2 relative z-10">Check-in Harian!</h2>
            <p className="text-slate-500 text-sm mb-6 relative z-10">
              Selamat datang kembali, {userName}! Jangan lupa klaim kehadiranmu hari ini untuk menjaga <strong>Streak Aktif</strong>.
            </p>
            <button
              onClick={handleCheckIn}
              className="w-full relative z-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all active:scale-95 shadow-[0_8px_20px_-6px_rgba(79,70,229,0.5)]">
              Klaim Kehadiran 🔥
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;