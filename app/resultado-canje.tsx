import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ResultadoCanjeScreen() {
  const router = useRouter();
  const { status = 'error', title = '', message = '', details = '' } = useLocalSearchParams<{
    status?: string; title?: string; message?: string; details?: string;
  }>();

  let parsed: any = null;
  try { parsed = details ? JSON.parse(String(details)) : null; } catch {}

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

      {parsed ? (
        <ScrollView style={styles.detailsBox}>
          <Text style={styles.detailsTitle}>Detalles</Text>
          <Text style={styles.detailsMono}>{JSON.stringify(parsed, null, 2)}</Text>
        </ScrollView>
      ) : null}

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
  detailsBox: { flex: 1, backgroundColor: '#0f172a', borderRadius: 12, padding: 12, marginTop: 8 },
  detailsTitle: { color: '#cbd5e1', fontWeight: '700', marginBottom: 6 },
  detailsMono: { color: '#e2e8f0', fontFamily: 'monospace', fontSize: 12 },
  actions: { marginTop: 14 },
  btnPrimary: { backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontWeight: '800' },
});
