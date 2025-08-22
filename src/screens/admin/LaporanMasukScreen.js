import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { collection, query, where, orderBy, limit, getDocs, startAfter, writeBatch, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { getDistance } from 'geolib';
import moment from 'moment';
import 'moment/locale/id';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReportItem from './components/ReportItem'
import { getFont } from '../../Utils/fontFallback';

moment.locale('id');

export default function LaporanMasukScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);

  // Cache location to avoid repeated GPS requests
  const getCachedLocation = async () => {
    try {
      // First check if we already have location in state
      if (location) {
        return location;
      }
      
      // Check cached location from AsyncStorage
      const cachedLocation = await AsyncStorage.getItem('admin_cached_location');
      const cacheTime = await AsyncStorage.getItem('admin_location_cache_time');
      
      // Use cached location if it's less than 10 minutes old
      if (cachedLocation && cacheTime) {
        const now = Date.now();
        const cacheAge = now - parseInt(cacheTime);
        if (cacheAge < 10 * 60 * 1000) { // 10 minutes
          const parsedLocation = JSON.parse(cachedLocation);
          setLocation(parsedLocation);
          return parsedLocation;
        }
      }
      
      // Get fresh location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return null;
      }

      const newLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // Use balanced accuracy for faster response
        timeout: 10000, // 10 second timeout
        maximumAge: 300000 // Accept location up to 5 minutes old
      });
      
      // Cache the new location
      await AsyncStorage.setItem('admin_cached_location', JSON.stringify(newLocation));
      await AsyncStorage.setItem('admin_location_cache_time', Date.now().toString());
      
      setLocation(newLocation);
      return newLocation;
    } catch (error) {
      console.error('Error getting location:', error);
      setErrorMsg('Failed to get location');
      return null;
    }
  };

  useFocusEffect(
    useCallback(() => {
      const initializeScreen = async () => {
        console.log('🚀 Initializing screen, getting fresh location...');
        const currentLocation = await getCachedLocation();
        console.log('📍 Got location:', currentLocation);
        if (currentLocation) {
          fetchReports(true); // Only fetch reports if we have location
        } else {
          console.log('❌ No location available, trying to fetch anyway...');
          fetchReports(true); // Try fetching anyway to see what happens
        }
      };
      
      initializeScreen();
    }, [])
  );

  const fetchReports = async (reloading = false) => {
    if (loading) return;
    setLoading(true);

    try {
      // Ensure we have location before processing reports
      let currentLocation = location;
      if (!currentLocation) {
        console.log('🔄 No location in state, getting fresh location...');
        currentLocation = await getCachedLocation();
      }
      
      let q = query(
        collection(db, 'reports'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      if (lastVisible && !reloading) {
        q = query(q, startAfter(lastVisible));
      }

      const documentSnapshots = await getDocs(q);

const newReports = await Promise.all(documentSnapshots.docs.map(async (reportDoc) => {
        const reportData = reportDoc.data();
        
        let userName = 'Anonim';
        let userAddress = 'Alamat tidak diketahui';

        // Try to find user by document ID first (most common case)
        try {
          const userDocRef = doc(db, 'users', reportData.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            console.log('User found by document ID:', userData);
            userName = userData.nama || 'Nama tidak diketahui';
            userAddress = userData.alamat || 'Alamat tidak diketahui';
          } else {
            // If not found by document ID, try to find by UID field
            console.log('No user found by document ID, trying UID field:', reportData.uid);
            const userQuery = query(collection(db, 'users'), where('uid', '==', reportData.uid));
            const userDoc = await getDocs(userQuery);
            
            if (!userDoc.empty) {
              const userData = userDoc.docs[0].data();
              console.log('User found by UID field:', userData);
              userName = userData.nama || 'Nama tidak diketahui';
              userAddress = userData.alamat || 'Alamat tidak diketahui';
            } else {
              console.log('No user found for ID:', reportData.uid);
            }
          }
        } catch (error) {
          console.log('Error fetching user:', error.message);
        }
        
        let distance = null;
        console.log('🔍 Debug - currentLocation:', currentLocation);
        console.log('🔍 Debug - reportData:', reportData);
        
        if (currentLocation) {
          console.log('📍 Admin location:', currentLocation.coords.latitude, currentLocation.coords.longitude);
          console.log('📍 Report location data - lat:', reportData.lat, 'lng:', reportData.lng);
          console.log('📍 Report location types - lat:', typeof reportData.lat, 'lng:', typeof reportData.lng);
          
          // Check if report has location data (using lat/lng as stored in LaporScreen)
          if (reportData.lat && reportData.lng) {
            try {
              distance = getDistance(
                { latitude: currentLocation.coords.latitude, longitude: currentLocation.coords.longitude },
                { latitude: reportData.lat, longitude: reportData.lng }
              );
              console.log('✅ Calculated distance:', distance, 'meters');
            } catch (error) {
              console.error('❌ Error calculating distance:', error);
            }
          } else {
            console.log('❌ Report missing location data - lat:', reportData.lat, 'lng:', reportData.lng);
          }
        } else {
          console.log('❌ Admin location not available');
        }

        // Debug log untuk imageUrls
        console.log('Report imageUrls:', reportData.imageUrls);
        
        return {
          id: reportDoc.id,
          ...reportData,
          userName,
          userAddress,
          distance,
        };
      }));

      setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
      
      if (reloading) {
        setReports(newReports);
      } else {
        // Prevent duplicates by filtering out reports that already exist
        setReports(prevReports => {
          const existingIds = new Set(prevReports.map(report => report.id));
          const uniqueNewReports = newReports.filter(report => !existingIds.has(report.id));
          return [...prevReports, ...uniqueNewReports];
        });
      }
    } catch (error) {
      console.error("Error fetching reports: ", error);
    } finally {
      setLoading(false);
      if (reloading) setRefreshing(false);
    }
  };

  // Removed auto-loading, data will only load on manual refresh

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setLastVisible(null);
    fetchReports(true).then(() => setRefreshing(false));
  }, []);

  const deleteAllReports = async () => {
    Alert.alert(
      "⚠️ Konfirmasi Hapus",
      "Apakah Anda yakin ingin menghapus SEMUA laporan? Tindakan ini tidak dapat dibatalkan!",
      [
        {
          text: "Batal",
          style: "cancel"
        },
        {
          text: "Hapus Semua",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const reportsCollection = collection(db, 'reports');
              const reportsSnapshot = await getDocs(reportsCollection);
              
              if (reportsSnapshot.empty) {
                Alert.alert('ℹ️ Info', 'Tidak ada laporan untuk dihapus.');
                return;
              }
              
              const batch = writeBatch(db);
              reportsSnapshot.docs.forEach((docSnapshot) => {
                batch.delete(doc(db, 'reports', docSnapshot.id));
              });
              
              await batch.commit();
              
              Alert.alert(
                '✅ Berhasil',
                `${reportsSnapshot.size} laporan berhasil dihapus.`
              );
              
              // Refresh the list
              setReports([]);
              setLastVisible(null);
              fetchReports(true);
              
            } catch (error) {
              console.error('Error deleting reports:', error);
              Alert.alert('❌ Error', 'Gagal menghapus laporan.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <ReportItem 
      item={item} 
      onPress={() => navigation.navigate('DetailLaporan', { reportId: item.id, status: item.status })}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        ListHeaderComponent={
          <>
            {/* Header Section with Background */}
            <View style={styles.headerSection}>
              <Image 
                source={require('../../../assets/images/top_header.png')} 
                style={styles.backgroundImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['rgba(76, 175, 80, 0.8)', 'rgba(46, 125, 50, 0.9)']}
                style={styles.headerGradient}
              >
                <View style={styles.headerContent}>
                  <View style={styles.headerTitleContainer}>
                    <Ionicons name="document-text" size={32} color="white" style={styles.headerIcon} />
                    <Text style={styles.headerTitle}>Laporan Masuk</Text>
                  </View>
                  <Text style={styles.headerSubtitle}>Kelola dan pantau laporan dari warga</Text>
                  
                  {/* Stats Cards */}
                  <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                      <Ionicons name="time-outline" size={24} color="#4CAF50" />
                      <Text style={styles.statNumber}>{reports.length}</Text>
                      <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statCard}>
                      <Ionicons name="checkmark-circle-outline" size={24} color="#2196F3" />
                      <Text style={styles.statNumber}>{reports.filter(r => r.status === 'complete').length}</Text>
                      <Text style={styles.statLabel}>Selesai</Text>
                    </View>
                    <View style={styles.statCard}>
                      <Ionicons name="hourglass-outline" size={24} color="#FF9800" />
                      <Text style={styles.statNumber}>{reports.filter(r => r.status === 'pending').length}</Text>
                      <Text style={styles.statLabel}>Pending</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </View>
            
            {/* Action Buttons */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('LaporanDitangani')}>
                  <Image source={require('../../../assets/images/handle.png')} style={{width: 40, height: 40, marginBottom: 8}} />
                  <Text style={styles.buttonText}>Laporan Ditangani</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('RekapLaporan')}>
                  <Image source={require('../../../assets/images/summary.png')} style={{width: 40, height: 40, marginBottom: 8}} />
                  <Text style={styles.buttonText}>Rekap Laporan</Text>
              </TouchableOpacity>
            </View>
            
            {/* List Header */}
            <View style={styles.listHeaderContainer}>
              <Ionicons name="time" size={20} color="#4CAF50" style={{ marginRight: 8 }} />
              <Text style={styles.listHeader}>Laporan Terbaru</Text>
              <View style={styles.fireBadge}>
                <Text style={styles.fireEmoji}>🔥</Text>
              </View>
            </View>
          </>
        }
        data={reports}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.id || `report-${index}-${Date.now()}`}
        ListFooterComponent={loading && !refreshing && <ActivityIndicator size="large" color="#4CAF50" />}
        ListEmptyComponent={
          !loading && !refreshing ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="document-outline" size={60} color="#4CAF50" />
                <View style={styles.emptyIconBadge}>
                  <Ionicons name="add-circle" size={24} color="#FF6B35" />
                </View>
              </View>
              <Text style={styles.emptyTitle}>Belum Ada Laporan Masuk</Text>
              <Text style={styles.emptySubtitle}>Laporan dari warga akan muncul di sini ketika ada yang melaporkan masalah sampah</Text>
              <View style={styles.emptyActionContainer}>
                <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
                  <Ionicons name="refresh" size={20} color="#4CAF50" />
                  <Text style={styles.refreshButtonText}>Muat Ulang</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
      
      {/* Enhanced FAB dengan gradient */}
      <TouchableOpacity
        style={[styles.fab, loading && styles.fabDisabled]}
        onPress={deleteAllReports}
        disabled={loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#F44336', '#D32F2F']}
          style={styles.fabGradient}
        >
          {loading ? (
            <ActivityIndicator size={24} color="white" />
          ) : (
            <Ionicons name="trash" size={24} color="white" />
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    ...getFont('bold'),
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  headerSection: {
    height: 320,
    position: 'relative',
    overflow: 'hidden',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerIcon: {
    marginRight: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
    paddingHorizontal: 0,
    width: '100%',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 24,
    ...getFont('bold'),
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    ...getFont('600'),
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    borderRadius: 20,
    flexDirection: 'column',
    alignItems: 'center',
    elevation: 8,
    width: '48%',
    justifyContent: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: '#E8F5E8',
    transform: [{ scale: 1 }],
  },
  buttonText: {
    fontSize: 14,
    color: '#2E7D32',
    ...getFont('bold'),
    textAlign: 'center',
  },
  listHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  listHeader: {
    fontSize: 18,
    ...getFont('bold'),
    color: '#333',
    flex: 1,
  },
  fireBadge: {
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    elevation: 2,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fireEmoji: {
    fontSize: 14,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    ...getFont('500'),
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
    height: 120, // Adjusted height
    backgroundColor: '#f0f0f0', // Added background color
  },
  placeholderImageContainer: {
    width: 100,
    height: 120,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
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
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  cardAddress: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    flex: 1,
  },
  distanceContainer: {
    backgroundColor: '#f44336',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  distanceText: {
    color: '#fff',
    fontSize: 12,
    ...getFont('bold'),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
    paddingHorizontal: 30,
  },
  emptyIconContainer: {
    position: 'relative',
    backgroundColor: '#f8f9fa',
    borderRadius: 50,
    padding: 20,
    marginBottom: 20,
  },
  emptyIconBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 2,
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
    marginTop: 10,
    lineHeight: 24,
  },
  emptyActionContainer: {
    marginTop: 30,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8f0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  refreshButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#4CAF50',
    ...getFont('600'),
  },
  fab: {
    position: 'absolute',
    width: 64,
    height: 64,
    right: 20,
    bottom: 20,
    borderRadius: 32,
    elevation: 12,
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabDisabled: {
    opacity: 0.6,
    elevation: 4,
  },
});
