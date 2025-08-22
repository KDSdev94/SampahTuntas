// ProfilWargaScreen.js - Migrated from ProfilWarga.dart
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase'
import { getFont } from '../../Utils/fontFallback';;

export default function ProfilWargaScreen({ route }) {
  const navigation = useNavigation();
  const onLogout = route?.params?.onLogout;
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const userSession = await AsyncStorage.getItem('user_session');
      if (userSession) {
        const sessionData = JSON.parse(userSession);
        const userDocRef = doc(db, 'users', sessionData.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setUserData({ ...data, uid: sessionData.uid });
        } else {
          console.log('User document not found');
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Konfirmasi Logout',
      'Apakah Anda yakin ingin keluar?',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Ya',
          style: 'destructive',
          onPress: async () => {
            try {
              if (onLogout) {
                await onLogout();
              } else {
                await AsyncStorage.removeItem('user_session');
              }
            } catch (error) {
              Alert.alert('Error', 'Gagal logout: ' + error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingTop: 120}}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      <View style={styles.greetingCard}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#4CAF50" />
            <Text style={styles.loadingText}>Memuat...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.greetingText}>
              Halo, {userData?.nama || 'Warga'} 👋
            </Text>
            <View style={styles.userInfoContainer}>
              <View style={styles.userInfoRow}>
                <Ionicons name="person-circle" size={16} color="#4CAF50" />
                <Text style={styles.userInfoLabel}>ID Pengguna:</Text>
                <Text style={styles.userInfoValue}>{userData?.uid || 'N/A'}</Text>
              </View>
              {userData?.email && (
                <View style={styles.userInfoRow}>
                  <Ionicons name="mail" size={16} color="#4CAF50" />
                  <Text style={styles.userInfoLabel}>Email:</Text>
                  <Text style={styles.userInfoValue}>{userData.email}</Text>
                </View>
              )}
              {userData?.phone && (
                <View style={styles.userInfoRow}>
                  <Ionicons name="call" size={16} color="#4CAF50" />
                  <Text style={styles.userInfoLabel}>Telepon:</Text>
                  <Text style={styles.userInfoValue}>{userData.phone}</Text>
                </View>
              )}
            </View>
          </>
        )}
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('UbahPassword')}
        >
          <Ionicons name="lock-closed" size={50} color="#FF9800" />
          <Text style={styles.menuText}>Ubah Password</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <Ionicons name="log-out" size={50} color="#F44336" />
          <Text style={styles.menuText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    height: 100,
    paddingTop: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 25,
    ...getFont('bold'),
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  greetingCard: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  greetingText: {
    fontSize: 20,
    ...getFont('bold'),
    color: '#333',
  },
  menuContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    padding: 10,
  },
  menuItem: {
    backgroundColor: 'white',
    width: '45%',
    height: 100,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuText: {
    marginTop: 10,
    fontSize: 15,
    ...getFont('bold'),
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#666',
  },
  userInfoContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfoLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    minWidth: 90,
  },
  userInfoValue: {
    fontSize: 14,
    color: '#333',
    ...getFont('500'),
    flex: 1,
  },
});
