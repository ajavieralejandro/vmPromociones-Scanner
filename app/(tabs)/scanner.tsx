import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';

// Logger (ajustá la ruta si hace falta)
import { apiFetch, DebugBanner } from '../debug/ServerLogger';

// === CONFIG API ===
const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'https://surtekbb.com';
const CLAIM_URL  = (code: string) => `${API_BASE}/api/v1/promotions/qrs/${encodeURIComponent(code)}/claim`;
const REDEEM_URL = (code: string) => `${API_BASE}/api/v1/promotions/qrs/${encodeURIComponent(code)}/redeem`;

// Headers seguros en RN
const HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

// ===================

function parseCode(raw?: string | null): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (s.startsWith('http')) {
    try {
      const u = new URL(s);
      const qp = u.searchParams.get('code');
      if (qp) return qp;
      const parts = u.pathname.split('/').filter(Boolean);
      const idx = parts.findIndex((p) => p.toLowerCase() === 'qrs');
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
      const last = parts.at(-1);
      if (last && /^[A-Za-z0-9-]+$/.test(last)) return last;
    } catch {}
  }
  if (s.startsWith('{')) {
    try {
      const o = JSON.parse(s);
      if (typeof o.code === 'string') return o.code;
    } catch {}
  }
  return /^[A-Za-z0-9-]+$/.test(s) ? s : null;
}

export default function Scanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanLock, setScanLock] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission, requestPermission]);

  const goResult = useCallback((status: 'ok'|'error', title: string, message: string, details?: any) => {
    navigation.navigate('ResultadoCanje', { status, title, message, details });
  }, [navigation]);

  // 1) Claim por código → 2) Redeem
  const claimThenRedeem = useCallback(async (code: string) => {
    setLoading(true);
    try {
      // CLAIM
      const claimRes = await apiFetch(
        CLAIM_URL(code),
        { method: 'POST', headers: HEADERS, body: JSON.stringify({ device: `scanner-${Platform.OS}` }) },
        { origin: 'claimByCode', notes: `Scanner claim=${code}` }
      );

      if (!claimRes.ok) {
        const baseMsg =
          (claimRes.json && (claimRes.json.message || claimRes.json.error)) ||
          claimRes.text || '';
        if (claimRes.status === 404) return goResult('error', 'QR no encontrado', baseMsg || 'No existe ese código.', { status: claimRes.status, body: claimRes.json ?? claimRes.text });
        if (claimRes.status === 409) return goResult('error', 'QR ya utilizado', baseMsg || 'Este QR fue canjeado previamente.', { status: claimRes.status, body: claimRes.json ?? claimRes.text });
        return goResult('error', 'No se pudo reservar el QR', baseMsg || 'Intentá nuevamente.', { status: claimRes.status, body: claimRes.json ?? claimRes.text });
      }

      // REDEEM
      const redeemRes = await apiFetch(
        REDEEM_URL(code),
        { method: 'POST', headers: HEADERS, body: JSON.stringify({ source: 'scanner' }) },
        { origin: 'redeemQR', notes: `Scanner redeem=${code}` }
      );

      if (!redeemRes.ok) {
        const baseMsg =
          (redeemRes.json && (redeemRes.json.message || redeemRes.json.error)) ||
          redeemRes.text || '';
        if (redeemRes.status === 404) return goResult('error', 'QR no encontrado', baseMsg || 'No existe ese código.', { status: redeemRes.status, body: redeemRes.json ?? redeemRes.text });
        if (redeemRes.status === 409) return goResult('error', 'QR ya utilizado', baseMsg || 'Este QR fue canjeado previamente.', { status: redeemRes.status, body: redeemRes.json ?? redeemRes.text });
        if (redeemRes.status === 422) return goResult('error', 'QR expirado o sin claim', baseMsg || 'Volvé a reclamarlo e intentá de nuevo.', { status: redeemRes.status, body: redeemRes.json ?? redeemRes.text });
        return goResult('error', 'Error de canje', baseMsg || `HTTP ${redeemRes.status ?? 'ERR'}`, { status: redeemRes.status, body: redeemRes.json ?? redeemRes.text });
      }

      // OK
      const body = redeemRes.json ?? {};
      const msgOk =
        body.message ||
        'El cupón fue marcado como usado.';
      goResult('ok', 'Canje exitoso', msgOk, body);
    } finally {
      setLoading(false);
      setTimeout(() => setScanLock(false), 600); // des-traba el scanner
    }
  }, [goResult]);

  if (!permission) {
    return (
      <Center>
        <ActivityIndicator />
        <Text style={styles.mini}>Pidiendo permiso…</Text>
      </Center>
    );
  }
  if (!permission.granted) {
    return (
      <Center>
        <Text style={styles.title}>Se requiere permiso de cámara</Text>
        <Text>Tocá “Permitir” en el diálogo del sistema.</Text>
      </Center>
    );
  }

  return (
    <View style={styles.container}>
      {__DEV__ && <DebugBanner autoOpenOnError />}

      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={({ data }) => {
          if (scanLock) return;
          const code = parseCode(data);
          if (!code) {
            goResult('error', 'QR inválido', 'No pude extraer un código válido del escaneo.');
            return;
          }
          setScanLock(true);
          claimThenRedeem(code);
        }}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      <View style={styles.overlay}>
        {loading ? <ActivityIndicator /> : <Text style={styles.text}>Apuntá al QR para canjear</Text>}
      </View>
    </View>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <View style={styles.center}>{children}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: {
    position: 'absolute',
    bottom: Platform.select({ ios: 28, android: 24, default: 24 }),
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(15,23,42,0.7)',
    borderRadius: 10,
  },
  text: { color: '#e2e8f0' },
  title: { fontSize: 18, fontWeight: '700' },
  mini: { color: '#94a3b8' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
