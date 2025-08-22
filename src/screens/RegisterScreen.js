import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, setDoc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '../config/firebase'
import { getFont } from '../Utils/fontFallback';; // Adjust path as needed
// import Toast from 'react-native-toast-message';

const RegisterScreen = () => {
  const navigation = useNavigation();
  
  // Form state
  const [nama, setNama] = useState('');
  const [alamat, setAlamat] = useState('');
  const [notelp, setNotelp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [konfPassword, setKonfPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Password validation function
  const isPasswordValid = (password) => {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasMinLength = password.length >= 6;
    
    return hasUppercase && hasLowercase && hasNumber && hasMinLength;
  };

  // Function to get next sequential user ID
  const getNextUserId = async () => {
    const counterRef = doc(db, 'counters', 'users');
    
    return await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      
      let newCount = 1;
      if (counterDoc.exists()) {
        newCount = (counterDoc.data().count || 0) + 1;
      }
      
      // Update the counter
      transaction.set(counterRef, { count: newCount }, { merge: true });
      
      // Format as 3-digit number with leading zeros (001, 002, etc.)
      return newCount.toString().padStart(3, '0');
    });
  };

  // Registration function
  const registerUser = async (
    nama,
    alamat,
    notelp,
    email,
    password,
    role
  ) => {
    setIsLoading(true);

    const registrationPromise = new Promise(async (resolve, reject) => {
      try {
        // Check if email already exists
        const q = query(collection(db, 'users'), where('email', '==', email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          reject(new Error('Email sudah terdaftar. Gunakan email lain.'));
          return;
        }

        // Get next sequential user ID
        const userId = await getNextUserId();

        // Save user data to Firestore with custom ID
        await setDoc(doc(db, 'users', userId), {
          nama: nama,
          alamat: alamat,
          notelp: notelp,
          email: email,
          password: password, // Direct password storage (not recommended for production)
          role: role,
          isApproved: role === 'warga' ? false : true,
          createdAt: serverTimestamp(),
        });

        resolve(userId); // Resolve with the new user ID
      } catch (error) {
        reject(error); // Reject the promise on error
      }
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Waktu registrasi habis. Silakan periksa koneksi internet Anda dan coba lagi.'));
      }, 30000); // 30 second timeout
    });

    try {
      await Promise.race([registrationPromise, timeoutPromise]);

      Alert.alert(
        '✅ Registrasi Berhasil',
        'Akun Anda telah terdaftar dan sedang menunggu persetujuan dari admin. Anda akan dapat login setelah admin menyetujui akun Anda. Terima kasih atas kesabaran Anda.',
        [{ text: 'OK' }]
      );

      // Wait 2 seconds then navigate back
      setTimeout(() => {
        navigation.goBack();
      }, 2000);

    } catch (error) {
      console.error('Registration error:', error.message);
      Alert.alert('❌ Error', error.message || 'Terjadi kesalahan saat registrasi');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle registration button press
  const handleRegister = async () => {
    if (
      nama.trim() === '' ||
      email.trim() === '' ||
      alamat.trim() === '' ||
      notelp.trim() === '' ||
      konfPassword !== password ||
      !isPasswordValid(password)
    ) {
      Alert.alert('❌ Error', 'Mohon lengkapi data dengan benar!');
      return;
    }

    await registerUser(nama.trim(), alamat.trim(), notelp.trim(), email.trim(), password, 'warga');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={30} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Tambah Warga</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            {/* Nama Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Nama"
                value={nama}
                onChangeText={setNama}
                keyboardType="default"
                returnKeyType="next"
                placeholderTextColor="#666"
              />
            </View>

            {/* Alamat Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Alamat"
                value={alamat}
                onChangeText={setAlamat}
                keyboardType="default"
                returnKeyType="next"
                placeholderTextColor="#666"
              />
            </View>

            {/* No Telp Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="No Telp"
                value={notelp}
                onChangeText={setNotelp}
                keyboardType="numeric"
                returnKeyType="next"
                placeholderTextColor="#666"
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                returnKeyType="next"
                autoCapitalize="none"
                placeholderTextColor="#666"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="next"
                placeholderTextColor="#666"
              />
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Konfirmasi Password"
                value={konfPassword}
                onChangeText={setKonfPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                placeholderTextColor="#666"
              />
            </View>

            {/* Password Requirements */}
            <Text style={styles.passwordHint}>
              *Password minimal 6. Terdiri dari Huruf besar, huruf kecil dan kombinasi angka
            </Text>

            {/* Show Password Checkbox */}
            <TouchableOpacity 
              style={styles.checkboxContainer}
              onPress={() => setShowPassword(!showPassword)}
            >
              <View style={[styles.checkbox, showPassword && styles.checkboxChecked]}>
                {showPassword && <Ionicons name="checkmark" size={16} color="white" />}
              </View>
              <Text style={styles.checkboxText}>Tampilkan password</Text>
            </TouchableOpacity>

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.registerButtonText}>Registrasi</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    ...getFont('600'),
    color: 'white',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 18,
  },
  inputContainer: {
    marginBottom: 20,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 32,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
    color: '#333',
  },
  passwordHint: {
    fontSize: 13,
    color: '#666',
    marginHorizontal: 4,
    marginBottom: 20,
    marginTop: -10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    marginHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#666',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkboxText: {
    fontSize: 16,
    color: '#333',
  },
  registerButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    ...getFont('600'),
  },
});

export default RegisterScreen;
