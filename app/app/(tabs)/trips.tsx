import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { useTrips, Trip } from '../../src/hooks/useTrips';
import { api } from '../../src/lib/api';

export default function TripsScreen() {
  const { user } = useAuth();
  const { trips, loading, refetch } = useTrips();

  const upcomingTrips = trips.filter((t) => t.status === 'upcoming' || t.status === 'active');
  const pastTrips = trips.filter((t) => t.status === 'completed');

  const upcoming = upcomingTrips[0];

  const [showCreate, setShowCreate] = useState(false);
  const [newTrip, setNewTrip] = useState({
    name: '',
    destination_city: '',
    destination_country: '',
    departure_date: '',
    return_date: '',
  });
  const [creating, setCreating] = useState(false);

  async function createTrip() {
    if (!newTrip.name || !newTrip.destination_city) return;
    try {
      setCreating(true);
      await api.createTrip(newTrip);
      setShowCreate(false);
      setNewTrip({ name: '', destination_city: '', destination_country: '', departure_date: '', return_date: '' });
      refetch();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setCreating(false);
    }
  }

  async function copyEmail() {
    if (user?.travelvault_email) {
      await Clipboard.setStringAsync(user.travelvault_email);
      Alert.alert('Copied!', 'Your TravelVault email address has been copied.');
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function daysUntil(dateStr: string) {
    const now = new Date();
    const target = new Date(dateStr);
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  const renderTripCard = ({ item }: { item: Trip }) => (
    <TouchableOpacity
      style={styles.tripCard}
      onPress={() => router.push(`/trip/${item.id}`)}
    >
      <View style={styles.tripCardContent}>
        <View style={styles.tripCardHeader}>
          <Text style={styles.tripName}>{item.name}</Text>
          <View style={[
            styles.statusBadge,
            item.status === 'active' && styles.statusActive,
            item.status === 'completed' && styles.statusCompleted,
          ]}>
            <Text style={[
              styles.statusText,
              item.status === 'active' && styles.statusTextActive,
              item.status === 'completed' && styles.statusTextCompleted,
            ]}>
              {item.status}
            </Text>
          </View>
        </View>
        <Text style={styles.tripDestination}>
          {item.destination_city}, {item.destination_country}
        </Text>
        <Text style={styles.tripDates}>
          {formatDate(item.departure_date)} — {formatDate(item.return_date)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CCC" />
    </TouchableOpacity>
  );

  // Empty state
  if (!loading && trips.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>✈️</Text>
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.emptyDescription}>
            Forward a booking confirmation email to your TravelVault address and we'll do the rest.
          </Text>

          {user?.travelvault_email && (
            <TouchableOpacity style={styles.emailCard} onPress={copyEmail}>
              <Text style={styles.emailLabel}>Your TravelVault Email</Text>
              <Text style={styles.emailValue}>{user.travelvault_email}</Text>
              <View style={styles.copyBadge}>
                <Ionicons name="copy" size={14} color="#0D6B6B" />
                <Text style={styles.copyText}>Tap to copy</Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreate(true)}
          >
            <Text style={styles.createButtonText}>+ Create Trip Manually</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={pastTrips}
        keyExtractor={(item) => item.id}
        renderItem={renderTripCard}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} tintColor="#0D6B6B" />
        }
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>My Trips</Text>
            </View>

            {upcoming && (
              <TouchableOpacity
                style={styles.heroCard}
                onPress={() => router.push(`/trip/${upcoming.id}`)}
              >
                <View style={styles.heroGradient}>
                  <Text style={styles.heroStatus}>
                    {upcoming.status === 'active' ? 'Currently Traveling' : `${daysUntil(upcoming.departure_date)} days`}
                  </Text>
                  <Text style={styles.heroDestination}>
                    {upcoming.destination_city}
                  </Text>
                  <Text style={styles.heroCountry}>{upcoming.destination_country}</Text>
                  <Text style={styles.heroDates}>
                    {formatDate(upcoming.departure_date)} — {formatDate(upcoming.return_date)}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {pastTrips.length > 0 && (
              <Text style={styles.sectionTitle}>Past Trips</Text>
            )}
          </>
        }
      />

      {/* Create Trip Modal */}
      {showCreate && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Trip</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Trip name (e.g., Summer in Tokyo)"
              placeholderTextColor="#999"
              value={newTrip.name}
              onChangeText={(t) => setNewTrip((p) => ({ ...p, name: t }))}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="City"
              placeholderTextColor="#999"
              value={newTrip.destination_city}
              onChangeText={(t) => setNewTrip((p) => ({ ...p, destination_city: t }))}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Country"
              placeholderTextColor="#999"
              value={newTrip.destination_country}
              onChangeText={(t) => setNewTrip((p) => ({ ...p, destination_country: t }))}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Departure (YYYY-MM-DD)"
              placeholderTextColor="#999"
              value={newTrip.departure_date}
              onChangeText={(t) => setNewTrip((p) => ({ ...p, departure_date: t }))}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Return (YYYY-MM-DD)"
              placeholderTextColor="#999"
              value={newTrip.return_date}
              onChangeText={(t) => setNewTrip((p) => ({ ...p, return_date: t }))}
            />

            <TouchableOpacity
              style={[styles.primaryButton, creating && { opacity: 0.6 }]}
              onPress={createTrip}
              disabled={creating}
            >
              {creating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create Trip</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreate(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
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
  heroCard: {
    marginHorizontal: 24,
    borderRadius: 20,
    backgroundColor: '#0D6B6B',
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#0D6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  heroGradient: {
    padding: 24,
  },
  heroStatus: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A3D9D9',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  heroDestination: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  heroCountry: {
    fontSize: 16,
    color: '#C4E8E8',
    marginBottom: 16,
  },
  heroDates: {
    fontSize: 14,
    color: '#A3D9D9',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginHorizontal: 24,
    marginBottom: 12,
  },
  tripCard: {
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginBottom: 10,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tripCardContent: {
    flex: 1,
  },
  tripCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tripName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E8F5F5',
  },
  statusActive: {
    backgroundColor: '#FFF3E0',
  },
  statusCompleted: {
    backgroundColor: '#F0F0F0',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D6B6B',
    textTransform: 'uppercase',
  },
  statusTextActive: {
    color: '#F5A623',
  },
  statusTextCompleted: {
    color: '#999',
  },
  tripDestination: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  tripDates: {
    fontSize: 13,
    color: '#999',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#222',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emailCard: {
    backgroundColor: '#E8F5F5',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#B8D8D8',
  },
  emailLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  emailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D6B6B',
    marginBottom: 8,
  },
  copyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyText: {
    fontSize: 12,
    color: '#0D6B6B',
  },
  createButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#0D6B6B',
    borderStyle: 'dashed',
    width: '100%',
    alignItems: 'center',
  },
  createButtonText: {
    color: '#0D6B6B',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#222',
  },
  modalInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  primaryButton: {
    backgroundColor: '#0D6B6B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5A623',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
