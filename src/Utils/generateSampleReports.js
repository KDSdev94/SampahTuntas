// generateSampleReports.js - Generate sample reports connected to existing users
import { collection, addDoc, Timestamp, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

const reportDescriptions = [
  "Tumpukan sampah di depan gang, menghalangi jalan dan mengganggu aktivitas warga.",
  "Sampah plastik dan botol berserakan di taman bermain anak-anak.",
  "Got tersumbat oleh sampah, menyebabkan bau tidak sedap dan genangan air.",
  "Tempat sampah umum sudah penuh dan meluap, perlu segera dikosongkan.",
  "Ada sampah liar yang dibuang di lahan kosong belakang komplek.",
  "Sampah sisa makanan dari warung menumpuk di pinggir jalan utama.",
  "Kaleng dan botol bekas di selokan, berpotensi jadi sarang nyamuk DBD.",
  "Sampah daun dan ranting pohon belum diangkut selama seminggu terakhir.",
  "Plastik kresek beterbangan di sepanjang jalan karena angin kencang."
];

const imageUrls = [
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=300&h=200&fit=crop&auto=format", // Trash/waste image
  "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=300&h=200&fit=crop&auto=format", // Garbage bags
  "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=300&h=200&fit=crop&auto=format", // Waste management
  "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=300&h=200&fit=crop&auto=format", // Trash pile
  "https://images.unsplash.com/photo-1583947581924-860bda6a26de?w=300&h=200&fit=crop&auto=format", // Waste sorting
  "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=300&h=200&fit=crop&auto=format"  // Environmental waste
];

const priorities = ['rendah', 'sedang', 'tinggi'];
const statuses = ['pending', 'complete', 'pending', 'pending', 'complete', 'pending', 'complete', 'pending', 'pending']; // Mix of statuses

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const generateRandomLocation = () => {
  // Base coordinates for Jakarta, Indonesia
  const baseLat = -6.2088;
  const baseLng = 106.8456;

  // Generate a random offset within a certain range (e.g., ~10km)
  // 1 degree of latitude is approx 111km. 0.1 degrees is ~11km
  const latOffset = (Math.random() - 0.5) * 0.1;
  const lngOffset = (Math.random() - 0.5) * 0.1;

  return {
    latitude: parseFloat((baseLat + latOffset).toFixed(6)),
    longitude: parseFloat((baseLng + lngOffset).toFixed(6)),
  };
};

const generateRandomDate = () => {
  // Generate random date within last 30 days
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 30);
  const randomDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
  return Timestamp.fromDate(randomDate);
};

export const generateSampleReports = async () => {
  try {
    console.log('🔍 Mengambil data warga...');
    
    // Fetch citizen users
    const usersQuery = query(collection(db, 'users'), where('role', '==', 'warga'));
    const usersSnapshot = await getDocs(usersQuery);

    if (usersSnapshot.empty) {
      console.log('❌ Tidak ada data warga ditemukan.');
      return { success: false, message: 'Tidak ada data warga ditemukan.' };
    }

    const warga = [];
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.uid) {
        warga.push({ 
          docId: doc.id, 
          uid: userData.uid, // Use actual Firebase Auth UID
          ...userData 
        });
      } else {
        console.warn(`Lewati user tanpa uid: ${userData.nama || doc.id}`);
      }
    });

    if (warga.length === 0) {
      console.log('❌ Tidak ada warga dengan UID yang valid.');
      return { success: false, message: 'Tidak ada warga dengan UID yang valid untuk membuat laporan.' };
    }

    console.log(`✅ Ditemukan ${warga.length} data warga dengan UID valid.`);
    console.log('📝 Membuat 9 laporan sample...');

    const createdReports = [];

    // Generate 9 reports
    for (let i = 0; i < 9; i++) {
      const user = warga[i % warga.length]; // Cycle through users if less than 9
      const description = reportDescriptions[i];
      const randomLocation = generateRandomLocation();
      
      const selectedImageUrl = getRandomItem(imageUrls);
      console.log(`Selected image URL for report #${i + 1}:`, selectedImageUrl);
      
      const reportData = {
        uid: user.uid, // Use the actual Firebase Auth UID
        description: description,
        imageUrls: [selectedImageUrl],
        lat: randomLocation.latitude,
        lng: randomLocation.longitude,
        priority: getRandomItem(priorities),
        status: statuses[i], // Use predetermined status pattern
        createdAt: generateRandomDate(),
        feedbackDescription: statuses[i] === 'complete' ? 'Laporan telah ditangani dengan baik. Sampah sudah dibersihkan.' : '',
        feedbackImages: []
      };

      try {
        const docRef = await addDoc(collection(db, 'reports'), reportData);
        console.log(`✅ Laporan #${i + 1} dibuat untuk: ${user.nama}`);
        console.log(`   ID: ${docRef.id}`);
        console.log(`   Koordinat: ${randomLocation.latitude}, ${randomLocation.longitude}`);
        
        createdReports.push({
          id: docRef.id,
          userName: user.nama,
          description: description.substring(0, 50) + '...'
        });
      } catch (error) {
        console.error(`❌ Gagal membuat laporan untuk ${user.nama}:`, error.message);
      }
    }

    console.log('🎉 Selesai membuat 9 laporan sample!');
    return { 
      success: true, 
      message: `Berhasil membuat ${createdReports.length} laporan`, 
      reports: createdReports 
    };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { success: false, message: error.message };
  }
};
