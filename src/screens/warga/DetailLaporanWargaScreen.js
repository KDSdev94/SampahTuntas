// DetailLaporanWargaScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase'
import { getFont } from '../../Utils/fontFallback';;
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import 'moment/locale/id';

const { width } = Dimensions.get('window');

export default function DetailLaporanWargaScreen({ route, navigation }) {
  const { reportId, status } = route.params;
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    moment.locale('id');
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    try {
      const docRef = doc(db, 'reports', reportId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const reportData = { id: docSnap.id, ...docSnap.data() };
        
        // Fetch user data
        if (reportData.uid) {
          const userDocRef = doc(db, 'users', reportData.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            reportData.userName = userDocSnap.data().nama;
          }
        }

        // Fetch admin feedback data if available
        if (reportData.feedbackBy) {
          const adminDocRef = doc(db, 'users', reportData.feedbackBy);
          const adminDocSnap = await getDoc(adminDocRef);
          if (adminDocSnap.exists()) {
            reportData.adminName = adminDocSnap.data().nama;
          }
        }
        
        setReport(reportData);
      } else {
        console.log('No such document!');
      }
    } catch (error) {
      console.error("Error fetching report: ", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return moment(date).format('D MMMM YYYY HH:mm');
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Belum Ditangani';
      case 'progress': return 'Dalam Proses';
      case 'complete': return 'Selesai';
      default: return 'Belum Ditangani';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'progress': return '#2196F3';
      case 'complete': return '#4CAF50';
      default: return '#FF9800';
    }
  };

  const renderImageItem = ({ item }) => (
    <Image source={{ uri: item }} style={styles.carouselImage} resizeMode="cover" />
  );

  const renderFeedbackImageItem = ({ item }) => (
    <Image source={{ uri: item }} style={styles.carouselImage} resizeMode="cover" />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Laporan tidak ditemukan</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Laporan</Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={styles.imageContainer}>
          <FlatList
            data={report.imageUrls || []}
            renderItem={renderImageItem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(index);
            }}
          />
          {/* Image indicator dots */}
          {report.imageUrls && report.imageUrls.length > 1 && (
            <View style={styles.imageIndicator}>
              {report.imageUrls.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    { backgroundColor: index === currentImageIndex ? '#4CAF50' : '#ccc' }
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.contentContainer}>
          {/* Description */}
          <Text style={styles.description}>{report.description}</Text>
          
          <View style={styles.divider} />
          
          {/* Status */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status: </Text>
            <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
              {getStatusText(report.status)}
            </Text>
          </View>
          
          <View style={styles.divider} />
          
          {/* Reporter and Date */}
          <View style={styles.reporterRow}>
            <Text style={styles.infoLabel}>Pelapor: {report.userName || 'Unknown'}</Text>
            <Text style={styles.dateText}>{formatDateTime(report.createdAt)}</Text>
          </View>
          
          <View style={styles.divider} />
          
          {/* Feedback Section - Show if status is not pending and feedback exists */}
          {report.status !== 'pending' && report.feedbackDescription && (
            <View style={styles.feedbackSection}>
              <Text style={styles.feedbackTitle}>💬 Balasan dari Admin</Text>
              
              {/* Feedback Images - Only show if available */}
              {report.feedbackImages && report.feedbackImages.length > 0 && (
                <View style={styles.feedbackImageContainer}>
                  <FlatList
                    data={report.feedbackImages}
                    renderItem={renderFeedbackImageItem}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                  />
                </View>
              )}
              
              {/* Feedback Description */}
              <View style={styles.feedbackCard}>
                <View style={styles.feedbackHeader}>
                  <Ionicons name="person-circle" size={20} color="#4CAF50" />
                  <Text style={styles.adminName}>
                    {report.adminName || 'Admin'}
                  </Text>
                  <Text style={styles.feedbackDate}>
                    {formatDateTime(report.updatedAt)}
                  </Text>
                </View>
                <Text style={styles.feedbackDescription}>
                  {report.feedbackDescription}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#4CAF50',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  backButton: {
    marginRight: 20,
  },
  headerTitle: {
    fontSize: 20,
    ...getFont('bold'),
    color: '#fff',
    textAlign: 'center',
    flex: 1,
    marginRight: 44, // To center the title considering back button width
  },
  scrollContainer: {
    flex: 1,
  },
  imageContainer: {
    height: 300,
    backgroundColor: '#000',
  },
  carouselImage: {
    width: width,
    height: 300,
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  contentContainer: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 8,
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  description: {
    fontSize: 18,
    ...getFont('bold'),
    color: '#333',
    marginBottom: 10,
  },
  divider: {
    height: 2,
    backgroundColor: '#f0f0f0',
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  infoLabel: {
    fontSize: 14,
    ...getFont('bold'),
    color: '#666',
  },
  statusText: {
    fontSize: 14,
    ...getFont('bold'),
  },
  reporterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  dateText: {
    fontSize: 14,
    ...getFont('bold'),
    color: '#666',
  },
  feedbackSection: {
    marginTop: 10,
  },
  feedbackTitle: {
    fontSize: 14,
    ...getFont('bold'),
    color: '#666',
    marginBottom: 10,
  },
  feedbackImageContainer: {
    height: 300,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
  },
  feedbackLabel: {
    fontSize: 14,
    ...getFont('bold'),
    color: '#666',
    marginBottom: 5,
  },
  feedbackCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  adminName: {
    fontSize: 14,
    ...getFont('bold'),
    color: '#4CAF50',
    marginLeft: 8,
    flex: 1,
  },
  feedbackDate: {
    fontSize: 12,
    color: '#888',
  },
  feedbackDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});
