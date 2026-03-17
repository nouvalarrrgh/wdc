import React, { useEffect, useMemo, useState } from 'react';
import { User, Mail, GraduationCap, MapPin, Camera, Save, Phone, AtSign, TreePine, Award, BadgeCheck, Lock, Timer, CalendarCheck2, BookOpen } from 'lucide-react';
import { getJson, setJson } from '../utils/storage';
import { makeAvatarDataUri } from '../utils/avatar';
import { compressImageFileToDataUrl } from '../utils/image';
import { prodifyAlert } from '../utils/popup';

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
    const [habitsTick, setHabitsTick] = useState(0);
    const [syncTick, setSyncTick] = useState(0);

    const [forestStats, setForestStats] = useState(() => getJson('forest_stats', { planted: 0, dead: 0 }));

    useEffect(() => {
        const sync = (e) => {
            const key = e?.key || e?.detail?.key;
            if (!key || key === 'forest_stats' || key === 'prodify_habits_v4') {
                setForestStats(getJson('forest_stats', { planted: 0, dead: 0 }));
            }
            if (!key || key === 'prodify_habits_v4') setHabitsTick((n) => n + 1);
            if (!key || key === 'prodify_tasks' || key === 'zen_pages_multi' || String(key).startsWith('forest_today_')) setSyncTick((n) => n + 1);
        };
        window.addEventListener('storage', sync);
        window.addEventListener('prodify-sync', sync);
        return () => {
            window.removeEventListener('storage', sync);
            window.removeEventListener('prodify-sync', sync);
        };
    }, []);
    const { level, exp, title } = useMemo(() => {
        const habits = getJson('prodify_habits_v4', []);
        const planted = forestStats?.planted || 0;

        const totalExp = (habits.reduce((acc, h) => acc + (h?.streak || 0), 0) * 10) + (planted * 25);
        const computedLevel = Math.floor(totalExp / 100) + 1;

        const getTitle = (lv) => {
            if (lv >= 25) return 'Deep Work Master';
            if (lv >= 18) return 'Discipline Architect';
            if (lv >= 12) return 'Consistency Builder';
            if (lv >= 7) return 'Momentum Seeker';
            return 'Novice Scholar';
        };

        return { level: computedLevel, exp: totalExp, title: getTitle(computedLevel) };
    }, [forestStats?.planted, habitsTick]);

    const forestSlots = 12;
    const forestFill = Math.min(forestSlots, Math.max(1, Math.floor(level * 0.8) + Math.floor((forestStats?.planted || 0) / 20)));

    const achievements = useMemo(() => {
        const localDateKey = (() => {
            const d = new Date();
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            return d.toISOString().split('T')[0];
        })();

        const focusToday = parseInt(getJson(`forest_today_${localDateKey}`, '0'), 10) || 0;
        const deadlines = getJson('prodify_tasks', []);
        const onTimeCompleted = deadlines.filter((t) => {
            if (!t?.completed) return false;
            if (!t?.deadline) return false;
            if (!t?.completedAt) return false;
            const doneAt = new Date(t.completedAt).getTime();
            const dueAt = new Date(t.deadline).getTime();
            return Number.isFinite(doneAt) && Number.isFinite(dueAt) && doneAt <= dueAt;
        }).length;

        const notesCount = (getJson('zen_pages_multi', []) || []).length;

        return [
            {
                id: 'iron_focus',
                title: 'Iron Focus',
                desc: 'Selesaikan 5 sesi Deep Focus dalam 1 hari.',
                icon: Timer,
                unlocked: focusToday >= 5,
            },
            {
                id: 'master_of_time',
                title: 'Master of Time',
                desc: 'Selesaikan 10 tugas sebelum deadline.',
                icon: CalendarCheck2,
                unlocked: onTimeCompleted >= 10,
            },
            {
                id: 'forest_builder',
                title: 'Forest Builder',
                desc: 'Tanam minimal 25 pohon lewat sesi fokus.',
                icon: TreePine,
                unlocked: (forestStats?.planted || 0) >= 25,
            },
            {
                id: 'note_scholar',
                title: 'Note Scholar',
                desc: 'Buat 10 catatan (ZenNotes) untuk kuliah & project.',
                icon: BookOpen,
                unlocked: notesCount >= 10,
            },
        ];
    }, [syncTick, forestStats?.planted]);

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

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const dataUrl = await compressImageFileToDataUrl(file, {
                maxDimension: 300,
                maxBytes: 100 * 1024,
                preferType: 'image/webp',
                quality: 0.72,
            });
            const updatedProfile = { ...profile, avatar: dataUrl };
            setProfile(updatedProfile);
            setJson('prodify_profileInfo', updatedProfile);
        } catch (err) {
            console.error(err);
            await prodifyAlert({ title: 'Upload Gagal', message: "Gagal memproses foto profil. Coba gunakan gambar lain atau crop lebih kecil." });
        } finally {
            // allow re-upload same file
            e.target.value = '';
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
                            src={profile.avatar || makeAvatarDataUri(profile.name || 'Student')}
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

                {/* Details (utility) + Showcase (non-analytic) */}
                <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-[2rem] border border-slate-200 dark:border-slate-700/60 p-6 md:p-8 shadow-sm md:col-span-2 transition-colors space-y-6">
                    {/* Kartu Mahasiswa Virtual */}
                    <div className="bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-950/35 dark:to-slate-900 border border-indigo-100 dark:border-indigo-500/20 rounded-3xl p-5 md:p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-100/70 dark:bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-2xl pointer-events-none" />
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-300">ID Card</p>
                                <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-white mt-1 flex items-center gap-2">
                                    <Award className="w-5 h-5 text-amber-500" /> {title}
                                </h3>
                                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">
                                    Level <span className="font-black text-indigo-600 dark:text-indigo-400">{level}</span> • EXP <span className="font-black text-slate-800 dark:text-white">{exp}</span>
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="px-4 py-3 bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Forest</p>
                                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2 mt-1">
                                        <TreePine className="w-5 h-5" /> {forestStats?.planted || 0} Pohon
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Forest Sandbox (visual reward) */}
                    <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/50 rounded-3xl p-5 md:p-6 relative overflow-hidden">
                        <div className="absolute inset-0 pointer-events-none opacity-60 dark:opacity-40" style={{ backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.18) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
                        <div className="relative z-10">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h4 className="text-sm font-black text-slate-800 dark:text-white tracking-tight">Forest Sandbox</h4>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 max-w-md leading-relaxed">
                                        Ini bukan analitik produktivitas — ini “lemari piala” visual. Semakin naik level, kebunmu makin rindang.
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Stage</p>
                                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{Math.min(5, Math.floor(level / 5) + 1)}/5</p>
                                </div>
                            </div>

                            <div className="mt-5 grid grid-cols-6 gap-2">
                                {Array.from({ length: forestSlots }, (_, i) => {
                                    const isOn = i < forestFill;
                                    const size = i % 3 === 0 ? 26 : i % 3 === 1 ? 22 : 20;
                                    return (
                                        <div key={i} className={`flex items-center justify-center rounded-2xl border shadow-sm transition-colors ${isOn ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 opacity-60'}`}>
                                            <TreePine
                                                className={`${isOn ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-600'}`}
                                                style={{ width: size, height: size }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Achievements / Badges (Gamer Student) */}
                    <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/50 rounded-3xl p-5 md:p-6">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h4 className="text-sm font-black text-slate-800 dark:text-white tracking-tight">Achievements</h4>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                                    Badge otomatis terbuka dari data lokal (tanpa backend).
                                </p>
                            </div>
                            <div className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[11px] font-black uppercase tracking-widest">
                                Gamer Mode
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {achievements.map((a) => {
                                const Icon = a.icon;
                                return (
                                    <div key={a.id} className={`relative overflow-hidden rounded-3xl border p-4 transition-colors ${a.unlocked ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50'}`}>
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2.5 rounded-2xl border shadow-sm ${a.unlocked ? 'bg-white/80 dark:bg-slate-900/40 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-white/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-sm font-black ${a.unlocked ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-200'}`}>{a.title}</p>
                                                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{a.desc}</p>
                                            </div>
                                            {a.unlocked ? (
                                                <BadgeCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" title="Unlocked" />
                                            ) : (
                                                <Lock className="w-5 h-5 text-slate-400 dark:text-slate-600" title="Locked" />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
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
        </div>
    );
}
