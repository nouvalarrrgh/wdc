import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    Bell, Shield, Monitor, LogOut, Check, Trash2, X, AlertTriangle,
    Download, Upload, Zap, BookOpen, Clock, FileJson, Brain
} from 'lucide-react';

// Import helper storage aman
import { getJson, setJson } from '../utils/storage';

export default function Settings({ onLogout }) {
    const [settings, setSettings] = useState(() => {
        const defaults = {
            darkMode: false,
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
    const fileInputRef = useRef(null);

    // Menghitung estimasi penggunaan LocalStorage secara Real-Time
    const calculateStorage = () => {
        let total = 0;
        for (let x in localStorage) {
            if (!localStorage.hasOwnProperty(x)) continue;
            total += ((localStorage[x].length + x.length) * 2);
        }
        return (total / 1024 / 1024).toFixed(2); // Konversi byte ke MB
    };

    const usedStorageMB = calculateStorage();
    const storagePercent = Math.min((usedStorageMB / 5.0) * 100, 100);

    const handleToggle = (key) => {
        const newSettings = { ...settings, [key]: !settings[key] };
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

    const showNotification = (msg) => {
        setSavedMessage(msg);
        setTimeout(() => setSavedMessage(''), 3000);
    };

    // FITUR EKSPOR DATA LOKAL UTUH (BACKUP)
    const handleExportData = () => {
        try {
            const keysToExport = [
                'prodify_user', 'prodify_settings', 'zen_pages_multi', 'matrix_tasks',
                'prodify_tasks', 'time_blocks', 'prodify_habits_v4', 'forest_stats',
                'prodify_radar_scores', 'prodify_login_streak', 'prodify_academic_schedule',
                'prodify_profileInfo', 'prodify_global_goal', 'prodify_balance_state', 'prodify_guide_finished'
            ];

            const storageOptions = typeof window !== 'undefined' && window.sessionStorage.getItem('isDemoMode') === 'true' ? window.sessionStorage : localStorage;
            const allData = {};
            keysToExport.forEach(key => {
                const val = storageOptions.getItem(key);
                if (val) {
                    try {
                        allData[key] = JSON.parse(val);
                    } catch {
                        allData[key] = val; // Fallback cerdas untuk data string murni
                    }
                }
            });

            // Export file JSON
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `Prodify_Backup_${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();

            showNotification("Data berhasil diekspor! (Backup Selesai)");
        } catch (error) {
            alert("Gagal mengekspor data.");
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
                const importedData = JSON.parse(event.target.result);
                const storageOptions = typeof window !== 'undefined' && window.sessionStorage.getItem('isDemoMode') === 'true' ? window.sessionStorage : localStorage;
                Object.keys(importedData).forEach(key => {
                    const valueToStore = typeof importedData[key] === 'object' ? JSON.stringify(importedData[key]) : importedData[key];
                    storageOptions.setItem(key, valueToStore);
                });
                window.dispatchEvent(new Event('storage'));
                showNotification("Data berhasil dipulihkan! Memuat ulang...");
                setTimeout(() => window.location.reload(), 1500); // Reload agar seluruh state merender ulang
            } catch (error) {
                alert("File backup tidak valid atau rusak!");
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
        window.dispatchEvent(new Event('storage'));
    };

    // HARD RESET / HAPUS AKUN TOTAL
    const handleDeleteAccount = () => {
        if (window.confirm("PERINGATAN ZONA BAHAYA!\n\nTindakan ini akan melenyapkan SELURUH data produktivitas, catatan, jadwal, profil, dan pengaturan Anda dari browser ini secara permanen. Anda akan dikembalikan ke halaman login.\n\nApakah Anda benar-benar yakin?")) {

            // LOGIKA MASTER: Sapu bersih SEMUA key milik Prodify secara dinamis!
            const storageOptions = typeof window !== 'undefined' && window.sessionStorage.getItem('isDemoMode') === 'true' ? window.sessionStorage : localStorage;
            Object.keys(storageOptions).forEach(key => {
                if (key.startsWith('prodify_') || key.startsWith('zen_') || key.startsWith('matrix_') || key.startsWith('time_') || key.startsWith('forest_')) {
                    storageOptions.removeItem(key);
                }
            });

            window.dispatchEvent(new Event('storage'));
            alert("Sistem berhasil di-reset. Sampai jumpa kembali!");
            onLogout(); // Panggil fungsi logout dari App.jsx
            window.location.reload(); // Memaksa browser memuat ulang dan me-logout user
        } else {
            setShowDeleteModal(false);
        }
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
                                    <Download className="w-4 h-4" /> Ekspor (Backup)
                                </button>
                                <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-sm transition-colors cursor-pointer">
                                    <Upload className="w-4 h-4" /> Impor (Restore)
                                    <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportData} className="hidden" />
                                </button>
                            </div>

                            {/* BAGIAN PROGRESS BAR KAPASITAS YANG DIUPDATE */}
                            <div className="pb-6 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex justify-between items-end mb-2">
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">Kapasitas Penyimpanan Lokal</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{usedStorageMB} MB / 5.0 MB</p>
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
                            onClick={() => setShowDeleteModal(true)}
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
                            <button onClick={handleDeleteAccount} className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-600/20 transition-all cursor-pointer">
                                Ya, Musnahkan Semua Data
                            </button>
                            <button onClick={() => setShowDeleteModal(false)} className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl transition-all cursor-pointer">
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
