import { useLocalSearchParams, useRouter } from 'expo-router';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'https://surtekbb.com';
const CLAIM_URL  = (code: string) => `${API_BASE}/api/v1/promotions/qrs/${encodeURIComponent(code)}/claim`;
const REDEEM_URL = (code: string) => `${API_BASE}/api/v1/promotions/qrs/${encodeURIComponent(code)}/redeem`;
const INFO_URL   = (code: string) => `${API_BASE}/api/v1/promotions/qrs/${encodeURIComponent(code)}`;

const HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

type QrInfo = {
  code?: string;
  is_used?: boolean;
  expires_at?: string | null;
  status?: string;
  promotion?: any;
  commerce?: any;
  [k: string]: any;
};

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch {}
  return { ok: res.ok, status: res.status, json, text };
}

export default function ConfirmarCanje() {
  const router = useRouter();

  // ⬅️ LEEMOS code, dni, external_user_id DESDE EL QR
  const {
    code = '',
    dni,
    external_user_id,
  } = useLocalSearchParams<{
    code?: string;
    dni?: string;
    external_user_id?: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<QrInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [debug, setDebug] = useState<string | null>(null);

  // ============================================
  // 1) OBTENER INFO DEL QR
  // ============================================
  const fetchInfo = useCallback(async () => {
    if (!code) {
      setError('Código de QR inválido.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      console.log('[CONFIRMAR CANJE PARAMS]', { code, dni, external_user_id });

      const res = await fetchJson(
        INFO_URL(code as string),
        { method: 'GET', headers: HEADERS }
      );

      console.log('[QR INFO RES]', res.status, res.json);

      setDebug(JSON.stringify({
        step: 'info',
        params: { code, dni, external_user_id },
        res
      }, null, 2));

      if (!res.ok) {
        const msg = (res.json && (res.json.message || res.json.error)) || res.text;
        setError(msg || 'No se pudo obtener el detalle del QR.');
        setInfo(null);
      } else {
        setInfo(res.json as QrInfo);
      }
    } catch (e: any) {
      console.log('[QR INFO ERROR]', e);
      setError(e?.message ?? 'Error de conexión.');
      setInfo(null);
    } finally {
      setLoading(false);
    }
  }, [code, dni, external_user_id]);

  useEffect(() => { fetchInfo(); }, [fetchInfo]);

  // ============================================
  // 2) NAVEGAR A RESULTADO
  // ============================================
  const goResult = useCallback(
    (status: 'ok'|'error', title: string, message: string, details?: any) => {
      router.replace({
        pathname: '/resultado-canje',
        params: {
          status,
          title,
          message,
          details: typeof details === 'string'
            ? details
            : JSON.stringify(details ?? {}),
        }
      });
    },
    [router]
  );

  // ============================================
  // 3) CONFIRMAR CANJE
  // ============================================
  const confirmRedeem = useCallback(async () => {
    if (!code) return;
    setSubmitting(true);

    try {
      // ========= CLAIM =========
      const claimBody = { device: `scanner-${Platform.OS}` };

      const claimRes = await fetchJson(
        CLAIM_URL(code as string),
        { method: 'POST', headers: HEADERS, body: JSON.stringify(claimBody) }
      );

      console.log('[QR CLAIM RES]', claimRes.status, claimRes.json);

      setDebug(JSON.stringify({
        step: 'claim',
        params: { code, dni, external_user_id },
        bodySent: claimBody,
        res: claimRes
      }, null, 2));

      if (!claimRes.ok) {
        const msg = (claimRes.json && (claimRes.json.message || claimRes.json.error)) || claimRes.text;
        if (claimRes.status === 404) return goResult('error','QR no encontrado', msg || '');
        if (claimRes.status === 409) return goResult('error','QR ya utilizado', msg || '');
        return goResult('error','No se pudo reservar el QR', msg || '');
      }

      // ========= REDEEM =========
      const redeemBody: any = { source: 'scanner' };

      // ⬅️ ENVIAMOS LO QUE VENÍA EN EL QR
      if (dni) redeemBody.dni = String(dni);
      if (external_user_id) redeemBody.external_user_id = String(external_user_id);

      console.log('[QR REDEEM BODY]', redeemBody);

      const redeemRes = await fetchJson(
        REDEEM_URL(code as string),
        { method: 'POST', headers: HEADERS, body: JSON.stringify(redeemBody) }
      );

      console.log('[QR REDEEM RES]', redeemRes.status, redeemRes.json);

      setDebug(JSON.stringify({
        step: 'redeem',
        params: { code, dni, external_user_id },
        bodySent: redeemBody,
        res: redeemRes
      }, null, 2));

      if (!redeemRes.ok) {
        const msg = (redeemRes.json && (redeemRes.json.message || redeemRes.json.error)) || redeemRes.text;
        if (redeemRes.status === 404) return goResult('error','QR no encontrado', msg || '');
        if (redeemRes.status === 409) return goResult('error','QR ya utilizado', msg || '');
        if (redeemRes.status === 422) return goResult('error','Error de validación', msg || '');
        return goResult('error','Error al canjear', msg || '');
      }

      const body = redeemRes.json ?? {};
      const msgOk = body.message || 'El cupón fue canjeado correctamente.';

      goResult('ok', 'Canje exitoso', msgOk, body);
    } catch (err: any) {
      console.log('[QR REDEEM ERROR]', err);
      setDebug(JSON.stringify({
        step: 'exception',
        error: String(err),
        params: { code, dni, external_user_id },
      }, null, 2));
      goResult('error', 'Sin conexión', err?.message ?? 'No pudimos contactar el servidor.');
    } finally {
      setSubmitting(false);
    }
  }, [code, dni, external_user_id, goResult]);

  // ============================================
  // 4) UI
  // ============================================
  const canConfirm =
    !!code &&
    !submitting &&
    (!info?.status || ['new','available','claimed'].includes(String(info.status).toLowerCase()));

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>

        <Text style={styles.headerTitle}>Confirmar canje</Text>
        <Text style={styles.headerSub}>Código: {String(code)}</Text>

        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator />
            <Text style={styles.muted}>Cargando datos…</Text>
          </View>
        ) : error ? (
          <View style={[styles.card, styles.err]}>
            <Text style={styles.title}>No se pudo obtener el detalle</Text>
            <Text style={styles.msg}>{error}</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.title}>{info?.promotion?.title ?? 'Promoción'}</Text>
            <Text style={styles.msg}>Comercio: {info?.commerce?.name ?? '—'}</Text>
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
            <Text style={styles.btnPrimaryText}>
              {submitting ? 'Canjeando…' : 'Confirmar canje'}
            </Text>
          </TouchableOpacity>
        </View>

        {debug && (
          <View style={styles.debugBox}>
            <Text style={styles.debugTitle}>DEBUG API</Text>
            <Text style={styles.debugText}>{debug}</Text>
          </View>
        )}

      </View>
    </ScrollView>
  );
}

