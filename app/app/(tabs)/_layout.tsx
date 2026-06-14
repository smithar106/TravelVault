import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  trips: 'airplane',
  vault: 'lock-closed',
  profile: 'globe',
  settings: 'settings',
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#0D6B6B',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#E5E5E5',
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size }) => {
          const iconName = TAB_ICONS[route.name] || 'square';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen
        name="trips"
        options={{ title: 'My Trips' }}
      />
      <Tabs.Screen
        name="vault"
        options={{ title: 'Vault' }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'My Profile' }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings' }}
      />
    </Tabs>
  );
}
