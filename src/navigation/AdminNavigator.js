import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase'
import { getFont } from '../Utils/fontFallback';

// Import Admin screens
import PersetujuanAkunScreen from '../screens/admin/PersetujuanAkunScreen';
import InformasiWargaScreen from '../screens/admin/InformasiWargaScreen';
import TambahInformasiScreen from '../screens/admin/TambahInformasiScreen';
import AdminProfilScreen from '../screens/admin/AdminProfilScreen';
import DataWargaScreen from '../screens/admin/DataWargaScreen';
import TambahWargaScreen from '../screens/admin/TambahWargaScreen';
import UbahPasswordScreen from '../screens/admin/UbahPasswordScreen';
import LaporanMasukScreen from '../screens/admin/LaporanMasukScreen';
import LaporanDitanganiScreen from '../screens/admin/LaporanDitanganiScreen';
import RekapLaporanScreen from '../screens/admin/RekapLaporanScreen';
import DetailLaporanScreen from '../screens/admin/DetailLaporanScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Tab Navigator Component
function LaporanStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LaporanMasuk" component={LaporanMasukScreen} />
      <Stack.Screen name="LaporanDitangani" component={LaporanDitanganiScreen} />
      <Stack.Screen name="RekapLaporan" component={RekapLaporanScreen} />
      <Stack.Screen name="DetailLaporan" component={DetailLaporanScreen} />
    </Stack.Navigator>
  );
}

// Informasi Stack Navigator
function InformasiStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="InformasiList" component={InformasiWargaScreen} />
      <Stack.Screen name="TambahInformasi" component={TambahInformasiScreen} />
    </Stack.Navigator>
  );
}

// Profil Stack Navigator
function ProfilStackNavigator({ onLogout }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfilMain">
        {(props) => <AdminProfilScreen {...props} route={{...props.route, params: {onLogout}}} />}
      </Stack.Screen>
      <Stack.Screen name="DataWarga" component={DataWargaScreen} />
      <Stack.Screen name="TambahWarga" component={TambahWargaScreen} />
      <Stack.Screen name="UbahPassword" component={UbahPasswordScreen} />
    </Stack.Navigator>
  );
}

// Custom Tab Bar Icon with Animation
function CustomTabBarIcon({ focused, iconName, size = 24, badgeCount }) {
  const animatedValue = React.useRef(new Animated.Value(focused ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: focused ? 1 : 0,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  const scale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -2],
  });

  return (
    <View style={styles.tabIconContainer}>
      {focused && <View style={styles.activeTabBackground} />}
      <Animated.View
        style={[
          styles.iconWrapper,
          {
            transform: [{ scale }, { translateY }],
          },
        ]}
      >
        <Ionicons 
          name={iconName} 
          size={size} 
          color={focused ? '#fff' : '#666'} 
        />
        {badgeCount > 0 && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{badgeCount}</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

function AdminTabNavigator({ onLogout }) {
  const [unapprovedCount, setUnapprovedCount] = React.useState(0);

  React.useEffect(() => {
    const q = query(collection(db, 'users'), where('isApproved', '==', false));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnapprovedCount(snapshot.size);
    });

    return () => unsubscribe();
  }, []);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          let iconName;

          if (route.name === 'Laporan') {
            iconName = 'file-tray-full';
          } else if (route.name === 'PersetujuanAkun') {
            iconName = 'checkmark-circle';
          } else if (route.name === 'InformasiWarga') {
            iconName = 'add-circle';
          } else if (route.name === 'ProfilAdmin') {
            iconName = 'person-circle';
          }

          return (
            <CustomTabBarIcon
              focused={focused}
              iconName={iconName}
              size={24}
              badgeCount={route.name === 'PersetujuanAkun' ? unapprovedCount : 0}
            />
          );
        },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: {
          fontSize: 12,
          ...getFont('600'),
          marginTop: 4,
        },
        tabBarStyle: {
          backgroundColor: '#4CAF50',
          borderTopWidth: 0,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Laporan" 
        component={LaporanStackNavigator}
      />
      <Tab.Screen 
        name="PersetujuanAkun" 
        component={PersetujuanAkunScreen}
        options={{
          tabBarLabel: 'Akun',
        }}
      />
      <Tab.Screen 
        name="InformasiWarga" 
        component={InformasiStackNavigator}
        options={{
          tabBarLabel: 'Informasi',
        }}
      />
      <Tab.Screen 
        name="ProfilAdmin" 
        options={{
          tabBarLabel: 'Profil',
        }}
      >
        {(props) => <ProfilStackNavigator {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// Main Stack Navigator
export default function AdminNavigator({ onLogout }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminTabs">
        {(props) => <AdminTabNavigator {...props} onLogout={onLogout} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

// Styles for custom tab bar
const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    position: 'relative',
  },
  activeTabBackground: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    top: 5,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#f44336',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    ...getFont('bold'),
  },
});
