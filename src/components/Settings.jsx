import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    Bell, Shield, Monitor, LogOut, Check, Trash2, X, AlertTriangle,
    Download, Upload, Zap, BookOpen, Clock, FileJson, Brain, Eye
} from 'lucide-react';

// Import helper storage aman
import { dispatchProdifySync, getJson, setJson } from '../utils/storage';
import { prodifyAlert, prodifyToast } from '../utils/popup';

export default function Settings({ onLogout }) {
    const [settings, setSettings] = useState(() => {
        const defaults = {
            darkMode: false,
            dashboardZenMode: false,
            reducedMotion: false,
            fontScale: 'normal', // normal | large | xlarge
            notifications: true,
            urgentReminders: true,    // Deadline < 2 Jam
            habitReminders: true,     // Habit harian
            focusSounds: true,        // Suara alarm Deep Focus
            strictFocusMode: true,    // Anti-tab out Deep Focus
            autoSaveNotes: true,      // ZenNotes
            autoCognitiveGuard: false // DITAMBAHKAN: Auto Cognitive Guard (Default False)
        };
        const saved = getJson('prodify_settings', null);
        return saved ? { ...defaults, ...saved } : defaults;
    });

    const [savedMessage, setSavedMessage] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const fileInputRef = useRef(null);

    const deleteConfirmToken = (() => {
        const profileInfo = getJson('prodify_profileInfo', {});
        const fromProfile = profileInfo?.username;
        const userSession = getJson('prodify_user', {});
        const fromUser = userSession?.name;
        const raw = (fromProfile || fromUser || 'student').toString();
        return raw.trim().toLowerCase().replace(/\s+/g, '');
    })();

    // Menghitung estimasi penggunaan LocalStorage secara Real-Time
    const calculateStorage = () => {
        // localStorage itu per-origin. Di localhost, beberapa project bisa berbagi origin yang sama.
        // Jadi hitung hanya key milik aplikasi (prefix Prodify).
        const prefixes = ['prodify_', 'zen_', 'matrix_', 'forest_', 'time_blocks'];
        let totalBytes = 0;

        for (let key in localStorage) {
            if (!Object.prototype.hasOwnProperty.call(localStorage, key)) continue;
            if (!prefixes.some((p) => key.startsWith(p))) continue;
            const value = localStorage.getItem(key) || '';
            totalBytes += ((value.length + key.length) * 2); // UTF-16 (2 bytes per char)
        }

        return totalBytes / 1024 / 1024; // MB
    };

    const usedStorageMB = calculateStorage();
    const usedStorageMBText = usedStorageMB.toFixed(2);
    const storagePercent = Math.min((usedStorageMB / 5.0) * 100, 100);
    const isDeleteConfirmed = deleteConfirmText.trim().toLowerCase().replace(/\s+/g, '') === deleteConfirmToken;

    const setSettingValue = (key, value) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        setJson('prodify_settings', newSettings);

        // TRIGGER GLOBAL DARK MODE
        if (key === 'darkMode') {
            if (newSettings.darkMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            window.dispatchEvent(new Event('themeChanged'));
        }

        setSavedMessage('Pengaturan disimpan otomatis');
        setTimeout(() => setSavedMessage(''), 2000);
    };

    const handleToggle = (key) => setSettingValue(key, !settings[key]);

    const showNotification = (msg) => {
        setSavedMessage(msg);
        setTimeout(() => setSavedMessage(''), 3000);
    };

    const isProdifyKey = (key) => {
        return (
            typeof key === 'string'
            && (key.startsWith('prodify_') || key.startsWith('zen_') || key.startsWith('matrix_') || key.startsWith('time_') || key.startsWith('forest_'))
        );
    };

    // FITUR EKSPOR DATA LOKAL UTUH (BACKUP)
    const handleExportData = () => {
        try {
            const storageOptions = typeof window !== 'undefined' && window.sessionStorage.getItem('isDemoMode') === 'true' ? window.sessionStorage : localStorage;
            const data = {};
            Object.keys(storageOptions).forEach((key) => {
                if (!isProdifyKey(key)) return;
                const val = storageOptions.getItem(key);
                if (val == null) return;
                try {
                    data[key] = JSON.parse(val);
                } catch {
                    data[key] = val; // Fallback untuk string murni
                }
            });

            const payload = {
                __meta__: {
                    app: 'Prodify',
                    version: 1,
                    exportedAt: new Date().toISOString(),
                    demoMode: (typeof window !== 'undefined') && (storageOptions === window.sessionStorage),
                },
                data,
            };

            // Export file JSON (Blob lebih aman daripada data: URL untuk file besar)
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute('href', url);
            downloadAnchorNode.setAttribute('download', 'prodify_backup.json');
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            setTimeout(() => URL.revokeObjectURL(url), 2000);

            showNotification("Data berhasil diekspor! (Backup Selesai)");
        } catch (error) {
            prodifyAlert({ title: 'Ekspor Gagal', message: 'Gagal mengekspor data.' });
            console.error(error);
        }
    };

    // FITUR IMPOR DATA LOKAL UTUH (RESTORE)
    const handleImportData = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                const importedData = parsed?.data && typeof parsed.data === 'object' ? parsed.data : parsed;
                const storageOptions = typeof window !== 'undefined' && window.sessionStorage.getItem('isDemoMode') === 'true' ? window.sessionStorage : localStorage;

                // Bersihkan hanya key milik Prodify, lalu restore dari file (menghindari injeksi key asing).
                Object.keys(storageOptions).forEach((key) => {
                    if (isProdifyKey(key)) storageOptions.removeItem(key);
                });

                Object.keys(importedData || {}).forEach(key => {
                    if (!isProdifyKey(key)) return;
                    const valueToStore = typeof importedData[key] === 'object' ? JSON.stringify(importedData[key]) : importedData[key];
                    storageOptions.setItem(key, valueToStore);
                });
                dispatchProdifySync();
                showNotification("Data berhasil dipulihkan! Memuat ulang...");
                setTimeout(() => window.location.reload(), 1500); // Reload agar seluruh state merender ulang
            } catch {
                prodifyAlert({ title: 'Impor Gagal', message: 'File backup tidak valid atau rusak.' });
            }
        };
        reader.readAsText(file);
    };

    const handleClearLocalData = () => {
        // Hapus data fungsional dari Storage yang aktif (Bisa jadi Session di Demo)
        const storageOptions = typeof window !== 'undefined' && window.sessionStorage.getItem('isDemoMode') === 'true' ? window.sessionStorage : localStorage;
        storageOptions.removeItem('prodify_tasks');
        storageOptions.removeItem('matrix_tasks');
        storageOptions.removeItem('time_blocks');
        storageOptions.removeItem('prodify_habits_v4');
        storageOptions.removeItem('forest_stats');
        storageOptions.removeItem('zen_pages_multi');

        setSavedMessage('Data lokal fungsional berhasil dibersihkan');
        setTimeout(() => setSavedMessage(''), 3000);
        dispatchProdifySync();
    };

    // HARD RESET / HAPUS AKUN TOTAL
    const handleDeleteAccount = () => {
        // Modal yang membuka tombol ini sudah merupakan konfirmasi eksplisit.
        const storageOptions = typeof window !== 'undefined' && window.sessionStorage.getItem('isDemoMode') === 'true' ? window.sessionStorage : localStorage;
        Object.keys(storageOptions).forEach(key => {
            if (key.startsWith('prodify_') || key.startsWith('zen_') || key.startsWith('matrix_') || key.startsWith('time_') || key.startsWith('forest_')) {
                storageOptions.removeItem(key);
            }
        });

        dispatchProdifySync();
        prodifyToast("Sistem berhasil di-reset. Sampai jumpa kembali!", { variant: 'success' });
        onLogout();
        window.location.reload();
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in-up pb-20 lg:pb-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm transition-colors gap-4">
                <div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white transition-colors">Pengaturan Sistem</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1 transition-colors">Kelola fungsionalitas fitur, preferensi, dan keamanan data Anda.</p>
                </div>
                {savedMessage && (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 px-4 py-2.5 rounded-full flex items-center gap-2 animate-pulse shadow-sm whitespace-nowrap">
                        <Check className="w-4 h-4" /> {savedMessage}
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Kiri: Preferensi Fitur */}
                <div className="space-y-6">
                    {/* Tampilan Visual */}
                    <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-[2rem] border border-slate-200 dark:border-slate-700/60 p-6 md:p-8 shadow-sm transition-colors">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl"><Monitor className="w-5 h-5" /></div>
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white transition-colors">Antarmuka Visual</h3>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-white transition-colors">Mode Gelap (Dark Mode)</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 transition-colors">Lebih nyaman di mata untuk belajar malam</p>
                            </div>
                            <Toggle isOn={settings.darkMode} onClick={() => handleToggle('darkMode')} />
                        </div>

                        <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                            <div className="pr-4">
                                <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-emerald-500" /> Zen Dashboard</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 transition-colors">Sembunyikan chart & metrik kompleks di Dashboard, tampilkan Action Items saja.</p>
                            </div>
                            <Toggle isOn={!!settings.dashboardZenMode} onClick={() => handleToggle('dashboardZenMode')} />
                        </div>
                    </div>

                    {/* Aksesibilitas & Tweaks */}
                    <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-[2rem] border border-slate-200 dark:border-slate-700/60 p-6 md:p-8 shadow-sm transition-colors">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                            <div className="p-2.5 bg-teal-50 dark:bg-teal-500/10 text-teal-600 rounded-xl"><Shield className="w-5 h-5" /></div>
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white transition-colors">Aksesibilitas</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="pr-4">
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">Reduced Motion</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Kurangi animasi untuk menghindari motion sickness & mempercepat di laptop juri.</p>
                                </div>
                                <Toggle isOn={!!settings.reducedMotion} onClick={() => handleToggle('reducedMotion')} />
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <div className="pr-4">
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">Ukuran Teks</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Biar terbaca jelas saat presentasi di proyektor.</p>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-1">
                                    {[
                                        { id: 'normal', label: 'Normal' },
                                        { id: 'large', label: 'Besar' },
                                        { id: 'xlarge', label: 'XL' },
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setSettingValue('fontScale', opt.id)}
                                            aria-pressed={settings.fontScale === opt.id}
                                            className={`px-3 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer ${settings.fontScale === opt.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
                                <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Shortcut Penting</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {[
                                        { k: 'Ctrl + Shift + B', v: 'Cognitive Guard (Breathing)' },
                                        { k: 'Ctrl + Shift + D', v: 'Inject Demo Data (Landing)' },
                                    ].map((it) => (
                                        <div key={it.k} className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3">
                                            <span className="text-xs font-black text-slate-700 dark:text-slate-200">{it.v}</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg whitespace-nowrap">{it.k}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Konfigurasi Fitur Aplikasi */}
                    <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-[2rem] border border-slate-200 dark:border-slate-700/60 p-6 md:p-8 shadow-sm transition-colors">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                            <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded-xl"><Zap className="w-5 h-5" /></div>
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white transition-colors">Konfigurasi Fitur</h3>
                        </div>

                        <div className="space-y-6">
                            {/* DITAMBAHKAN: Auto Cognitive Guard */}
                            <div className="flex items-center justify-between">
                                <div className="pr-4">
                                    <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5"><Brain className="w-3.5 h-3.5 text-teal-500" /> Auto-Cognitive Guard</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Otomatis munculkan layar relaksasi saat beban tugas harian melebihi kapasitas mental.</p>
                                </div>
                                <Toggle isOn={settings.autoCognitiveGuard} onClick={() => handleToggle('autoCognitiveGuard')} />
                            </div>

                            {/* Notifikasi Global */}
                            <div className="flex items-center justify-between">
                                <div className="pr-4">
                                    <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5"><Bell className="w-3.5 h-3.5 text-slate-400" /> Notifikasi Cerdas</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Izinkan Prodify memunculkan lencana notifikasi (*bell*).</p>
                                </div>
                                <Toggle isOn={settings.notifications} onClick={() => handleToggle('notifications')} />
                            </div>

                            {/* Pengingat Deadline */}
                            <div className="flex items-center justify-between">
                                <div className="pr-4">
                                    <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-rose-400" /> Peringatan Deadline Kritis</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Munculkan *pop-up* 2 jam sebelum tugas TimeManager hangus.</p>
                                </div>
                                <Toggle isOn={settings.urgentReminders} onClick={() => handleToggle('urgentReminders')} disabled={!settings.notifications} />
                            </div>

                            {/* Deep Focus Strict Mode */}
                            <div className="flex items-center justify-between">
                                <div className="pr-4">
                                    <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-purple-400" /> Mode Fokus Ketat</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Pohon Deep Focus akan mati jika Anda pindah *tab* browser.</p>
                                </div>
                                <Toggle isOn={settings.strictFocusMode} onClick={() => handleToggle('strictFocusMode')} />
                            </div>

                            {/* Auto Save Notes */}
                            <div className="flex items-center justify-between">
                                <div className="pr-4">
                                    <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-emerald-400" /> Auto-Save ZenNotes</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Simpan ketikan otomatis setiap 800ms secara lokal.</p>
                                </div>
                                <Toggle isOn={settings.autoSaveNotes} onClick={() => handleToggle('autoSaveNotes')} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Kanan: Manajemen Data (FAQ Dihapus) */}
                <div className="space-y-6">
                    {/* Backup & Restore Data */}
                    <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-[2rem] border border-slate-200 dark:border-slate-700/60 p-6 md:p-8 shadow-sm transition-colors h-full flex flex-col">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6 shrink-0">
                            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-xl"><FileJson className="w-5 h-5" /></div>
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white transition-colors">Manajemen Data</h3>
                        </div>

                        <div className="flex-1">
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                                Aplikasi ini berjalan tanpa database eksternal. Pindahkan profil, catatan, dan progres Anda ke perangkat lain dengan mengunduh file <strong className="text-emerald-600 dark:text-emerald-400">.json</strong> ini.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                                <button onClick={handleExportData} className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded-xl font-bold text-sm transition-colors cursor-pointer">
                                    <Upload className="w-4 h-4" /> Ekspor (Backup)
                                </button>
                                <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-sm transition-colors cursor-pointer">
                                    <Download className="w-4 h-4" /> Impor (Restore)
                                    <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportData} className="hidden" />
                                </button>
                            </div>

                            {/* BAGIAN PROGRESS BAR KAPASITAS YANG DIUPDATE */}
                            <div className="pb-6 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex justify-between items-end mb-2">
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">Kapasitas Penyimpanan Lokal</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{usedStorageMBText} MB / 5.0 MB</p>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 shadow-inner relative overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-1000 ${storagePercent > 80 ? 'bg-rose-500' : storagePercent > 50 ? 'bg-amber-500' : 'bg-indigo-600'}`} style={{ width: `${storagePercent}%` }}>
                                        <div className="absolute right-0 top-0 bottom-0 w-6 bg-white/20 animate-pulse rounded-r-full"></div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-2">
                                    *Jika sering pakai whiteboard (ZenNotes), disarankan rutin ekspor PDF & backup JSON.
                                </p>
                            </div>

                            <div className="pt-6 flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">Reset Fungsional</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Hapus catatan & tugas (Akun aman)</p>
                                </div>
                                <button onClick={handleClearLocalData} className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 transition-all cursor-pointer shadow-sm">
                                    Bersihkan Data
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* DANGER ZONE (FULL WIDTH) */}
            <div className="bg-gradient-to-r from-rose-50 to-white dark:from-rose-950/30 dark:to-slate-900 rounded-[2rem] border border-rose-200 dark:border-rose-900/50 p-6 md:p-8 shadow-sm transition-colors mt-2">
                <h4 className="text-xs font-black text-rose-600 dark:text-rose-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Zona Berbahaya
                </h4>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
                    <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">Keluar atau Hapus Akun</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md leading-relaxed">Menghapus akun akan memusnahkan secara permanen seluruh data profil dan *cache* lokal dari browser Anda.</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                        <button
                            onClick={onLogout}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer"
                        >
                            <LogOut className="w-4 h-4 text-slate-400" /> Log Out
                        </button>

                        <button
                            onClick={() => { setDeleteConfirmText(''); setShowDeleteModal(true); }}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-rose-600/20 cursor-pointer"
                        >
                            <Trash2 className="w-4 h-4" /> Hapus Akun
                        </button>
                    </div>
                </div>
            </div>

            {/* MODAL KONFIRMASI HAPUS AKUN */}
            {showDeleteModal && createPortal(
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden animate-fade-in-up text-center p-8 relative">
                        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <AlertTriangle className="w-10 h-10" strokeWidth={2.5} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-3">Hapus Akun Permanen?</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-8 leading-relaxed">
                            Tindakan ini tidak dapat dibatalkan. Seluruh data profil, catatan (ZenNotes), tugas, dan rutinitas Anda akan <strong className="text-rose-600 dark:text-rose-400">terhapus selamanya</strong> dari perangkat ini.
                        </p>

                        <div className="flex flex-col gap-3 relative z-10">
                            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl p-4 text-left">
                                <p className="text-xs font-black text-rose-700 dark:text-rose-300 uppercase tracking-widest">Konfirmasi Wajib</p>
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-2 leading-relaxed">
                                    Ketik username berikut untuk melanjutkan: <span className="font-black text-rose-600 dark:text-rose-400">@{deleteConfirmToken}</span>
                                </p>
                                <input
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    placeholder={`Ketik @${deleteConfirmToken} untuk konfirmasi`}
                                    autoFocus
                                    className="mt-3 w-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-500/30 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-rose-500"
                                />
                            </div>

                            <button
                                onClick={handleDeleteAccount}
                                disabled={!isDeleteConfirmed}
                                className={`w-full py-4 text-white font-bold rounded-xl shadow-lg transition-all ${isDeleteConfirmed ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20 cursor-pointer' : 'bg-rose-300 dark:bg-rose-900/40 cursor-not-allowed opacity-70'}`}
                                title={isDeleteConfirmed ? 'Hapus semua data sekarang' : 'Ketik username untuk mengaktifkan tombol'}
                            >
                                Ya, Musnahkan Semua Data
                            </button>
                            <button onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }} className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl transition-all cursor-pointer">
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
                , document.body)}
        </div>
    );
}

function Toggle({ isOn, onClick, disabled = false }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} shadow-inner ${isOn ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${isOn ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    );
}
