import React, { useState, useEffect } from 'react';
import { User, Mail, GraduationCap, MapPin, Camera, Save, Phone, AtSign, Flame, CheckCircle2, TreePine, BarChart2, AlertTriangle } from 'lucide-react';
import { getJson, setJson } from '../utils/storage';

const getInitialProfile = () => {
    const baseProfile = {
        name: '',
        username: '',
        email: '',
        university: '',
        major: '',
        location: '',
        phone: '',
        portfolio: '',
        bio: '',
        avatar: ''
    };

    const savedInfo = getJson('prodify_profileInfo', null);
    const userSession = getJson('prodify_user', {});

    if (savedInfo) {
        if (userSession.name) savedInfo.name = userSession.name;
        if (userSession.email) savedInfo.email = userSession.email;
        if (!savedInfo.username) savedInfo.username = (userSession.name || 'student').toLowerCase().replace(/\s+/g, '');
        return { ...baseProfile, ...savedInfo };
    }

    if (userSession.name) {
        return {
            ...baseProfile,
            name: userSession.name,
            username: userSession.name.toLowerCase().replace(/\s+/g, ''),
            email: userSession.email || 'mahasiswa@kampus.ac.id',
            university: 'Belum diisi',
            major: 'Belum diisi'
        };
    }

    return baseProfile;
};

