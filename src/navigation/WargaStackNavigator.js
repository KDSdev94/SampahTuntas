import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import WargaNavigator from './WargaNavigator';
import DetailLaporanWargaScreen from '../screens/warga/DetailLaporanWargaScreen';
import UbahPasswordWargaScreen from '../screens/warga/UbahPasswordWargaScreen';

const Stack = createStackNavigator();

export default function WargaStackNavigator({ onLogout }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WargaTabs">
        {(props) => <WargaNavigator {...props} onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen name="DetailLaporan" component={DetailLaporanWargaScreen} />
      <Stack.Screen name="UbahPassword" component={UbahPasswordWargaScreen} />
    </Stack.Navigator>
  );
}
