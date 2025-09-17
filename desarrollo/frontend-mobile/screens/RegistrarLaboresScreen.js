// HU-001: Pantalla de registro de labores
// Estado: en desarrollo local

import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

export default function RegistrarLaboresScreen() {
  const [fecha, setFecha] = useState('');
  const [trabajador, setTrabajador] = useState('');
  const [tipo, setTipo] = useState('');
  const [horas, setHoras] = useState('');

  const handleGuardar = () => {
    // Lógica básica: validación sin Firebase (por ahora)
    if (!fecha || !trabajador || !tipo || !horas) {
      alert('Por favor completa todos los campos');
      return;
    }
    alert('Labor registrada (sin conexión por ahora)');
    // Aquí irá Firebase más adelante
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registrar Labor</Text>

      <TextInput
        style={styles.input}
        placeholder="Fecha (YYYY-MM-DD)"
        value={fecha}
        onChangeText={setFecha}
      />

      <TextInput
        style={styles.input}
        placeholder="Nombre del trabajador"
        value={trabajador}
        onChangeText={setTrabajador}
      />

      <TextInput
        style={styles.input}
        placeholder="Tipo de labor (ej: Riego, Siembra)"
        value={tipo}
        onChangeText={setTipo}
      />

      <TextInput
        style={styles.input}
        placeholder="Horas trabajadas"
        value={horas}
        onChangeText={setHoras}
        keyboardType="numeric"
      />

      <Button title="Guardar Labor" onPress={handleGuardar} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 },
});