import React, { useState } from 'react';

import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Link, router } from 'expo-router';

import { useAuth } from '../../../src/context/AuthContext';

export default function RegisterScreen() {
  const { register } = useAuth();

  const [name, setName] = useState('');

  const [email, setEmail] = useState('');

  const [phone, setPhone] = useState('');

  const [password, setPassword] = useState('');

  const [confirmPassword, setConfirmPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);

  async function handleRegister() {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');

      return;
    }

    if (!email.trim()) {
      Alert.alert('Email required', 'Please enter your email.');

      return;
    }

    if (password.length < 8) {
      Alert.alert('Password too short', 'Password must contain at least 8 characters.');

      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Please make sure both passwords are the same.');

      return;
    }

    try {
      setSubmitting(true);

      await register(
        name.trim(),

        email.trim(),

        password,

        phone.trim() || undefined
      );

      router.replace('/(customer)/home');
    } catch (error: any) {
      Alert.alert('Registration failed', error.message || 'Unable to create account.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput placeholder="Full name" value={name} onChangeText={setName} style={styles.input} />

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />

      <TextInput
        placeholder="Phone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <TextInput
        placeholder="Confirm password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        style={styles.input}
      />

      <Pressable onPress={handleRegister} disabled={submitting} style={styles.button}>
        <Text style={styles.buttonText}>
          {submitting ? 'Creating account...' : 'Create Account'}
        </Text>
      </Pressable>

      <Link href="/(auth)/login" style={styles.link}>
        Already have an account? Sign in
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

    justifyContent: 'center',

    padding: 24,

    backgroundColor: '#FFFFFF',
  },

  title: {
    fontSize: 30,

    fontWeight: '700',

    marginBottom: 25,
  },

  input: {
    borderWidth: 1,

    borderColor: '#D1D5DB',

    borderRadius: 12,

    padding: 14,

    fontSize: 16,

    marginBottom: 12,
  },

  button: {
    backgroundColor: '#2563EB',

    borderRadius: 12,

    padding: 15,

    alignItems: 'center',

    marginTop: 8,
  },

  buttonText: {
    color: '#FFFFFF',

    fontWeight: '700',

    fontSize: 16,
  },

  link: {
    color: '#2563EB',

    textAlign: 'center',

    marginTop: 20,
  },
});
