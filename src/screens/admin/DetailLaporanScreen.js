import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView, Linking, SafeAreaView, StatusBar } from 'react-native';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase'
import { getFont } from '../../Utils/fontFallback';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import 'moment/locale/id';

moment.locale('id');

export default function DetailLaporanScreen({ route, navigation }) {
  const { reportId, status } = route.params;
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const docRef = doc(db, 'reports', reportId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const reportData = docSnap.data();
          
let userName = 'Anonim';
          let userAddress = 'Alamat tidak diketahui';
          
          // First try to find user by UID (Firebase Auth UID)
          const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', reportData.uid)));
          
          if (userDoc.docs.length > 0) {
            userName = userDoc.docs[0].data().nama || 'Anonim';
            userAddress = userDoc.docs[0].data().alamat || 'Alamat tidak diketahui';
          } else {
            // If not found by UID, try to find by document ID
            try {
              const userDocRef = doc(db, 'users', reportData.uid);
              const userDocSnap = await getDoc(userDocRef);
              
              if (userDocSnap.exists()) {
                userName = userDocSnap.data().nama || 'Anonim';
                userAddress = userDocSnap.data().alamat || 'Alamat tidak diketahui';
              }
            } catch (error) {
              console.log('Error fetching user by document ID:', error.message);
            }
          }
          
          setReport({ ...reportData, userName, userAddress });
        } else {
          Alert.alert('Error', 'Laporan tidak ditemukan.');
        }
      } catch (error) {
        console.error("Error fetching report: ", error);
        Alert.alert('Error', 'Gagal memuat laporan.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId]);

  const handleCompleteReport = async () => {
    if (!feedback.trim()) {
      Alert.alert('Input kosong', 'Harap berikan feedback sebelum menyelesaikan laporan.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Get current admin info from session
      const userSession = await AsyncStorage.getItem('user_session');
      let adminId = null;
      if (userSession) {
        const userData = JSON.parse(userSession);
        adminId = userData.uid;
      }

      const reportRef = doc(db, 'reports', reportId);
      await updateDoc(reportRef, {
        status: 'complete',
        feedbackDescription: feedback,
        feedbackBy: adminId, // Store admin ID who gave feedback
        updatedAt: new Date(),
      });
      Alert.alert('Sukses', 'Laporan telah ditandai sebagai selesai dan feedback telah dikirim.');
      navigation.goBack();
    } catch (error) {
      console.error("Error completing report: ", error);
      Alert.alert('Error', 'Gagal menyelesaikan laporan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#4CAF50" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  if (!report) {
    return (
      <View style={styles.container}>
        <Text>Laporan tidak ditemukan.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Detail Laporan</Text>
        </View>

      {report.imageUrls && (
        <ScrollView horizontal pagingEnabled style={styles.imageSlider}>
          {report.imageUrls.map((uri, index) => (
            <Image key={index} source={{ uri }} style={styles.image} />
          ))}
        </ScrollView>
      )}

      <View style={styles.contentContainer}>
        <Text style={styles.description}>{report.description}</Text>
<Text style={styles.detailText}><Ionicons name="person" size={16} /> Pelapor: {report.userName}</Text>
        <Text style={styles.detailText}><Ionicons name="home" size={16} /> Alamat: {report.userAddress}</Text>
        <Text style={styles.detailText}><Ionicons name="time" size={16} /> Waktu: {report.createdAt ? moment(report.createdAt.toDate()).format('D MMMM YYYY, HH:mm') : 'Tanggal tidak tersedia'}</Text>
        <Text style={styles.detailText}><Ionicons name="git-network" size={16} /> Status: {report.status}</Text>
        <View style={[styles.priorityContainer, { backgroundColor: getPriorityColor(report.priority) }]}>
            <Text style={styles.priorityText}>Prioritas: {report.priority}</Text>
        </View>
        
        <View style={styles.locationContainer}>
          <Text style={styles.locationTitle}>📍 Lokasi Laporan</Text>
          <Text style={styles.locationText}>Lat: {report.latitude || report.lat || 'N/A'}</Text>
          <Text style={styles.locationText}>Lng: {report.longitude || report.lng || 'N/A'}</Text>
          <TouchableOpacity 
            style={styles.mapButton} 
            onPress={() => {
              const lat = report.latitude || report.lat;
              const lng = report.longitude || report.lng;
              if (lat && lng) {
                const url = `https://www.google.com/maps?q=${lat},${lng}`;
                Linking.openURL(url);
              } else {
                Alert.alert('Error', 'Koordinat tidak tersedia');
              }
            }}
          >
            <Ionicons name="map" size={20} color="#fff" style={{marginRight: 10}} />
            <Text style={styles.mapButtonText}>Buka di Google Maps</Text>
          </TouchableOpacity>
        </View>

        {status === 'pending' ? (
          <View style={styles.feedbackSection}>
            <TextInput
              style={styles.input}
              placeholder="Berikan feedback..."
          placeholderTextColor="#999"
              value={feedback}
              onChangeText={setFeedback}
              multiline
            />
            <TouchableOpacity style={styles.button} onPress={handleCompleteReport} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Selesaikan Laporan</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.feedbackDisplay}>
            <Text style={styles.feedbackTitle}>Feedback:</Text>
            <Text style={styles.feedbackContent}>{report.feedbackDescription}</Text>
          </View>
        )}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getPriorityColor = (priority) => {
  if (!priority) return '#9E9E9E';
  switch (priority.toLowerCase()) {
    case 'rendah': return '#4CAF50';
    case 'sedang': return '#FFC107';
    case 'tinggi': return '#F44336';
    default: return '#9E9E9E';
  }
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#4CAF50',
  },
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
  imageSlider: {
    height: 250,
  },
  image: {
    width: 420,
    height: 250,
  },
  contentContainer: {
    padding: 20,
  },
  description: {
    fontSize: 18,
    ...getFont('bold'),
    color: '#333',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
    flexDirection: 'row',
    alignItems: 'center'
  },
  priorityContainer: {
      borderRadius: 15,
      paddingVertical: 5,
      paddingHorizontal: 10,
      alignSelf: 'flex-start',
      marginVertical: 10
  },
  priorityText: {
      color: '#fff',
      fontSize: 12,
      ...getFont('bold'),
  },
  map: {
    height: 200,
    marginTop: 15,
    borderRadius: 10,
  },
  feedbackSection: {
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    minHeight: 100,
    textAlignVertical: 'top',
    color: '#333',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    ...getFont('bold'),
  },
  feedbackDisplay: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#eef',
    borderRadius: 5,
  },
  feedbackTitle: {
    ...getFont('bold'),
    color: '#333',
    marginBottom: 5,
  },
  feedbackContent: {
    color: '#666',
  },
  locationContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 2
  },
  locationTitle: {
    fontSize: 16,
    ...getFont('bold'),
    color: '#333',
    marginBottom: 10
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    marginTop: 10
  },
  mapButtonText: {
    color: '#fff',
    ...getFont('bold'),
  }
});
