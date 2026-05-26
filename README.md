# P-IOT: IoT Smart Parking App

P-IOT (Smart Parking Management App) adalah aplikasi web pemantauan dan kontrol parkir real-time berbasis IoT dengan antarmuka bertema estetika retro **Y2K Cyberpunk**. Aplikasi ini memadukan sensor fisik (IR sensor & RFID reader) dengan Next.js App Router, Firebase Firestore, dan MQTT broker untuk menyajikan sistem manajemen parkir yang aman, cerdas, dan interaktif.

---

## 🌟 Fitur Utama

1. **Live Parking Grid (Real-time Monitoring)**
   - Status slot parkir (A01 - A04) diperbarui secara instan melalui sinkronisasi Firestore `onSnapshot`.
   - Visualisasi grid interaktif bergaya Y2K dengan status `available` (hijau), `occupied` (merah), dan `maintenance` (abu-abu).

2. **Cross-Sensor Anomaly Engine (Deteksi Anomali Silang)**
   - Algoritma pencocokan data cerdas: mengevaluasi perbedaan antara jumlah slot terisi fisik (sensor IR) dan jumlah kartu RFID yang aktif masuk sistem.
   - Pemicu fase evaluasi (*Debounce filter* selama 3 detik) untuk memisahkan noise sesaat dari anomali nyata.
   - Alarm visual instan saat anomali aktif (merah berkedip) dan mempublikasikan payload status anomali kembali ke MQTT broker pada topik `parking/anomaly` untuk integrasi hardware.

3. **IoT Diagnostic & Simulation Panel**
   - **Gerbang Override**: Kontrol manual dari web untuk menerbitkan perintah gerbang (`FORCE_OPEN` atau `FORCE_CLOSE`) dalam format JSON stringified ke topik MQTT `parking/gate/command`.
   - **Time Warp Simulator**: Mendeteksi sesi parkir yang sedang berjalan (`status == "ongoing"` di Firestore) dan menyediakan kontrol manipulasi waktu individual untuk mempercepat waktu check-out (simulasi durasi parkir & pengujian perhitungan tarif Rp5.000/jam).
   - **MQTTX Log Importer**: Parser log teks mentah dari MQTTX untuk merekonstruksi dan memutar ulang (*replay*) rangkaian event masuk/keluar ke database secara sekuensial.

4. **Operator & Admin Directory**
   - Panel manajemen pengguna (CRUD) untuk menambah, mengubah, atau menghapus profil operator dan kredensial akses.
   - Pembedaan fungsionalitas stats card (StatCard) berdasarkan hak akses (Admin melihat RFID Active & Gate Status, Operator melihat Catatan Logbook).

5. **Analytics & Trend Charts**
   - Visualisasi grafik interaktif menggunakan `recharts` untuk menganalisis tren keluar-masuk kendaraan, rata-rata durasi parkir, dan pendapatan harian.

---

