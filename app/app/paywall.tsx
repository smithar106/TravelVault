import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type Plan = 'monthly' | 'annual';

const PLANS: Record<Plan, { price: string; original: string; savings?: string; label: string }> = {
  monthly: {
    price: '$5.99',
    original: '$5.99',
    label: 'Monthly',
  },
  annual: {
    price: '$39.99',
    original: '$71.88',
    savings: 'Save 44%',
    label: 'Annual',
  },
};

const PRO_FEATURES = [
  { icon: 'infinite' as const, title: 'Unlimited Trips', desc: 'No trip limits. Forward as many bookings as you want.' },
  { icon: 'sparkles' as const, title: 'AI Destination Guides', desc: 'Personalized guides for every destination.' },
  { icon: 'airplane' as const, title: 'Live Flight Status', desc: 'Real-time flight alerts and gate change notifications.' },
  { icon: 'briefcase' as const, title: 'Smart Packing Lists', desc: 'AI-generated packing lists based on your trip and style.' },
  { icon: 'globe' as const, title: 'Travel Style Learning', desc: 'Your travel brain gets smarter with every trip.' },
  { icon: 'lock-closed' as const, title: 'Document Vault', desc: 'Secure storage for all your travel documents.' },
];

export default function PaywallScreen() {
  const [selectedPlan, setSelectedPlan] = useState<Plan>('annual');

  async function startSubscription() {
    Alert.alert(
      'Start Free Trial',
      `You'll get 7 days free on the ${PLANS[selectedPlan].label.toLowerCase()} plan. After that, you'll be charged ${PLANS[selectedPlan].price}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Trial',
          onPress: () => {
            // RevenueCat purchase flow would go here
            Alert.alert('Success', 'Free trial started! Welcome to TravelVault Pro.');
            router.back();
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Close button */}
      <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
        <Ionicons name="close" size={24} color="#333" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.headerEmoji}>✨</Text>
        <Text style={styles.headerTitle}>TravelVault Pro</Text>
        <Text style={styles.headerSubtitle}>
          Unlimited trips, AI guides, live flight tracking, and more
        </Text>
      </View>

      {/* Plan Toggle */}
      <View style={styles.planContainer}>
        <View style={styles.planToggle}>
          {(['monthly', 'annual'] as Plan[]).map((plan) => (
            <TouchableOpacity
              key={plan}
              style={[
                styles.planOption,
                selectedPlan === plan && styles.planOptionActive,
              ]}
              onPress={() => setSelectedPlan(plan)}
            >
              <Text
                style={[
                  styles.planOptionText,
                  selectedPlan === plan && styles.planOptionTextActive,
                ]}
              >
                {PLANS[plan].label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Price display */}
        <View style={styles.priceContainer}>
          <Text style={styles.priceCurrency}>$</Text>
          <Text style={styles.priceAmount}>
            {selectedPlan === 'annual' ? '39' : '5'}
          </Text>
          <Text style={styles.priceDecimal}>.
            {selectedPlan === 'annual' ? '99' : '99'}
          </Text>
          <Text style={styles.pricePeriod}>
            /{selectedPlan === 'annual' ? 'year' : 'month'}
          </Text>
        </View>

        {PLANS[selectedPlan].savings && (
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsText}>{PLANS[selectedPlan].savings}</Text>
          </View>
        )}

        {selectedPlan === 'annual' && (
          <Text style={styles.originalPrice}>
            {PLANS.annual.original}/year
          </Text>
        )}
      </View>

      {/* Trial CTA */}
      <TouchableOpacity style={styles.trialButton} onPress={startSubscription}>
        <Text style={styles.trialButtonText}>Start 7-Day Free Trial</Text>
      </TouchableOpacity>

      <Text style={styles.trialHint}>
        No charge until trial ends. Cancel anytime.
      </Text>

      {/* Features */}
      <View style={styles.featuresSection}>
        <Text style={styles.featuresTitle}>Pro Features</Text>
        {PRO_FEATURES.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <View style={styles.featureIconContainer}>
              <Ionicons name={feature.icon} size={20} color="#0D6B6B" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDesc}>{feature.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Free plan info */}
      <View style={styles.freePlanInfo}>
        <Text style={styles.freePlanTitle}>Stay on Free</Text>
        <Text style={styles.freePlanDesc}>
          Free includes 1 trip with basic itinerary building.
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#222',
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  planContainer: {
    marginHorizontal: 24,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  planToggle: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 3,
    marginBottom: 20,
  },
  planOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  planOptionActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  planOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  planOptionTextActive: {
    color: '#0D6B6B',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  priceCurrency: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222',
    marginTop: 12,
  },
  priceAmount: {
    fontSize: 56,
    fontWeight: '800',
    color: '#222',
    lineHeight: 64,
  },
  priceDecimal: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222',
    marginTop: 12,
  },
  pricePeriod: {
    fontSize: 16,
    color: '#999',
    marginTop: 36,
    marginLeft: 4,
  },
  savingsBadge: {
    backgroundColor: '#E8F5F5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  savingsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D6B6B',
  },
  originalPrice: {
    fontSize: 14,
    color: '#BBB',
    textDecorationLine: 'line-through',
  },
  trialButton: {
    backgroundColor: '#F5A623',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  trialButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  trialHint: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 32,
  },
  featuresSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 14,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E8F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    color: '#999',
    lineHeight: 18,
  },
  freePlanInfo: {
    marginHorizontal: 24,
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  freePlanTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  freePlanDesc: {
    fontSize: 13,
    color: '#999',
  },
});
