import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, StatusBar, SafeAreaView } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../config/firebase'
import { getFont } from '../../Utils/fontFallback';;

export default function TambahWargaScreen({ navigation }) {
  const [nama, setNama] = useState('');
  const [alamat, setAlamat] = useState('');
  const [notelp, setNotelp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [konfPassword, setKonfPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const isPasswordValid = (password) => {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasMinLength = password.length >= 6;
    return hasUppercase && hasLowercase && hasNumber && hasMinLength;
  };

  const handleRegister = async () => {
    if (!nama || !email || !password || !konfPassword || !alamat) {
      Alert.alert('Error', 'Mohon lengkapi data!');
      return;
    }
    if (password !== konfPassword) {
      Alert.alert('Error', 'Konfirmasi password tidak cocok!');
      return;
    }
    if (!isPasswordValid(password)) {
      Alert.alert('Error', 'Password minimal 6, terdiri dari Huruf besar, huruf kecil dan kombinasi angka');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        nama: nama,
        alamat: alamat,
        email: email,
        role: 'warga',
        isApproved: true,
        createdAt: serverTimestamp(),
      });

      Alert.alert('Success', 'Registrasi berhasil!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
        <Text style={styles.headerTitle}>Tambah Warga</Text>
      </View>
      
      <ScrollView style={styles.content} contentContainerStyle={{paddingTop: 20}} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nama</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukkan nama lengkap"
          placeholderTextColor="#999"
              value={nama}
              onChangeText={setNama}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Alamat</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukkan alamat lengkap"
          placeholderTextColor="#999"
              value={alamat}
              onChangeText={setAlamat}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>No Telp</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukkan nomor telepon"
          placeholderTextColor="#999"
              value={notelp}
              onChangeText={setNotelp}
              keyboardType="phone-pad"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukkan email"
          placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukkan password"
          placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Konfirmasi Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Konfirmasi password"
          placeholderTextColor="#999"
              value={konfPassword}
              onChangeText={setKonfPassword}
              secureTextEntry
            />
          </View>
          
          <Text style={styles.note}>
            *Password minimal 6 karakter. Terdiri dari Huruf besar, huruf kecil dan kombinasi angka
          </Text>
          
          <TouchableOpacity 
            style={[styles.registerButton, loading && styles.disabledButton]} 
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>Registrasi</Text>
            )}
          </TouchableOpacity>
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
  content: {
    flex: 1,
  },
  form: {
    marginHorizontal: 15,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    ...getFont('600'),
    marginBottom: 8,
    color: '#333',
  },
  input: {
    height: 45,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
    color: '#333',
  },
  note: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  registerButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#A5D6A7',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    ...getFont('bold'),
  },
});
