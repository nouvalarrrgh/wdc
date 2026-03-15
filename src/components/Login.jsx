import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  User as UserIcon,
  Zap,
  GraduationCap,
  Target,
  BarChart2,
  BookOpen,
  Flame,
  Focus,
  CalendarDays
} from 'lucide-react';
import { NekoMascotFull } from './NekoMascot';
import { setJson } from '../utils/storage';

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ name: '', university: '', targetIpk: '' });
  const [error, setError] = useState('');

  const cleaned = useMemo(() => {
    const name = form.name.trim();
    const university = form.university.trim();
    const targetIpk = String(form.targetIpk ?? '').trim();
    const username = (name || 'student').toLowerCase().replace(/\s+/g, '');
    return { name, university, targetIpk, username };
  }, [form]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!cleaned.name) {
      setError('Nama lengkap tidak boleh kosong.');
      return;
    }

    const user = {
      name: cleaned.name,
      university: cleaned.university || 'Belum diisi',
      targetIpk: cleaned.targetIpk || ''
    };

    // Checklist WDC: simpan simulasi login frontend-only di localStorage sebagai `prodify_user`.
    setJson('prodify_user', user);

    // Supaya halaman Profile langsung kebaca datanya tanpa null error.
    setJson('prodify_profileInfo', {
      name: user.name,
      username: cleaned.username,
      email: 'mahasiswa@kampus.ac.id',
      university: user.university,
      major: 'Belum diisi',
      location: 'Indonesia',
      phone: '-',
      portfolio: '',
      bio: user.targetIpk ? `Target IPK: ${user.targetIpk}` : 'Mahasiswa yang sedang berjuang meningkatkan produktivitas.',
      avatar: ''
    });

    if (typeof onLogin === 'function') onLogin(user);
  };

  const FEATURES_LIST = [
    { icon: BarChart2, label: 'Dashboard', color: 'from-blue-500 to-cyan-400' },
    { icon: BookOpen, label: 'Smart Notes', color: 'from-emerald-500 to-teal-400' },
    { icon: CalendarDays, label: 'Time Manager', color: 'from-amber-500 to-orange-400' },
    { icon: Flame, label: 'Habits', color: 'from-orange-500 to-amber-400' },
    { icon: Focus, label: 'Deep Focus', color: 'from-purple-500 to-pink-400' }
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-slate-50 relative overflow-x-hidden overflow-y-auto">
      {/* LEFT PANEL: BRAND */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] relative bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 flex-col items-center justify-center p-10 overflow-hidden shrink-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute top-10 right-10 w-28 h-28 border-2 border-white/15 rounded-full animate-spin-slow" />
        <div className="absolute bottom-14 left-14 w-16 h-16 border-2 border-white/10 rounded-full animate-spin-slow" style={{ animationDirection: 'reverse' }} />

        <div className="relative z-10 flex flex-col items-center gap-6 max-w-sm text-center">
          <div className="animate-float">
            <NekoMascotFull className="w-32 h-32 drop-shadow-[0_0_30px_rgba(255,255,255,0.25)]" animate={false} />
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full text-white/90 text-xs font-black tracking-widest uppercase">
              <Zap className="w-4 h-4 text-yellow-300" />
              Prodify
            </div>
            <h2 className="mt-4 text-3xl font-black text-white leading-tight">
              Empowering Students
              <span className="block text-white/90">Through Innovative Productivity Tools</span>
            </h2>
            <p className="mt-3 text-sm font-medium text-indigo-100 leading-relaxed">
              Semua data disimpan lokal di browser. Tanpa backend, tanpa akun rumit.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full mt-2">
            {FEATURES_LIST.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.label}
                  className="bg-white/10 border border-white/15 rounded-2xl px-4 py-3 flex items-center gap-3 backdrop-blur-sm"
                >
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-black text-white leading-tight">{f.label}</div>
                    <div className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Module</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: FORM */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex flex-col items-center mb-6 animate-fade-in-up">
            <div className="animate-float">
              <NekoMascotFull className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md" animate={false} />
            </div>
            <div className="flex items-center gap-2 mt-3">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg p-1.5">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                Prodi<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">fy</span>
              </h1>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-[2rem] shadow-2xl shadow-slate-200/60 border border-white p-5 sm:p-7 md:p-10 animate-fade-in-up">
            <div className="mb-6 text-center">
              <h2 className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight">Mulai Sekarang</h2>
              <p className="text-slate-500 mt-1.5 text-sm font-medium">
                Frontend-only: isi 3 data berikut untuk membuat sesi lokal.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 sm:gap-4">
              <div className="relative group">
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Nama Lengkap"
                  value={form.name}
                  className="w-full bg-slate-50 border border-slate-200 group-focus-within:border-indigo-400 rounded-2xl px-4 py-3.5 pl-12 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-800 placeholder:text-slate-400 font-medium text-sm"
                  onChange={handleChange}
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <UserIcon className="w-5 h-5" />
                </div>
              </div>

              <div className="relative group">
                <input
                  type="text"
                  name="university"
                  placeholder="Asal Universitas"
                  value={form.university}
                  className="w-full bg-slate-50 border border-slate-200 group-focus-within:border-indigo-400 rounded-2xl px-4 py-3.5 pl-12 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-800 placeholder:text-slate-400 font-medium text-sm"
                  onChange={handleChange}
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <GraduationCap className="w-5 h-5" />
                </div>
              </div>

              <div className="relative group">
                <input
                  type="number"
                  name="targetIpk"
                  placeholder="Target IPK (opsional)"
                  step="0.01"
                  min="0"
                  max="4.00"
                  value={form.targetIpk}
                  className="w-full bg-slate-50 border border-slate-200 group-focus-within:border-indigo-400 rounded-2xl px-4 py-3.5 pl-11 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-800 placeholder:text-slate-400 font-medium text-sm"
                  onChange={handleChange}
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Target className="w-4 h-4" />
                </div>
              </div>

              {error && (
                <div className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl px-4 py-4 font-bold transition-all shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 active:scale-95 text-base cursor-pointer"
              >
                Masuk ke Dashboard <ArrowRight className="w-5 h-5" />
              </button>
            </form>

            <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mt-6 text-[11px] sm:text-xs text-slate-400 font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Data lokal
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Tanpa backend
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                Sesi instan
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