## 🛠️ Stack Teknologi

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Bahasa**: [TypeScript](https://www.typescriptlang.org/)
- **State Management & Authentication**: React Context & [Firebase Authentication](https://firebase.google.com/docs/auth)
- **Database**: [Firebase Firestore](https://firebase.google.com/docs/firestore) (Real-time Listener & Subscriptions)
- **Komunikasi IoT**: [MQTT](https://mqtt.org/) via WebSockets ([HiveMQ Cloud](https://www.hivemq.com/hivemq-cloud/) / `mqtt.js`)
- **Styling**: Tailwind CSS v4 dengan variabel kustom Y2K Neon/Cyberpunk
- **Library Grafik**: [Recharts](https://recharts.org/)

---

## 📂 Struktur Direktori Proyek

```text
pbl-app/
├── app/                        # Next.js App Router (Halaman & Logika Utama)
│   ├── api/                    # API Routes (Backend Next.js proxy)
│   ├── auth/                   # Halaman Login & Registrasi
│   ├── context/                # AuthContext Provider
│   ├── dashboard/              # Halaman Dashboard Utama
│   ├── lib/                    # SDK Firebase, authService, & Slot Hooks
│   ├── globals.css             # Desain Sistem Global (Variabel & Tema Y2K)
│   ├── layout.tsx              # Root Layout
│   └── page.tsx                # Landing Page
├── components/                 # React Components Terdistribusi
│   ├── admin/                  # Panel Khusus Admin (UserManager, Analytics)
│   ├── layout/                 # Kerangka Halaman (Header & Sidebar Responsive)
│   ├── modal/                  # Dialog Pop-up (OperatorNotes, Notifications, dll)
│   ├── parking/                # Visualisasi Slot, StatCard, & Overview Tab
│   ├── profile/                # Halaman Profile & User Settings
│   ├── iot-config/             # Halaman IoT Simulator & Override Panel
│   └── ui/                     # Komponen UI Dasar Bergaya Y2K (Y2KButton, Y2KCard)
├── hooks/                      # Custom React Hooks
│   └── useParkingMQTT.ts       # Manajemen Koneksi MQTT Client & Anomaly Engine
├── scripts/                    # Skrip Utilitas Database & Seeding
│   ├── seed_full_schema.ts     # Inisialisasi seluruh koleksi Firestore
│   ├── seed_parking.ts         # Inisialisasi slot dummy A01-A04
│   ├── clear_parking.ts        # Hapus data slot
│   └── clear_parking_sessions.mjs # Pembersihan log transaksi parkir
├── types/                      # Type Definitions Global TypeScript
└── package.json                # Konfigurasi dependensi dan script npm
```

---

## 📡 Arsitektur Topik MQTT

Aplikasi ini bertukar pesan secara real-time melalui broker dengan skema topik berikut:

| Topik | Arah | Payload / Format | Deskripsi |
| :--- | :--- | :--- | :--- |
| `parking/slot/status` | Subscribe | `{"slot": [1, 0, 0, 0]}` | Status sensor IR fisik (1 = Terisi, 0 = Kosong). |
| `parking/gate/status` | Subscribe | `{"slot_counter": 1, "gate_masuk": "TUTUP", "gate_keluar": "TUTUP", "kendaraan_dalam": ["UID1234"]}` | Status gerbang dan total antrean kartu aktif. |
| `parking/gate/event` | Subscribe / Publish | `{"event": "MASUK_DIIZINKAN", "uid": "RFID_UID"}` | Trigger untuk membuat/mengakhiri sesi transaksi di database. |
| `parking/gate/command` | Publish | `{"command": "FORCE_OPEN"}`, `{"command": "FORCE_CLOSE"}` | Perintah override gerbang manual yang dikirim ke ESP32. |
| `parking/anomaly` | Publish | `{"status": "ANOMALY", "rfid_active": 0, "slot_occupied": 1, "anomaly_count": 1, "message": "...", "timestamp": "..."}` | Log peringatan anomali yang dikirim balik ke Cloud/Broker. |
| `parking/gate/lwt` | Subscribe | `{"status": "online" \| "offline"}` | LWT (*Last Will and Testament*) status hardware gerbang. |
| `parking/slot/lwt` | Subscribe | `{"status": "online" \| "offline"}` | LWT status hardware sensor slot parkir. |

---

## 💾 Skema Database Firestore

Koleksi database terstruktur secara flat di tingkat root Firestore:

### 1. `parking_slots`
Menyimpan data koordinat fisik setiap ruang parkir:
```json
{
  "id": "A01",
  "status": "available", // options: 'available' | 'occupied' | 'maintenance'
  "type": "car",
  "iot_node_id": "NODE_ZONE_A",
  "last_updated": "Timestamp"
}
```

### 2. `sessions`
Log riwayat parkir aktif dan terselesaikan:
```json
{
  "rfid_uid": "UID9824",
  "vehicle_type": "car",
  "slot_id": "A01",
  "check_in": "2026-05-26T01:55:00.000Z",
  "check_out": "2026-05-26T03:55:00.000Z", // null jika status ongoing
  "duration_minutes": 120,
  "fee": 10000,
  "status": "completed", // options: 'ongoing' | 'completed'
  "created_at": "Timestamp"
}
```

### 3. `users`
Kredensial dan metadata akun pengguna:
```json
{
  "username": "admin1",
  "email": "admin@example.com",
  "role": "admin", // options: 'admin' | 'operator'
  "password": "hashed_password",
  "created_at": "Timestamp",
  "last_login": "Timestamp"
}
```

---

## 🚀 Panduan Instalasi & Pengembangan

### Prasyarat
Pastikan Anda sudah menginstal [Bun](https://bun.sh/) atau Node.js di sistem Anda.

### Langkah-langkah
1. **Clone repositori dan masuk ke direktori proyek**:
   ```bash
   cd pbl-app
   ```

2. **Instal seluruh dependensi**:
   ```bash
   bun install
   ```

3. **Konfigurasikan Environment Variables (`.env.local`)**:
   Salin berkas `.env.example` menjadi `.env.local` dan isi dengan kredensial Firebase dan Broker MQTT Anda:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="sender-id"
   NEXT_PUBLIC_FIREBASE_APP_ID="app-id"
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="measurement-id"

   NEXT_PUBLIC_MQTT_USER="mqtt-username"
   NEXT_PUBLIC_MQTT_PASS="mqtt-password"
   NEXT_PUBLIC_MQTT_HOST="mqtt-broker-host"
   ```

4. **Jalankan Seeding Awal Database**:
   Seeding skema dan data slot awal ke Firestore Anda:
   ```bash
   bun run scripts/seed_parking.ts
   ```

5. **Jalankan Aplikasi dalam Mode Pengembangan**:
   ```bash
   bun run dev
   ```
   Aplikasi akan berjalan secara lokal di [http://localhost:3000](http://localhost:3000).

---

## 🛠️ Perintah Utilitas Pengembang

- **Inisialisasi Seluruh Skema Firestore**:
  ```bash
  bun run scripts/seed_full_schema.ts
  ```
- **Reset/Clear Riwayat Sesi (Menghindari Kuota Firebase Habis)**:
  ```bash
  bun run scripts/clear_parking_sessions.mjs
  ```
- **Melakukan Verifikasi Type-safety**:
  ```bash
  npx tsc --noEmit
  ```
