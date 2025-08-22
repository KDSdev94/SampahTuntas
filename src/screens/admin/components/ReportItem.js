import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { getFont } from '../../../Utils/fontFallback';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';

// Helper functions for status
const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return '#FF9800'; // Orange
    case 'complete': return '#4CAF50'; // Green
    case 'in_progress': return '#2196F3'; // Blue
    default: return '#9E9E9E'; // Gray
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'pending': return 'Menunggu';
    case 'complete': return 'Selesai';
    case 'in_progress': return 'Proses';
    default: return 'Unknown';
  }
};

const ReportItem = ({ item, onPress }) => {
  const [imageError, setImageError] = useState(false);

  const imageUri = imageError || !item.imageUrls || item.imageUrls.length === 0
    ? null
    : item.imageUrls[0];

  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.card}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.cardImage}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.placeholderImageContainer}>
            <Ionicons name="image-outline" size={40} color="#ccc" />
          </View>
        )}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.description}</Text>
          <Text style={styles.cardSubtitle}>Pelapor: {item.userName}</Text>
          <View style={styles.addressContainer}>
            <Ionicons name="location-outline" size={12} color="#888" style={{ marginRight: 4 }} />
            <Text style={styles.cardAddress} numberOfLines={1}>{item.userAddress}</Text>
          </View>
          <Text style={styles.cardSubtitle}>Waktu: {item.createdAt ? moment(item.createdAt.toDate()).format('D MMMM YYYY, HH:mm') : 'Tanggal tidak tersedia'}</Text>
          <View style={styles.statusAndDistanceContainer}>
            <View style={[styles.statusContainer, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
            </View>
            <View style={styles.distanceContainer}>
              <Text style={styles.distanceText}>
                {item.distance !== null
                  ? `Estimasi Jarak: ${item.distance >= 1000
                    ? `${(item.distance / 1000).toFixed(2)} km`
                    : `${item.distance.toFixed(0)} m`}`
                  : 'Hitung jarak...'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 12,
    marginHorizontal: 16,
    elevation: 4,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardImage: {
    width: 110,
    height: 130,
    backgroundColor: '#e0e0e0',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
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
  statusAndDistanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  statusContainer: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    ...getFont('bold'),
  },
  distanceContainer: {
    backgroundColor: '#f44336',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  distanceText: {
    color: '#fff',
    fontSize: 10,
    ...getFont('bold'),
  },
});

export default ReportItem;

