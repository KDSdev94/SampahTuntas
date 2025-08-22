import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl, SafeAreaView, StatusBar } from 'react-native';
import { collection, query, where, orderBy, limit, getDocs, startAfter, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase'
import { getFont } from '../../Utils/fontFallback';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import moment from 'moment';
import 'moment/locale/id';

moment.locale('id');

const generateYearList = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 4 }, (_, index) => {
    const year = currentYear - index;
    return { label: year.toString(), value: year };
  });
};

const dataMonth = [
  { label: 'Januari', value: 1 },
  { label: 'Februari', value: 2 },
  { label: 'Maret', value: 3 },
  { label: 'April', value: 4 },
  { label: 'Mei', value: 5 },
  { label: 'Juni', value: 6 },
  { label: 'Juli', value: 7 },
  { label: 'Agustus', value: 8 },
  { label: 'September', value: 9 },
  { label: 'Oktober', value: 10 },
  { label: 'November', value: 11 },
  { label: 'Desember', value: 12 },
];

export default function LaporanDitanganiScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [isFilterMode, setIsFilterMode] = useState(false);

  const dataYear = generateYearList();

  // Auto refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log('LaporanDitanganiScreen focused - auto refreshing data');
      setLastVisible(null);
      setIsFilterMode(false);
      setSelectedMonth(null);
      setSelectedYear(null);
      fetchReports(true);
    }, [])
  );

  const fetchReports = async (reloading = false, filter = false) => {
    if (loading) return;
    setLoading(true);

    try {
      let q = query(
        collection(db, 'reports'),
        where('status', '==', 'complete'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      if (filter && selectedMonth && selectedYear) {
        const startDate = new Date(selectedYear, selectedMonth - 1, 1);
        const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);
        q = query(q, where('createdAt', '>=', Timestamp.fromDate(startDate)), where('createdAt', '<=', Timestamp.fromDate(endDate)));
      } else if (lastVisible && !reloading && !filter) {
        q = query(q, startAfter(lastVisible));
      }

      const documentSnapshots = await getDocs(q);

const newReports = await Promise.all(documentSnapshots.docs.map(async (reportDoc) => {
        const reportData = reportDoc.data();
        let userName = 'Anonim';
        let userAddress = 'Alamat tidak diketahui';

        try {
          const userDocRef = doc(db, 'users', reportData.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            userName = userData.nama || 'Nama tidak diketahui';
            userAddress = userData.alamat || 'Alamat tidak diketahui';
          } else {
            const userQuery = query(collection(db, 'users'), where('uid', '==', reportData.uid));
            const userDoc = await getDocs(userQuery);

            if (!userDoc.empty) {
              const userData = userDoc.docs[0].data();
              userName = userData.nama || 'Nama tidak diketahui';
              userAddress = userData.alamat || 'Alamat tidak diketahui';
            }
          }
        } catch (error) {
          console.log('Error fetching user:', error.message);
        }

        return { id: reportDoc.id, ...reportData, userName, userAddress };
      }));

      if (documentSnapshots.docs.length > 0) {
        setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
      }

      if (reloading || filter) {
        setReports(newReports);
      } else {
        setReports(prev => [...prev, ...newReports]);
      }

    } catch (error) {
      console.error("Error fetching reports: ", error);
    } finally {
      setLoading(false);
      if (reloading) setRefreshing(false);
    }
  };

  // Removed auto-loading, data will only load on manual refresh or filter
  // useEffect(() => {
  //   if (!isFilterMode) {
  //     fetchReports(true);
  //   }
  // }, [isFilterMode]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setLastVisible(null);
    setIsFilterMode(false);
    fetchReports(true).then(() => setRefreshing(false));
  }, []);

  const handleFilter = () => {
    if (selectedMonth && selectedYear) {
        setLastVisible(null);
        setIsFilterMode(true);
        fetchReports(true, true);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('DetailLaporan', { reportId: item.id, status: 'complete' })}>
      <View style={styles.card}>
        <Image source={{ uri: item.imageUrls[0] }} style={styles.cardImage} />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.description}</Text>
<Text style={styles.cardSubtitle}>Pelapor: {item.userName}</Text>
          <Text style={styles.cardSubtitle}>Alamat: {item.userAddress}</Text>
          <Text style={styles.cardSubtitle}>Waktu: {moment(item.createdAt.toDate()).format('D MMMM YYYY, HH:mm')}</Text>
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackText}>Feedback: {item.feedbackDescription}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Laporan Ditangani</Text>
      </View>
      
      <View style={styles.filterContainer}>
        <Picker
          selectedValue={selectedMonth}
          style={styles.picker}
          onValueChange={(itemValue) => setSelectedMonth(itemValue)}>
          <Picker.Item label="Bulan" value={null} />
          {dataMonth.map(item => <Picker.Item key={item.value} label={item.label} value={item.value} />)}
        </Picker>
        <Picker
          selectedValue={selectedYear}
          style={styles.picker}
          onValueChange={(itemValue) => setSelectedYear(itemValue)}>
          <Picker.Item label="Tahun" value={null} />
          {dataYear.map(item => <Picker.Item key={item.value} label={item.label} value={item.value} />)}
        </Picker>
        <TouchableOpacity style={styles.filterButton} onPress={handleFilter}>
          <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={reports}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListFooterComponent={loading && !refreshing ? <ActivityIndicator size="large" color="#4CAF50" /> : null}
        ListEmptyComponent={
          !loading && !refreshing ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle-outline" size={80} color="#ccc" />
              <Text style={styles.emptyTitle}>Belum Ada Laporan Selesai</Text>
              <Text style={styles.emptySubtitle}>Laporan yang sudah ditangani akan muncul di sini</Text>
            </View>
          ) : null
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  backButton: {
    marginRight: 20,
  },
  headerTitle: {
    fontSize: 20,
    ...getFont('bold'),
    color: '#fff',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
  },
  picker: {
    flex: 1,
    height: 50,
    backgroundColor: '#fff',
    marginHorizontal: 5,
    borderRadius: 5,
  },
  filterButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  filterButtonText: {
    color: '#fff',
    ...getFont('bold'),
  },
  card: {
    backgroundColor: '#fff', 
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 10,
    marginHorizontal: 20,
    elevation: 3,
    flexDirection: 'row',
  },
  cardImage: {
    width: 100,
    height: '100%',
  },
  cardContent: {
    padding: 15,
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    ...getFont('bold'),
    color: '#333',
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  feedbackContainer: {
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  feedbackText: {
    color: '#fff',
    fontSize: 12,
    ...getFont('bold'),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyTitle: {
    fontSize: 22,
    ...getFont('bold'),
    color: '#555',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 30,
    marginTop: 10,
  },
});
