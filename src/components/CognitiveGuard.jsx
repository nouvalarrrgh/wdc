import React, { useEffect, useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, X } from 'lucide-react';

// IMPORT STORAGE TINGKAT DEWA UNTUK MENGAMBIL DATA DENGAN AMAN
import { getJson, getLocalDateKey } from '../utils/storage';

const BREATHING_PATTERN = [
    { phase: 'inhale', seconds: 4 },
    { phase: 'hold', seconds: 7 },
    { phase: 'exhale', seconds: 8 },
];
const BREATHING_CYCLE_COUNT = 4;
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const MotionDiv = motion.div;
const MotionH3 = motion.h3;

const CognitiveGuard = ({ manualTriggerSignal = 0 }) => {
    const [triggerGuard, setTriggerGuard] = useState(false);
    const [breathingPhase, setBreathingPhase] = useState('inhale');
    const [timeLeft, setTimeLeft] = useState(0);
    const lastManualSignalRef = useRef(0);

    // =========================================================================
    // FITUR BARU (AUTO-TRIGGER LOGIC): Mendeteksi Overload / Burnout secara Cerdas
    // =========================================================================
    const checkCognitiveOverload = useCallback(() => {
        // 1. Cek apakah pengguna mengaktifkan fitur ini di Settings
        const settings = getJson('prodify_settings', {});
        if (!settings.autoCognitiveGuard) return;

        // 2. Tentukan batas energi koin maksimal berdasarkan status Synergy hari ini
        const synergyState = localStorage.getItem('prodify_balance_state') || 'balanced';
        const MAX_DAILY_ENERGY = synergyState === 'buffed' ? 13 : synergyState === 'debuffed' ? 7 : 10;

        // 3. Hitung total beban energi dari tugas yang dijadwalkan hari ini
        const timeBlocks = getJson('time_blocks', {});
        const todayKey = getLocalDateKey(new Date());
        const todayBlocks = timeBlocks[todayKey] || [];
        const currentDailyEnergy = todayBlocks.reduce((acc, block) => acc + (block.energy || 1), 0);

        // 4. Jika overload (burnout), panggil sistem pernapasan!
        if (currentDailyEnergy > MAX_DAILY_ENERGY) {
            // Mencegah layar pernapasan muncul berulang kali di hari yang sama (anti-spam)
            const lastTriggered = localStorage.getItem('prodify_last_auto_guard');
            if (lastTriggered !== todayKey) {
                setTriggerGuard(true);
                localStorage.setItem('prodify_last_auto_guard', todayKey);
            }
        }
    }, []);

    useEffect(() => {
        // Cek saat aplikasi pertama dimuat
        checkCognitiveOverload();

        // Cek setiap kali pengguna menambah/mengedit jadwal di TimeManager
        window.addEventListener('storage', checkCognitiveOverload);
        window.addEventListener('prodify-sync', checkCognitiveOverload);

        // Pemicu Manual (Shortcut dan Button di Dashboard)
        const handleKeyDown = (e) => {
            // Shortcut darurat: Ctrl + Shift + B (Breath)
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'b') {
                setTriggerGuard(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('storage', checkCognitiveOverload);
            window.removeEventListener('prodify-sync', checkCognitiveOverload);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [checkCognitiveOverload]);

    useEffect(() => {
        // Trigger manual dari parent (Dashboard/App) tanpa event global.
        if (!manualTriggerSignal) return;
        if (manualTriggerSignal !== lastManualSignalRef.current) {
            lastManualSignalRef.current = manualTriggerSignal;
            setTriggerGuard(true);
        }
    }, [manualTriggerSignal]);

    useEffect(() => {
        if (!triggerGuard) return undefined;
        let cancelled = false;

        const runCycle = async () => {
            for (let cycle = 0; cycle < BREATHING_CYCLE_COUNT; cycle++) {
                for (const step of BREATHING_PATTERN) {
                    if (cancelled) return;
                    setBreathingPhase(step.phase);
                    setTimeLeft(step.seconds);
                    await wait(step.seconds * 1000);
                }
            }
            if (cancelled) return;
            setTriggerGuard(false);
        };

        runCycle();
        return () => { cancelled = true; };
    }, [triggerGuard]);

    useEffect(() => {
        if (!triggerGuard) return;
        const t = setInterval(() => setTimeLeft(prev => Math.max(0, prev - 1)), 1000);
        return () => clearInterval(t);
    }, [triggerGuard, breathingPhase]);

    const circleVariants = {
        inhale: { scale: 1.5, opacity: 0.8, backgroundColor: '#3b82f6', transition: { duration: 4 } },
        hold: { scale: 1.5, opacity: 1, backgroundColor: '#8b5cf6', transition: { duration: 7 } },
        exhale: { scale: 1, opacity: 0.4, backgroundColor: '#10b981', transition: { duration: 8 } }
    };

    const phaseText = {
        inhale: "Tarik Napas Pelan...",
        hold: "Tahan Napas...",
        exhale: "Hembuskan Perlahan..."
    };

    if (!triggerGuard) return null;

    return (
        <AnimatePresence>
            <MotionDiv
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-3xl text-white spatial-shadow"
            >
                <button 
                  onClick={() => setTriggerGuard(false)} 
                  className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer text-slate-300 hover:text-white"
                  title="Tutup (Lewati Fase Ini)"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="absolute top-10 flex items-center gap-3 text-teal-300">
                    <Brain className="w-8 h-8" />
                    <h2 className="text-xl font-bold tracking-widest uppercase">Zona Relaksasi Mental</h2>
                </div>

                <p className="text-slate-300 mb-16 text-center max-w-md mt-10 text-lg leading-relaxed">
                    Sistem mendeteksi Anda butuh rehat. Mari istirahatkan saraf optik dan otak Anda dengan Teknik Pernapasan 4-7-8 selama 1 menit.
                </p>

                <div className="relative w-64 h-64 flex items-center justify-center">
                    <MotionDiv variants={circleVariants} animate={triggerGuard ? breathingPhase : "exhale"} className="absolute w-32 h-32 rounded-full blur-xl" />
                    <MotionDiv variants={circleVariants} animate={triggerGuard ? breathingPhase : "exhale"} className="absolute w-32 h-32 rounded-full border-4 border-white border-opacity-20 flex items-center justify-center shadow-inner">
                        <span className="text-4xl font-black drop-shadow-md z-10">{timeLeft}</span>
                    </MotionDiv>
                </div>

                <MotionH3 key={breathingPhase} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-16 text-3xl font-black tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-teal-200 to-emerald-400">
                    {phaseText[breathingPhase]}
                </MotionH3>
            </MotionDiv>
        </AnimatePresence>
    );
};

export default CognitiveGuard;
