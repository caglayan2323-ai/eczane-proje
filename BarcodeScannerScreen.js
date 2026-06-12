import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { getCurrentCounter, updateCounter } from '../services/counterService';

export default function AdminScreen({ navigation }) {
  const [counter, setCounter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const val = await getCurrentCounter();
        setCounter(String(val));
      } catch (e) {
        Alert.alert('Hata', 'Sayaç değeri okunamadı');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleUpdate = async () => {
    const num = parseInt(counter, 10);
    if (Number.isNaN(num)) {
      Alert.alert('Hata', 'Lütfen geçerli bir sayı girin');
      return;
    }
    try {
      await updateCounter(num);
      Alert.alert('Başarılı', `Sayaç ${num} olarak güncellendi`);
    } catch (e) {
      Alert.alert('Hata', 'Güncelleme başarısız');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Mevcut Sayaç</Text>
      <Text style={styles.counter}>{loading ? '...' : counter}</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={counter}
        onChangeText={setCounter}
        placeholder="Yeni sayı girin"
      />
      <Button title="Güncelle" onPress={handleUpdate} />
      <View style={{ height: 12 }} />
      <Button title="Tarayıcıya Git" onPress={() => navigation.navigate('Scanner')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  label: { fontSize: 16, marginBottom: 8 },
  counter: { fontSize: 28, fontWeight: '600', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 12, borderRadius: 4 },
});