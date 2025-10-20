import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';

// Logger (ajustá la ruta si hace falta)
import { DebugBanner } from '../debug/ServerLogger';

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
  const lockRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission, requestPermission]);

  const handleScan = useCallback(({ data }: { data: string }) => {
    if (lockRef.current) return;
    const code = parseCode(data);
    lockRef.current = true;
    setScanLock(true);

    if (!code) {
      // si el QR es inválido, mandamos a resultado con error
      router.replace({
        pathname: '/resultado-canje',
        params: {
          status: 'error',
          title: 'QR inválido',
          message: 'No pude extraer un código válido del escaneo.',
          details: '{}',
        },
      });
      return;
    }

    // Paso de confirmación: no canjeamos todavía
router.replace({ pathname: '/confirmar-canje' as any, params: { code } });

    // soltamos el lock un poco después para evitar rebote al volver
    setTimeout(() => {
      lockRef.current = false;
      setScanLock(false);
      setLoading(false);
    }, 800);
  }, [router]);

  // limpiar lock si se desmonta
  useEffect(() => () => { lockRef.current = false; }, []);

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
        onBarcodeScanned={scanLock ? undefined : handleScan}
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
    bottom: Platform.select({ ios: 28, android: 24, default: 24 }) as number,
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
