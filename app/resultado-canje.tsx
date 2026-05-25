import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ResultTone = 'success' | 'error' | 'warning' | 'info';

function resolveResultTone(status: string, title: string, message: string): ResultTone {
  if (status === 'ok') return 'success';

  const fullText = `${title} ${message}`.toLowerCase();
  if (fullText.includes('vencid')) return 'warning';
  if (fullText.includes('red') || fullText.includes('conex')) return 'info';
  if (fullText.includes('permiso')) return 'warning';
  return 'error';
}

const TONE_CONFIG: Record<ResultTone, {
  icon: keyof typeof Ionicons.glyphMap;
  titleColor: string;
  textColor: string;
  cardBg: string;
  iconBg: string;
}> = {
  success: {
    icon: 'checkmark-circle',
    titleColor: '#065f46',
    textColor: '#047857',
    cardBg: '#ecfdf5',
    iconBg: '#d1fae5',
  },
  error: {
    icon: 'close-circle',
    titleColor: '#991b1b',
    textColor: '#b91c1c',
    cardBg: '#fef2f2',
    iconBg: '#fee2e2',
  },
  warning: {
    icon: 'alert-circle',
    titleColor: '#92400e',
    textColor: '#b45309',
    cardBg: '#fffbeb',
    iconBg: '#fef3c7',
  },
  info: {
    icon: 'information-circle',
    titleColor: '#1e3a8a',
    textColor: '#1d4ed8',
    cardBg: '#eff6ff',
    iconBg: '#dbeafe',
  },
};

export default function ResultadoCanjeScreen() {
  const router = useRouter();
  const { status = 'error', title = '', message = '' } = useLocalSearchParams<{
    status?: string; title?: string; message?: string;
  }>();

  const tone = resolveResultTone(String(status), String(title), String(message));
  const config = TONE_CONFIG[tone];
  const isOk = tone === 'success';

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <View style={[styles.iconCircle, { backgroundColor: config.iconBg }]}>
            <Ionicons name={config.icon} size={34} color={config.titleColor} />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: config.cardBg }]}>
          <Text style={[styles.title, { color: config.titleColor }]}>
          {title || (isOk ? 'Canje exitoso' : 'No se pudo canjear')}
          </Text>
          <Text style={[styles.msg, { color: config.textColor }]}>
          {message || (isOk ? 'El cupón fue marcado como usado.' : 'Reintentalo más tarde.')}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity onPress={() => router.replace('/(tabs)/scanner')} style={styles.btnPrimary}>
            <Text style={styles.btnPrimaryText}>Escanear otro QR</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.btnGhost}>
            <Text style={styles.btnGhostText}>Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, padding: 18, justifyContent: 'center' },
  iconWrap: { alignItems: 'center', marginBottom: 12 },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
    borderColor: '#e2e8f0',
    borderWidth: 1,
  },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 6, textAlign: 'center' },
  msg: { fontSize: 16, textAlign: 'center', lineHeight: 22 },
  actions: { marginTop: 6, gap: 10 },
  btnPrimary: {
    backgroundColor: '#0f62fe',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnPrimaryText: { color: '#fff', fontWeight: '700' },
  btnGhost: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnGhostText: { color: '#334155', fontWeight: '700' },
});
