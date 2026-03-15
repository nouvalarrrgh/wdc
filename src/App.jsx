import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, BarChart2, BookOpen, CalendarDays, Focus, Bell, Search, Menu, X, ChevronRight, Settings as SettingsIcon, Star, ShieldCheck, Zap, CheckCircle2, ArrowLeft } from 'lucide-react';
import { createPortal } from 'react-dom';

// IMPORT KOMPONEN LOGIN & LANDING PAGE (Statis)
import Login from './components/Login';
import LandingPage from './components/LandingPage';
import CognitiveGuard from './components/CognitiveGuard';
import NekoGuide from './components/NekoGuide';

// IMPORT STORAGE TINGKAT DEWA
import { getJson } from './utils/storage';

// LAZY LOADING KOMPONEN DASHBOARD DLL
const Dashboard = lazy(() => import('./components/Dashboard'));
const ZenNotes = lazy(() => import('./components/ZenNotes'));
const TimeManager = lazy(() => import('./components/TimeManager'));
const DeepFocus = lazy(() => import('./components/DeepFocus'));
const Habits = lazy(() => import('./components/Habits'));
const Profile = lazy(() => import('./components/Profile'));
const Settings = lazy(() => import('./components/Settings'));

const MotionDiv = motion.div;

function App() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(() => getJson('prodify_user', null));

  // STATE UNTUK MENGONTROL ROUTING LANDING PAGE VS LOGIN
  const [showLanding, setShowLanding] = useState(true);

  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeMenu]);

  const [userLevel, setUserLevel] = useState(1);
  const [userExp, setUserExp] = useState(0);
  const [profileAvatar, setProfileAvatar] = useState('');
  const [profileUsername, setProfileUsername] = useState('');

  // STATE ONBOARDING STATIS KEMBALI DIHADIRKAN
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDrop, setShowSearchDrop] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [footerModal, setFooterModal] = useState(null);

  const getSettings = () => getJson('prodify_settings', {});

  // INIT DARK MODE & GLOBAL DATA
  const loadGlobalData = useCallback(() => {
    const settings = getJson('prodify_settings', {});
    if (settings.darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    const habits = getJson('prodify_habits_v4', []);
    const focusStats = getJson('forest_stats', { planted: 0 });
    const totalExp = (habits.reduce((acc, h) => acc + (h.streak || 0), 0) * 10) + ((focusStats.planted || 0) * 25);
    setUserExp(totalExp);
    setUserLevel(Math.floor(totalExp / 100) + 1);

    const pInfo = getJson('prodify_profileInfo', {});
    setProfileAvatar(pInfo.avatar || '');

    const fallbackUsername = user?.name ? user.name.toLowerCase().replace(/\s+/g, '') : 'student';
    setProfileUsername(pInfo.username || fallbackUsername);
  }, [user]);

  useEffect(() => {
    loadGlobalData();
    window.addEventListener('storage', loadGlobalData);
    window.addEventListener('themeChanged', loadGlobalData);
    return () => {
      window.removeEventListener('storage', loadGlobalData);
      window.removeEventListener('themeChanged', loadGlobalData);
    }
  }, [loadGlobalData]);

  // NAVIGASI GLOBAL
  useEffect(() => {
    const handleGlobalNav = (e) => {
      setActiveMenu(e.detail);
      setIsSidebarOpen(false);
    };
    window.addEventListener('navigate', handleGlobalNav);
    return () => window.removeEventListener('navigate', handleGlobalNav);
  }, []);

  // LOGIKA MUNCULNYA ONBOARDING STATIS
  useEffect(() => {
    const onboarded = localStorage.getItem('prodify_onboarded_v1');
    if (!onboarded && user) setShowOnboarding(true);
  }, [user]);

  const finishOnboarding = () => {
    localStorage.setItem('prodify_onboarded_v1', 'true');
    setShowOnboarding(false);
  };

  // SISTEM PENCARIAN
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]); setShowSearchDrop(false); return;
    }
    const q = searchQuery.toLowerCase();
    let results = [];

    const notes = getJson('zen_pages_multi', []);
    notes.forEach(n => { if (n.title.toLowerCase().includes(q)) results.push({ type: 'Catatan', title: n.title, action: 'zennotes' }) });

    const mTasks = getJson('matrix_tasks', []);
    mTasks.forEach(t => { if (t.title.toLowerCase().includes(q)) results.push({ type: 'Tugas', title: t.title, action: 'time_manager' }) });

    const dTasks = getJson('prodify_tasks', []);
    dTasks.forEach(t => { if (t.text && t.text.toLowerCase().includes(q)) results.push({ type: 'Deadline', title: t.text, action: 'time_manager' }) });

    const hData = getJson('prodify_habits_v4', []);
    hData.forEach(h => { if (h.title.toLowerCase().includes(q)) results.push({ type: 'Habit', title: h.title, action: 'habits' }) });

    setSearchResults(results.slice(0, 5));
    setShowSearchDrop(true);
  }, [searchQuery]);

  // SISTEM NOTIFIKASI
  useEffect(() => {
    const checkNotifs = () => {
      const settings = getSettings();
      if (settings.notifications === false) {
        setNotifications([]);
        return;
      }

      let notifs = [];
      const now = new Date().getTime();

      if (settings.urgentReminders !== false) {
        const dTasks = getJson('prodify_tasks', []);
        dTasks.forEach(t => {
          if (!t.completed && t.deadline) {
            const diff = new Date(t.deadline).getTime() - now;
            if (diff > 0 && diff <= 7200000) notifs.push({ id: t.id, title: t.text, desc: 'Deadline < 2 jam!', type: 'urgent', target: 'time_manager' });
          }
        });
      }

      if (settings.habitReminders !== false) {
        const habits = getJson('prodify_habits_v4', []);
        const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        const dateStr = d.toISOString().split('T')[0];
        let pendingHabits = 0;
        habits.forEach(h => { if ((h.history?.[dateStr] || 0) < h.targetCount) pendingHabits++; });
        if (pendingHabits > 0) notifs.push({ id: 'h_pending', title: 'Rutinitas Pending', desc: `Ada ${pendingHabits} habit hari ini.`, type: 'reminder', target: 'habits' });
      }

      setNotifications(notifs);
    };
    checkNotifs();
    const interval = setInterval(checkNotifs, 60000);
    window.addEventListener('storage', checkNotifs);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkNotifs);
    };
  }, [activeMenu]);

  // ROUTING LOGIC
  if (!user) {
    return (
      <AnimatePresence mode="wait">
        {showLanding ? (
          <MotionDiv
            key="landing"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <LandingPage onStart={() => setShowLanding(false)} />
          </MotionDiv>
        ) : (
          <MotionDiv
            key="login"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative min-h-screen bg-[#050814] text-slate-300"
          >
            <button
              onClick={() => setShowLanding(true)}
              className="absolute top-4 left-4 sm:top-6 sm:left-6 z-50 px-2.5 py-2 sm:px-4 sm:py-2 bg-slate-900/40 sm:bg-white/5 backdrop-blur-md rounded-full sm:rounded-xl font-bold text-white border border-slate-700/60 sm:border-white/10 shadow-lg cursor-pointer hover:bg-slate-900/60 sm:hover:bg-white/10 hover:border-[#00f0ff]/50 transition-all flex items-center gap-1.5 sm:gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Kembali ke Beranda</span>
            </button>
            <Login onLogin={setUser} />
          </MotionDiv>
        )}
      </AnimatePresence>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('prodify_user');
    setUser(null);
    setActiveMenu('dashboard');
    setShowLanding(true);
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard': return <Dashboard />;
      case 'zennotes': return <ZenNotes />;
      case 'time_manager': return <TimeManager />;
      case 'focus': return <DeepFocus />;
      case 'habits': return <Habits />;
      case 'profile': return <Profile />;
      case 'settings': return <Settings onLogout={handleLogout} />;
      default: return <Dashboard />;
    }
  };

  const menuTitles = {
    dashboard: "Student Intelligence Hub", zennotes: "Smart Notes & Journal", time_manager: "Task & Activity Manager",
    focus: "Deep Focus Workspace", habits: "Habit & Synergy Tracker", profile: "Profil Mahasiswa", settings: "Pengaturan Sistem"
  };

  const navItems = [
    { key: 'dashboard', icon: <BarChart2 />, label: 'Intelligence Hub', classes: { bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-600', activeBg: 'bg-indigo-600', activeText: 'text-white', border: 'border-indigo-200 dark:border-indigo-500/20', shadow: 'shadow-[0_8px_16px_-6px_rgba(79,70,229,0.5)]' } },
    { key: 'zennotes', icon: <BookOpen />, label: 'Smart Notes', classes: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600', activeBg: 'bg-emerald-500', activeText: 'text-white', border: 'border-emerald-200 dark:border-emerald-500/20', shadow: 'shadow-[0_8px_16px_-6px_rgba(16,185,129,0.5)]' } },
    { key: 'time_manager', icon: <CalendarDays />, label: 'Task & Activity Manager', classes: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600', activeBg: 'bg-amber-500', activeText: 'text-white', border: 'border-amber-200 dark:border-amber-500/20', shadow: 'shadow-[0_8px_16px_-6px_rgba(245,158,11,0.5)]' } },
    { key: 'habits', icon: <Star />, label: 'Habit Tracker', classes: { bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-600', activeBg: 'bg-rose-500', activeText: 'text-white', border: 'border-rose-200 dark:border-rose-500/20', shadow: 'shadow-[0_8px_16px_-6px_rgba(244,63,94,0.5)]' } },
    { key: 'focus', icon: <Focus />, label: 'Deep Focus', classes: { bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-600', activeBg: 'bg-purple-500', activeText: 'text-white', border: 'border-purple-200 dark:border-purple-500/20', shadow: 'shadow-[0_8px_16px_-6px_rgba(168,85,247,0.5)]' } },
  ];

  const activeNavItem = navItems.find(item => item.key === activeMenu) || { icon: <SettingsIcon />, classes: { text: 'text-slate-800 dark:text-slate-100', bg: 'bg-slate-100 dark:bg-slate-800' } };

  return (
    <div className="flex h-[100dvh] flex-1 font-sans text-sm overflow-hidden text-slate-800 dark:text-slate-100 transition-colors duration-500 bg-[#F8FAFC] dark:bg-slate-950">
      <CognitiveGuard />

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-30 lg:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* ========== SIDEBAR ========== */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col w-[280px] h-[100dvh] bg-slate-50/90 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/60 dark:border-slate-800/80 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-all duration-300 shadow-2xl lg:shadow-none overflow-hidden`}>

        <MotionDiv animate={{ x: [0, 20, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }} className="absolute top-[-10%] left-[-10%] w-[50%] h-[30%] bg-indigo-400/10 blur-3xl rounded-full pointer-events-none" />
        <MotionDiv animate={{ x: [0, -20, 0], y: [0, 20, 0], scale: [1, 1.2, 1] }} transition={{ duration: 12, repeat: Infinity, ease: 'linear' }} className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[30%] bg-rose-400/10 blur-3xl rounded-full pointer-events-none" />

        <div className="flex items-center justify-between h-[76px] px-6 border-b border-slate-200/50 dark:border-slate-800/80 shrink-0 relative bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="relative p-2 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
              <Layers className="w-5 h-5 text-white" />
              <div className="absolute inset-0 bg-white/20 rounded-xl blur-[2px] -z-10" />
            </div>
            <h1 className="font-black text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300">
              Pro<span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">dify</span>
            </h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col p-4 gap-1.5 overflow-y-auto flex-1 custom-scrollbar relative z-10">
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 mt-2 px-3">Workspace Navigasi</div>
          {navItems.map(({ key, icon, label, classes }) => (
            <MenuButton key={key} active={activeMenu === key} onClick={() => { setActiveMenu(key); setIsSidebarOpen(false); }} icon={icon} label={label} classes={classes} />
          ))}
        </div>

        {/* SIDEBAR FOOTER: USER PROFILE CARD */}
        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md relative z-10">
          <div onClick={() => { setActiveMenu('profile'); setIsSidebarOpen(false); }}
            className={`flex items-center justify-between p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border ${activeMenu === 'profile' ? 'border-purple-400 dark:border-purple-500 shadow-md shadow-purple-500/10 ring-2 ring-purple-50 dark:ring-purple-500/20' : 'border-slate-200/60 dark:border-slate-700/60 hover:border-purple-300 dark:hover:border-purple-500/50 hover:shadow-md'} transition-all cursor-pointer group`}>

            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <img src={profileAvatar || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=A855F7&color=fff&bold=true&size=80`} alt="Profile" className="w-10 h-10 rounded-full ring-2 ring-purple-100 dark:ring-purple-900 object-cover" />
                <div className="absolute -bottom-1 -right-1 bg-amber-400 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md border-2 border-white dark:border-slate-800 shadow-sm">
                  Lv.{userLevel}
                </div>
              </div>
              <div className="flex flex-col min-w-0 pr-2">
                <p className="font-bold text-slate-800 dark:text-white text-sm truncate">{user?.name || 'Student'}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold truncate tracking-wide">
                  @{profileUsername}
                </p>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${userExp % 100}%` }} />
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shrink-0" />
          </div>
        </div>
      </aside>

      {/* ========== MAIN CONTENT ========== */}
      <main className="flex-1 flex flex-col h-[100dvh] lg:ml-[280px] min-w-0 relative">

        {/* Topbar */}
        <header className="flex items-center justify-between w-full h-[76px] shrink-0 border-b border-slate-200/50 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-6 lg:px-10 z-30 sticky top-0 shadow-md shadow-slate-300/40 dark:shadow-slate-950/40 transition-all">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl active:scale-95 transition-transform focus:ring-2 focus:ring-indigo-500">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className={`font-black text-xl md:text-2xl tracking-tight flex items-center gap-3 transition-colors ${activeNavItem.classes.text}`}>
              <div className={`p-2 rounded-xl hidden md:block transition-colors ${activeNavItem.classes.bg}`}>
                {React.cloneElement(activeNavItem.icon, { className: "w-5 h-5" })}
              </div>
              {menuTitles[activeMenu]}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Search Bar */}
            <div className="relative hidden md:block w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if (searchResults.length > 0) setShowSearchDrop(true) }}
                onBlur={() => setTimeout(() => setShowSearchDrop(false), 200)}
                placeholder="Cari catatan, tugas, habit..."
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl pl-11 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-800 dark:text-slate-200"
              />

              <AnimatePresence>
                {showSearchDrop && (
                  <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden z-[100]">
                    {searchResults.length > 0 ? searchResults.map((r, i) => (
                      <div key={i} onMouseDown={() => { setActiveMenu(r.action); setSearchQuery(''); setShowSearchDrop(false); }} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 flex items-center gap-3">
                        <span className="text-[9px] font-bold text-white bg-indigo-500 px-2 py-0.5 rounded uppercase tracking-wider shrink-0">{r.type}</span>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">{r.title}</span>
                      </div>
                    )) : (
                      <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400 font-medium">Tidak ada hasil ditemukan.</div>
                    )}
                  </MotionDiv>
                )}
              </AnimatePresence>
            </div>

            {/* Notifikasi Lonceng */}
            <div className="relative">
              <button
                onClick={() => setShowNotif(!showNotif)}
                onBlur={() => setTimeout(() => setShowNotif(false), 200)}
                className="relative p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-500"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />}
              </button>

              <AnimatePresence>
                {showNotif && (
                  <MotionDiv initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 top-full mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl z-[100] overflow-hidden origin-top-right">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 dark:text-white">Pusat Notifikasi</h3>
                      <span className="text-[10px] bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 px-2.5 py-1 rounded-md font-black uppercase tracking-widest">{notifications.length} Baru</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {notifications.length > 0 ? notifications.map((n, i) => (
                        <div key={i} onMouseDown={() => { setActiveMenu(n.target); setShowNotif(false); }} className="p-4 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex gap-3 items-start cursor-pointer group">
                          <div className={`p-2 rounded-full mt-0.5 shrink-0 transition-colors ${n.type === 'urgent' ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-500 dark:text-rose-400 group-hover:bg-rose-200' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-500 dark:text-amber-400 group-hover:bg-amber-200'}`}>
                            <Bell className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">{n.title}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">{n.desc}</p>
                          </div>
                        </div>
                      )) : (
                        <div className="p-8 text-center flex flex-col items-center">
                          <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3 opacity-50" />
                          <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Semua aman terkendali!</p>
                        </div>
                      )}
                    </div>
                  </MotionDiv>
                )}
              </AnimatePresence>
            </div>

            <button onClick={() => setActiveMenu('settings')}
              className={`relative p-2.5 transition-colors cursor-pointer rounded-full border shadow-sm focus:ring-2 focus:ring-indigo-500 ${activeMenu === 'settings' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 border-indigo-200 dark:border-indigo-500/30' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* CONTAINER SCROLL UTAMA */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 pb-32 relative scroll-smooth custom-scrollbar">
          <Suspense fallback={<PageLoader />}>
            <AnimatePresence mode="wait">
              <MotionDiv key={activeMenu} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="max-w-7xl mx-auto w-full min-h-full">
                {renderContent()}
              </MotionDiv>
            </AnimatePresence>
          </Suspense>
        </div>

        {/* Global Sticky Footer */}
        <footer className="absolute bottom-0 left-0 right-0 border-t border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl py-3 px-6 lg:px-10 z-20">
          <div className="flex flex-col md:flex-row items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 max-w-7xl mx-auto">
            <div>&copy; {new Date().getFullYear()} Pro<span className="text-indigo-600 dark:text-indigo-400">dify</span>. All rights reserved.</div>
            <div className="flex items-center gap-4 mt-2 md:mt-0">
              <button onClick={() => setFooterModal('privacy')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">Privacy</button>
              <button onClick={() => setFooterModal('terms')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">Terms</button>
              <button onClick={() => setFooterModal('help')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">Help Center</button>
            </div>
          </div>
        </footer>

        {/* ============================================== */}
        {/* MODAL ONBOARDING STATIS (PERTAMA KALI LOGIN) */}
        {/* ============================================== */}
        {showOnboarding && createPortal(
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden animate-fade-in-up border border-indigo-100 dark:border-slate-700">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <Zap className="w-16 h-16 text-yellow-300 mx-auto mb-4 animate-bounce relative z-10" />
                <h2 className="text-3xl font-black text-white relative z-10">Selamat Datang di Prodify!</h2>
                <p className="text-indigo-100 mt-2 font-medium relative z-10">Ekosistem produktivitas yang mengerti kamu.</p>
              </div>

              <div className="p-8">
                {onboardingStep === 1 && (
                  <div className="text-center animate-fade-in">
                    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4"><Layers className="w-8 h-8" /></div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Bukan Sekadar To-Do List</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Kelima fitur di sini (Notes, Task, Habit, Focus, Dashboard) <strong>saling terhubung secara magis</strong>. Kebiasaan baikmu akan meningkatkan kapasitas mental untuk mengerjakan tugas!</p>
                  </div>
                )}
                {onboardingStep === 2 && (
                  <div className="text-center animate-fade-in">
                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4"><Star className="w-8 h-8" /></div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Sistem Leveling Mahasiswa</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Lakukan sesi fokus dan selesaikan rutinitas harian untuk mendapatkan <strong>EXP</strong> dan menaikkan <strong>Level Mahasiswa</strong>-mu di sidebar kiri.</p>
                  </div>
                )}
                {onboardingStep === 3 && (
                  <div className="text-center animate-fade-in">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mx-auto mb-4"><ShieldCheck className="w-8 h-8" /></div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Cognitive Guard Aktif</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Jangan memaksakan diri! Radar evaluasi di Dashboard akan memantau kesehatan mentalmu. Jika kamu kurang istirahat, layar akan berubah untuk mengingatkanmu.</p>
                  </div>
                )}

                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex gap-2">
                    {[1, 2, 3].map(step => (
                      <div key={step} className={`w-2.5 h-2.5 rounded-full transition-colors ${onboardingStep === step ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
                    ))}
                  </div>
                  <button onClick={() => onboardingStep < 3 ? setOnboardingStep(onboardingStep + 1) : finishOnboarding()} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer">
                    {onboardingStep < 3 ? 'Selanjutnya' : 'Mulai Produktif!'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          , document.body)}

        {/* Footer Policy Modals */}
        {footerModal && createPortal(
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in" onClick={() => setFooterModal(null)}>
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up flex flex-col max-h-[85vh] border border-white dark:border-slate-700 spatial-shadow" onClick={e => e.stopPropagation()}>
              <div className="p-6 md:p-8 border-b border-slate-200/50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="font-black text-2xl text-slate-800 dark:text-white tracking-tight">
                  {footerModal === 'privacy' ? 'Privacy Policy' : footerModal === 'terms' ? 'Terms of Service' : 'Help Center'}
                </h3>
                <button onClick={() => setFooterModal(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer"><X className="w-6 h-6 text-slate-500 dark:text-slate-400" /></button>
              </div>
              <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar text-sm text-slate-600 dark:text-slate-300 space-y-5 leading-relaxed font-medium">
                {footerModal === 'privacy' && (
                  <>
                    <p><strong className="text-slate-800 dark:text-white">1. Data Lokal 100%:</strong> Seluruh data aplikasi (catatan, tugas, kebiasaan) disimpan secara mutlak di dalam perangkat Anda menggunakan teknologi <code>localStorage</code> browser.</p>
                    <p><strong className="text-slate-800 dark:text-white">2. Tidak Ada Pelacakan Server:</strong> Kami beroperasi tanpa backend. Tidak ada data pribadi yang dikirim, disadap, atau dijual oleh pihak ketiga mana pun.</p>
                    <p><strong className="text-slate-800 dark:text-white">3. Hak Hapus Penuh:</strong> Anda memegang kendali penuh. Gunakan menu <em>Pengaturan {'>'} Zona Berbahaya</em> untuk melenyapkan semua jejak data dalam satu klik.</p>
                  </>
                )}
                {footerModal === 'terms' && (
                  <>
                    <p><strong className="text-slate-800 dark:text-white">1. Tanggung Jawab Cache:</strong> Karena data berada di lokal, membersihkan memori *cache* browser Anda berisiko menghapus data aplikasi. Gunakan fitur Export PDF secara berkala untuk pencadangan.</p>
                    <p><strong className="text-slate-800 dark:text-white">2. Penggunaan Wajar:</strong> Platform Prodify dirancang eksklusif untuk memberdayakan manajemen waktu mahasiswa.</p>
                    <p><strong className="text-slate-800 dark:text-white">3. Aset Kompetisi:</strong> Prototipe ini dikembangkan dengan bangga untuk ajang IFest Web Development Competition 2026.</p>
                  </>
                )}
                {footerModal === 'help' && (
                  <>
                    <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 p-4 rounded-2xl mb-4">
                      <h4 className="font-black text-indigo-700 dark:text-indigo-400 text-base mb-1">Tips Cepat Navigasi! 🚀</h4>
                      <p className="text-indigo-600/80 dark:text-indigo-300/80 text-xs">Aplikasi ini dirancang saling terhubung. Coba skenario ini:</p>
                    </div>
                    <ul className="space-y-3">
                      <li className="flex gap-3"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" /> <p><strong>Smart Notes:</strong> Ketik apapun, blok teksnya, lalu jadikan otomatis sebagai Task Matrix.</p></li>
                      <li className="flex gap-3"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" /> <p><strong>Task & Activity Manager:</strong> Geser (*drag and drop*) tugas sesuai skala prioritas mendesak.</p></li>
                      <li className="flex gap-3"><div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" /> <p><strong>Deep Focus:</strong> Awas! Jika kamu me-minimize layar (*tab out*), pohonmu akan layu dan mati (Fitur Anti-Cheat).</p></li>
                    </ul>
                  </>
                )}
              </div>
              <div className="p-6 border-t border-slate-200/50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-center">
                <button onClick={() => setFooterModal(null)} className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer w-full text-base active:scale-95">Mengerti & Tutup</button>
              </div>
            </div>
          </div>
          , document.body)}

        {/* MUNCULKAN NEKO GUIDE HANYA SETELAH ONBOARDING STATIS SELESAI */}
        {user && !showOnboarding && <NekoGuide />}
      </main>
    </div>
  );
}

function MenuButton({ active, icon, label, classes, onClick }) {
  const theme = classes || { bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-600', activeBg: 'bg-indigo-600', activeText: 'text-white', border: 'border-indigo-200', shadow: 'shadow-md shadow-indigo-600/30' };

  return (
    <button onClick={onClick}
      className={`w-full group flex items-center rounded-2xl px-4 py-3.5 gap-3.5 transition-all duration-300 cursor-pointer border ${active ? `${theme.activeBg} ${theme.activeText} ${theme.shadow} border-transparent scale-[1.02]` : `bg-transparent text-slate-500 dark:text-slate-400 hover:${theme.bg} hover:${theme.text} hover:${theme.border} border-transparent`}`}>
      <div className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shrink-0 ${active ? 'text-white' : `text-slate-400 dark:text-slate-500 group-hover:${theme.text}`}`}>
        {icon}
      </div>
      <span className="font-bold text-sm tracking-wide">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 bg-white/80 rounded-full animate-pulse shadow-sm shadow-white" />}
    </button>
  );
}

function PageLoader() {
  return (
    <div className="min-h-[300px] flex items-center justify-center">
      <div className="text-sm font-bold text-slate-500 dark:text-slate-400">Memuat modul...</div>
    </div>
  );
}

export default App;
