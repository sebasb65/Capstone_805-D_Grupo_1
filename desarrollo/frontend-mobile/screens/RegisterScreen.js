// HU-007: Pantalla de registro con Firebase (offline-first)
// Estado: en desarrollo local

import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      alert('❌ Completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      alert('❌ Las contraseñas no coinciden');
      return;
    }

    try {
      // Registro con Firebase (offline-first)
      await createUserWithEmailAndPassword(auth, email, password);
      alert('✅ Registro exitoso (offline-first)');
      console.log('HU-007: registro exitoso', { email });
      navigation.navigate('Login');
    } catch (error) {
      alert('❌ Error de registro: ' + error.message);
      console.log('HU-007: error de registro', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear Cuenta</Text>

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

      <TextInput
        style={styles.input}
        placeholder="Repetir contraseña"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <Button title="Crear Cuenta" onPress={handleRegister} />
      <Button title="¿Ya tienes cuenta?" onPress={() => navigation.navigate('Login')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 },
});