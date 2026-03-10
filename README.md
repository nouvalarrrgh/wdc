# 🚀 StuProd (Student Productivity Hub)
*Ekosistem Produktiviti Teras Pintar yang Direka Khas untuk Mahasiswa*

---

### 📋 Maklumat Projek & Pasukan
- **Nama Website:** StuProd
- **Nama Tim:** Logicraft
- **Dengan Backend:** TIDAK *(Aplikasi ini berjalan 100% secara Client-Side (Frontend) menggunakan Seni Bina LocalStorage berasaskan Event-Driven untuk penyegerakan data masa nyata antara komponen).*

---

## 🌟 Daftar Fitur Utama

**1. Intelligence Hub (Pemuka Dinamik & Radar Keseimbangan)**
Bukan sekadar papan pemuka biasa. Ia memaparkan **Skor Impak Mingguan** hasil kalkulasi silang algoritma antara tugasan, tabiat, dan sesi fokus. Dilengkapi dengan **Heatmap Konsistensi 48-Hari**, Carta Bar Aktiviti, dan **Radar Penilaian Pantas** di mana maskot "Neko" akan menemu bual tahap kelesuan (Burnout) mahasiswa dalam 5 aspek (Akademik, Organisasi, Rehat, Sosial, Tugas) untuk memberikan *Dynamic Insight*.

**2. Balance Matrix & Agenda (Pengurusan Masa Komprehensif)**
Pusat kawalan masa yang menggabungkan:
- **Eisenhower Priority Matrix:** Sistem seret dan lepas (*Drag & Drop*) untuk memetakan tugasan ke dalam 4 kuadran keutamaan.
- **Weekly Time Blocking Calendar:** Kalendar pintar yang merender blok masa tugasan.
- **Jadual Akademik Kekal:** Pengguna boleh memasukkan jadual kuliah (Lengkap dengan SKS & Bilik/Lokasi) yang akan dipaparkan secara kekal sebagai templat (*blueprint*) dalam barisan kalendar.
- **Deadline Tracker:** Pengesanan tarikh akhir dengan amaran amaran pop-timbul visual jika baki masa kurang dari 2 jam.

**3. Deep Focus Workspace (Sistem Pomodoro & Anti-Penipuan)**
Ruang fokus mendalam (Pomodoro/Ultradian) yang memvisualisasikan penanaman pokok maya (Animasi Lottie). Memiliki seni bina **Strict Mode & Anti-Cheat**: 
- Jika pengguna menukar *tab* atau meminimumkan skrin, pokok akan layu dan mati (*Fail*).
- Dilengkapi **Research Mode (Jeda Penyelidikan)** yang memberi kelonggaran 2 Minit untuk pengguna mencari rujukan di tab lain sebelum pokok dikira mati.
- Memiliki dwi-sistem amaran: Notifikasi OS Asli dan Notifikasi Fallback Dalam-Aplikasi (jika Notifikasi OS disekat juri).

**4. Habit & Synergy Tracker (Penjejak Tabiat Harian)**
Sistem pangkalan tabiat yang bukan sekadar senarai semak, tetapi berkait rapat dengan kapasiti mental pengguna.
- **Synergy State:** Menyiapkan tabiat akan memberikan status **Buffed** (Koin Tenaga Maksimum meningkat ke 13). Mengabaikan tabiat mencetuskan status **Debuffed** (Koin Tenaga jatuh ke 7). Status ini akan mempengaruhi jumlah tugasan yang boleh dijadualkan dalam *Time Manager*.

**5. Smart Notes & Journal (ZenNotes)**
Buku nota digital dengan dua mod:
- **Rich Text Editor:** Untuk penulisan artikel/jurnal yang kemas.
- **Infinite Whiteboard Canvas:** Kanvas lukisan bebas untuk lakaran peta minda atau rumus (Menyokong eksport ke imej/PDF).
- **Integrasi Matriks Pantas:** Pengguna boleh menyerlahkan (*highlight*) teks di dalam nota, dan dengan satu klik, teks tersebut akan terus dihantar ke *Balance Matrix* sebagai tugasan baharu!

**6. NekoGuide & Cognitive Guard (Bonus Inovasi)**
- **NekoGuide:** Sistem *Onboarding* interaktif! Maskot kucing yang memantau secara langsung (*real-time*) perkembangan pengguna melalui `storage event`. Ia memandu pengguna merasai setiap ciri satu per satu dari langkah 1 hingga 6 tanpa *Interval Polling* yang membebankan CPU.
- **Cognitive Guard:** Pengawal Kesihatan Mental. Jika aplikasi mendeteksi Koin Tenaga pengguna negatif (terlalu banyak tugasan berat dalam sehari), skrin peringatan relaksasi pernafasan (4-7-8) akan muncul untuk memaksa pengguna berehat sementara.

---

## 🛠️ Aspek Seni Bina Kod & Peneguhan (Engineering Architecture)

Bagi membuktikan bahawa projek ini berada di tahap **Production-Ready**, pasukan Logicraft telah melaksanakan standard kejuruteraan kualiti tinggi:

* **Penyegerakan Tab-Sama (*Same-Tab Event Sync*):** Walaupun tiada state manager seperti Redux, kami memanipulasi *DOM Event Listener* (`window.dispatchEvent(new Event('storage'))`) di dalam fungsi `setJson()`. Ini membolehkan mana-mana komponen dikemas kini secara automatik sejurus selepas data `localStorage` berubah tanpa perlu memuat semula halaman (Konsep *Single Page Application* yang murni).
* **Pengendalian Ralat Selamat (*Graceful Fallback & Hardening*):** Menggantikan `JSON.parse()` mentah dengan utiliti khusus `getJson(key, fallback)`. Jika juri memanipulasi rentetan (string) di *DevTools Application* dengan format JSON yang rosak, aplikasi TIDAK akan mengalami *White Screen of Death*, sebaliknya kembali ke nilai lalai secara elegan.
* **Kuata Pengurusan Memori:** Oleh kerana kanvas lukisan (*Base64*) boleh memakan saiz besar, kami menambah visualisasi pengira beban memori (MB) di dalam halaman Tetapan beserta amaran automatik `QuotaExceededError` jika storan pelayar sudah penuh.
* **Komponen Pembahagian Khusus (*Modularity*):** Pemisahan melampau fail-fail antaramuka (cth: `WeeklyCalendar.jsx`, `DeadlineTracker.jsx`) bagi memastikan kod *maintainable*, bersih dan mematuhi *Solid Principles*.

---

## 💻 Tindanan Teknologi (Tech Stack)

- **Teras Frontend:** React.js (Vite)
- **Gaya Visual:** Tailwind CSS (dengan sokongan Glassmorphism & Sistem Dwi Tema - Terang/Gelap)
- **Pengurusan Pangkalan Data:** Native Browser `localStorage` API + Custom Hooks
- **Animasi & Interaksi:** Framer Motion, Lottie-React
- **Visualisasi Data:** Chart.js, React-Chartjs-2
- **Ikonografi:** Lucide-React
- **Seret & Lepas (DnD):** @hello-pangea/dnd

---

## 🚀 Cara Menjalankan Secara Tempatan (Local Setup)

1. **Klon Repositori**
   ```bash
   git clone <pautan-repositori-anda>
