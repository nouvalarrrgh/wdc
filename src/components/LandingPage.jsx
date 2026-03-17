import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Target, Shield, ListChecks, Activity,
  CalendarDays, BarChart2, Star, BookOpen, Focus, Flame, ChevronDown
} from 'lucide-react';
import { triggerDemoData } from '../utils/demoData';

// IMPORT KOMPONEN HERO 3D KITA
import HeroSection from './HeroSection';

export default function LandingPage({ onStart }) {
  const handleNormalStart = (e) => {
    if (e) e.preventDefault();
    if (typeof window !== 'undefined') {
      // CLEAR DEMO MODE KEY AND ANY DUMMY SESSION DATA
      window.sessionStorage.removeItem('isDemoMode');
      window.sessionStorage.clear();
    }
    onStart(); // Proceed to login/dashboard
  };

  const handleDemoLaunch = (e) => {
    if (e) e.preventDefault();
    triggerDemoData();
    onStart(); // Proceed to dashboard after data is injected
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      // Shortcut rahasia presentasi: Ctrl + Shift + D (Demo Data Inject)
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDemoLaunch();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    const el = document.getElementById(targetId);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Add fade-in flash animation
    el.classList.remove('nav-fade-in');
    void el.offsetWidth; // force reflow
    el.classList.add('nav-fade-in');
    setTimeout(() => el.classList.remove('nav-fade-in'), 900);
  };

  const BENEFITS = [
    { icon: Target, title: "Fokus pada hal yang penting", desc: "Prioritaskan tugas berdasarkan urgensi dan kepentingan agar waktu kamu tidak terbuang sia-sia." },
    { icon: Shield, title: "Tidak lagi panik saat deadline", desc: "Dengan pengingat otomatis, kamu selalu tahu kapan tugas harus selesai." },
    { icon: ListChecks, title: "Semua tugas tersusun rapi", desc: "Organisasi tugas berdasarkan mata kuliah, prioritas, dan status dengan mudah." },
    { icon: Activity, title: "Aktivitas lebih terkontrol", desc: "Pantau kegiatan harian dan mingguan untuk memastikan keseimbangan studi dan kegiatan." }
  ];

  // ==========================================
  // DAFTAR 5 FITUR UTAMA PRODIFY YANG ELEGAN
  // ==========================================
  const FEATURES = [
    { icon: BarChart2, title: "Productivity Dashboard", desc: "Pantau skor dampak, tingkat kelesuan mental, dan statistik produktivitasmu secara real-time.", tag: "Analytics" },
    { icon: BookOpen, title: "Smart Notes", desc: "Catat ide dan materi. Sorot teks apa saja untuk langsung mengubahnya menjadi tugas otomatis!", tag: "Knowledge" },
    { icon: CalendarDays, title: "Activity Manager", desc: "Atur prioritas tugas dengan Eisenhower Matrix dan eksekusi melalui blok kalender mingguan.", tag: "Manajemen" },
    { icon: Flame, title: "Habit Tracker", desc: "Bangun kebiasaan positif untuk mendapatkan Synergy Point dan meningkatkan kapasitas energi harian.", tag: "Rutinitas" },
    { icon: Focus, title: "Deep Focus", desc: "Tanam pohon maya. Dilengkapi mode fokus ketat yang akan menggagalkan sesi jika kamu pindah tab!", tag: "Anti-Cheat" }
  ];

  const [openFaq, setOpenFaq] = useState(null);
  const toggleFaq = (idx) => setOpenFaq(openFaq === idx ? null : idx);

  const FAQS = [
    { q: "Apakah Prodify gratis untuk digunakan?", a: "Ya! Prodify sepenuhnya gratis untuk semua mahasiswa. Kami percaya setiap mahasiswa berhak mendapatkan alat produktivitas terbaik tanpa hambatan biaya." },
    { q: "Apa saja fitur utama yang tersedia di Prodify?", a: "Prodify menyediakan 5 pilar utama: Productivity Dashboard untuk memantau statistik real-time, Smart Notes untuk mencatat dan mengubah catatan menjadi tugas, Activity Manager dengan Eisenhower Matrix, Habit Tracker untuk membangun kebiasaan positif, dan Deep Focus untuk sesi belajar tanpa gangguan." },
    { q: "Apakah data saya aman di Prodify?", a: "Tentu saja. Semua data disimpan secara lokal di perangkat kamu dan tidak dikirim ke server manapun. Kamu memiliki kendali penuh atas datamu." },
    { q: "Bisakah Prodify digunakan di perangkat mobile?", a: "Prodify didesain dengan pendekatan responsive-first, sehingga dapat diakses dengan nyaman di browser perangkat mobile maupun desktop tanpa perlu menginstal aplikasi tambahan." },
    { q: "Bagaimana fitur Deep Focus mencegah saya membuka media sosial?", a: "Deep Focus menggunakan sistem anti-cheat yang mendeteksi jika kamu berpindah tab saat sesi fokus aktif. Jika terdeteksi, sesi akan otomatis gagal — membuatmu tetap disiplin dan fokus pada tugas yang sedang dikerjakan." },
  ];

  const TESTIMONIALS = [
    { name: "Rina Safitri", role: "Mahasiswa Teknik Informatika", content: "Sejak pakai Prodify, IPK aku naik dari 3.2 jadi 3.8! Semua tugas jadi terorganisir dan nggak pernah telat kumpulin lagi.", avatar: "RS" },
    { name: "Ahmad Fauzan", role: "Mahasiswa Manajemen", content: "Balance Matrix-nya game changer banget. Aku bisa menyeimbangkan antara kuliah, organisasi, dan part-time job dengan lebih baik.", avatar: "AF" },
    { name: "Dina Maharani", role: "Mahasiswa Kedokteran", content: "Fitur Deep Focus super helpful! Nggak ada lagi godaan buka sosmed pas lagi belajar. Highly recommend buat semua mahasiswa.", avatar: "DM" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050814] text-slate-900 dark:text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden">

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#050814]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 transition-colors">
        <div className="container mx-auto max-w-7xl flex items-center justify-between h-20 px-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-2 shadow-lg shadow-slate-200/40 dark:shadow-slate-950/40">
              <img src="/brand-logo.png" alt="Prodify Logo" className="h-6 w-6" />
            </div>
            <span className="text-2xl font-black tracking-tight">Prodi<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">fy</span></span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <a href="#benefits" onClick={(e) => handleNavClick(e, 'benefits')} className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">Manfaat</a>
            <a href="#features" onClick={(e) => handleNavClick(e, 'features')} className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">Fitur</a>
            <a href="#preview" onClick={(e) => handleNavClick(e, 'preview')} className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">Preview</a>
            <a href="#testimonials" onClick={(e) => handleNavClick(e, 'testimonials')} className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">Testimoni</a>
            <a href="#faq" onClick={(e) => handleNavClick(e, 'faq')} className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">FAQ</a>
          </div>
          <button onClick={handleNormalStart} className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:scale-105 transition-transform shadow-lg cursor-pointer">
            Masuk / Daftar
          </button>
        </div>
      </nav>

      {/* HERO SECTION DENGAN 3D ELEMENTS */}
      <HeroSection onStart={handleNormalStart} onDemo={handleDemoLaunch} />

      {/* BENEFITS SECTION — Marquee / Conveyor Belt (find-it.id "Why You Should Join" style) */}
      <section id="benefits" className="py-24 md:py-32 bg-white dark:bg-slate-900/50 border-y border-slate-100 dark:border-white/5 overflow-hidden">
        <div className="container mx-auto px-6 max-w-7xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Kenapa mahasiswa butuh <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">sistem produktivitas?</span></h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto font-medium">Karena mengandalkan ingatan saja tidak cukup untuk menghadapi banyaknya tugas dan aktivitas.</p>
          </motion.div>
        </div>

        {/* Marquee Container */}
        <div className="w-full relative overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)' }}>
          <div className="flex w-max animate-marquee gap-6 hover:[animation-play-state:paused]">
            {/* Render BENEFITS twice for seamless loop */}
            {[...BENEFITS, ...BENEFITS].map((item, idx) => (
              <div key={idx}
                className="group w-[300px] md:w-[360px] shrink-0 p-8 rounded-[2rem] bg-indigo-500/5 dark:bg-white/[0.06] backdrop-blur-md border border-slate-200/80 dark:border-white/10 hover:border-indigo-500/30 transition-all duration-300 hover:-translate-y-2 flex flex-col items-center text-center aspect-[4/3]">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-indigo-500/30">
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-black mb-3">{item.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES SECTION (5 ITEM GRID) */}
      <section id="features" className="py-32 relative">
        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Pilar Ekosistem <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Prodify</span></h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto font-medium">Lima fitur inti yang dirancang khusus dan terintegrasi untuk kebutuhan mahasiswa modern.</p>
          </motion.div>

          {/* GRID UNTUK 5 ITEM: 3 di atas, 2 di tengah bawah (centered) pada layar besar */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
            {FEATURES.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`group relative p-10 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 hover:-translate-y-2 overflow-hidden
                  ${idx < 3 ? "lg:col-span-2 md:col-span-1" : "lg:col-span-3 md:col-span-1"}
                `}
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
                <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 text-xs font-black uppercase tracking-widest mb-6 relative z-10">
                  {item.tag}
                </span>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg shadow-indigo-500/30 relative z-10">
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black mb-4 relative z-10">{item.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm font-medium relative z-10">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PREVIEW SECTION */}
      <section id="preview" className="py-32 bg-slate-100 dark:bg-slate-900/50 border-y border-slate-200 dark:border-white/5">
        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Intip <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Tampilan Aplikasi</span></h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto font-medium">Desain modern dan intuitif yang memudahkan kamu mengatur semua aktivitas tanpa pusing.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="relative max-w-5xl mx-auto">
            <div className="rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 bg-white dark:bg-slate-900">
              <img src="/app-preview-qsvHccVI.png" alt="App Preview" className="w-full h-auto" loading="lazy" />
            </div>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-20 blur-[60px] rounded-full -z-10" />
          </motion.div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-32 relative">
        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Apa kata <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">mereka?</span></h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">Ribuan mahasiswa sudah merasakan manfaat dari ekosistem Prodify.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((item, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="p-8 rounded-[2rem] bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xl hover:-translate-y-2 transition-transform duration-300">
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-slate-700 dark:text-slate-300 mb-8 leading-relaxed font-medium text-lg italic">"{item.content}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-lg shadow-md">
                    {item.avatar}
                  </div>
                  <div>
                    <p className="font-black text-slate-900 dark:text-white">{item.name}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{item.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-32 bg-white dark:bg-slate-900/50 border-y border-slate-100 dark:border-white/5">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Pertanyaan <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Umum</span></h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">Hal-hal yang sering ditanyakan tentang Prodify.</p>
          </motion.div>

          <div className="flex flex-col gap-4">
            {FAQS.map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left px-6 py-5 md:px-8 md:py-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 group cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{faq.q}</h3>
                    <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${openFaq === idx ? 'rotate-180 text-indigo-500' : ''}`} />
                  </div>
                  <AnimatePresence>
                    {openFaq === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <p className="pt-4 text-sm md:text-base text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="relative max-w-2xl mx-auto rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-6 md:p-10 text-center overflow-hidden shadow-2xl shadow-indigo-600/30 border border-indigo-400/30">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <h2 className="text-2xl md:text-4xl font-black text-white mb-3 leading-tight">Upgrade cara kamu mengatur<br />hidup sebagai mahasiswa.</h2>
              <p className="text-indigo-100 text-sm md:text-base mb-6 max-w-md mx-auto font-medium">Bergabung dengan ekosistem yang sudah membuktikan peningkatan produktivitas tanpa stres berlebih.</p>

              <button onClick={handleNormalStart} className="px-6 py-3 bg-white text-indigo-700 hover:bg-indigo-50 rounded-xl font-bold text-sm transition-all shadow-[0_0_25px_rgba(255,255,255,0.3)] hover:scale-105 flex items-center justify-center gap-2 mx-auto cursor-pointer">
                Coba Gratis Sekarang <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="pt-16 pb-8 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#050814]">
        <div className="container mx-auto px-6 max-w-7xl">
          {/* Footer Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-16 mb-12">
            {/* Brand Column */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-2 shadow-lg shadow-slate-200/40 dark:shadow-slate-950/40">
                  <img src="/brand-logo.png" alt="Prodify Logo" className="h-5 w-5" />
                </div>
                <span className="text-xl font-black tracking-tight">Prodi<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">fy</span></span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium max-w-xs">
                Ekosistem produktivitas all-in-one yang dirancang khusus untuk mahasiswa Indonesia.
              </p>
            </div>

            {/* Navigation Column */}
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-4">Navigasi</h4>
              <ul className="space-y-3">
                {[{ label: 'Manfaat', id: 'benefits' }, { label: 'Fitur', id: 'features' }, { label: 'Preview', id: 'preview' }, { label: 'Testimoni', id: 'testimonials' }].map(link => (
                  <li key={link.id}>
                    <a href={`#${link.id}`} onClick={(e) => handleNavClick(e, link.id)} className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Features Column */}
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-4">Fitur</h4>
              <ul className="space-y-3">
                {['Dashboard', 'Smart Notes', 'Activity Manager', 'Habit Tracker', 'Deep Focus'].map(feat => (
                  <li key={feat}>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA Column */}
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-4">Mulai Sekarang</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium mb-5">
                Gratis untuk semua mahasiswa. Tidak perlu kartu kredit.
              </p>
              <button onClick={handleNormalStart} className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-sm hover:scale-105 transition-transform shadow-lg shadow-indigo-500/25 cursor-pointer">
                Masuk / Daftar
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 text-center sm:text-left">
                © {new Date().getFullYear()} Prodify. All Right Reserved by Logicraft.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