export default function Profile() {
    const [profile, setProfile] = useState(getInitialProfile);
    const [isEditing, setIsEditing] = useState(false);
    const [summary, setSummary] = useState({
        treesPlanted: 0,
        longestStreak: 0,
        avgRadar: 0,
        completedTasks: 0,
    });

    useEffect(() => {
        const streakData = getJson('prodify_login_streak', { streak: 0 });
        const deadlineTasks = getJson('prodify_tasks', []);
        const matrixTasks = getJson('matrix_tasks', []);
        const completedTasks = deadlineTasks.filter(t => t.completed).length + matrixTasks.filter(t => t.completed).length;
        const habits = getJson('prodify_habits_v4', []);
        const forestStats = getJson('forest_stats', { planted: 0 });
        const radarScores = getJson('prodify_radar_scores', { akademik: 50, organisasi: 50, istirahat: 50, sosial: 50, tugas: 50 });

        const habitLongest = habits.reduce((acc, h) => Math.max(acc, h?.streak || 0), 0);
        const longestStreak = Math.max(streakData.streak || 0, habitLongest);

        const radarVals = Object.values(radarScores || {})
            .map((v) => (typeof v === 'number' ? v : parseFloat(v)))
            .filter((n) => Number.isFinite(n));
        const avgRadar = radarVals.length ? Math.round(radarVals.reduce((a, b) => a + b, 0) / radarVals.length) : 0;

        setSummary({
            treesPlanted: forestStats?.planted || 0,
            longestStreak,
            avgRadar,
            completedTasks,
        });
    }, []);

    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        // Sanitasi username jika diedit
        const cleanedProfile = { ...profile, username: profile.username.trim().toLowerCase().replace(/\s+/g, '') };
        setJson('prodify_profileInfo', cleanedProfile);

        const userSession = getJson('prodify_user', {});
        userSession.name = cleanedProfile.name;
        setJson('prodify_user', userSession);

        setProfile(cleanedProfile);
        setIsEditing(false);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2.5 * 1024 * 1024) {
                alert("Ukuran gambar terlalu besar! Maksimal 2.5MB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result;
                const updatedProfile = { ...profile, avatar: base64String };
                setProfile(updatedProfile);
                setJson('prodify_profileInfo', updatedProfile);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleResetAccount = () => {
        const ok = window.confirm('Reset akun akan menghapus seluruh data Prodify di browser ini. Lanjutkan?');
        if (!ok) return;
        try {
            localStorage.clear();
            window.sessionStorage?.clear?.();
        } finally {
            window.location.reload();
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in-up pb-20 lg:pb-0 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm transition-colors">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Profil Mahasiswa</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Kelola informasi pribadi dan identitas akademismu.</p>
                </div>
                <button
                    onClick={isEditing ? handleSave : () => setIsEditing(true)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md cursor-pointer ${isEditing
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                        }`}
                >
                    {isEditing ? <><Save className="w-4 h-4" /> Simpan Profil</> : 'Edit Profil'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Avatar Section */}
                <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-[2rem] border border-slate-200 dark:border-slate-700/60 p-8 flex flex-col items-center justify-center gap-4 shadow-sm md:col-span-1 relative overflow-hidden transition-colors h-fit">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-500/10 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none" />

                    <div className="relative group z-10">
                        <img
                            src={profile.avatar || `https://ui-avatars.com/api/?name=${profile.name || 'Student'}&background=4F46E5&color=fff&size=512&bold=true`}
                            alt="Profile"
                            className="w-32 h-32 rounded-full ring-4 ring-indigo-50 dark:ring-indigo-900 shadow-xl object-cover transition-transform group-hover:scale-105"
                        />
                        <label
                            className="absolute bottom-1 right-1 bg-white dark:bg-slate-800 p-2.5 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all z-20 text-slate-500 dark:text-slate-400 group-hover:scale-110"
                            title="Ganti Foto Profil"
                        >
                            <Camera className="w-4 h-4" />
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                    </div>
                    <div className="text-center z-10 mt-2">
                        <h3 className="text-xl font-black text-slate-800 dark:text-white">{profile.name || 'Nama Belum Diatur'}</h3>
                        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1 flex items-center justify-center gap-1">
                            <AtSign className="w-3.5 h-3.5" /> {profile.username || 'username'}
                        </p>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 mt-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full shadow-sm">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            Mahasiswa Aktif
                        </span>
                    </div>
                </div>

                {/* Details + Productivity Snapshot */}
                <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-[2rem] border border-slate-200 dark:border-slate-700/60 p-6 md:p-8 shadow-sm md:col-span-2 transition-colors space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                                <TreePine className="w-3.5 h-3.5 text-emerald-400" /> Total Pohon
                            </div>
                            <p className="text-xl font-black text-slate-800 dark:text-white">{summary.treesPlanted}</p>
                            <p className="text-[10px] text-slate-400">Pohon ditanam dari Deep Focus</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                                <Flame className="w-3.5 h-3.5 text-orange-400" /> Longest Streak
                            </div>
                            <p className="text-xl font-black text-slate-800 dark:text-white">{summary.longestStreak}</p>
                            <p className="text-[10px] text-slate-400">Rekor streak tertinggi</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                                <BarChart2 className="w-3.5 h-3.5 text-indigo-400" /> Skor Radar
                            </div>
                            <p className="text-xl font-black text-slate-800 dark:text-white">{summary.avgRadar}%</p>
                            <p className="text-[10px] text-slate-400">Rata-rata evaluasi</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Tugas Selesai
                            </div>
                            <p className="text-xl font-black text-slate-800 dark:text-white">{summary.completedTasks}</p>
                            <p className="text-[10px] text-slate-400">Sejak mulai memakai Prodify</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-indigo-400" /> Nama Lengkap
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={profile.name}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 disabled:opacity-70 disabled:bg-slate-50 dark:disabled:bg-slate-800/30 transition-all"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <AtSign className="w-3.5 h-3.5 text-indigo-400" /> Username
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">@</span>
                                <input
                                    type="text"
                                    name="username"
                                    value={profile.username}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl pl-9 pr-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 disabled:opacity-70 disabled:bg-slate-50 dark:disabled:bg-slate-800/30 transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5 text-indigo-400" /> Alamat Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={profile.email}
                                onChange={handleChange}
                                disabled={true}
                                className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <GraduationCap className="w-3.5 h-3.5 text-indigo-400" /> Universitas / Institut
                            </label>
                            <input
                                type="text"
                                name="university"
                                value={profile.university}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 disabled:opacity-70 disabled:bg-slate-50 dark:disabled:bg-slate-800/30 transition-all"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-indigo-400" /> Lokasi / Kota
                            </label>
                            <input
                                type="text"
                                name="location"
                                value={profile.location}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 disabled:opacity-70 disabled:bg-slate-50 dark:disabled:bg-slate-800/30 transition-all"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-indigo-400" /> Nomor Telepon
                            </label>
                            <input
                                type="text"
                                name="phone"
                                value={profile.phone}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 disabled:opacity-70 disabled:bg-slate-50 dark:disabled:bg-slate-800/30 transition-all"
                            />
                        </div>
                        <div className="flex flex-col gap-2 sm:col-span-2">
                            <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                Biografi / Deskripsi Diri
                            </label>
                            <textarea
                                name="bio"
                                value={profile.bio}
                                onChange={handleChange}
                                disabled={!isEditing}
                                rows={3}
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-4 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-2 ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 disabled:opacity-70 disabled:bg-slate-50 dark:disabled:bg-slate-800/30 transition-all resize-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Danger Zone: Reset Akun */}
            <div className="bg-gradient-to-r from-rose-50 to-white dark:from-rose-950/30 dark:to-slate-900 rounded-[2rem] border border-rose-200 dark:border-rose-900/50 p-6 md:p-8 shadow-sm transition-colors">
                <h4 className="text-xs font-black text-rose-600 dark:text-rose-500 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Zona Berbahaya
                </h4>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
                    <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">Reset Akun</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md leading-relaxed">
                            Menghapus seluruh data lokal (profil, catatan, tugas, habit, dan statistik) agar juri bisa mencoba dari awal.
                        </p>
                    </div>
                    <button
                        onClick={handleResetAccount}
                        className="w-full sm:w-auto px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-rose-600/20 cursor-pointer"
                    >
                        Reset Akun
                    </button>
                </div>
            </div>
        </div>
    );
}
