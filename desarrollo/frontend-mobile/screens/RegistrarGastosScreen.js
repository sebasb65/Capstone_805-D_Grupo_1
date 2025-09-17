// HU-003: Pantalla de registrar costos de insumos (offline-first)
// Estado: en desarrollo local

import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';

export default function RegistrarGastosScreen() {
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const handleGuardar = () => {
    if (!monto || !categoria) {
      alert('❌ Completa monto y categoría');
      return;
    }

    if (isNaN(monto) || parseFloat(monto) <= 0) {
      alert('❌ Monto debe ser un número mayor a 0');
      return;
    }

    alert(`✅ Gasto registrado: $${monto} en ${categoria} (offline-first)`);
    console.log('HU-003: gasto registrado', { monto, categoria, descripcion });

    // Limpiar formulario
    setMonto('');
    setCategoria('');
    setDescripcion('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registrar Gastos</Text>

      <TextInput
        style={styles.input}
        placeholder="Monto ($)"
        value={monto}
        onChangeText={setMonto}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="Categoría (ej: Fertilizantes, Semillas)"
        value={categoria}
        onChangeText={setCategoria}
      />

      <TextInput
        style={styles.input}
        placeholder="Descripción (opcional)"
        value={descripcion}
        onChangeText={setDescripcion}
        multiline
      />

      <Button title="Guardar Gasto" onPress={handleGuardar} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 },
});