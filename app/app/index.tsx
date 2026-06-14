import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { useAuth } from '../src/hooks/useAuth';
import { supabase } from '../src/lib/supabase';
import { storage } from '../src/lib/storage';

const QUIZ_URL = Constants.expoConfig?.extra?.TRAVELVAULT_QUIZ_URL || 'https://travelvault-quiz.vercel.app';

const INTERESTS_OPTIONS = [
  'museums', 'food', 'nature', 'nightlife', 'shopping',
  'history', 'art', 'adventure', 'relaxation', 'sports',
];

const PACE_OPTIONS = ['relaxed', 'moderate', 'packed'] as const;

export default function FirstLaunchScreen() {
  const { user, loading: authLoading, signUp, signIn, completeOnboarding } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [authProcessing, setAuthProcessing] = useState(false);
  const [step, setStep] = useState<'auth' | 'quiz-cta' | 'onboarding-interests' | 'onboarding-pace' | 'email-display'>('auth');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedPace, setSelectedPace] = useState<'relaxed' | 'moderate' | 'packed'>('moderate');
  const [travelvaultEmail, setTravelvaultEmail] = useState('');

  useEffect(() => {
    storage.hasCompletedOnboarding().then((done) => {
      if (done && user) {
        router.replace('/(tabs)/trips');
      }
    });
  }, [user]);

  useEffect(() => {
    if (user) {
      setStep('quiz-cta');
      // Check if quiz already done
      if (user.quiz_completed) {
        router.replace('/(tabs)/trips');
      }
    }
  }, [user]);

  async function handleAuth() {
    try {
      setAuthProcessing(true);
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setAuthProcessing(false);
    }
  }

  async function openQuiz() {
    if (!user) return;
    const quizUrl = `${QUIZ_URL}?user_id=${user.id}`;
    const result = await WebBrowser.openBrowserAsync(quizUrl);
    if (result.type === 'cancel') {
      // User skipped quiz, go to minimal onboarding
      setStep('onboarding-interests');
    }
  }

  async function completeMinimalOnboarding() {
    try {
      const { error } = await supabase.from('travel_profiles').upsert({
        user_id: user!.id,
        interests: selectedInterests,
        trip_pace: selectedPace,
        updated_at: new Date().toISOString(),
      });

      if (error) console.error('Profile save error:', error);

      // Generate their travelvault email
      const { data: userData } = await supabase
        .from('users')
        .select('travelvault_email')
        .eq('id', user!.id)
        .single();

      setTravelvaultEmail(userData?.travelvault_email || '');
      await completeOnboarding();

      // Show email for 3 seconds then go to dashboard
      setTimeout(() => {
        router.replace('/(tabs)/trips');
      }, 3000);
    } catch (err) {
      console.error('Onboarding error:', err);
    }
  }

  if (authLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0D6B6B" />
      </View>
    );
  }

  // Auth screen
  if (step === 'auth') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>TravelVault</Text>
          <Text style={styles.tagline}>Your AI travel companion</Text>
        </View>

        <View style={styles.authCard}>
          <Text style={styles.authTitle}>{isSignUp ? 'Get Started' : 'Welcome Back'}</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleAuth}
            disabled={authProcessing}
          >
            {authProcessing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => setIsSignUp(!isSignUp)}
          >
            <Text style={styles.linkText}>
              {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Quiz CTA screen
  if (step === 'quiz-cta') {
    return (
      <View style={styles.container}>
        <View style={styles.quizHero}>
          <Text style={styles.quizEmoji}>🧳</Text>
          <Text style={styles.quizTitle}>Discover Your Travel Personality</Text>
          <Text style={styles.quizSubtitle}>In 60 seconds</Text>
          <Text style={styles.quizDescription}>
            We'll learn your travel style to build perfect, personalized itineraries for every trip.
          </Text>
        </View>

        <TouchableOpacity style={styles.quizButton} onPress={openQuiz}>
          <Text style={styles.quizButtonText}>Take the Travel Quiz →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => setStep('onboarding-interests')}
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Minimal onboarding: Interests
  if (step === 'onboarding-interests') {
    return (
      <View style={styles.container}>
        <Text style={styles.onboardingTitle}>What interests you?</Text>
        <Text style={styles.onboardingSubtitle}>Pick your favorites</Text>

        <ScrollView contentContainerStyle={styles.chipContainer}>
          {INTERESTS_OPTIONS.map((interest) => (
            <TouchableOpacity
              key={interest}
              style={[
                styles.chip,
                selectedInterests.includes(interest) && styles.chipSelected,
              ]}
              onPress={() => {
                if (selectedInterests.includes(interest)) {
                  setSelectedInterests(selectedInterests.filter((i) => i !== interest));
                } else {
                  setSelectedInterests([...selectedInterests, interest]);
                }
              }}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedInterests.includes(interest) && styles.chipTextSelected,
                ]}
              >
                {interest}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={[styles.primaryButton, styles.nextButton]}
          onPress={() => setStep('onboarding-pace')}
        >
          <Text style={styles.buttonText}>Next →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Minimal onboarding: Pace
  if (step === 'onboarding-pace') {
    return (
      <View style={styles.container}>
        <Text style={styles.onboardingTitle}>What's your travel pace?</Text>

        <View style={styles.paceContainer}>
          {PACE_OPTIONS.map((pace) => (
            <TouchableOpacity
              key={pace}
              style={[
                styles.paceCard,
                selectedPace === pace && styles.paceCardSelected,
              ]}
              onPress={() => setSelectedPace(pace)}
            >
              <Text style={styles.paceEmoji}>
                {pace === 'relaxed' ? '🏖️' : pace === 'moderate' ? '🗺️' : '⚡'}
              </Text>
              <Text
                style={[
                  styles.paceLabel,
                  selectedPace === pace && styles.paceLabelSelected,
                ]}
              >
                {pace.charAt(0).toUpperCase() + pace.slice(1)}
              </Text>
              <Text style={styles.paceDesc}>
                {pace === 'relaxed'
                  ? 'Slow mornings, spontaneous afternoons'
                  : pace === 'moderate'
                  ? 'A few key sights, time to explore'
                  : 'See everything, maximize every moment'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, styles.nextButton]}
          onPress={completeMinimalOnboarding}
        >
          <Text style={styles.buttonText}>Let's Go →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    padding: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0D6B6B',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  authCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
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
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#0D6B6B',
    fontSize: 14,
  },
  quizHero: {
    alignItems: 'center',
    marginBottom: 40,
  },
  quizEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  quizTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#222',
    textAlign: 'center',
    marginBottom: 8,
  },
  quizSubtitle: {
    fontSize: 18,
    color: '#0D6B6B',
    fontWeight: '600',
    marginBottom: 16,
  },
  quizDescription: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  quizButton: {
    backgroundColor: '#F5A623',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  quizButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  skipButton: {
    alignItems: 'center',
    padding: 12,
  },
  skipText: {
    color: '#999',
    fontSize: 14,
  },
  onboardingTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#222',
    textAlign: 'center',
    marginBottom: 8,
  },
  onboardingSubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 32,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
  },
  chipSelected: {
    backgroundColor: '#E8F5F5',
    borderColor: '#0D6B6B',
  },
  chipText: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  chipTextSelected: {
    color: '#0D6B6B',
    fontWeight: '600',
  },
  nextButton: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
  },
  paceContainer: {
    gap: 16,
    marginBottom: 32,
  },
  paceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  paceCardSelected: {
    borderColor: '#0D6B6B',
    backgroundColor: '#E8F5F5',
  },
  paceEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  paceLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  paceLabelSelected: {
    color: '#0D6B6B',
  },
  paceDesc: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
});
