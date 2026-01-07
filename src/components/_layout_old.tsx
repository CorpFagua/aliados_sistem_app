// app/(protected)/delivery/_layout.tsx
import { Tabs } from 'expo-router';
import { MaterialIcons} from '@expo/vector-icons';
import { View } from 'react-native';
import Header from '@/components/Header';

export default function DeliveryLayout() {
  return (
    <View style={{ flex: 1 }}>
      {/* ✅ Header global */}
      <Header />

      {/* ✅ Tabs debajo */}
      <Tabs
        screenOptions={{
          headerShown: false, // oculta header nativo
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopColor: '#E5E7EB',
            height: 70,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            position: 'absolute',
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#FFD700',
          tabBarInactiveTintColor: '#666',
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
  name="AvailableOrders"
  options={{
    title: 'Disponibles',
    tabBarIcon: ({ color }) => (
      <MaterialIcons name="list" size={28} color={color} />
    ),
  }}
/>
<Tabs.Screen
  name="PendingPickups"
  options={{
    title: 'Asignados',
    tabBarIcon: ({ color }) => (
      <MaterialIcons name="catching-pokemon" size={28} color={color} />
    ),
  }}
/>
<Tabs.Screen
  name="ActiveDeliveries"
  options={{
    title: 'En Ruta',
    tabBarIcon: ({ color }) => (
      <MaterialIcons name="motorcycle" size={28} color={color} />
    ),
  }}
/>

       
      </Tabs>
    </View>
  );
}
