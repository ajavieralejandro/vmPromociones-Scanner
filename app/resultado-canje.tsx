import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ResultadoCanjeScreen() {
  const router = useRouter();
  const { status = 'error', title = '', message = '' } = useLocalSearchParams<{
    status?: string; title?: string; message?: string;
  }>();

  const isOk = status === 'ok';

  return (
    <View style={styles.container}>
      <View style={[styles.card, isOk ? styles.ok : styles.err]}>
        <Text style={[styles.title, isOk ? styles.okText : styles.errText]}>
          {title || (isOk ? 'Canje exitoso' : 'No se pudo canjear')}
        </Text>
        <Text style={[styles.msg, isOk ? styles.okText : styles.errText]}>
          {message || (isOk ? 'El cupón fue marcado como usado.' : 'Reintentalo más tarde.')}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/scanner')} style={styles.btnPrimary}>
          <Text style={styles.btnPrimaryText}>Volver a escanear</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, backgroundColor: '#0b1220' },
  card: { padding: 16, borderRadius: 14, marginBottom: 14 },
  ok: { backgroundColor: '#093a2b' },
  err: { backgroundColor: '#3a0913' },
  okText: { color: '#bcf7db' },
  errText: { color: '#ffc7d1' },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  msg: { fontSize: 16 },
  actions: { marginTop: 14 },
  btnPrimary: { backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontWeight: '800' },
});
