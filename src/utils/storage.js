// src/utils/storage.js
import { prodifyAlert } from './popup';

/**
 * Mengambil dan memparsing data dari LocalStorage dengan aman (Graceful Fallback)
 */
export function getJson(key, fallback) {
    try {
        const isDemoMode = typeof window !== 'undefined' && window.sessionStorage.getItem('isDemoMode') === 'true';
        const storageOptions = isDemoMode ? window.sessionStorage : localStorage;
        const raw = storageOptions.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw);
    } catch (e) {
        console.warn(`[Prodify Storage] Gagal parsing key: ${key}, data mungkin rusak. Menggunakan default.`, e);
        return fallback; // Anti White-Screen of Death!
    }
}

/**
 * Memicu event sync intra-tab (SPA) untuk menggantikan keterbatasan native 'storage' event.
 * Native 'storage' hanya terpicu di tab lain; event ini dipakai untuk tab yang sama.
 */
export function dispatchProdifySync(key) {
    try {
        if (typeof window === 'undefined') return;
        window.dispatchEvent(new CustomEvent('prodify-sync', { detail: { key } }));
    } catch {
        // Fallback browser lama tanpa CustomEvent
        try {
            window.dispatchEvent(new Event('prodify-sync'));
        } catch {
            // ignore
        }
    }
}

/**
 * Menyimpan data ke LocalStorage dengan aman dan memicu auto-sync antar komponen
 */
export function setJson(key, value) {
    try {
        const isDemoMode = typeof window !== 'undefined' && window.sessionStorage.getItem('isDemoMode') === 'true';
        const storageOptions = isDemoMode ? window.sessionStorage : localStorage;
        storageOptions.setItem(key, JSON.stringify(value));
        // Memicu event agar komponen lain di tab yang sama langsung terupdate tanpa perlu reload.
        dispatchProdifySync(key);
    } catch (e) {
        console.error(`[Prodify Storage] Quota penuh atau error saat menyimpan: ${key}`, e);
        if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            // Avoid native browser alert: show in-app popup.
            prodifyAlert({
                title: 'Penyimpanan Lokal Penuh',
                message: "Harap lakukan backup data di menu Pengaturan dan hapus catatan (Whiteboard) yang sudah tidak terpakai.",
            });
        }
    }
}

/**
 * Mendapatkan string tanggal hari ini disesuaikan dengan zona waktu lokal (YYYY-MM-DD)
 */
export function getLocalDateKey(dateObj = new Date()) {
    const d = new Date(dateObj);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split("T")[0];
}

/**
 * Utilitas untuk menghitung estimasi penggunaan memori LocalStorage (dalam satuan MB)
 */
export function getStorageUsageMB() {
    try {
        let total = 0;
        for (let x in localStorage) {
            if (!Object.prototype.hasOwnProperty.call(localStorage, x)) continue;
            total += ((localStorage[x].length + x.length) * 2); // JavaScript strings are UTF-16 (2 bytes per char)
        }
        return (total / 1024 / 1024).toFixed(2);
    } catch (e) {
        console.error("[Prodify Storage] Gagal menghitung kuota:", e);
        return "0.00";
    }
}
