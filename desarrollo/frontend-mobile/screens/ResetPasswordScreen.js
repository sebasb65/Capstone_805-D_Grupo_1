// HU-007: Pantalla de restablecer contraseña con Firebase (offline-first)
// Estado: en desarrollo local

import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function ResetPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');

  const handleReset = async () => {
    if (!email) {
      alert('❌ Ingresa tu correo electrónico');
      return;
    }

    try {
      // Restablecer contraseña con Firebase (offline-first)
      await sendPasswordResetEmail(auth, email);
      alert('✅ Correo de restablecimiento enviado (offline-first)');
      console.log('HU-007: restablecimiento enviado', { email });
      navigation.navigate('Login');
    } catch (error) {
      alert('❌ Error al restablecer: ' + error.message);
      console.log('HU-007: error al restablecer', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Restablecer Contraseña</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <Button title="Enviar correo de restablecimiento" onPress={handleReset} />
      <Button title="Volver al login" onPress={() => navigation.navigate('Login')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 },
});