import * as SecureStore from 'expo-secure-store';

const PREFIX = 'tv_';

export const storage = {
  async set(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(`${PREFIX}${key}`, value);
  },

  async get(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(`${PREFIX}${key}`);
  },

  async setObject(key: string, value: object): Promise<void> {
    await this.set(key, JSON.stringify(value));
  },

  async getObject<T = any>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  },

  async remove(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(`${PREFIX}${key}`);
  },

  // App onboarding state
  async hasCompletedOnboarding(): Promise<boolean> {
    const val = await this.get('onboarding_complete');
    return val === 'true';
  },

  async setOnboardingComplete(): Promise<void> {
    await this.set('onboarding_complete', 'true');
  },

  // Quiz state
  async getQuizToken(): Promise<string | null> {
    return this.get('quiz_token');
  },

  async setQuizToken(token: string): Promise<void> {
    await this.set('quiz_token', token);
  },
};
