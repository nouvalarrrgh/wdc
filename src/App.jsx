import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, BarChart2, BookOpen, CalendarDays, Focus, Bell, Search, Menu, X, ChevronRight, Settings as SettingsIcon, Star } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ZenNotes from './components/ZenNotes';
import TimeManager from './components/TimeManager';
import DeepFocus from './components/DeepFocus';
import Habits from './components/Habits';
import Login from './components/Login';
import Profile from './components/Profile';
import Settings from './components/Settings';
import CognitiveGuard from './components/CognitiveGuard';


function App() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('stuprod_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLowRest, setIsLowRest] = useState(false);

  useEffect(() => {
    const checkRestScore = () => {
      const savedScores = localStorage.getItem('stuprod_radar_scores');
      if (savedScores) {
        try {
          const parsed = JSON.parse(savedScores);
          setIsLowRest(parsed.istirahat < 30);
        } catch (e) {
          setIsLowRest(false);
        }
      }
    };
    checkRestScore(); // Initial check

    window.addEventListener('radarScoreUpdated', checkRestScore);
    return () => window.removeEventListener('radarScoreUpdated', checkRestScore);
  }, []);

  if (!user) return <Login onLogin={setUser} />;

  const handleLogout = () => {
    localStorage.removeItem('stuprod_user');
    setUser(null);
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
    dashboard: "Productivity Dashboard",
    zennotes: "ZenNotes",
    time_manager: "Time & Task Management",
    focus: "Deep Focus Sphere",
    habits: "Habit Constellation",
    profile: "User Profile",
    settings: "Settings & Preferences"
  };

  const navItems = [
    {
      key: 'dashboard', icon: <BarChart2 />, label: 'Dashboard & Analitik',
      classes: { bg: 'bg-indigo-50', text: 'text-indigo-600', activeBg: 'bg-indigo-600', activeText: 'text-white', border: 'border-indigo-200', shadow: 'shadow-[0_8px_16px_-6px_rgba(79,70,229,0.5)]' }
    },
    {
      key: 'zennotes', icon: <BookOpen />, label: 'ZenNotes',
      classes: { bg: 'bg-emerald-50', text: 'text-emerald-600', activeBg: 'bg-emerald-500', activeText: 'text-white', border: 'border-emerald-200', shadow: 'shadow-[0_8px_16px_-6px_rgba(16,185,129,0.5)]' }
    },
    {
      key: 'time_manager', icon: <CalendarDays />, label: 'Time & Task Manager',
      classes: { bg: 'bg-amber-50', text: 'text-amber-600', activeBg: 'bg-amber-500', activeText: 'text-white', border: 'border-amber-200', shadow: 'shadow-[0_8px_16px_-6px_rgba(245,158,11,0.5)]' }
    },
    {
      key: 'habits', icon: <Star />, label: 'Habit Constellation',
      classes: { bg: 'bg-rose-50', text: 'text-rose-600', activeBg: 'bg-rose-500', activeText: 'text-white', border: 'border-rose-200', shadow: 'shadow-[0_8px_16px_-6px_rgba(244,63,94,0.5)]' }
    },
    {
      key: 'focus', icon: <Focus />, label: 'Deep Focus Sphere',
      classes: { bg: 'bg-purple-50', text: 'text-purple-600', activeBg: 'bg-purple-500', activeText: 'text-white', border: 'border-purple-200', shadow: 'shadow-[0_8px_16px_-6px_rgba(168,85,247,0.5)]' }
    },
  ];

  const activeNavItem = navItems.find(item => item.key === activeMenu) ||
    { icon: <SettingsIcon />, classes: { text: 'text-slate-800', bg: 'bg-slate-100' } };

  return (
    <div className={`flex h-[100dvh] flex-1 font-sans text-sm overflow-hidden text-slate-800 transition-colors duration-1000 ${isLowRest ? 'bg-amber-50/80 sepia-[.20]' : 'bg-[#F8FAFC]'}`}>
      <CognitiveGuard />

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* ========== SIDEBAR ========== */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col w-[280px] h-[100dvh] bg-slate-50/90 backdrop-blur-xl border-r border-slate-200/60 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 shadow-2xl lg:shadow-none overflow-hidden`}>

        {/* Subtle decorative dynamic mesh gradient in sidebar background */}
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[30%] bg-indigo-400/10 blur-3xl rounded-full" />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 20, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[30%] bg-rose-400/10 blur-3xl rounded-full" />

        {/* Logo / Brand area */}
        <div className="flex items-center justify-between h-[76px] px-6 border-b border-slate-200/50 shrink-0 relative bg-white/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="relative p-2 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
              <Layers className="w-5 h-5 text-white" />
              <div className="absolute inset-0 bg-white/20 rounded-xl blur-[2px] -z-10" />
            </div>
            <h1 className="font-black text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
              Stu<span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Prod</span>
            </h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} aria-label="Tutup Menu" className="lg:hidden p-2 text-slate-400 hover:bg-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav items */}
        <div className="flex flex-col p-4 gap-1.5 overflow-y-auto flex-1 custom-scrollbar relative z-10">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 mt-2 px-3">Workspace Navigasi</div>
          {navItems.map(({ key, icon, label, classes }) => (
            <MenuButton
              key={key}
              active={activeMenu === key}
              onClick={() => { setActiveMenu(key); setIsSidebarOpen(false); }}
              icon={icon}
              label={label}
              classes={classes}
            />
          ))}
        </div>

        {/* User card at bottom */}
        <div className="p-4 border-t border-slate-200/50 bg-white/50 backdrop-blur-md relative z-10">
          <div onClick={() => { setActiveMenu('profile'); setIsSidebarOpen(false); }}
            className={`flex items-center justify-between p-3 rounded-2xl bg-white/80 border ${activeMenu === 'profile' ? 'border-purple-400 shadow-md shadow-purple-500/10 ring-2 ring-purple-50' : 'border-slate-200/60 hover:border-purple-300 hover:shadow-md'} transition-all cursor-pointer group`}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=A855F7&color=fff&bold=true&size=80`} alt="Profile" className="w-10 h-10 rounded-full ring-2 ring-purple-100" />
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm max-w-[100px] truncate">{user?.name || 'Student'}</p>
                <p className="text-[10px] text-slate-400 font-bold truncate max-w-[100px] uppercase tracking-wider">{user?.email?.split('@')[0] || ''}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>
        </div>
      </aside>

      {/* ========== MAIN CONTENT ========== */}
      <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden relative lg:ml-[280px]">
        {/* Topbar */}
        <header className="flex items-center justify-between w-full h-[76px] shrink-0 border-b border-slate-200/50 bg-white/80 backdrop-blur-xl px-6 lg:px-10 z-30 sticky top-0 shadow-md shadow-slate-300/40">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} aria-label="Buka Menu Navigasi" className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-xl active:scale-95 transition-transform focus:ring-2 focus:ring-indigo-500">
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
            <div className="relative hidden md:block w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" aria-label="Kolom Pencarian" placeholder="Cari catatan, tugas, jadwal..." className="w-full bg-slate-100 border-none rounded-2xl pl-11 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400" />
            </div>
            <button aria-label="Notifikasi" className="relative p-2.5 text-slate-500 hover:bg-slate-100 rounded-full transition-colors cursor-pointer bg-white border border-slate-200 shadow-sm focus:ring-2 focus:ring-indigo-500">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
            </button>
            <button onClick={() => setActiveMenu('settings')} aria-label="Pengaturan Akun"
              className={`relative p-2.5 transition-colors cursor-pointer rounded-full border shadow-sm focus:ring-2 focus:ring-indigo-500 ${activeMenu === 'settings' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white text-slate-500 hover:bg-slate-100 border-slate-200'}`}>
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 pb-32 relative scroll-smooth custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMenu}
              initial={{ opacity: 0, y: 15, filter: 'blur(5px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -15, filter: 'blur(5px)' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-7xl mx-auto w-full min-h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Global Sticky Footer */}
        <footer className="absolute bottom-0 left-0 right-0 border-t border-slate-200/60 bg-white/80 backdrop-blur-xl py-3 px-6 lg:px-10 z-20">
          <div className="flex flex-col md:flex-row items-center justify-between text-xs font-bold text-slate-500 max-w-7xl mx-auto">
            <div>&copy; {new Date().getFullYear()} Stu<span className="text-indigo-600">Prod</span>. All rights reserved.</div>
            <div className="flex items-center gap-4 mt-2 md:mt-0">
              <span className="hover:text-indigo-600 cursor-pointer transition-colors">Privacy</span>
              <span className="hover:text-indigo-600 cursor-pointer transition-colors">Terms</span>
              <span className="hover:text-indigo-600 cursor-pointer transition-colors">Help Center</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

function MenuButton({ active, icon, label, classes, onClick }) {
  // If classes aren't provided (e.g. for a fallback), default to generic indigo styling
  const theme = classes || { bg: 'bg-indigo-50', text: 'text-indigo-600', activeBg: 'bg-indigo-600', activeText: 'text-white', border: 'border-indigo-200', shadow: 'shadow-md shadow-indigo-600/30' };

  return (
    <button onClick={onClick}
      className={`w-full group flex items-center rounded-2xl px-4 py-3.5 gap-3.5 transition-all duration-300 cursor-pointer border ${active ? `${theme.activeBg} ${theme.activeText} ${theme.shadow} border-transparent scale-[1.02]` : `bg-transparent text-slate-500 hover:${theme.bg} hover:${theme.text} hover:${theme.border} border-transparent`}`}>
      <div className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shrink-0 ${active ? 'text-white' : `text-slate-400 group-hover:${theme.text}`}`}>
        {icon}
      </div>
      <span className="font-bold text-sm tracking-wide">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 bg-white/80 rounded-full animate-pulse shadow-sm shadow-white" />}
    </button>
  );
}

export default App;