import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Switch,
  Image,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { getFont } from '../../Utils/fontFallback';

const TambahInformasiScreen = () => {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [alwaysShow, setAlwaysShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expiredDate, setExpiredDate] = useState(new Date());

  const handlePickImage = async () => {
    try {
      console.log('Starting image picker...');
      
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Permission result:', permissionResult);
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Izinkan akses ke galeri untuk memilih gambar.');
        return;
      }

      // Launch image picker
      console.log('Launching image picker...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log('Image selected:', result.assets[0].uri);
        setImage(result.assets[0].uri);
        Alert.alert('Berhasil', 'Gambar berhasil dipilih!');
      } else {
        console.log('Image picker was canceled or no image selected');
      }
    } catch (error) {
      console.error('Error in handlePickImage:', error);
      Alert.alert('Error', 'Gagal membuka galeri: ' + error.message);
    }
  };

  const handlePickFromCamera = async () => {
    try {
      console.log('Starting camera...');
      
      // Request camera permission
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      console.log('Camera permission result:', permissionResult);
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Izinkan akses ke kamera untuk mengambil foto.');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      console.log('Camera result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log('Photo taken:', result.assets[0].uri);
        setImage(result.assets[0].uri);
        Alert.alert('Berhasil', 'Foto berhasil diambil!');
      }
    } catch (error) {
      console.error('Error in handlePickFromCamera:', error);
      Alert.alert('Error', 'Gagal membuka kamera: ' + error.message);
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Pilih Gambar',
      'Pilih sumber gambar',
      [
        { text: 'Galeri', onPress: handlePickImage },
        { text: 'Kamera', onPress: handlePickFromCamera },
        { text: 'Batal', style: 'cancel' },
      ]
    );
  };

  const uploadImageToSentral = async (imageUri) => {
    try {
      console.log('Uploading image to sentral.id...', imageUri);
      
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `informasi_${Date.now()}.jpg`,
      });

      const response = await fetch('https://storage.sentral.id/upload.php', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();
      console.log('Upload result:', result);

      if (result.success) {
        return result.url;
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading to sentral.id:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    if (!title || !description) {
      Alert.alert('Input tidak lengkap', 'Judul dan deskripsi harus diisi.');
      return;
    }

    setLoading(true);

    try {
      let imageUrl = '';
      if (image) {
        console.log('Uploading image...', image);
        imageUrl = await uploadImageToSentral(image);
        console.log('Image uploaded successfully:', imageUrl);
      }

      const docData = {
        judul: title,
        isi: description,
        imageUrl,
        alwaysShow,
        createdAt: Timestamp.now(),
        tanggal: Timestamp.fromDate(expiredDate),
      };

      console.log('Adding document to Firestore:', docData);
      await addDoc(collection(db, 'informasi'), docData);

      Alert.alert('Berhasil', 'Informasi berhasil ditambahkan');
      navigation.goBack();
    } catch (error) {
      console.error('Error adding document: ', error);
      Alert.alert('Error', 'Gagal menambahkan informasi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tambah Informasi</Text>
      </View>
      <ScrollView contentContainerStyle={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Judul Informasi"
          placeholderTextColor="#999"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Deskripsi"
          placeholderTextColor="#999"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Selalu Tampilkan</Text>
          <Switch
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={alwaysShow ? '#f5dd4b' : '#f4f3f4'}
            onValueChange={setAlwaysShow}
            value={alwaysShow}
          />
        </View>
        <TouchableOpacity style={styles.imagePicker} onPress={showImagePickerOptions}>
          <Ionicons name="image-outline" size={24} color="#4CAF50" />
          <Text style={styles.imagePickerText}>Pilih Gambar</Text>
        </TouchableOpacity>
        {image && <Image source={{ uri: image }} style={styles.previewImage} />}
        
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Simpan</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  formContainer: {
    padding: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#333',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  imagePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    padding: 15,
    borderRadius: 8,
    justifyContent: 'center',
    marginBottom: 20,
  },
  imagePickerText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#4CAF50',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    ...getFont('bold'),
  },
});

export default TambahInformasiScreen;
