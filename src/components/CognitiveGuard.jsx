import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind, ShieldAlert, Heart, Brain } from 'lucide-react';

const CognitiveGuard = () => {
    const [triggerGuard, setTriggerGuard] = useState(false);
    const [breathingPhase, setBreathingPhase] = useState('inhale'); // inhale, hold, exhale
    const [timeLeft, setTimeLeft] = useState(0);

    // Constants
    const OVERLOAD_THRESHOLD_MS = 4 * 60 * 60 * 1000; // 4 Hours
    const SESSION_KEY = 'stuprod_active_session_start';

    useEffect(() => {
        // Initialize session tracker
        let sessionStart = localStorage.getItem(SESSION_KEY);
        if (!sessionStart) {
            sessionStart = Date.now().toString();
            localStorage.setItem(SESSION_KEY, sessionStart);
        }

        const checkOverload = setInterval(() => {
            const now = Date.now();
            const elapsed = now - parseInt(localStorage.getItem(SESSION_KEY), 10);

            if (elapsed > OVERLOAD_THRESHOLD_MS && !triggerGuard) {
                setTriggerGuard(true);
                startBreathingCycle();
            }
        }, 60000); // Check every minute

        // Debug listener: allow manual trigger by pressing Ctrl+Shift+B
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'B') {
                setTriggerGuard(true);
                startBreathingCycle();
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            clearInterval(checkOverload);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [triggerGuard]);

    const startBreathingCycle = () => {
        // 4-7-8 Breathing Loop
        const runCycle = async () => {
            // We will do 4 cycles (around 1 minute)
            for (let i = 0; i < 4; i++) {
                if (!triggerGuard) break; // if somehow dismissed
                setBreathingPhase('inhale');
                setTimeLeft(4);
                await wait(4000);

                setBreathingPhase('hold');
                setTimeLeft(7);
                await wait(7000);

                setBreathingPhase('exhale');
                setTimeLeft(8);
                await wait(8000);
            }

            // End of cycle
            setTriggerGuard(false);
            // Reset session limit
            localStorage.setItem(SESSION_KEY, Date.now().toString());
        };

        runCycle();
    };

    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-3xl text-white spatial-shadow"
            >
                <div className="absolute top-10 flex items-center gap-3 text-rose-300">
                    <Brain className="w-8 h-8" />
                    <h2 className="text-xl font-bold tracking-widest uppercase">Cognitive Overload Detected</h2>
                </div>

                <p className="text-slate-300 mb-16 text-center max-w-md">
                    Sistem mendeteksi Anda telah berlatih fokus secara konstan. Mari istirahatkan saraf optik dan otak Anda dengan Teknik Pernapasan 4-7-8 selama 1 menit.
                </p>

                <div className="relative w-64 h-64 flex items-center justify-center">
                    <motion.div
                        variants={circleVariants}
                        animate={triggerGuard ? breathingPhase : "exhale"}
                        className="absolute w-32 h-32 rounded-full blur-xl"
                    />
                    <motion.div
                        variants={circleVariants}
                        animate={triggerGuard ? breathingPhase : "exhale"}
                        className="absolute w-32 h-32 rounded-full border-4 border-white border-opacity-20 flex items-center justify-center shadow-inner"
                    >
                        <span className="text-4xl font-black drop-shadow-md z-10">{timeLeft}</span>
                    </motion.div>
                </div>

                <motion.h3
                    key={breathingPhase}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mt-16 text-2xl font-black tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-teal-200 to-emerald-400"
                >
                    {phaseText[breathingPhase]}
                </motion.h3>

                <p className="fixed bottom-10 text-xs text-slate-500 font-bold tracking-widest uppercase">
                    Tindakan ini tidak bisa dilewati demi kesehatan Anda.
                </p>
            </motion.div>
        </AnimatePresence>
    );
};

export default CognitiveGuard;
