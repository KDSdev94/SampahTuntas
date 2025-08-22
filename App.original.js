import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, ActivityIndicator, View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ErrorBoundary, setupGlobalErrorHandler } from './src/utils/ErrorHandler';

// Setup global error handling
setupGlobalErrorHandler();

// Import navigators and screens
import AuthNavigator from './src/navigation/AuthNavigator';
import AdminNavigator from './src/navigation/AdminNavigator';
import WargaStackNavigator from './src/navigation/WargaStackNavigator';

const Stack = createStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    checkUserSession();
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

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{ marginTop: 20, fontSize: 16, color: '#666' }}>Memeriksа sesi...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}
