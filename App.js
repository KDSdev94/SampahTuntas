import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, ActivityIndicator, View, Text, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Font from 'expo-font';
import LoadingScreen from './components/LoadingScreen';

// Safe Error Boundary Component
class SafeErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f5f5f5' }}>
          <Text style={{ fontSize: 18, marginBottom: 10, textAlign: 'center' }}>Terjadi kesalahan</Text>
          <Text style={{ textAlign: 'center', marginBottom: 20 }}>Silakan restart aplikasi</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// Import navigators and screens with try-catch
let AuthNavigator, AdminNavigator, WargaStackNavigator;

try {
  AuthNavigator = require('./src/navigation/AuthNavigator').default;
  AdminNavigator = require('./src/navigation/AdminNavigator').default;
  WargaStackNavigator = require('./src/navigation/WargaStackNavigator').default;
} catch (error) {
  console.error('Navigation import error:', error);
}

const Stack = createStackNavigator();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [showCustomLoading, setShowCustomLoading] = useState(true);

  const loadFonts = async () => {
    try {
      await Font.loadAsync({
        'Quicksand-Bold': require('./assets/fonts/Quicksand-Bold.ttf'),
        'Quicksand-Light': require('./assets/fonts/Quicksand-Light.ttf'),
        'Quicksand-Medium': require('./assets/fonts/Quicksand-Medium.ttf'),
        'Quicksand-Regular': require('./assets/fonts/Quicksand-Regular.ttf'),
        'Quicksand-SemiBold': require('./assets/fonts/Quicksand-SemiBold.ttf'),
      });
      setFontsLoaded(true);
    } catch (error) {
      console.error('Font loading error:', error);
      setFontsLoaded(true); // Continue even if fonts fail to load
    }
  };

  useEffect(() => {
    // Show custom loading screen for at least 2 seconds
    const initializeApp = async () => {
      await Promise.all([
        loadFonts(),
        checkUserSession(),
        // Minimum loading time to show the beautiful loading screen
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);
      setShowCustomLoading(false);
    };
    
    initializeApp();
  }, []);

  const checkUserSession = async () => {
    console.log('🔍 Checking user session...');
    try {
      const userSession = await AsyncStorage.getItem('user_session');
      console.log('📱 Raw session data:', userSession);
      
      if (userSession) {
        const userData = JSON.parse(userSession);
        const userRole = userData.role;
        const isApproved = userData.isApproved ?? false;
        console.log('👤 User data:', { role: userRole, isApproved, email: userData.email });
        
        // Only set user and role if approved or admin
        if (userRole === 'admin' || isApproved) {
          console.log('✅ User approved/admin, logging in automatically');
          setRole(userRole);
          setUser(userData);
        } else {
          console.log('❌ Warga not approved, clearing session');
          // If warga but not approved, clear session
          await AsyncStorage.removeItem('user_session');
          setUser(null);
          setRole(null);
        }
      } else {
        console.log('🚫 No session found, showing login');
        setUser(null);
        setRole(null);
      }
    } catch (error) {
      console.error('Error checking user session:', error);
      setUser(null);
      setRole(null);
    } finally {
      console.log('🏁 Session check completed, loading:', loading);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user_session');
    setUser(null);
    setRole(null);
  };

  // Show custom loading screen
  if (showCustomLoading || !fontsLoaded || loading) {
    const message = !fontsLoaded ? 'Memuat font...' : 
                   loading ? 'Memeriksa sesi...' : 
                   'Loading SAMPAH TUNTAS...';
    return <LoadingScreen message={message} />;
  }

  return (
    <SafeErrorBoundary>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor="#4CAF50" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            role === 'admin' ? (
              <Stack.Screen name="Admin">
                {(props) => <AdminNavigator {...props} onLogout={handleLogout} />}
              </Stack.Screen>
            ) : (
              <Stack.Screen name="Warga">
                {(props) => <WargaStackNavigator {...props} onLogout={handleLogout} />}
              </Stack.Screen>
            )
          ) : (
            <Stack.Screen name="Auth">
              {(props) => <AuthNavigator {...props} onLoginSuccess={checkUserSession} />}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeErrorBoundary>
  );
}
