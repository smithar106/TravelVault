import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTripDetail, Booking } from '../../src/hooks/useTrips';
import { useFlightStatus } from '../../src/hooks/useFlightStatus';

type DetailTab = 'timeline' | 'guide' | 'packing' | 'documents';

const TABS: { key: DetailTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'timeline', label: 'Timeline', icon: 'time' },
  { key: 'guide', label: 'Guide', icon: 'map' },
  { key: 'packing', label: 'Packing', icon: 'briefcase' },
  { key: 'documents', label: 'Docs', icon: 'document-text' },
];

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trip, bookings, guide, loading, guideLoading, generateGuide } = useTripDetail(id);
  const [activeTab, setActiveTab] = useState<DetailTab>('timeline');

  // Get first flight for flight status
  const firstFlight = bookings?.find((b) => b.booking_type === 'flight');
  const flightNumber = firstFlight?.parsed_data?.flight_number as string | undefined;
  const flightDate = firstFlight?.starts_at?.split('T')[0];

  const { status: flightStatus } = useFlightStatus(
    trip?.status === 'active' ? flightNumber : undefined,
    trip?.status === 'active' ? flightDate : undefined
  );

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0D6B6B" />
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Trip not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerDestination}>{trip.destination_city}</Text>
          <Text style={styles.headerCountry}>{trip.destination_country}</Text>
          <Text style={styles.headerDates}>
            {formatDate(trip.departure_date)} — {formatDate(trip.return_date)}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={16}
              color={activeTab === tab.key ? '#0D6B6B' : '#999'}
            />
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'timeline' && (
          <TimelineTab bookings={bookings || []} flightStatus={flightStatus} />
        )}

        {activeTab === 'guide' && (
          <GuideTab guide={guide} loading={guideLoading} onGenerate={generateGuide} />
        )}

        {activeTab === 'packing' && (
          <PackingTab guide={guide} />
        )}

        {activeTab === 'documents' && (
          <DocumentsTab />
        )}
      </ScrollView>
    </View>
  );
}

