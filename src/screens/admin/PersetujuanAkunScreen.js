import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  doc, 
  updateDoc,
  deleteDoc,
  startAfter
} from 'firebase/firestore';
import { db } from '../../config/firebase'
import { getFont } from '../../Utils/fontFallback';;

const PersetujuanAkunScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;

  useEffect(() => {
    fetchUnapprovedUsers();
  }, []);

  const fetchUnapprovedUsers = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
      setUsers([]);
      setLastDoc(null);
      setHasMore(true);
    } else {
      setLoading(true);
    }

    try {
      // Temporary simple query while waiting for indexes to build
      let q;
      if (lastDoc && !isRefresh) {
        q = query(
          collection(db, 'users'),
          where('isApproved', '==', false),
          startAfter(lastDoc),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, 'users'),
          where('isApproved', '==', false),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const userData = [];

      snapshot.forEach((doc) => {
        userData.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      if (snapshot.docs.length < 10) {
        setHasMore(false);
      }

      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        
        if (isRefresh) {
          setUsers(userData);
        } else {
          setUsers(prev => [...prev, ...userData]);
        }
      }

    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Gagal mengambil data pengguna');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleApprove = async (userId, userName) => {
    Alert.alert(
      'Konfirmasi',
      `Setujui akun ${userName}?`,
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Setujui',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'users', userId), {
                isApproved: true,
              });
              
              // Remove user from list
              setUsers(prev => prev.filter(user => user.id !== userId));
              Alert.alert('Berhasil', `Akun ${userName} telah disetujui`);
            } catch (error) {
              console.error('Error approving user:', error);
              Alert.alert('Error', 'Gagal menyetujui akun');
            }
          },
        },
      ]
    );
  };

  const handleReject = async (userId, userName) => {
    Alert.alert(
      'Konfirmasi',
      `Tolak akun ${userName}?`,
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Tolak',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete user document from Firestore
              await deleteDoc(doc(db, 'users', userId));
              
              // Remove user from the local list
              setUsers(prev => prev.filter(user => user.id !== userId));
              Alert.alert('Berhasil', `Akun ${userName} telah ditolak dan dihapus.`);

              // Note: Deleting from Firebase Auth requires a backend (e.g., Cloud Function)
              // for security reasons. The user will not be able to log in anyway
              // because their Firestore document is gone.

            } catch (error) {
              console.error('Error rejecting user:', error);
              Alert.alert('Error', 'Gagal menolak akun');
            }
          },
        },
      ]
    );
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      fetchUnapprovedUsers();
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderUser = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.nama}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <Text style={styles.userAddress}>{item.alamat}</Text>
        <Text style={styles.userDate}>
          Mendaftar: {formatDate(item.createdAt)}
        </Text>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.approveButton]}
          onPress={() => handleApprove(item.id, item.nama)}
        >
          <Ionicons name="checkmark" size={20} color="white" />
          <Text style={styles.buttonText}>Setujui</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.rejectButton]}
          onPress={() => handleReject(item.id, item.nama)}
        >
          <Ionicons name="close" size={20} color="white" />
          <Text style={styles.buttonText}>Tolak</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#4CAF50" />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Memuat data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image 
        source={require('../../../assets/images/top_header.png')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Persetujuan Akun</Text>
        <Text style={styles.headerSubtitle}>Akun baru masuk 🔥</Text>
      </View>

      
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchUnapprovedUsers(true)}
            colors={['#4CAF50']}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#ccc" />
            <Text style={styles.emptyText}>Tidak ada akun yang perlu disetujui</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: 250,
  },
  headerContent: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
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
  headerSubtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginTop: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    paddingTop: 160,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  userCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  userInfo: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 18,
    ...getFont('bold'),
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userDate: {
    fontSize: 12,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    ...getFont('bold'),
    marginLeft: 8,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
});

export default PersetujuanAkunScreen;
