// HU-002: Pantalla de cálculo de pagos (offline-first)
// Estado: en desarrollo local

import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';

export default function CalcularPagosScreen() {
  const [trabajador, setTrabajador] = useState('');
  const [horas, setHoras] = useState('');
  const [tarifa, setTarifa] = useState('');

  const handleCalcular = () => {
    if (!trabajador || !horas || !tarifa) {
      alert('❌ Completa todos los campos');
      return;
    }

    if (isNaN(horas) || isNaN(tarifa) || parseInt(horas) <= 0 || parseFloat(tarifa) <= 0) {
      alert('❌ Horas y tarifa deben ser números mayores a 0');
      return;
    }

    const total = parseInt(horas) * parseFloat(tarifa);
    alert(`✅ Total a pagar: $${total.toFixed(2)} (offline-first)`);
    console.log('HU-002: cálculo exitoso', { trabajador, horas, tarifa, total });

    // Limpiar formulario
    setTrabajador('');
    setHoras('');
    setTarifa('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calcular Pagos</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre del trabajador"
        value={trabajador}
        onChangeText={setTrabajador}
      />

      <TextInput
        style={styles.input}
        placeholder="Horas trabajadas"
        value={horas}
        onChangeText={setHoras}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="Tarifa por hora ($)"
        value={tarifa}
        onChangeText={setTarifa}
        keyboardType="numeric"
      />

      <Button title="Calcular Pago" onPress={handleCalcular} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 },
});