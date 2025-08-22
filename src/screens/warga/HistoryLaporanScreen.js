// HistoryLaporanScreen.js - Migrated from HistoryLaporan.dart
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase'
import { getFont } from '../../Utils/fontFallback';;
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HistoryLaporanScreen() {
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    fetchMyReports();
  }, []);

  const fetchMyReports = async () => {
    setLoading(true);
    try {
      const userSession = await AsyncStorage.getItem('user_session');
      if (!userSession) {
        console.log('No authenticated user found');
        setMyReports([]);
        return;
      }
      const userData = JSON.parse(userSession);
      const uid = userData.uid;
      
      console.log('🔎 Fetching reports with UID:', uid);
      console.log('👤 Full user data:', userData);
      
      // First, let's check ALL reports to see if there are any
      const allReportsQuery = query(
        collection(db, 'reports'),
        orderBy('createdAt', 'desc')
      );
      const allReportsSnapshot = await getDocs(allReportsQuery);
      console.log('📊 Total reports in database:', allReportsSnapshot.size);
      allReportsSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`Report ID: ${doc.id}, UID: ${data.uid}, Description: ${data.description}`);
      });

      // Now fetch reports for this specific user
      const q = query(
        collection(db, 'reports'),
        where('uid', '==', uid),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const reports = [];
      querySnapshot.forEach((doc) => {
        reports.push({ id: doc.id, ...doc.data() });
      });
      
      console.log('📄 Fetched user reports:', reports);
      console.log('🔢 Number of user reports:', reports.length);

      setMyReports(reports);
    } catch (error) {
      console.error("Error fetching my reports: ", error);
      // Show user-friendly error message
      Alert.alert('Error', 'Gagal memuat riwayat laporan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'complete': return '#4CAF50';
      case 'progress': return '#FF9800';
      default: return '#F44336';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'complete': return 'Selesai';
      case 'progress': return 'Dalam Proses';
      default: return 'Menunggu';
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('DetailLaporan', { reportId: item.id })}
    >
      <Image source={{ uri: item.imageUrls?.[0] || 'https://via.placeholder.com/100' }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.description}</Text>
        <Text style={styles.cardDate}>
          {item.createdAt?.toDate().toLocaleDateString('id-ID')}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History Laporan Anda</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
      ) : (
        <FlatList
          data={myReports}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{paddingTop: 85}}
          refreshControl={
            <RefreshControl 
              refreshing={loading} 
              onRefresh={fetchMyReports}
              colors={['#4CAF50']}
              tintColor='#4CAF50'
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Belum ada laporan</Text>
              <Text style={styles.emptySubText}>Tarik ke bawah untuk refresh</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    paddingTop: 25,
    paddingBottom: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 20,
    ...getFont('bold'),
    color: 'white',
  },
  loader: {
    marginTop: 50,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  cardImage: {
    width: 100,
    height: 100,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  cardContent: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    ...getFont('bold'),
    marginBottom: 5,
  },
  cardDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    ...getFont('bold'),
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
});
