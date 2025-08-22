import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar, Alert } from 'react-native';
import { collection, getDocs, query, where, orderBy, limit, startAfter, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../config/firebase'
import { getFont } from '../../Utils/fontFallback';;

export default function DataWargaScreen() {
  const [users, setUsers] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isFetching, setIsFetching] = useState(false);

  const fetchWarga = async (search = '', newSearch = false) => {
    if (loading) return;
    setLoading(true);

    try {
      let q = query(
        collection(db, 'users'),
        where('role', '==', 'warga'),
        where('isApproved', '==', true),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      if (!newSearch && lastVisible) {
        q = query(q, startAfter(lastVisible));
      }

      const querySnapshot = await getDocs(q);
      const newWarga = [];
      querySnapshot.forEach((doc) => {
        newWarga.push({ id: doc.id, ...doc.data() });
      });

      if (querySnapshot.docs.length > 0) {
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      }
      
      const filteredWarga = search.length > 0 ? newWarga.filter(user => user.nama.toLowerCase().includes(search.toLowerCase())) : newWarga;

      if (newSearch) {
        setUsers(filteredWarga);
      } else {
        setUsers((prev) => [...prev, ...filteredWarga]);
      }

      if (querySnapshot.docs.length < 10) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching data: ", error);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchWarga(searchKeyword, true);
  }, [searchKeyword]);

  const handleSearch = () => {
    setUsers([]);
    setLastVisible(null);
    setHasMore(true);
    fetchWarga(searchKeyword, true);
  };

  const handleReset = () => {
    Alert.alert(
      "⚠️ Konfirmasi Hapus",
      "Apakah Anda yakin ingin menghapus SEMUA data warga? Tindakan ini tidak dapat dibatalkan!",
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
              const usersCollection = collection(db, 'users');
              const usersSnapshot = await getDocs(query(usersCollection, where('role', '==', 'warga')));
              
              if (usersSnapshot.empty) {
                Alert.alert('ℹ️ Info', 'Tidak ada data warga untuk dihapus.');
                return;
              }
              
              const batch = writeBatch(db);
              usersSnapshot.docs.forEach((docSnapshot) => {
                batch.delete(doc(db, 'users', docSnapshot.id));
              });
              
              await batch.commit();
              
              Alert.alert(
                '✅ Berhasil',
                `${usersSnapshot.size} data warga berhasil dihapus.`
              );
              
              // Refresh the list
              setUsers([]);
              setLastVisible(null);
              setHasMore(true);
              fetchWarga('', true);
              
            } catch (error) {
              console.error('Error deleting users:', error);
              Alert.alert('❌ Error', 'Gagal menghapus data warga.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchWarga(searchKeyword);
    }
  };

  const onRefresh = () => {
    setIsFetching(true);
    setUsers([]);
    setLastVisible(null);
    setHasMore(true);
    fetchWarga(searchKeyword, true);
  }

  const renderItem = ({ item }) => (
    <View style={styles.card}>
        <Text style={styles.cardTitle}>Nama: {item.nama}</Text>
        <Text style={styles.cardText}>Pembuatan Akun: {item.createdAt?.toDate().toLocaleDateString('id-ID')} {item.createdAt?.toDate().toLocaleTimeString('id-ID')}</Text>
        <Text style={styles.cardText}>Email: {item.email}</Text>
        <Text style={styles.cardText}>Alamat: {item.alamat}</Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return <ActivityIndicator style={{ marginVertical: 20 }} color="#4CAF50" />;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
        <Text style={styles.headerTitle}>Data Warga</Text>
      </View>
      
      {/* Search Container */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Cari berdasarkan nama..."
          placeholderTextColor="#999"
          value={searchKeyword}
          onChangeText={setSearchKeyword}
        />
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.buttonText}>Cari</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        <FlatList
          data={users}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          onRefresh={onRefresh}
          refreshing={isFetching}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      </View>
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
  header: {
    backgroundColor: '#4CAF50',
    paddingTop: 15,
    paddingBottom: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    ...getFont('bold'),
    color: '#fff',
  },
  searchContainer: {
    marginHorizontal: 15,
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  input: {
    height: 45,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  searchButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#F44336', // Merah
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    ...getFont('600'),
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
  },
  listContainer: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 18,
    marginVertical: 6,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    ...getFont('bold'),
    color: '#2E7D32',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
    lineHeight: 20,
  },
});
