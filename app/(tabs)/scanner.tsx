import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

// === CONFIG API ===
const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'https://surtekbb.com';
const REDEEM_URL = (code: string) => `${API_BASE}/api/v1/promotions/qrs/${encodeURIComponent(code)}/redeem`;
const HEADERS: HeadersInit = { 'Content-Type': 'application/json' };
// ==================

function parseCode(raw?: string | null): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (s.startsWith('http')) {
    try {
      const u = new URL(s);
      const qp = u.searchParams.get('code');
      if (qp) return qp;
      const parts = u.pathname.split('/').filter(Boolean);
      const idx = parts.findIndex(p => p.toLowerCase() === 'qrs');
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
      const last = parts.at(-1);
      if (last && /^[A-Za-z0-9-]+$/.test(last)) return last;
    } catch {}
  }
  if (s.startsWith('{')) {
    try { const o = JSON.parse(s); if (typeof o.code === 'string') return o.code; } catch {}
  }
  return /^[A-Za-z0-9-]+$/.test(s) ? s : null;
}

export default function Scanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanLock, setScanLock] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!permission) requestPermission(); }, [permission]);

  const redeem = useCallback(async (code: string) => {
    setLoading(true);
    try {
      const res = await fetch(REDEEM_URL(code), {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({ source: 'scanner' })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 404) throw new Error('QR no encontrado.');
        if (res.status === 409) throw new Error('QR ya utilizado.');
        if (res.status === 422) throw new Error(data?.message || 'QR expirado o sin claim.');
        throw new Error(data?.message || `Error HTTP ${res.status}`);
      }
      Alert.alert('✅ Canje OK', 'El cupón fue marcado como usado.');
    } catch (e: any) {
      Alert.alert('❌ No se pudo canjear', e?.message ?? 'Intentá nuevamente.');
    } finally {
      setLoading(false);
      setTimeout(() => setScanLock(false), 600);
    }
  }, []);

  if (!permission) {
    return <Center><ActivityIndicator /><Text style={styles.mini}>Pidiendo permiso…</Text></Center>;
  }
  if (!permission.granted) {
    return <Center>
      <Text style={styles.title}>Se requiere permiso de cámara</Text>
      <Text>Tocá “Permitir” en el diálogo del sistema.</Text>
    </Center>;
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={({ data }) => {
          if (scanLock) return;
          const code = parseCode(data);
          if (!code) return Alert.alert('QR inválido', 'No pude extraer un código válido.');
          setScanLock(true);
          redeem(code);
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
  overlay: { position: 'absolute', bottom: 28, alignSelf: 'center', padding: 10, backgroundColor: 'rgba(15,23,42,0.7)', borderRadius: 10 },
  text: { color: '#e2e8f0' },
  title: { fontSize: 18, fontWeight: '700' },
  mini: { color: '#94a3b8' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
