import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Animated } from 'react-native'
import { getFont } from '../Utils/fontFallback';
import { Ionicons } from '@expo/vector-icons';

// Import Warga screens
import LaporScreen from '../screens/warga/LaporScreen';
import SemuaLaporanScreen from '../screens/warga/SemuaLaporanScreen';
import HistoryLaporanScreen from '../screens/warga/HistoryLaporanScreen';
import ProfilWargaScreen from '../screens/warga/ProfilWargaScreen';
import DetailLaporanWargaScreen from '../screens/warga/DetailLaporanWargaScreen';
import UbahPasswordWargaScreen from '../screens/warga/UbahPasswordWargaScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Laporan Stack Navigator
function LaporanStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SemuaLaporan" component={SemuaLaporanScreen} />
      <Stack.Screen name="DetailLaporanWarga" component={DetailLaporanWargaScreen} />
    </Stack.Navigator>
  );
}

// Profil Stack Navigator
function ProfilStackNavigator({ onLogout }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfilMain">
        {(props) => <ProfilWargaScreen {...props} route={{...props.route, params: {onLogout}}} />}
      </Stack.Screen>
      <Stack.Screen name="UbahPasswordWarga" component={UbahPasswordWargaScreen} />
    </Stack.Navigator>
  );
}

// Custom Tab Bar Icon with Animation (sama seperti admin)
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

function WargaTabNavigator({ onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          let iconName;

          if (route.name === 'Lapor') {
            iconName = 'document-text';
          } else if (route.name === 'Laporan') {
            iconName = 'list';
          } else if (route.name === 'Histori') {
            iconName = 'time';
          } else if (route.name === 'Profil') {
            iconName = 'person-circle';
          }

          return (
            <CustomTabBarIcon
              focused={focused}
              iconName={iconName}
              size={24}
              badgeCount={0}
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
        name="Lapor" 
        component={LaporScreen}
        options={{
          tabBarLabel: 'Lapor',
        }}
      />
      <Tab.Screen 
        name="Laporan" 
        component={LaporanStackNavigator}
        options={{
          tabBarLabel: 'Laporan',
        }}
      />
      <Tab.Screen 
        name="Histori" 
        component={HistoryLaporanScreen}
        options={{
          tabBarLabel: 'Histori',
        }}
      />
      <Tab.Screen 
        name="Profil" 
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
export default function WargaNavigator({ onLogout }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WargaTabs">
        {(props) => <WargaTabNavigator {...props} onLogout={onLogout} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

// Styles untuk custom tab bar (sama seperti admin)
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
