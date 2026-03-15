import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, BookOpen, Brain, CalendarDays, Focus, 
  Flame, Zap, Target, Lightbulb, Clock, GraduationCap, 
  Coffee, Trophy, Rocket, Award, CheckCircle, Compass, 
  Star, Monitor, PenTool, Globe 
} from 'lucide-react';

export default function HeroSection({ onStart, onDemo }) {
  const heroRef = useRef(null);
  const elementRefs = useRef([]);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Scroll listener — tracks how far hero has been scrolled past
  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const heroHeight = rect.height;
      // progress: 0 = hero at top, 1 = hero fully scrolled past viewport
      const progress = Math.min(Math.max(-rect.top / (heroHeight * 0.6), 0), 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // DATA ELEMEN 3D — each with scatterX/scatterY for individual scatter direction
  // scatterX/scatterY = how many vw/vh the element moves when fully scrolled (positive = right/down)
  const floatingElements = [
    // === FOREGROUND ===
    { icon: BookOpen, color: "text-blue-500", pos: "top-[10%] left-[2%] md:left-[6%]", size: "w-16 h-16 md:w-20 md:h-20", delay: 0, animation: "animate-float-3d", depth: "opacity-100 z-10 blur-0", scatterX: -40, scatterY: -30 },
    { icon: Brain, color: "text-purple-500", pos: "top-[10%] right-[2%] md:right-[6%]", size: "w-20 h-20 md:w-24 md:h-24", delay: 0.2, animation: "animate-float-3d-reverse", depth: "opacity-100 z-10 blur-0", scatterX: 40, scatterY: -35 },
    { icon: Rocket, color: "text-indigo-500", pos: "top-[31%] left-[-2%] md:left-[2%]", size: "w-14 h-14 md:w-20 md:h-20", delay: 0.3, animation: "animate-float-3d", depth: "opacity-90 z-10 blur-[0.5px]", scatterX: -50, scatterY: 10 },
    { icon: Award, color: "text-amber-400", pos: "top-[31%] right-[-2%] md:right-[18%]", size: "w-12 h-12 md:w-16 md:h-16", delay: 0.7, animation: "animate-float-3d-reverse", depth: "opacity-90 z-10 blur-[0.5px]", scatterX: 50, scatterY: 15 },

    // === MIDGROUND ===
    { icon: Target, color: "text-red-500", pos: "top-[30%] right-[15%] md:right-[2%]", size: "w-10 h-10 md:w-14 md:h-14", delay: 0.8, animation: "animate-float-3d", depth: "opacity-75 z-0 blur-[1px]", scatterX: 35, scatterY: -20 },
    { icon: Focus, color: "text-rose-500", pos: "top-[28%] left-[15%] md:left-[18%]", size: "w-10 h-10 md:w-12 md:h-12", delay: 1.0, animation: "animate-float-3d-reverse", depth: "opacity-75 z-0 blur-[1px]", scatterX: -30, scatterY: -15 },
    { icon: GraduationCap, color: "text-indigo-400", pos: "top-[6%] left-[25%] md:left-[28%]", size: "w-10 h-10 md:w-14 md:h-14", delay: 1.2, animation: "animate-float-3d", depth: "opacity-60 z-0 blur-[1.5px]", scatterX: -20, scatterY: -45 },
    { icon: Lightbulb, color: "text-yellow-500", pos: "top-[4%] right-[25%] md:right-[28%]", size: "w-10 h-10 md:w-14 md:h-14", delay: 1.4, animation: "animate-float-3d-reverse", depth: "opacity-60 z-0 blur-[1.5px]", scatterX: 20, scatterY: -45 },
    { icon: CheckCircle, color: "text-emerald-400", pos: "top-[22%] left-[15%] md:left-[10%]", size: "w-8 h-8 md:w-12 md:h-12", delay: 1.1, animation: "animate-float-3d", depth: "opacity-65 z-0 blur-[1px]", scatterX: -45, scatterY: -10 },
    { icon: Compass, color: "text-blue-400", pos: "top-[22%] right-[16%] md:right-[15%]", size: "w-10 h-10 md:w-12 md:h-12", delay: 1.3, animation: "animate-float-3d-reverse", depth: "opacity-65 z-0 blur-[1px]", scatterX: 30, scatterY: 10 },
  ];

  return (
    <section ref={heroRef} className="relative pt-28 pb-20 overflow-hidden min-h-[95vh] flex flex-col items-center justify-center">
      {/* Background Blurs (Cahaya Latar) */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none -z-20" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none -z-20" />

      {/* 3D Floating Elements — each scatters individually on scroll (find-it.id style) */}
      <div className="absolute inset-0 pointer-events-none overflow-visible">
        {floatingElements.map((el, idx) => {
          // Calculate scatter transform based on scroll progress
          const translateX = scrollProgress * el.scatterX;
          const translateY = scrollProgress * el.scatterY;
          const scale = 1 - scrollProgress * 0.6; // scale from 1 → 0.4
          const opacity = 1 - scrollProgress; // fade from 1 → 0

          return (
            // Outer div: handles scroll-driven scatter (translate + scale + fade)
            <div
              key={idx}
              className={`absolute ${el.pos} hidden sm:flex items-center justify-center ${el.depth} transition-all duration-700 ease-in-out`}
              style={{
                transform: `translate(${translateX}vw, ${translateY}vh) scale(${Math.max(scale, 0)})`,
                opacity: Math.max(opacity, 0),
                willChange: "transform, opacity",
                backfaceVisibility: "hidden",
              }}
            >
              {/* Inner motion.div: entrance spring animation + glass card */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, delay: el.delay, type: "spring", bounce: 0.4 }}
                className={`${el.animation} flex items-center justify-center rounded-[2rem] glass-3d ${el.size}`}
                style={{ perspective: "1000px" }}
              >
                <el.icon className={`w-1/2 h-1/2 ${el.color} drop-shadow-xl`} strokeWidth={2} />
              </motion.div>
            </div>
          );
        })}
      </div>

      <div className="container mx-auto px-6 text-center relative z-20 max-w-5xl mt-8">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs md:text-sm font-bold mb-8 shadow-sm">
            <Zap className="w-4 h-4 text-amber-500" />
            Prodify: Transformasi Produktivitas Mahasiswa
          </span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
          className="text-[11px] md:text-xs font-black tracking-[0.18em] uppercase text-indigo-600/80 dark:text-indigo-300/80 mb-3"
        >
          Empowering Students Through Innovative Productivity Tools
        </motion.p>

        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-black leading-[1.1] mb-6 tracking-tight drop-shadow-sm">
          Amplify Your Work <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
            Automate Your Success.
          </span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-slate-700 dark:text-slate-300 max-w-2xl mx-auto mb-12 font-medium leading-relaxed drop-shadow-sm">
          Jangan biarkan potensimu terkunci oleh manajemen waktu yang buruk. Gunakan ekosistem cerdas Prodify untuk mendominasi tugas kuliah dan kehidupan kampusmu tanpa membuatmu merasa <span className="italic text-rose-500 dark:text-rose-400 font-bold">burnout</span>.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-20 relative z-30">
          <button onClick={onStart} className="px-8 py-4 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-[0_10px_40px_-10px_rgba(79,70,229,0.8)] flex items-center justify-center gap-2 cursor-pointer">
            Mulai Sekarang <ArrowRight className="w-5 h-5" />
          </button>
          <button onClick={onDemo} className="px-8 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-2 border-indigo-100 dark:border-slate-700 text-slate-700 dark:text-white rounded-2xl font-bold text-lg hover:border-indigo-500 dark:hover:border-indigo-500 transition-all flex items-center justify-center cursor-pointer shadow-sm">
            Lihat Demo
          </button>
        </motion.div>

        {/* APA ITU PRODIFY? — Full-width transparent card (find-it.id style) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="relative w-full mx-auto mb-16"
        >
          <div
            className="rounded-[1.25rem] border border-slate-400/30 dark:border-white/15 px-4 py-6 md:px-8 md:py-8 flex flex-col items-center w-full gap-6"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(14px) saturate(130%)',
              WebkitBackdropFilter: 'blur(14px) saturate(130%)',
              boxShadow: '0 8px 32px rgba(99, 102, 241, 0.08), inset 0 1px 0 rgba(255,255,255,0.3)',
            }}
          >
            {/* Title */}
            <h2 className="text-2xl md:text-[1.75rem] font-black text-slate-800 dark:text-white text-center leading-tight">
              Get To Know{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                Prodify
              </span>
            </h2>

            {/* Description — gradient fade container like find-it.id */}
            <div className="w-[95%] md:w-[85%] p-5 md:p-7 rounded-[1.25rem] flex items-center justify-center text-center"
              style={{
                background: 'linear-gradient(to bottom, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0.06) 50%, transparent 100%)',
              }}
            >
              <p className="text-slate-600 dark:text-slate-300 text-xs md:text-sm leading-relaxed font-medium">
                <strong className="text-slate-800 dark:text-white">Prodify</strong> (Productive n Amplify) adalah ekosistem produktivitas digital yang dirancang eksklusif untuk mahasiswa Indonesia. Lebih dari sekadar to-do list biasa, Prodify mengintegrasikan manajemen tugas, pelacak kebiasaan, catatan cerdas, hingga sesi fokus mendalam ke dalam satu ruang kerja yang intuitif.
                <span className="mt-2 block">
                  Kami hadir untuk membantumu menyeimbangkan jadwal kuliah, organisasi, dan kehidupan pribadi—mencapai target akademik tertinggi tanpa harus merasa <span className="italic text-rose-500 dark:text-rose-400 font-bold">burnout & Overload</span>.
                </span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* 3D App Preview Mockup Container */}
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
          className="relative max-w-5xl mx-auto perspective-container pointer-events-auto z-20 mt-10">
          <div className="rounded-[2rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-2 rotate-x-3d">
            <img src="/dashboard-mockup-B7RGmG4s.png" alt="Prodify Dashboard" className="w-full h-auto rounded-[1.5rem]" loading="lazy" />
          </div>
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-4/5 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-30 blur-[60px] rounded-full -z-10" />
        </motion.div>
      </div>
    </section>
  );
}
