import { dispatchProdifySync } from './storage';

export const triggerDemoData = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    const todayKey = d.toISOString().split('T')[0];
    const todayTime = d.getTime();

    // Helper untuk format tanggal mundur
    const getPastDateStr = (daysAgo) => {
        const pd = new Date(d);
        pd.setDate(pd.getDate() - daysAgo);
        return pd.toISOString().split('T')[0];
    };

    // 1. Matrix Tasks
    const sampleMatrixTasks = [
        { id: 't1', title: 'Finalisasi Frontend Web', quadrant: 'urgent-important', energy: 3, category: 'project', completed: false, createdAt: new Date(todayTime - 86400000).toISOString() },
        { id: 't2', title: 'Submit Laporan Praktikum Jarkom', quadrant: 'urgent-important', energy: 2, category: 'academic', completed: true, completedAt: d.toISOString(), createdAt: new Date(todayTime - 186400000).toISOString() },
        { id: 't3', title: 'Baca 1 Bab Clean Architecture', quadrant: 'not-urgent-important', energy: 2, category: 'academic', completed: false, createdAt: d.toISOString() },
        { id: 't4', title: 'Drafting Proposal BEM', quadrant: 'not-urgent-important', energy: 3, category: 'organization', completed: false, createdAt: d.toISOString() },
        { id: 't5', title: 'Balas Email Sponsorship', quadrant: 'urgent-not-important', energy: 1, category: 'committee', completed: true, completedAt: d.toISOString(), createdAt: d.toISOString() },
        { id: 't6', title: 'Checkout Buku di Tokopedia', quadrant: 'not-urgent-not-important', energy: 1, category: 'personal', completed: false, createdAt: d.toISOString() },
        { id: 't7', title: 'Review Jurnal AI', quadrant: 'not-urgent-important', energy: 2, category: 'academic', completed: false, createdAt: d.toISOString() },
        { id: 't8', title: 'Olahraga Sore (Lari 30 Menit)', quadrant: 'not-urgent-important', energy: 2, category: 'personal', completed: true, completedAt: getPastDateStr(1) + "T16:00:00.000Z", createdAt: d.toISOString() }
    ];

    // 2. Time Blocks
    const sampleTimeBlocks = {
        [todayKey]: [
            { id: 'b1', taskId: 't3', title: 'Baca 1 Bab Clean Architecture', time: '07:00', quadrant: 'not-urgent-important', energy: 2, category: 'academic', completed: true },
            { id: 'b2', taskId: null, title: 'Kuliah Jarkom', time: '09:00', quadrant: 'urgent-important', energy: 2, category: 'academic', completed: true },
            { id: 'b3', taskId: 't1', title: 'Finalisasi Frontend Web', time: '11:00', quadrant: 'urgent-important', energy: 3, category: 'project', completed: false },
            { id: 'b4', taskId: 't2', title: 'Submit Laporan Praktikum', time: '13:00', quadrant: 'urgent-important', energy: 2, category: 'academic', completed: true },
            { id: 'b5', taskId: 't7', title: 'Review Jurnal AI', time: '15:00', quadrant: 'not-urgent-important', energy: 2, category: 'academic', completed: false },
            { id: 'b6', taskId: 't5', title: 'Balas Email Sponsorship', time: '19:00', quadrant: 'urgent-not-important', energy: 1, category: 'committee', completed: true },
            { id: 'b7', taskId: null, title: 'Deep Work: LeetCode', time: '20:30', quadrant: 'not-urgent-important', energy: 3, category: 'cognitive', completed: false }
        ]
    };

    // Penuhi block 7 hari ke belakang agar Heatmap & Bar Chart aktif penuh
    for (let i = 1; i <= 7; i++) {
        const pdStr = getPastDateStr(i);
        sampleTimeBlocks[pdStr] = [
            { id: `pb1_${i}`, taskId: null, title: 'Pagi: Rutinitas', time: '06:00', category: 'personal', completed: true },
            { id: `pb2_${i}`, taskId: null, title: 'Kuliah / Kelas', time: '08:00', category: 'academic', completed: true },
            { id: `pb3_${i}`, taskId: null, title: 'Rapat Koordinasi BEM', time: '14:00', category: i % 2 === 0 ? 'organization' : 'committee', completed: true },
            { id: `pb4_${i}`, taskId: null, title: 'Mengerjakan Project Web', time: '19:00', category: 'project', completed: true },
            { id: `pb5_${i}`, taskId: null, title: 'Review Materi Kuliah', time: '21:00', category: 'academic', completed: true }
        ];
    }

    const currentDayOfWeek = d.getDay() === 0 ? 0 : d.getDay();
    const sampleAcademicSchedule = [
        { id: 'c1', course: 'Kecerdasan Buatan', dayOfWeek: currentDayOfWeek, startTime: '10:00', endTime: '12:00', sks: 3, location: 'Ruang A.1' },
        { id: 'c2', course: 'Interaksi Manusia & Komputer', dayOfWeek: currentDayOfWeek, startTime: '13:00', endTime: '15:00', sks: 3, location: 'Lab Komputasi' }
    ];

    const sampleDeadlines = [
        { id: 'd1', text: 'Kumpul Laporan Jarkom', deadline: d.toISOString(), completed: true, completedAt: d.toISOString(), notified: false, category: 'academic' },
        { id: 'd2', text: 'Proposal Ideation WDC', deadline: new Date(todayTime + 86400000 * 2).toISOString(), completed: false, notified: false, category: 'project' },
        { id: 'd3', text: 'Tugas Akhir Machine Learning', deadline: new Date(todayTime + 86400000 * 5).toISOString(), completed: false, notified: false, category: 'academic' },
        { id: 'd4', text: 'LPJ Kegiatan Makrab', deadline: new Date(todayTime + 86400000 * 7).toISOString(), completed: false, notified: false, category: 'organization' }
    ];

    const generateHistory = (target, skipChance = 0) => {
        const history = {};
        for (let i = 0; i <= 45; i++) {
            if (Math.random() > skipChance) {
                history[getPastDateStr(i)] = target;
            } else {
                history[getPastDateStr(i)] = Math.floor(Math.random() * target);
            }
        }
        return history;
    };

    const sampleHabits = [
        { id: 'h1', title: 'Bangun Pagi Konsisten (05:00)', icon: '🌅', streak: 45, history: generateHistory(1, 0.05), targetCount: 1, pillar: 'vitality' },
        { id: 'h2', title: 'Hidrasi Penuh 8 Gelas', icon: '💧', streak: 45, history: generateHistory(8, 0.1), targetCount: 8, pillar: 'vitality' },
        { id: 'h3', title: 'Latihan Ngoding / LeetCode', icon: '💻', streak: 14, history: generateHistory(1, 0.2), targetCount: 1, pillar: 'cognitive' },
        { id: 'h4', title: 'Meditasi Pagi / Jurnal', icon: '🧘‍♂️', streak: 30, history: generateHistory(1, 0.02), targetCount: 1, pillar: 'mindfulness' }
    ];

    const sampleNotes = [
        { id: 'n1', title: 'Ideation Web WDC 2026', content: '<h3>Tema: Mahasiswa Super Produktif</h3><p>Fitur Utama:</p><ul><li>Dashboard AI (Intelligence Hub)</li><li>Time Manager (Eisenhower Matrix)</li><li>ZenNotes (Rich Text + Whiteboard)</li></ul><p><em>Target: Juara 1 Nasional!</em> 🚀</p>', lastEdited: new Date(todayTime - 10000).toISOString(), isWhiteboard: false },
        { id: 'n2', title: 'Catatan Kelas Kecerdasan Buatan', content: '<p><strong>Supervised Learning</strong>: Algoritma diajari dengan data yang sudah dilabeli.</p><p>Misalnya membedakan kucing dan anjing dengan 10.000 gambar kucing & anjing.</p><p>Metode populer:</p><ul><li>Linear Regression</li><li>Decision Trees</li><li>SVM</li></ul>', lastEdited: new Date(todayTime - 3600000).toISOString(), isWhiteboard: false }
    ];

    const sampleRadar = { akademik: 95, organisasi: 85, istirahat: 80, sosial: 75, tugas: 95 };
    const sampleGlobalGoal = 'Lulus Cumlaude 3.95 & Juara Nasional WDC 2026! 🚀🏆';
    const sampleProfileInfo = { name: 'Sobat Ambis', username: 'ambis_pro', university: 'Universitas Indonesia', major: 'Ilmu Komputer', semester: '5', targetIpk: '3.95', location: 'Indonesia', phone: '-', portfolio: 'github.com/ambispro', bio: 'Konsistensi adalah kunci. 1% lebih baik setiap harinya.' };

    // SET TO SESSION STORAGE TO MOCK DATA JUST FOR THIS SESSION
    window.sessionStorage.setItem('isDemoMode', 'true');
    window.sessionStorage.setItem('prodify_hasSeenOnboarding', 'true');
    window.sessionStorage.setItem('prodify_user', JSON.stringify({ name: 'Sobat Ambis', email: 'ambis@prodify.com', token: 'demo-token' }));
    window.sessionStorage.setItem('prodify_userName', 'Sobat Ambis');
    window.sessionStorage.setItem('prodify_profileInfo', JSON.stringify(sampleProfileInfo));

    window.sessionStorage.setItem('matrix_tasks', JSON.stringify(sampleMatrixTasks));
    window.sessionStorage.setItem('time_blocks', JSON.stringify(sampleTimeBlocks));
    window.sessionStorage.setItem('prodify_academic_schedule', JSON.stringify(sampleAcademicSchedule));
    window.sessionStorage.setItem('prodify_tasks', JSON.stringify(sampleDeadlines));
    window.sessionStorage.setItem('prodify_habits_v4', JSON.stringify(sampleHabits));
    window.sessionStorage.setItem('zen_pages_multi', JSON.stringify(sampleNotes));
    window.sessionStorage.setItem('prodify_global_goal', sampleGlobalGoal);
    window.sessionStorage.setItem('prodify_settings', JSON.stringify({ theme: 'system', notifications: true, urgentReminders: true, strictFocusMode: true }));
    window.sessionStorage.setItem('prodify_energyCoins', 25);
    window.sessionStorage.setItem('prodify_balanceState', 'buffed');

    window.sessionStorage.setItem('prodify_login_streak', JSON.stringify({ lastLogin: todayKey, streak: 45 }));
    window.sessionStorage.setItem('prodify_radar_scores', JSON.stringify(sampleRadar));
    window.sessionStorage.setItem('forest_stats', JSON.stringify({ planted: 145, dead: 6 }));
    window.sessionStorage.setItem(`forest_today_${todayKey}`, '4'); // 4 session focus today

    // Custom event to trigger reload/re-render across components (SPA intra-tab)
    dispatchProdifySync();
    window.location.reload(); // Force full reload to apply demo mode purely over session storage 
};

export const clearDemoData = () => {
    window.sessionStorage.removeItem('isDemoMode');
    window.sessionStorage.clear();
    dispatchProdifySync();
    window.location.reload();
};