// Timeline Tab
function TimelineTab({
  bookings,
  flightStatus,
}: {
  bookings: Booking[];
  flightStatus: any;
}) {
  return (
    <View style={styles.tabContent}>
      {bookings.length === 0 ? (
        <View style={styles.emptyTab}>
          <Ionicons name="mail" size={40} color="#CCC" />
          <Text style={styles.emptyTabText}>No bookings yet</Text>
          <Text style={styles.emptyTabSubtext}>
            Forward booking confirmations to your TravelVault email
          </Text>
        </View>
      ) : (
        bookings.map((booking, index) => (
          <View key={booking.id} style={styles.timelineCard}>
            <View style={styles.timelineLine}>
              <View style={[
                styles.timelineDot,
                booking.booking_type === 'flight' && styles.dotFlight,
                booking.booking_type === 'hotel' && styles.dotHotel,
                booking.booking_type === 'car' && styles.dotCar,
              ]} />
              {index < bookings.length - 1 && <View style={styles.timelineConnector} />}
            </View>
            <View style={styles.timelineContent}>
              <View style={styles.bookingHeader}>
                <Text style={styles.bookingType}>
                  {booking.booking_type.toUpperCase()}
                </Text>
                <Text style={styles.bookingProvider}>{booking.provider_name}</Text>
              </View>

              {booking.booking_type === 'flight' && (
                <>
                  <View style={styles.flightRoute}>
                    <View style={styles.flightPoint}>
                      <Text style={styles.flightTime}>{formatTime(booking.starts_at)}</Text>
                      <Text style={styles.flightCity}>
                        {(booking.parsed_data?.origin_city as string) || 'Departure'}
                      </Text>
                    </View>
                    <View style={styles.flightArrow}>
                      <Ionicons name="airplane" size={16} color="#0D6B6B" />
                    </View>
                    <View style={styles.flightPoint}>
                      <Text style={styles.flightTime}>{formatTime(booking.ends_at)}</Text>
                      <Text style={styles.flightCity}>
                        {(booking.parsed_data?.destination_city as string) || 'Arrival'}
                      </Text>
                    </View>
                  </View>

                  {flightStatus && (
                    <View style={styles.liveStatus}>
                      <View style={styles.statusDot} />
                      <Text style={styles.statusTextLarge}>
                        {flightStatus.status} — Gate {flightStatus.departure.gate}
                      </Text>
                      {flightStatus.departure.delay && (
                        <Text style={styles.delayText}>
                          Delayed {flightStatus.departure.delay} min
                        </Text>
                      )}
                    </View>
                  )}
                </>
              )}

              {booking.booking_type === 'hotel' && (
                <>
                  <Text style={styles.bookingDetail}>
                    Check-in: {formatDate(booking.starts_at)}
                  </Text>
                  <Text style={styles.bookingDetail}>
                    Check-out: {formatDate(booking.ends_at)}
                  </Text>
                  {booking.location && (
                    <Text style={styles.bookingAddress}>{booking.location}</Text>
                  )}
                </>
              )}

              {booking.booking_type === 'car' && (
                <>
                  <Text style={styles.bookingDetail}>
                    Pick-up: {formatTime(booking.starts_at)}
                  </Text>
                  <Text style={styles.bookingDetail}>
                    Drop-off: {formatTime(booking.ends_at)}
                  </Text>
                </>
              )}

              {booking.booking_type === 'activity' && (
                <Text style={styles.bookingDetail}>
                  {formatDate(booking.starts_at)} at {formatTime(booking.starts_at)}
                </Text>
              )}

              <Text style={styles.confirmationNumber}>
                Confirmation: {booking.confirmation_number || 'N/A'}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

// Guide Tab
function GuideTab({
  guide,
  loading,
  onGenerate,
}: {
  guide: any;
  loading: boolean;
  onGenerate: () => void;
}) {
  if (loading) {
    return (
      <View style={styles.guideLoading}>
        <ActivityIndicator size="large" color="#0D6B6B" />
        <Text style={styles.guideLoadingText}>Building your travel guide...</Text>
        <Text style={styles.guideLoadingHint}>Analyzing local recommendations for your style</Text>
      </View>
    );
  }

  if (!guide) {
    return (
      <View style={styles.emptyTab}>
        <Ionicons name="map" size={40} color="#0D6B6B" />
        <Text style={styles.emptyTabText}>No guide yet</Text>
        <Text style={styles.emptyTabSubtext}>
          Generate an AI-powered destination guide tailored to your travel style
        </Text>
        <TouchableOpacity style={styles.generateButton} onPress={onGenerate}>
          <Text style={styles.generateButtonText}>Generate Guide ✨</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const tips = guide.neighborhood_tips || {};
  const practical = guide.practical_info || {};

  return (
    <View style={styles.tabContent}>
      {/* Restaurants */}
      {tips.restaurants?.length > 0 && (
        <View style={styles.guideSection}>
          <Text style={styles.guideSectionTitle}>🍽️ Restaurants</Text>
          {tips.restaurants.map((r: any, i: number) => (
            <View key={i} style={styles.guideCard}>
              <View style={styles.guideCardHeader}>
                <Text style={styles.guideCardTitle}>{r.name}</Text>
                <Text style={styles.priceRange}>{r.price_range || '$$'}</Text>
              </View>
              <Text style={styles.guideCardSubtitle}>{r.cuisine}</Text>
              <Text style={styles.guideCardDesc}>{r.why_worth_it}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Hidden Gems */}
      {tips.hidden_gems?.length > 0 && (
        <View style={styles.guideSection}>
          <Text style={styles.guideSectionTitle}>💎 Hidden Gems</Text>
          {tips.hidden_gems.map((g: any, i: number) => (
            <View key={i} style={styles.guideCard}>
              <Text style={styles.guideCardTitle}>{g.name}</Text>
              <Text style={styles.guideCardDesc}>{g.description}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Avoid */}
      {tips.avoid?.length > 0 && (
        <View style={styles.guideSection}>
          <Text style={[styles.guideSectionTitle, { color: '#F44336' }]}>⚠️ Avoid</Text>
          {tips.avoid.map((a: any, i: number) => (
            <View key={i} style={[styles.guideCard, { borderLeftColor: '#F44336' }]}>
              <Text style={styles.guideCardTitle}>{a.thing}</Text>
              <Text style={styles.guideCardDesc}>{a.reason}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Safety */}
      {tips.safety && (
        <View style={styles.guideSection}>
          <Text style={styles.guideSectionTitle}>🛡️ Safety</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>{tips.safety}</Text>
          </View>
        </View>
      )}

      {/* Practical Info */}
      <View style={styles.guideSection}>
        <Text style={styles.guideSectionTitle}>📋 Practical Info</Text>
        <View style={styles.practicalGrid}>
          {practical.currency && (
            <View style={styles.practicalItem}>
              <Text style={styles.practicalLabel}>Currency</Text>
              <Text style={styles.practicalValue}>{practical.currency}</Text>
            </View>
          )}
          {practical.tipping && (
            <View style={styles.practicalItem}>
              <Text style={styles.practicalLabel}>Tipping</Text>
              <Text style={styles.practicalValue}>{practical.tipping}</Text>
            </View>
          )}
          {practical.transit && (
            <View style={styles.practicalItem}>
              <Text style={styles.practicalLabel}>Transit</Text>
              <Text style={styles.practicalValue}>{practical.transit}</Text>
            </View>
          )}
          {practical.plug_adapter && (
            <View style={styles.practicalItem}>
              <Text style={styles.practicalLabel}>Plug</Text>
              <Text style={styles.practicalValue}>{practical.plug_adapter}</Text>
            </View>
          )}
          {practical.language_tips && (
            <View style={styles.practicalItem}>
              <Text style={styles.practicalLabel}>Language</Text>
              <Text style={styles.practicalValue}>{practical.language_tips}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Weather */}
      {guide.weather_summary && (
        <View style={styles.guideSection}>
          <Text style={styles.guideSectionTitle}>🌤️ Weather</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>{guide.weather_summary}</Text>
          </View>
        </View>
      )}

      <View style={styles.aiFooter}>
        <Ionicons name="sparkles" size={12} color="#999" />
        <Text style={styles.aiFooterText}>
          Built by AI for your travel style
        </Text>
      </View>
    </View>
  );
}

// Packing Tab
function PackingTab({ guide }: { guide: any }) {
  const items = guide?.packing_list?.items || [];
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newChecked = new Set(checked);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setChecked(newChecked);
  };

  const progress = items.length > 0 ? checked.size / items.length : 0;

  if (items.length === 0) {
    return (
      <View style={styles.emptyTab}>
        <Ionicons name="briefcase" size={40} color="#CCC" />
        <Text style={styles.emptyTabText}>No packing list yet</Text>
        <Text style={styles.emptyTabSubtext}>
          Generate a destination guide to get a personalized packing list
        </Text>
      </View>
    );
  }

  // Group by category
  const categories = items.reduce((acc: Record<string, any[]>, item: any) => {
    const cat = item.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <View style={styles.tabContent}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {checked.size}/{items.length} packed
        </Text>
      </View>

      {Object.entries(categories).map(([category, catItems]) => (
        <View key={category} style={styles.guideSection}>
          <Text style={[styles.guideSectionTitle, { textTransform: 'capitalize' }]}>
            {category}
          </Text>
          {catItems.map((item: any, i: number) => {
            const globalIndex = items.indexOf(item);
            const isChecked = checked.has(globalIndex);
            return (
              <TouchableOpacity
                key={i}
                style={styles.packingItem}
                onPress={() => toggleItem(globalIndex)}
              >
                <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                  {isChecked && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.packingItemText,
                      isChecked && styles.packingItemChecked,
                    ]}
                  >
                    {item.item}
                  </Text>
                  {item.reason && (
                    <Text style={styles.packingReason}>{item.reason}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// Documents Tab
function DocumentsTab() {
  return (
    <View style={styles.emptyTab}>
      <Ionicons name="document-text" size={40} color="#CCC" />
      <Text style={styles.emptyTabText}>Trip Documents</Text>
      <Text style={styles.emptyTabSubtext}>
        Upload tickets, reservations, and other documents for this trip
      </Text>
      <TouchableOpacity style={styles.generateButton}>
        <Text style={styles.generateButtonText}>Upload Document</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  detailHeader: {
    backgroundColor: '#0D6B6B',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  backButton: {
    marginBottom: 12,
  },
  headerContent: {},
  headerDestination: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  headerCountry: {
    fontSize: 16,
    color: '#C4E8E8',
    marginBottom: 8,
  },
  headerDates: {
    fontSize: 14,
    color: '#A3D9D9',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#0D6B6B',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  tabLabelActive: {
    color: '#0D6B6B',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  emptyTab: {
    alignItems: 'center',
    paddingTop: 60,
    padding: 24,
  },
  emptyTabText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 12,
    marginBottom: 6,
  },
  emptyTabSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  // Timeline
  timelineCard: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  timelineLine: {
    width: 20,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#CCC',
    marginTop: 4,
  },
  dotFlight: { backgroundColor: '#0D6B6B' },
  dotHotel: { backgroundColor: '#F5A623' },
  dotCar: { backgroundColor: '#4ECDC4' },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E5E5',
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginLeft: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bookingType: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0D6B6B',
    letterSpacing: 1,
  },
  bookingProvider: {
    fontSize: 12,
    color: '#999',
  },
  flightRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  flightPoint: {
    alignItems: 'center',
  },
  flightTime: {
    fontSize: 20,
    fontWeight: '800',
    color: '#222',
  },
  flightCity: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  flightArrow: {
    paddingHorizontal: 12,
  },
  liveStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  statusTextLarge: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  delayText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F44336',
  },
  bookingDetail: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  bookingAddress: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  confirmationNumber: {
    fontSize: 12,
    color: '#BBB',
    marginTop: 8,
  },
  // Guide
  guideLoading: {
    alignItems: 'center',
    paddingTop: 80,
    padding: 24,
  },
  guideLoadingText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
  },
  guideLoadingHint: {
    fontSize: 14,
    color: '#999',
    marginTop: 6,
  },
  generateButton: {
    backgroundColor: '#0D6B6B',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  guideSection: {
    marginBottom: 20,
  },
  guideSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#222',
    marginBottom: 12,
  },
  guideCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0D6B6B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  guideCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  guideCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
  },
  guideCardSubtitle: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  guideCardDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  priceRange: {
    fontSize: 13,
    color: '#F5A623',
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: '#E8F5F5',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#B8D8D8',
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  practicalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  practicalItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  practicalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  practicalValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  aiFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
  },
  aiFooterText: {
    fontSize: 12,
    color: '#999',
  },
  // Packing
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0D6B6B',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    textAlign: 'right',
  },
  packingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0D6B6B',
    borderColor: '#0D6B6B',
  },
  packingItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  packingItemChecked: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  packingReason: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});
