import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check } from 'lucide-react';
import { NekoMascotMini } from './NekoMascot';
import { getJson, setJson } from '../utils/storage';

export default function NekoGuide() {
  const isDemoMode = typeof window !== 'undefined' && window.sessionStorage.getItem('isDemoMode') === 'true';
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Fungsi untuk mengecek progress dipisah menggunakan useCallback agar stabil
  const checkProgress = useCallback(() => {
    if (isDemoMode) {
      const savedStep = getJson('prodify_demo_guide_step_v1', 1) || 1;
      setStep(Math.min(7, Math.max(1, savedStep)));
      return;
    }

    if (getJson('prodify_guide_finished', null)) {
      setIsVisible(false);
      return;
    }

    // Ambil data real-time menggunakan getJson yang aman (Hardening Level Senior)
    const notes = getJson('zen_pages_multi', []);
    const mTasks = getJson('matrix_tasks', []);
    const dTasks = getJson('prodify_tasks', []);
    const timeBlocks = getJson('time_blocks', {});
    const habits = getJson('prodify_habits_v4', []);
    const profile = getJson('prodify_profileInfo', {});
    const goal = getJson('prodify_global_goal', null);

    let currentStep = 1;

    // Misi 1: Bikin Catatan Pertama (Minimal 5 karakter)
    if (notes.length > 1 || (notes[0] && notes[0].content.length > 5)) {
      currentStep = 2;
    }

    // Misi 2: Bikin Tugas di Task & Activity Manager
    if (currentStep === 2 && (mTasks.length > 0 || dTasks.length > 0)) {
      currentStep = 3;
    }

    // Misi 3: Jadwalkan Tugas ke Kalender
    if (currentStep === 3 && Object.keys(timeBlocks).length > 0) {
      currentStep = 4;
    }

    // Misi 4: Bikin Habit
    if (currentStep === 4 && habits.length > 0) {
      currentStep = 5;
    }

    // Misi 5: Update Profile / Set Global Goal
    if (currentStep === 5 && (Object.keys(profile).length > 0 || goal)) {
      currentStep = 6;
    }

    // Pastikan step tidak mundur (hanya maju)
    setStep(prev => (currentStep > prev ? currentStep : prev));
  }, [isDemoMode]);

  useEffect(() => {
    // Cek jika user sudah menyelesaikan onboarding sebelumnya
    const isFinished = !isDemoMode && getJson('prodify_guide_finished', null);
    if (isFinished) return;

    // Tunda kemunculan 1.5 detik agar animasi aplikasi selesai dulu
    const initTimer = setTimeout(() => {
      setIsVisible(true);
      if (isDemoMode) {
        setJson('prodify_demo_guide_step_v1', 1);
        setStep(1);
      } else {
        checkProgress(); // Cek progress pertama kali saat Neko muncul
      }
    }, 1500);

    // MENGHAPUS BOM WAKTU PERFORMA: setInterval diganti dengan Event Listener!
    window.addEventListener('storage', checkProgress);
    window.addEventListener('prodify-sync', checkProgress);

    return () => {
      clearTimeout(initTimer);
      window.removeEventListener('storage', checkProgress);
      window.removeEventListener('prodify-sync', checkProgress);
    };
  }, [checkProgress, isDemoMode]);

  const nextDemoStep = () => {
    if (!isDemoMode) return;
    setStep((prev) => {
      const next = Math.min(7, (prev || 1) + 1);
      setJson('prodify_demo_guide_step_v1', next);
      return next;
    });
  };

  const completeGuide = () => {
    setStep(7); // Masuk ke state selebrasi (Purr-fect!)
    setTimeout(() => {
      setJson('prodify_guide_finished', 'true');
      setIsVisible(false);
    }, 5000); // Hilang sendiri setelah 5 detik
  };

  const skipGuide = () => {
    setIsVisible(false);
    setJson('prodify_guide_finished', 'true');
  };

  const getGuideContent = () => {
    switch (step) {
      case 1: return "Nyaa~! Aku Neko, asistenmu. Yuk mulai! Pergi ke menu Smart Notes dan buat 1 catatan pertamamu.";
      case 2: return "Catatan tersimpan! Sekarang kelola tugasmu. Buka Task & Activity Manager dan buat tugas pertamamu di kolom Matriks.";
      case 3: return "Tugas berhasil dibuat! Agar tidak lupa, jadwalkan tugas tersebut ke Kalender Mingguan dengan menekan baris waktu yang kosong.";
      case 4: return "Tugas terjadwal! Mahasiswa hebat butuh rutinitas. Buka Habit Tracker dan buat satu rutinitas positif harianmu.";
      case 5: return "Hebat! Mari lengkapi identitasmu. Buka menu Profil Mahasiswa dan atur foto profil atau tulis 'Target Utama' kamu semester ini.";
      case 6: return "Satu hal lagi! Buka Pengaturan, coba aktifkan Dark Mode, dan ingat tempat Backup Data. Jika paham, klik tombol di bawah!";
      case 7: return "Purr-fect! Selamat! Kamu sudah menguasai Prodify. Buka menu Intelligence Hub (Dashboard) untuk melihat wujud datamu!";
      default: return "Selamat datang!";
    }
  };

  return (
    <AnimatePresence>
      {isVisible && step > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end pointer-events-none"
        >
          {/* Bubble Chat */}
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            className="bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-500/30 shadow-2xl rounded-3xl p-5 mb-4 max-w-[300px] relative pointer-events-auto"
          >
            <button onClick={skipGuide} className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 cursor-pointer tooltip" title="Lewati Panduan">
              <X className="w-4 h-4" />
            </button>

            <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Langkah {step > 6 ? 6 : step} dari 6
            </h4>

            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed pr-4">
              {getGuideContent()}
            </p>

            {isDemoMode && step < 6 && (
              <button
                onClick={nextDemoStep}
                className="mt-4 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Check className="w-4 h-4" /> Lanjut
              </button>
            )}

            {isDemoMode && step === 6 && (
              <button
                onClick={completeGuide}
                className="mt-4 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Check className="w-4 h-4" /> Selesai Demo
              </button>
            )}

            {!isDemoMode && step === 6 && (
              <button onClick={completeGuide} className="mt-4 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-95">
                <Check className="w-4 h-4" /> Saya Mengerti
              </button>
            )}

            {step < 7 && (
              <div className="flex gap-1.5 mt-4">
                {[1, 2, 3, 4, 5, 6].map(s => (
                  <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s < step ? 'bg-emerald-500' : s === step ? 'bg-indigo-500 animate-pulse' : 'bg-slate-200 dark:bg-slate-700'}`} />
                ))}
              </div>
            )}

            {/* Segitiga panah chat */}
            <div className="absolute -bottom-3 right-10 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[14px] border-t-white dark:border-t-slate-800 drop-shadow-md" />
          </motion.div>

          {/* Neko Mascot (Ukurannya Dibesarkan dan Dimirror) */}
          <div className="mr-4 pointer-events-auto cursor-pointer hover:scale-105 transition-transform">
            {/* WRAPPER ANIMASI: Menangani naik-turun (float/bounce) */}
            <div className={step === 7 ? 'animate-bounce' : 'animate-float'}>
              {/* WRAPPER MIRROR: Menangani rotasi menghadap kiri */}
              <div className="transform -scale-x-100">
                <NekoMascotMini className="w-32 h-32 drop-shadow-2xl" />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
