import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity, Animated, Vibration } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Audio } from 'expo-av';
import { incrementCounterAtomic, addEvrakWithBarcode, getCurrentCounter } from '../services/counterService';

export default function BarcodeScannerScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState(null);
  const flashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('Admin')} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Yönetici</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const playBeep = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(require('../assets/beep.mp3'));
      await sound.playAsync();
      // not unloading for brevity
    } catch (e) {
      // ignore if asset not present
    }
  };

  const handleBarCodeScanned = async ({ data, type }) => {
    if (scanned) return;
    setScanned(true);
    try {
      const newCounter = await incrementCounterAtomic();
      const id = await addEvrakWithBarcode(data, newCounter);
      setResult({ data, type, counter: newCounter, id });
      Vibration.vibrate(200);
      playBeep();
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start();
    } catch (e) {
      setResult({ error: true });
    }
  };

  if (hasPermission === null) return <Text>İzin isteniyor...</Text>;
  if (hasPermission === false) return <Text>Kamera izni verilmedi.</Text>;

  return (
    <View style={styles.container}>
      <BarCodeScanner onBarCodeScanned={handleBarCodeScanned} style={StyleSheet.absoluteFillObject} />

      <View style={styles.frameContainer} pointerEvents="none">
        <View style={styles.frame} />
      </View>

      {result ? (
        <View style={styles.summary}>
          {result.error ? (
            <Text>Okuma sırasında hata oluştu.</Text>
          ) : (
            <>
              <Text>Okunan Barkod: {result.data}</Text>
              <Text>Atanan Evrak No: {result.counter}</Text>
              <Text>ID: {result.id}</Text>
            </>
          )}
          <Button title="Yeniden Tara" onPress={() => { setScanned(false); setResult(null); }} />
        </View>
      ) : (
        <TouchableOpacity style={styles.manualButton} onPress={async () => { const val = await getCurrentCounter(); setResult({ data: '---', counter: val }); }}>
          <Text style={{ color: '#fff' }}>Sayaç Görüntüle</Text>
        </TouchableOpacity>
      )}

      <Animated.View pointerEvents="none" style={[styles.flash, { opacity: flashAnim }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  frameContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  frame: { width: 260, height: 160, borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)', borderRadius: 8 },
  summary: { position: 'absolute', bottom: 40, left: 20, right: 20, backgroundColor: 'rgba(255,255,255,0.95)', padding: 12, borderRadius: 8 },
  manualButton: { position: 'absolute', top: 40, right: 16, backgroundColor: '#007AFF', padding: 8, borderRadius: 6 },
  flash: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,255,0,0.2)' },
  headerButton: { marginRight: 8, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#007AFF', borderRadius: 6 },
  headerButtonText: { color: '#fff', fontWeight: '600' },
});