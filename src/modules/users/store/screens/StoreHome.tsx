import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DeliveryRequest from './DeliveryRequest';
import Profile from '../../shared/screens/Profile';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Button } from "react-native"
import { useAuth } from "@/providers/AuthProvider"

const Tab = createBottomTabNavigator();

export default function StoreHome() {
  const { logout, session } = useAuth()

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
        name="DeliveryRequest" 
        component={DeliveryRequest}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bicycle" size={size} color={color} />
          ),
          tabBarLabel: 'Solicitar Domicilio'
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
