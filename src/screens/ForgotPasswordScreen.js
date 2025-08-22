import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { collection, query, where, getDocs, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase'
import { getFont } from '../Utils/fontFallback';;

const ForgotPasswordScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [enteredCode, setEnteredCode] = useState('');

  // Generate 6 digit random code
  const generateResetCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleResetPassword = async () => {
    if (email.trim() === '') {
      Alert.alert('Error', 'Mohon masukkan alamat email Anda.');
      return;
    }

    setIsLoading(true);

    try {
      // Check if user exists in Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert('❌ Error', 'Email tidak ditemukan dalam sistem.');
        setIsLoading(false);
        return;
      }

      // Generate 6 digit code
      const code = generateResetCode();
      
      // Save reset code to Firestore with expiration (15 minutes)
      const expirationTime = new Date();
      expirationTime.setMinutes(expirationTime.getMinutes() + 15);
      
      await setDoc(doc(db, 'passwordReset', email.trim()), {
        code: code,
        email: email.trim(),
        expiresAt: expirationTime,
        createdAt: serverTimestamp(),
        used: false
      });
      
      setResetCode(code);
      setShowCode(true);
      
    } catch (error) {
      console.error('Generate code error:', error.message);
      Alert.alert('❌ Error', 'Gagal generate kode reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (enteredCode.trim() !== resetCode) {
      Alert.alert('❌ Error', 'Kode verifikasi salah.');
      return;
    }

    setIsLoading(true);

    try {
      const resetRef = doc(db, 'passwordReset', email.trim());
      const resetSnap = await getDoc(resetRef);

      if (!resetSnap.exists()) {
        Alert.alert('❌ Error', 'Kode reset tidak valid atau sudah kedaluwarsa.');
        setIsLoading(false);
        return;
      }

      const { expiresAt, used } = resetSnap.data();
      const now = new Date();

      if (now > expiresAt.toDate() || used) {
        Alert.alert('❌ Error', 'Kode reset sudah tidak berlaku.');
        setIsLoading(false);
        return;
      }

      // Navigate to set new password
      navigation.navigate('SetNewPassword', { email: email.trim() });

    } catch (error) {
      console.error('Verify code error:', error.message);
      Alert.alert('❌ Error', 'Gagal memverifikasi kode.');
    } finally {
      setIsLoading(false);
    }
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
            <Text style={styles.headerTitle}>Reset Password</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
        {!showCode ? (
          // Email Input Phase
          <>
            <Text style={styles.infoText}>
              Masukkan email Anda untuk mendapatkan kode reset password
            </Text>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Masukkan email Anda"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#666"
                editable={!isLoading}
              />
            </View>

            {/* Generate Code Button */}
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.submitButtonText}>KIRIM KODE RESET</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          // Show Generated Code Phase
          <>
            <Text style={styles.infoText}>
              Masukkan 6 digit kode yang telah dikirimkan ke email Anda
            </Text>
            
            {/* Show Generated Code */}
            <View style={styles.codeDisplayContainer}>
              <Text style={styles.codeLabel}>Kode Reset Anda:</Text>
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>{resetCode}</Text>
              </View>
            </View>

            {/* Code Input Field */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.codeInputField}
                placeholder="Masukkan kode 6 digit"
                value={enteredCode}
                onChangeText={setEnteredCode}
                keyboardType="numeric"
                maxLength={6}
                placeholderTextColor="#666"
                textAlign="center"
              />
            </View>

            {/* Verify Code Button */}
            <TouchableOpacity
              style={[styles.verifyButton, isLoading && styles.buttonDisabled]}
              onPress={handleVerifyCode}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.verifyButtonText}>VERIFIKASI KODE</Text>
              )}
            </TouchableOpacity>

            {/* Resend Code */}
            <TouchableOpacity
              style={styles.resendButton}
              onPress={() => {
                setShowCode(false);
                setResetCode('');
              }}
            >
              <Text style={styles.resendButtonText}>Kirim Ulang Kode</Text>
            </TouchableOpacity>
            </>
        )}
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
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
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
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    ...getFont('600'),
  },
  codeDisplayContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  codeLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  codeBox: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  codeText: {
    fontSize: 32,
    ...getFont('bold'),
    color: 'white',
    textAlign: 'center',
    letterSpacing: 5,
  },
  verifyButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    elevation: 5,
    marginBottom: 15,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    ...getFont('600'),
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  resendButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  codeInputField: {
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 32,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 18,
    backgroundColor: 'white',
    color: '#333',
    textAlign: 'center',
    ...getFont('bold'),
    letterSpacing: 2,
  },
});

export default ForgotPasswordScreen;
