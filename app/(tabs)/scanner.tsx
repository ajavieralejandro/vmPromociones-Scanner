import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [flash, setFlash] = useState(false);
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

    router.replace({ pathname: '/confirmar-canje' as any, params: { code } });

    setTimeout(() => {
      lockRef.current = false;
      setScanLock(false);
      setLoading(false);
    }, 800);
  }, [router]);

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
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={scanLock ? undefined : handleScan}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />

        <View style={styles.header} pointerEvents="box-none">
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            onPress={() => setFlash((f) => !f)}
            style={styles.headerButton}
            accessibilityLabel="Toggle flash"
          >
            <Ionicons name={flash ? 'flash' : 'flash-off'} size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.centerOverlay} pointerEvents="none">
          <View style={styles.frame} />
          <Text style={styles.centerText}>Apuntá al QR</Text>
        </View>

        <View style={styles.bottomArea} pointerEvents="box-none">
          <View style={styles.statusContainer}>
            {loading ? (
              <View style={styles.statusRow}>
                <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.statusText}>Validando…</Text>
              </View>
            ) : (
              <Text style={styles.statusText}>Listo para escanear</Text>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <View style={styles.center}>{children}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safe: { flex: 1, backgroundColor: '#000' },
  header: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  centerOverlay: {
    position: 'absolute',
    top: '25%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  frame: {
    width: 260,
    height: 180,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: 'transparent',
    marginBottom: 12,
  },
  centerText: { color: '#fff', fontSize: 16 },
  bottomArea: {
    position: 'absolute',
    bottom: Platform.select({ ios: 20, android: 16, default: 16 }) as number,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 6,
  },
  statusContainer: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusText: { color: '#fff' },
  title: { fontSize: 18, fontWeight: '700' },
  mini: { color: '#94a3b8' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

