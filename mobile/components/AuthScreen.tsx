import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const supabase = (() => {
  try {
    return require('../lib/supabase').supabase;
  } catch {
    return {
      auth: {
        signInWithPassword: async () => ({
          error: { message: 'Supabase is not configured.' },
        }),
        signUp: async () => ({
          data: { session: null },
          error: { message: 'Supabase is not configured.' },
        }),
      },
    };
  }
})();

type Props = {
  onAuthenticated: () => void;
};

export default function AuthScreen({ onAuthenticated }: Props) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing information', 'Please enter your email and password.');
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Password too short',
        'Your password must be at least 6 characters.'
      );
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          Alert.alert('Login failed', error.message);
          return;
        }

        onAuthenticated();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) {
          Alert.alert('Sign up failed', error.message);
          return;
        }

        if (!data.session) {
          Alert.alert(
            'Check your email',
            'Your account has been created. Please verify your email before logging in.'
          );
        } else {
          onAuthenticated();
        }
      }
    } catch (error) {
      Alert.alert('Something went wrong', 'Please try again.');
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>D</Text>
        </View>

        <Text style={styles.brand}>DEBEST</Text>
        <Text style={styles.subtitle}>Stationaries</Text>

        <View style={styles.card}>
          <Text style={styles.title}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </Text>

          <Text style={styles.description}>
            {isLogin
              ? 'Sign in to continue shopping.'
              : 'Create an account to manage your orders.'}
          </Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
              loading && styles.disabledButton,
            ]}
            onPress={handleAuth}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading
                ? 'Please wait...'
                : isLogin
                ? 'Sign In'
                : 'Create Account'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.switchButton}
            onPress={() => setIsLogin((current) => !current)}
          >
            <Text style={styles.switchText}>
              {isLogin
                ? "Don't have an account? "
                : 'Already have an account? '}
              <Text style={styles.switchTextBold}>
                {isLogin ? 'Create one' : 'Sign in'}
              </Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FC',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#111827',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
  },
  brand: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 15,
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 28,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 22,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 7,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#111827',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  primaryButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  switchButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  switchText: {
    color: '#6B7280',
    fontSize: 14,
  },
  switchTextBold: {
    color: '#111827',
    fontWeight: '700',
  },
});