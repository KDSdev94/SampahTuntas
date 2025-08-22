import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  doc, 
  deleteDoc,
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../../config/firebase'
import { getFont } from '../../Utils/fontFallback';;

const InformasiWargaScreen = () => {
  const navigation = useNavigation();
  const [informations, setInformations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchInformations(true);
    }, [])
  );

  const fetchInformations = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const q = query(
        collection(db, 'informasi'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const infoData = [];
      
      snapshot.forEach((doc) => {
        infoData.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      
      setInformations(infoData);
    } catch (error) {
      console.error('Error fetching informations:', error);
      Alert.alert('Error', 'Gagal memuat informasi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = (infoId, title) => {
    Alert.alert(
      'Konfirmasi',
      'Apakah Anda yakin ingin menghapus informasi ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'informasi', infoId));
              setInformations(prev => prev.filter(info => info.id !== infoId));
              Alert.alert('Berhasil', '✅ Informasi berhasil dihapus');
            } catch (error) {
              console.error('Error deleting information:', error);
              Alert.alert('Error', '❌ Gagal menghapus informasi');
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const renderInformation = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.listTile}>
        {/* Leading Image */}
        <View style={styles.leading}>
          {item.imageUrl && item.imageUrl.trim() !== '' ? (
            <Image 
              source={{ uri: item.imageUrl }} 
              style={styles.leadingImage}
              defaultSource={require('../../../assets/icon.png')}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={40} color="#999" />
            </View>
          )}
        </View>
        
        {/* Title and Subtitle */}
        <View style={styles.titleSubtitle}>
          <Text style={styles.title} numberOfLines={1}>{item.judul || item.title || '-'}</Text>
          <View style={styles.subtitleContainer}>
            <Text style={styles.description} numberOfLines={2}>
              {item.isi || item.description || '-'}
            </Text>
            <View style={styles.spacing} />
            <Text style={styles.expiredDate}>
              Expired: {item.tanggal ? formatDate(item.tanggal) : (item.expiredDate ? formatDate(item.expiredDate) : '-')}
            </Text>
            {item.alwaysShow && (
              <Text style={styles.alwaysShowIndicator}>⚠️ Selalu tampilkan</Text>
            )}
          </View>
        </View>
        
        {/* Trailing Delete Button */}
        <TouchableOpacity 
          style={styles.trailing}
          onPress={() => handleDelete(item.id, item.judul || item.title)}
        >
          <Ionicons name="trash" size={20} color="#f44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Memuat informasi...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Daftar Informasi</Text>
      </View>
      
      <FlatList
        data={informations}
        renderItem={renderInformation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchInformations(true)}
            colors={['#4CAF50']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Belum ada informasi</Text>
          </View>
        }
      />
      
      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('TambahInformasi')}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
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
    top: 70,
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
  listContainer: {
    paddingBottom: 100,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoContent: {
    flex: 1,
    marginRight: 12,
  },
  infoTitle: {
    fontSize: 16,
    ...getFont('bold'),
    color: '#333',
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  infoFooter: {
    flexDirection: 'column',
    gap: 4,
  },
  infoDate: {
    fontSize: 12,
    color: '#4CAF50',
    ...getFont('500'),
  },
  expiredText: {
    fontSize: 12,
    color: '#f44336',
    ...getFont('500'),
  },
  alwaysShowText: {
    fontSize: 12,
    color: '#FF9800',
    ...getFont('500'),
  },
  infoImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  // Flutter Card and ListTile equivalent styles
  appBar: {
    backgroundColor: '#4CAF50',
    paddingVertical: 20,
    paddingHorizontal: 16,
    paddingTop: 50,
    alignItems: 'center',
  },
  appBarTitle: {
    fontSize: 20,
    ...getFont('bold'),
    color: 'white',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginHorizontal: 12,
    marginVertical: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  listTile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  leading: {
    marginRight: 16,
  },
  leadingImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSubtitle: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 16,
    ...getFont('bold'),
    color: '#333',
    marginBottom: 4,
  },
  subtitleContainer: {
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    marginBottom: 4,
  },
  spacing: {
    height: 4,
  },
  expiredDate: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
  },
  alwaysShowIndicator: {
    fontSize: 12,
    color: '#FF9800',
    ...getFont('500'),
  },
  trailing: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default InformasiWargaScreen;
