import { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';

import { router } from 'expo-router';

import { useAuthStore } from '../../store/authStore';

export default function Register() {
  const register = useAuthStore((state) => state.register);

  const [name, setName] = useState('');

  const [email, setEmail] = useState('');

  const [phone, setPhone] = useState('');

  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name || !email || !phone || !password) {
      Alert.alert('Missing information', 'Please complete all fields.');

      return;
    }

    try {
      setLoading(true);

      await register(name, email, phone, password);

      router.replace('/(protected)/home');
    } catch (error: any) {
      Alert.alert('Registration failed', error.message ?? 'Unable to create account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create account</Text>

      <Text style={styles.subtitle}>Join RoadAssist</Text>

      <TextInput style={styles.input} placeholder="Full name" value={name} onChangeText={setName} />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Phone number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Creating account...' : 'Create Account'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.login}>
          Already have an account?{' '}
          <Text
            style={{
              fontWeight: '800',
            }}>
            Login
          </Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 25,
    justifyContent: 'center',
  },

  title: {
    fontSize: 32,
    fontWeight: '900',
  },

  subtitle: {
    marginTop: 8,
    marginBottom: 30,
    color: '#6B7280',
  },

  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
  },

  button: {
    backgroundColor: '#16A34A',
    padding: 17,
    borderRadius: 12,
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  login: {
    textAlign: 'center',
    marginTop: 25,
    color: '#4B5563',
  },
});
