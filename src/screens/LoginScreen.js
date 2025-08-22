import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  StatusBar,
  BackHandler,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebase';
import { useFocusEffect } from '@react-navigation/native';
import { getFont } from '../Utils/fontFallback';

export default function LoginScreen({ navigation, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        Alert.alert(
          'Konfirmasi',
          'Apakah ingin keluar dari aplikasi?',
          [
            { text: 'Tidak', style: 'cancel' },
            { text: 'Ya', onPress: () => BackHandler.exitApp() },
          ]
        );
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [])
  );

  const showAlert = (message) => {
    Alert.alert('Notifikasi', message);
  };

  // Email validation helper
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };


  const loginUser = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert('❌ Email dan password wajib diisi');
      return;
    }

    if (!isValidEmail(email.trim())) {
      showAlert('❌ Format email tidak valid');
      return;
    }

    setIsLoggingIn(true);

    try {
      const q = query(
        collection(db, 'users'),
        where('email', '==', email.trim()),
        where('password', '==', password.trim()) // Direct password check (not recommended for production)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        showAlert('❌ Email atau password salah.');
        setIsLoggingIn(false);
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      const uid = userDoc.id;

      const { role, isApproved } = userData;

      if (role === 'warga' && !isApproved) {
        showAlert('⏳ Akun Anda sedang menunggu persetujuan dari admin.');
        setIsLoggingIn(false);
        return;
      }

      // Save session to AsyncStorage
      const userSession = { uid, ...userData };
      await AsyncStorage.setItem('user_session', JSON.stringify(userSession));
      
      console.log('Login successful:', { role, uid, email: userData.email });
      console.log('Navigating to:', role === 'admin' ? 'Admin' : 'Warga');

      showAlert(`✅ Login berhasil sebagai ${role}`);
      
      // Callback to App.js to re-check the session and update the navigator
      if (onLoginSuccess) {
        onLoginSuccess();
      }

    } catch (error) {
      console.error('Login error:', error);
      showAlert('❌ Terjadi kesalahan saat login. Silakan coba lagi.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
      
      {/* Header with curved wave effect */}
      <View style={styles.headerContainer}>
        <Svg
          height="100%"
          width="100%"
          viewBox="0 0 400 120"
          preserveAspectRatio="none"
          style={styles.svgHeader}
        >
          <Path
            d="M0,0 L400,0 L400,60 Q350,80 300,70 Q250,60 200,75 Q150,90 100,65 Q50,40 0,55 Z"
            fill="#4CAF50"
          />
        </Svg>
      </View>
      
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/images/logo_final.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Login Title */}
      <Text style={styles.title}>LOGIN</Text>

      {/* Form Container */}
      <View style={styles.formContainer}>
        {/* Email Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Masukkan Email Anda"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password Input */}
        <View style={styles.passwordInputContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Masukkan Password Anda"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons 
              name={showPassword ? "eye" : "eye-off"} 
              size={20} 
              color="#666" 
            />
          </TouchableOpacity>
        </View>

        {/* Forgot Password Link */}
        <TouchableOpacity 
          style={styles.forgotPasswordContainer}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={styles.forgotPasswordLink}>Lupa Kata Sandi?</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginButton, isLoggingIn && styles.loginButtonDisabled]}
          onPress={loginUser}
          disabled={isLoggingIn}
        >
          {isLoggingIn ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>


        {/* Register Link */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Belum punya akun? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Daftar sekarang</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    height: 120,
    width: '100%',
  },
  svgHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  logo: {
    width: 200,
    height: 120,
  },
  title: {
    fontSize: 24,
    ...getFont('bold'),
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 32,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    ...getFont('regular'),
    backgroundColor: '#fff',
    color: '#333',
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
    marginHorizontal: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loginButtonDisabled: {
    backgroundColor: '#a5d6a7',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    ...getFont('bold'),
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  forgotPasswordLink: {
    fontSize: 14,
    ...getFont('regular'),
    color: '#666',
    textDecorationLine: 'underline',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    ...getFont('regular'),
    color: '#666',
  },
  registerLink: {
    fontSize: 14,
    color: '#4CAF50',
    ...getFont('bold'),
  },
  passwordInputContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 32,
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingRight: 50,
    fontSize: 16,
    ...getFont('regular'),
    backgroundColor: '#fff',
    color: '#333',
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: '100%',
  },
});
