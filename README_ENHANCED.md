# SampahTuntas - Smart Waste Management System

![React Native](https://img.shields.io/badge/React%20Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

## Tentang Aplikasi

SampahTuntas adalah aplikasi mobile untuk sistem manajemen sampah pintar yang membantu warga dalam melaporkan masalah sampah, memantau jadwal pengangkutan, dan berpartisipasi dalam program daur ulang. Aplikasi ini dibangun dengan Expo React Native dan Firebase.

### Fitur Utama

- **Waste Reporting**: Laporan masalah sampah dengan lokasi GPS
- **Collection Schedule**: Jadwal pengangkutan sampah
- **Recycling Program**: Program daur ulang dan reward
- **Admin Dashboard**: Dashboard untuk admin pengelola
- **Real-time Tracking**: Pelacakan status laporan real-time
- **Community Engagement**: Fitur komunitas dan edukasi
- **Analytics & Reports**: Laporan dan statistik pengelolaan sampah
- **Push Notifications**: Notifikasi untuk jadwal dan update
- **Location Services**: Layanan berbasis lokasi GPS
- **Multi-role System**: Admin dan Warga

## Quick Start

### Prasyarat

- Node.js LTS (v16 atau lebih baru)
- npm atau yarn
- Expo CLI (npm install -g @expo/cli)
- Akun Firebase (Firestore, Auth, Storage)
- Android Studio / Xcode (untuk emulator)

### Instalasi

`ash
# Clone repository
git clone [repository-url]
cd EXPO SAMPAH TUNTAS

# Install dependencies
npm install

# Jalankan aplikasi
npx expo start
`

### Menjalankan di Device

1. **Android/iOS**: Scan QR code dengan Expo Go app
2. **Emulator**: Tekan 'a' untuk Android atau 'i' untuk iOS
3. **Web**: Tekan 'w' untuk membuka di browser

## Konfigurasi

### Firebase Setup

1. Buat project Firebase baru
2. Enable Authentication, Firestore, dan Storage
3. Download google-services.json dan letakkan di root project
4. Update konfigurasi di src/config/firebase.js

`javascript
// src/config/firebase.js
const firebaseConfig = {
  apiKey: 'your-api-key',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project-id',
  storageBucket: 'your-project.appspot.com',
  messagingSenderId: '123456789',
  appId: 'your-app-id'
};
`

## Struktur Proyek

`
SampahTuntas/
+-- src/                     # Source code
¦   +-- screens/             # Layar aplikasi
¦   ¦   +-- admin/          # Layar admin
¦   ¦   +-- warga/          # Layar warga
¦   +-- navigation/          # Navigasi aplikasi
¦   +-- config/              # Konfigurasi aplikasi
¦   +-- Utils/               # Helper functions
+-- components/              # Komponen UI reusable
+-- utils/                   # Utility functions
+-- assets/                  # Gambar, font, dll
+-- App.js                   # Entry point
+-- package.json             # Dependencies
`

## Scripts Tersedia

`ash
# Development
npm start              # Jalankan Expo dev server
npm run android        # Jalankan di Android
npm run ios           # Jalankan di iOS
npm run web           # Jalankan di web browser

# Utilities
node src/Utils/generateSampleReports.js    # Generate sample data
`

## Database Schema

### Collections Firestore

- **users**: Data pengguna (admin, warga)
- **reports**: Laporan masalah sampah
- **schedules**: Jadwal pengangkutan sampah
- **locations**: Data lokasi TPS/TPA
- **recycling**: Program daur ulang
- **notifications**: Sistem notifikasi
- **analytics**: Data statistik dan analytics

## Fitur Berdasarkan Role

### Warga
- Laporkan masalah sampah dengan foto dan lokasi
- Lihat jadwal pengangkutan sampah
- Ikuti program daur ulang
- Dapatkan reward dari aktivitas ramah lingkungan
- Akses edukasi pengelolaan sampah

### Admin
- Dashboard monitoring laporan
- Kelola jadwal pengangkutan
- Verifikasi dan tindak lanjut laporan
- Analisis data dan statistik
- Kelola program daur ulang
- Kirim notifikasi ke warga

## Fitur Teknologi

- **GPS Integration**: Integrasi dengan layanan lokasi
- **Camera Integration**: Pengambilan foto untuk laporan
- **Push Notifications**: Notifikasi real-time
- **Offline Support**: Dukungan mode offline
- **Data Analytics**: Visualisasi data dengan chart
- **Responsive Design**: UI yang adaptif

## Screenshots

*Tambahkan screenshot aplikasi di sini*

## Contributing

1. Fork repository ini
2. Buat branch fitur: git checkout -b feature/amazing-feature
3. Commit perubahan: git commit -m 'Add amazing feature'
4. Push ke branch: git push origin feature/amazing-feature
5. Buka Pull Request

### Coding Standards

- Gunakan ESLint dan Prettier
- Ikuti konvensi penamaan React Native
- Tulis komentar untuk logika kompleks
- Test fitur sebelum commit

## Testing

`ash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
`

## License

Hak cipta 2024 SampahTuntas. All rights reserved.

## Support

- Email: support@sampahtuntas.id
- WhatsApp: +62 xxx-xxxx-xxxx
- Website: www.sampahtuntas.id

## Acknowledgments

- Expo Team untuk platform yang luar biasa
- Firebase untuk backend services
- React Native Community untuk ecosystem yang kaya
- Komunitas peduli lingkungan

---

Made with love for a cleaner environment
Star this repo if you find it helpful!
