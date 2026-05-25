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
    setLoading(true);

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
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <Center>
          <View style={styles.centerCard}>
            <ActivityIndicator color="#0f62fe" />
            <Text style={styles.centerTitle}>Preparando cámara</Text>
            <Text style={styles.centerSubtitle}>Solicitando permisos del dispositivo.</Text>
          </View>
        </Center>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <Center>
          <View style={styles.centerCard}>
            <Text style={styles.centerTitle}>Se requiere acceso a la cámara</Text>
            <Text style={styles.centerSubtitle}>
              Permití el acceso para escanear y validar códigos QR.
            </Text>
            <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
              <Text style={styles.permissionBtnText}>Solicitar permiso</Text>
            </TouchableOpacity>
          </View>
        </Center>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          enableTorch={flash}
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

        <View style={styles.topInfo} pointerEvents="none">
          <Text style={styles.topInfoTitle}>Escanear QR</Text>
          <Text style={styles.topInfoSubtitle}>Apuntá al código del cliente para validar el beneficio.</Text>
        </View>

        <View style={styles.centerOverlay} pointerEvents="none">
          <View style={styles.frame} />
          <Text style={styles.centerText}>Alineá el QR dentro del marco</Text>
        </View>

        <View style={styles.bottomArea} pointerEvents="box-none">
          <View style={styles.statusContainer}>
            {loading ? (
              <View style={styles.statusRow}>
                <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.statusText}>Procesando lectura…</Text>
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
  topInfo: {
    position: 'absolute',
    top: 64,
    left: 16,
    right: 16,
    zIndex: 8,
    backgroundColor: 'rgba(15,23,42,0.72)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  topInfoTitle: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  topInfoSubtitle: {
    color: '#cbd5e1',
    fontSize: 13,
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
    borderColor: '#bfdbfe',
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
    backgroundColor: 'rgba(15,23,42,0.78)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderColor: 'rgba(191,219,254,0.5)',
    borderWidth: 1,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusText: { color: '#fff' },
  centerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 18,
    width: '88%',
    gap: 8,
    alignItems: 'center',
  },
  centerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  centerSubtitle: {
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionBtn: {
    marginTop: 8,
    backgroundColor: '#0f62fe',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  permissionBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

