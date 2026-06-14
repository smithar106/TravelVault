import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();

  const [notifyFlights, setNotifyFlights] = useState(true);
  const [notifyCountdown, setNotifyCountdown] = useState(true);
  const [notifyPacking, setNotifyPacking] = useState(false);

  async function copyEmail() {
    if (user?.travelvault_email) {
      await Clipboard.setStringAsync(user.travelvault_email);
      Alert.alert('Copied', 'Email address copied to clipboard');
    }
  }

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/');
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* TravelVault Email */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>YOUR TRAVELVAULT EMAIL</Text>
        <TouchableOpacity style={styles.emailCard} onPress={copyEmail}>
          <View style={styles.emailContent}>
            <Text style={styles.emailValue}>{user?.travelvault_email || 'Loading...'}</Text>
            <Text style={styles.emailHint}>
              Forward booking confirmations here
            </Text>
          </View>
          <Ionicons name="copy" size={20} color="#0D6B6B" />
        </TouchableOpacity>
      </View>

      {/* Subscription */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>SUBSCRIPTION</Text>
        <View style={styles.menuCard}>
          <View style={styles.menuRow}>
            <View>
              <Text style={styles.menuText}>Current Plan</Text>
              <Text style={styles.menuSubtext}>
                {user?.subscription_status === 'pro' ? 'TravelVault Pro' : 'Free'}
              </Text>
            </View>
            {user?.subscription_status !== 'pro' && (
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={() => router.push('/paywall')}
              >
                <Text style={styles.upgradeText}>Upgrade</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Travel Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>TRAVEL PREFERENCES</Text>
        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <View style={styles.menuRow}>
            <Text style={styles.menuText}>Travel Profile</Text>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
        <View style={styles.menuCard}>
          <View style={styles.menuRow}>
            <Text style={styles.menuText}>Flight Alerts</Text>
            <Switch
              value={notifyFlights}
              onValueChange={setNotifyFlights}
              trackColor={{ false: '#E5E5E5', true: '#0D6B6B' }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.menuRow}>
            <Text style={styles.menuText}>Countdown Reminders</Text>
            <Switch
              value={notifyCountdown}
              onValueChange={setNotifyCountdown}
              trackColor={{ false: '#E5E5E5', true: '#0D6B6B' }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.menuRow}>
            <Text style={styles.menuText}>Packing Reminder</Text>
            <Switch
              value={notifyPacking}
              onValueChange={setNotifyPacking}
              trackColor={{ false: '#E5E5E5', true: '#0D6B6B' }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </View>

      {/* App */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>APP</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => Alert.alert('Rate', 'Rate TravelVault would open App Store')}
          >
            <Text style={styles.menuText}>Rate TravelVault</Text>
            <Ionicons name="star" size={18} color="#F5A623" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <View style={styles.menuRow}>
            <Text style={styles.menuText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </View>
          <View style={styles.divider} />
          <View style={styles.menuRow}>
            <Text style={styles.menuText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </View>
          <View style={styles.divider} />
          <View style={styles.menuRow}>
            <Text style={styles.menuText}>App Version</Text>
            <Text style={styles.menuSubtext}>1.0.0</Text>
          </View>
        </View>
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#222',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  emailCard: {
    backgroundColor: '#E8F5F5',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B8D8D8',
  },
  emailContent: {
    flex: 1,
  },
  emailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D6B6B',
    marginBottom: 2,
  },
  emailHint: {
    fontSize: 12,
    color: '#888',
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  menuText: {
    fontSize: 15,
    color: '#222',
  },
  menuSubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 16,
  },
  upgradeButton: {
    backgroundColor: '#F5A623',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  upgradeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  signOutButton: {
    marginHorizontal: 24,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  signOutText: {
    color: '#F44336',
    fontSize: 15,
    fontWeight: '700',
  },
});
