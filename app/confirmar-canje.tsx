import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { apiFetch, DebugBanner } from './debug/ServerLogger';

// === CONFIG API ===
const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'https://surtekbb.com';
const CLAIM_URL  = (code: string) => `${API_BASE}/api/v1/promotions/qrs/${encodeURIComponent(code)}/claim`;
const REDEEM_URL = (code: string) => `${API_BASE}/api/v1/promotions/qrs/${encodeURIComponent(code)}/redeem`;
const INFO_URL   = (code: string) => `${API_BASE}/api/v1/promotions/qrs/${encodeURIComponent(code)}`; // GET sugerido

const HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

type QrInfo = {
  code?: string;
  status?: string;          // e.g. 'new' | 'claimed' | 'redeemed' | 'expired'
  expires_at?: string | null;
  promotion?: {
    id?: number | string;
    name?: string;
    title?: string;
    points?: number;
    value?: number;
    starts_at?: string | null;
    ends_at?: string | null;
  };
  commerce?: {
    id?: number | string;
    name?: string;
  };
  [k: string]: any;
};

export default function ConfirmarCanje() {
  const router = useRouter();
  const { code = '' } = useLocalSearchParams<{ code?: string }>();

  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<QrInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchInfo = useCallback(async () => {
    if (!code) {
      setError('Código de QR inválido.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(
        INFO_URL(code as string),
        { method: 'GET', headers: HEADERS },
        { origin: 'qrInfo', notes: `lookup code=${code}` }
      );
      if (!res.ok) {
        const msg = (res.json && (res.json.message || res.json.error)) || res.text || `HTTP ${res.status}`;
        setError(msg || 'No se pudo obtener el detalle del QR.');
        setInfo(null);
      } else {
        setInfo(res.json as QrInfo);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Error de conexión.');
      setInfo(null);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => { fetchInfo(); }, [fetchInfo]);

  const goResult = useCallback(
    (status: 'ok'|'error', title: string, message: string, details?: any) => {
      const det = typeof details === 'string' ? details : JSON.stringify(details ?? {});
      router.replace({ pathname: '/resultado-canje', params: { status, title, message, details: det } });
    },
    [router]
  );

  // 1) Claim → 2) Redeem
  const confirmRedeem = useCallback(async () => {
    if (!code) return;
    setSubmitting(true);
    try {
      // CLAIM
      const claimRes = await apiFetch(
        CLAIM_URL(code as string),
        { method: 'POST', headers: HEADERS, body: JSON.stringify({ device: `scanner-${Platform.OS}` }) },
        { origin: 'claimByCode', notes: `confirm claim=${code}` }
      );
      if (!claimRes.ok) {
        const baseMsg = (claimRes.json && (claimRes.json.message || claimRes.json.error)) || claimRes.text || '';
        if (claimRes.status === 404) return goResult('error', 'QR no encontrado', baseMsg || 'No existe ese código.', { status: claimRes.status, body: claimRes.json ?? claimRes.text });
        if (claimRes.status === 409) return goResult('error', 'QR ya utilizado', baseMsg || 'Este QR fue canjeado previamente.', { status: claimRes.status, body: claimRes.json ?? claimRes.text });
        return goResult('error', 'No se pudo reservar el QR', baseMsg || 'Intentá nuevamente.', { status: claimRes.status, body: claimRes.json ?? claimRes.text });
      }

      // REDEEM
      const redeemRes = await apiFetch(
        REDEEM_URL(code as string),
        { method: 'POST', headers: HEADERS, body: JSON.stringify({ source: 'scanner' }) },
        { origin: 'redeemQR', notes: `confirm redeem=${code}` }
      );
      if (!redeemRes.ok) {
        const baseMsg = (redeemRes.json && (redeemRes.json.message || redeemRes.json.error)) || redeemRes.text || '';
        if (redeemRes.status === 404) return goResult('error', 'QR no encontrado', baseMsg || 'No existe ese código.', { status: redeemRes.status, body: redeemRes.json ?? redeemRes.text });
        if (redeemRes.status === 409) return goResult('error', 'QR ya utilizado', baseMsg || 'Este QR fue canjeado previamente.', { status: redeemRes.status, body: redeemRes.json ?? redeemRes.text });
        if (redeemRes.status === 422) return goResult('error', 'QR expirado o sin claim', baseMsg || 'Volvé a reclamarlo e intentá de nuevo.', { status: redeemRes.status, body: redeemRes.json ?? redeemRes.text });
        return goResult('error', 'Error de canje', baseMsg || `HTTP ${redeemRes.status ?? 'ERR'}`, { status: redeemRes.status, body: redeemRes.json ?? redeemRes.text });
      }

      const body = redeemRes.json ?? {};
      const msgOk = body.message || 'El cupón fue marcado como usado.';
      goResult('ok', 'Canje exitoso', msgOk, body);
    } catch (err: any) {
      goResult('error', 'Sin conexión', err?.message ?? 'No pudimos contactar el servidor.', { error: String(err) });
    } finally {
      setSubmitting(false);
    }
  }, [code, goResult]);

  const canConfirm =
    !!code &&
    !submitting &&
    (!info?.status || ['new', 'available', 'claimed'].includes(String(info.status).toLowerCase()));

  return (
    <View style={styles.container}>
      {__DEV__ && <DebugBanner autoOpenOnError />}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Confirmar canje</Text>
        <Text style={styles.headerSub}>Código: <Text style={styles.mono}>{String(code)}</Text></Text>
      </View>

      {loading ? (
        <View style={styles.loaderBox}><ActivityIndicator /><Text style={styles.muted}>Cargando datos…</Text></View>
      ) : error ? (
        <View style={[styles.card, styles.err]}>
          <Text style={[styles.title, styles.errText]}>No se pudo obtener el detalle</Text>
          <Text style={[styles.msg, styles.errText]}>{error}</Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.title}>{info?.promotion?.title || info?.promotion?.name || 'Promoción'}</Text>
          <Text style={styles.msg}>
            Comercio: <Text style={styles.bold}>{info?.commerce?.name ?? '—'}</Text>
          </Text>

          <View style={styles.kvBox}>
            <KV k="Estado" v={info?.status ?? '—'} />
            {info?.promotion?.points != null && <KV k="Puntos" v={String(info.promotion.points)} />}
            {info?.promotion?.value != null && <KV k="Valor" v={`$ ${info.promotion.value}`} />}
            {info?.expires_at && <KV k="Vence" v={String(info.expires_at)} />}
          </View>

          {/* Dump opcional por si tu API trae otras claves */}
          <ScrollView style={styles.detailsBox}>
            <Text style={styles.detailsTitle}>Detalle</Text>
            <Text style={styles.detailsMono}>{JSON.stringify(info, null, 2)}</Text>
          </ScrollView>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/scanner')}
          style={styles.btnGhost}
          disabled={submitting}
        >
          <Text style={styles.btnGhostText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={confirmRedeem}
          style={[styles.btnPrimary, !canConfirm && styles.btnDisabled]}
          disabled={!canConfirm}
        >
          <Text style={styles.btnPrimaryText}>{submitting ? 'Canjeando…' : 'Confirmar canje'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.kv}>
      <Text style={styles.kvK}>{k}</Text>
      <Text style={styles.kvV}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#0b1220' },
  header: { marginBottom: 10 },
  headerTitle: { color: '#e2e8f0', fontSize: 18, fontWeight: '800' },
  headerSub: { color: '#94a3b8', marginTop: 2 },
  mono: { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }), color: '#cbd5e1' },

  loaderBox: { padding: 16, borderRadius: 14, backgroundColor: '#0f172a', alignItems: 'center' },
  muted: { color: '#94a3b8', marginTop: 8 },

  card: { padding: 16, borderRadius: 14, backgroundColor: '#0f172a', marginBottom: 12 },
  title: { color: '#e2e8f0', fontSize: 18, fontWeight: '800', marginBottom: 6 },
  msg: { color: '#cbd5e1', fontSize: 14, marginBottom: 8 },
  bold: { fontWeight: '800', color: '#e2e8f0' },

  kvBox: { marginTop: 6, marginBottom: 10, gap: 8 },
  kv: { flexDirection: 'row', justifyContent: 'space-between' },
  kvK: { color: '#94a3b8' },
  kvV: { color: '#e2e8f0', fontWeight: '700' },

  detailsBox: { maxHeight: 220, backgroundColor: '#0b1220', borderRadius: 12, padding: 12, marginTop: 6 },
  detailsTitle: { color: '#cbd5e1', fontWeight: '700', marginBottom: 6 },
  detailsMono: { color: '#e2e8f0', fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }), fontSize: 12 },

  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btnPrimary: { flex: 1, backgroundColor: '#16a34a', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontWeight: '800' },
  btnDisabled: { opacity: 0.6 },
  btnGhost: { flex: 1, backgroundColor: 'transparent', paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  btnGhostText: { color: '#cbd5e1', fontWeight: '800' },

  err: { backgroundColor: '#3a0913' },
  errText: { color: '#ffc7d1' },
});
