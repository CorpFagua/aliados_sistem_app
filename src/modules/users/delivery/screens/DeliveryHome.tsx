import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Profile from '../../shared/screens/Profile';
import AvailableOrders from './AvailableOrders';
import PendingPickups from './PendingPickups';
import ActiveDeliveries from './ActiveDeliveries';

const Tab = createBottomTabNavigator();

export default function DeliveryHome() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#FFD700',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tab.Screen 
        name="AvailableOrders" 
        component={AvailableOrders}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
          tabBarLabel: 'Disponibles'
        }}
      />
      <Tab.Screen 
        name="PendingPickups" 
        component={PendingPickups}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
          tabBarLabel: 'Por Recoger'
        }}
      />
      <Tab.Screen 
        name="ActiveDeliveries" 
        component={ActiveDeliveries}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bicycle" size={size} color={color} />
          ),
          tabBarLabel: 'En Entrega'
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={Profile}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
          tabBarLabel: 'Perfil'
        }}
      />
    </Tab.Navigator>
  );
}
