// LaporScreen.js - Migrated from Lapor.dart
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/firebase'
import { getFont } from '../../Utils/fontFallback';;
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LaporScreen() {
  const [images, setImages] = useState([]);
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [priority, setPriority] = useState('rendah');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      console.log('🔐 Requesting permissions...');
      
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      
      console.log('📷 Camera permission:', cameraStatus);
      console.log('📱 Media permission:', mediaStatus);
      console.log('📍 Location permission:', locationStatus);
      
      if (cameraStatus !== 'granted') {
        Alert.alert('Camera Permission', 'Camera permission is required to take photos.');
      }
      
      if (mediaStatus !== 'granted') {
        Alert.alert('Media Permission', 'Media library permission is required to select photos.');
      }
      
      if (locationStatus !== 'granted') {
        Alert.alert('Location Permission', 'Location permission is required to get current location.');
      }
    } catch (error) {
      console.error('❌ Permission request error:', error);
      Alert.alert('Permission Error', 'Failed to request permissions: ' + error.message);
    }
  };

  const pickImages = async () => {
    if (images.length >= 3) {
      Alert.alert('Limit Reached', 'Maksimum 3 gambar');
      return;
    }

    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => openCamera() },
        { text: 'Gallery', onPress: () => openGallery() },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const openCamera = async () => {
    try {
      console.log('📷 Opening camera...');
      
      // Check camera permission first
      const { status } = await ImagePicker.getCameraPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await ImagePicker.requestCameraPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert('Permission Required', 'Camera permission is required to take photos.');
          return;
        }
      }
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      });

      console.log('📷 Camera result:', result);
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        if (images.length < 3) {
          setImages([...images, result.assets[0]]);
          console.log('✅ Image added from camera');
        } else {
          Alert.alert('Limit Reached', 'Maksimum 3 gambar');
        }
      }
    } catch (error) {
      console.error('❌ Camera error:', error);
      Alert.alert('Camera Error', 'Failed to open camera: ' + error.message);
    }
  };

  const openGallery = async () => {
    try {
      console.log('🖼️ Opening gallery...');
      
      // Check media library permission first
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert('Permission Required', 'Media library permission is required to select photos.');
          return;
        }
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      });

      console.log('🖼️ Gallery result:', result);
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        if (images.length < 3) {
          setImages([...images, result.assets[0]]);
          console.log('✅ Image added from gallery');
        } else {
          Alert.alert('Limit Reached', 'Maksimum 3 gambar');
        }
      }
    } catch (error) {
      console.error('❌ Gallery error:', error);
      Alert.alert('Gallery Error', 'Failed to open gallery: ' + error.message);
    }
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required');
        return;
      }

      setLoading(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLatitude(location.coords.latitude.toFixed(6));
      setLongitude(location.coords.longitude.toFixed(6));
      Alert.alert('Success', '✅ Lokasi berhasil diambil');
    } catch (error) {
      Alert.alert('Error', '❌ Gagal mengambil lokasi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (imageUri, fileName) => {
    try {
      console.log('📤 Starting image upload:', fileName);
      console.log('📷 Image URI:', imageUri);
      
      // Create FormData for multipart upload (same as Flutter code)
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: fileName,
      });
      
      console.log('⬆️ Uploading to external server...');
      
      // Upload to the same server as the Flutter code
      const uploadResponse = await fetch('https://storage.sentral.id/upload.php', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('🌐 Upload response status:', uploadResponse.status);
      
      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status: ${uploadResponse.status}`);
      }
      
      const responseText = await uploadResponse.text();
      console.log('📄 Raw response:', responseText);
      
      const responseJson = JSON.parse(responseText);
      console.log('📋 Parsed response:', responseJson);
      
      if (responseJson.success && responseJson.url) {
        console.log('✅ Upload successful:', responseJson.url);
        return responseJson.url;
      } else {
        throw new Error(`Upload failed: ${responseJson.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  };

  const submitReport = async () => {
    if (images.length === 0 || !priority || !description.trim()) {
      Alert.alert('Validation Error', '❗ Semua field wajib diisi');
      return;
    }

    if (!latitude || !longitude) {
      Alert.alert('Location Required', 'Silakan ambil lokasi terlebih dahulu');
      return;
    }

    setLoading(true);

    try {
      // Upload images first
      const imageUrls = [];
      for (let i = 0; i < images.length; i++) {
        const fileName = `${Date.now()}-${i}.jpg`;
        const url = await uploadImage(images[i].uri, fileName);
        imageUrls.push(url);
      }

      const userSession = await AsyncStorage.getItem('user_session');
      if (!userSession) {
        Alert.alert('Authentication Error', 'Anda harus login terlebih dahulu');
        return;
      }
      const userData = JSON.parse(userSession);
      const uid = userData.uid;
      
      console.log('💾 Saving report with UID:', uid);
      console.log('👤 User data:', userData);

      // Save report to Firestore
      const reportData = {
        uid: uid,
        description: description.trim(),
        lat: parseFloat(latitude),
        lng: parseFloat(longitude),
        priority: priority,
        status: 'pending',
        imageUrls: imageUrls,
        createdAt: serverTimestamp(),
      };
      
      console.log('📋 Report data to save:', reportData);
      
      const docRef = await addDoc(collection(db, 'reports'), reportData);
      
      console.log('✅ Report saved with ID:', docRef.id);

      Alert.alert('Success', '✅ Laporan berhasil dikirim');
      
      // Reset form
      setImages([]);
      setDescription('');
      setLatitude('');
      setLongitude('');
      setPriority('rendah');
    } catch (error) {
      Alert.alert('Error', '❌ Gagal mengirim laporan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Buat Laporan</Text>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Foto Sampah (Max 3 gambar)</Text>
          
          {images.length === 0 ? (
            <View style={styles.emptyImageContainer}>
              <Text style={styles.emptyImageText}>No Image Selected</Text>
            </View>
          ) : (
            <View style={styles.imageGrid}>
              {images.map((image, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri: image.uri }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close" size={18} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#4CAF50' }]}
            onPress={pickImages}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Ambil Gambar</Text>
          </TouchableOpacity>
          
          {images.length > 0 && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#F44336', marginTop: 10 }]}
              onPress={() => setImages([])}
            >
              <Text style={styles.buttonText}>Clear All Images</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.divider} />

        {/* Location Section */}
        <View style={styles.locationSection}>
          <View style={styles.locationInputs}>
            <View style={styles.locationInput}>
              <TextInput
                style={styles.input}
                placeholder="Latitude"
          placeholderTextColor="#999"
                value={latitude}
                editable={false}
              />
            </View>
            <View style={styles.locationInput}>
              <TextInput
                style={styles.input}
                placeholder="Longitude"
          placeholderTextColor="#999"
                value={longitude}
                editable={false}
              />
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#4CAF50' }]}
            onPress={getLocation}
            disabled={loading}
          >
            <Ionicons name="location" size={20} color="white" />
            <Text style={[styles.buttonText, { marginLeft: 5 }]}>Lokasi</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Priority Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prioritas Penanganan</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={priority}
              onValueChange={(itemValue) => setPriority(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Rendah" value="rendah" />
              <Picker.Item label="Sedang" value="sedang" />
              <Picker.Item label="Tinggi" value="tinggi" />
            </Picker>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Description Section */}
        <View style={styles.section}>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Deskripsi"
          placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={submitReport}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Lapor!</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerTitle: {
    fontSize: 20,
    ...getFont('bold'),
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    margin: 15,
  },
  sectionTitle: {
    fontSize: 15,
    ...getFont('bold'),
    marginBottom: 5,
    color: '#333',
  },
  emptyImageContainer: {
    width: 200,
    height: 200,
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 10,
  },
  emptyImageText: {
    color: '#666',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 10,
  },
  imageContainer: {
    position: 'relative',
    margin: 5,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#F44336',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonText: {
    color: 'white',
    ...getFont('bold'),
  },
  divider: {
    height: 2,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 10,
    marginVertical: 10,
  },
  locationSection: {
    margin: 15,
  },
  locationInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  locationInput: {
    flex: 1,
    marginHorizontal: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    backgroundColor: 'white',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    backgroundColor: 'white',
  },
  picker: {
    height: 50,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    backgroundColor: 'white',
    minHeight: 80,
  },
  submitButton: {
    backgroundColor: '#F44336',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    ...getFont('bold'),
    fontSize: 16,
  },
});
