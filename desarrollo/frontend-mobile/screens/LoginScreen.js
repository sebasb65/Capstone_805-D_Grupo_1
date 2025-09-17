// HU-007: Pantalla de login con Firebase (offline-first)
// Estado: en desarrollo local

import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      alert('❌ Completa todos los campos');
      return;
    }

    try {
      // Intenta login con Firebase (offline-first)
      await signInWithEmailAndPassword(auth, email, password);
      alert('✅ Login exitoso (offline-first)');
      console.log('HU-007: login exitoso', { email });
      navigation.navigate('Dashboard');
    } catch (error) {
      alert('❌ Error de login: ' + error.message);
      console.log('HU-007: error de login', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button title="Iniciar Sesión" onPress={handleLogin} />
      <Button title="¿Olvidaste tu contraseña?" onPress={() => navigation.navigate('ResetPassword')} />
      <Button title="Crear cuenta" onPress={() => navigation.navigate('Register')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 },
});