// ============================================
// ESTILOS
// ============================================
const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#0b1220' },
  scrollContent: { padding: 16 },
  container: { flex: 1 },
  headerTitle: { color: '#e2e8f0', fontSize: 20, fontWeight: '900' },
  headerSub: { color: '#94a3b8', marginBottom: 12 },

  loaderBox: { padding: 16, borderRadius: 14, backgroundColor: '#0f172a', alignItems: 'center' },
  muted: { color: '#94a3b8', marginTop: 6 },

  card: { padding: 16, borderRadius: 14, backgroundColor: '#0f172a', marginBottom: 12 },
  title: { color: '#e2e8f0', fontSize: 18, fontWeight: '900', marginBottom: 6 },
  msg: { color: '#cbd5e1', fontSize: 14 },

  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btnPrimary: { flex: 1, backgroundColor: '#16a34a', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontWeight: '900' },
  btnDisabled: { opacity: 0.5 },

  btnGhost: { flex: 1, borderColor: '#334155', borderWidth: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnGhostText: { color: '#cbd5e1', fontWeight: '900' },

  err: { backgroundColor: '#3a0913' },

  debugBox: { backgroundColor: '#020617', padding: 12, borderRadius: 8, marginTop: 16 },
  debugTitle: { color: '#38bdf8', fontWeight: '900', marginBottom: 6 },
  debugText: { color: '#e5e7eb', fontFamily: 'monospace', fontSize: 12 },
});
