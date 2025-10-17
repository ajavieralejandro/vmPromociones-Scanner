// debug/ServerLogger.js
import { useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// ---- Store simple con subscriptores ----
const listeners = new Set();
let lastLog = null;
export const subscribeLogs = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const publish = () => listeners.forEach((fn) => fn(lastLog));

// Redactar campos sensibles en body/JSON
const SENSITIVE_KEYS = ["password","clave","token","authorization","auth","secret","api_key","apikey"];
function redactDeep(value) {
  try {
    if (value && typeof value === "object") {
      const out = Array.isArray(value) ? [] : {};
      Object.entries(value).forEach(([k, v]) => {
        if (SENSITIVE_KEYS.some(s => k.toLowerCase().includes(s))) {
          out[k] = "***redacted***";
        } else {
          out[k] = redactDeep(v);
        }
      });
      return out;
    }
    return value;
  } catch {
    return value;
  }
}

// Convierte headers del Response a objeto simple
async function headersToObject(headers) {
  const obj = {};
  try {
    // RN soporta .forEach en Headers
    headers.forEach((v, k) => { obj[k] = v; });
  } catch {}
  return obj;
}

// Devuelve fuente monoespaciada por plataforma
const mono = Platform.select({ ios: "Menlo", android: "monospace", default: undefined });

// ---- Wrapper de fetch que guarda logs ----
/**
 * apiFetch(url, options, meta)
 * - meta.origin: string para identificar desde dónde llamaste (ej: "validateQR")
 * - meta.notes : notas libres (ej: "DetalleCuponScreen")
 */
export async function apiFetch(url, options = {}, meta = {}) {
  const startedAt = Date.now();
  const method = (options.method || "GET").toUpperCase();

  // Clon seguro del body para log (y redactado)
  let requestBodyRaw = options.body;
  let requestBodyParsed = null;
  try {
    if (typeof requestBodyRaw === "string") requestBodyParsed = JSON.parse(requestBodyRaw);
    else if (requestBodyRaw && typeof requestBodyRaw === "object") requestBodyParsed = requestBodyRaw;
  } catch {}
  const requestBodyRedacted = redactDeep(requestBodyParsed ?? requestBodyRaw);

  let response, text = null, json = null, headersObj = {};
  let error = null;

  try {
    response = await fetch(url, options);
    try { headersObj = await headersToObject(response.headers); } catch {}
    try { text = await response.text(); } catch (e) { text = String(e?.message || e); }
    try { json = JSON.parse(text); } catch { /* puede no ser JSON */ }
  } catch (e) {
    error = e?.message || String(e);
  }

  const endedAt = Date.now();

  // Armar y publicar log
  lastLog = {
    ts: new Date().toISOString(),
    origin: meta.origin || null,
    notes: meta.notes || null,
    url, method,
    requestHeaders: options.headers || null,
    requestBody: requestBodyRedacted || null,
    status: response?.status ?? null,
    ok: response?.ok ?? false,
    responseHeaders: headersObj,
    responseText: text,
    responseJson: json,
    error,
    durationMs: endedAt - startedAt,
  };
  publish();

  // Devolver respuesta “cómoda”
  if (error) {
    return { ok: false, status: null, json: null, text: null, error };
  }
  return {
    ok: !!response?.ok,
    status: response?.status ?? null,
    json,
    text,
    headers: headersObj,
    raw: response,
  };
}

// ---- Cartel / Overlay de depuración ----
export function DebugBanner({ autoOpenOnError = true }) {
  const [log, setLog] = useState(lastLog);
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    return subscribeLogs((l) => {
      setLog(l);
      if (autoOpenOnError && l && (!l.ok || /expirad/i.test(l?.responseText || "") || /sin\s*claim/i.test(l?.responseText || ""))) {
        setVisible(true);
        setExpanded(true);
      }
    });
  }, [autoOpenOnError]);

  if (!log || !visible) return null;

  const statusColor = log.ok ? "#116611" : "#a40000";
  const summary = [
    log.method, " ", log.url,
    "  •  ", (log.status ?? "ERR"),
    "  •  ", log.durationMs, "ms",
    log.origin ? `  •  ${log.origin}` : "",
  ].join("");

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={[styles.banner, !log.ok ? styles.bannerError : styles.bannerOk]}>
        <TouchableOpacity onPress={() => setExpanded(!expanded)} style={{ flex: 1 }}>
          <Text style={[styles.summary, { color: statusColor }]} numberOfLines={2}>
            {summary}
          </Text>
          {!expanded ? (
            <Text style={styles.hint} numberOfLines={1}>
              Toca para ver detalles • {log.ok ? "OK" : "ERROR / Revisar"} {/expirad/i.test(log?.responseText || "") ? "• “expirado” detectado" : ""} {/sin\s*claim/i.test(log?.responseText || "") ? "• “sin claim” detectado" : ""}
            </Text>
          ) : null}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setVisible(false)} style={styles.btn}>
          <Text style={styles.btnText}>✕</Text>
        </TouchableOpacity>
      </View>

      {expanded && (
        <View style={styles.panel}>
          <ScrollView contentContainerStyle={{ padding: 12 }}>
            <Text style={styles.section}>Resumen</Text>
            <Text style={styles.code}>
              {JSON.stringify(
                {
                  ts: log.ts,
                  origin: log.origin,
                  notes: log.notes,
                  method: log.method,
                  url: log.url,
                  status: log.status,
                  ok: log.ok,
                  durationMs: log.durationMs,
                },
                null,
                2
              )}
            </Text>

            <Text style={styles.section}>Request headers</Text>
            <Text style={styles.code}>{JSON.stringify(log.requestHeaders, null, 2)}</Text>

            <Text style={styles.section}>Request body</Text>
            <Text style={styles.code}>{typeof log.requestBody === "string" ? log.requestBody : JSON.stringify(log.requestBody, null, 2)}</Text>

            <Text style={styles.section}>Response headers</Text>
            <Text style={styles.code}>{JSON.stringify(log.responseHeaders, null, 2)}</Text>

            <Text style={styles.section}>Response JSON</Text>
            <Text style={styles.code}>{log.responseJson ? JSON.stringify(log.responseJson, null, 2) : "—"}</Text>

            <Text style={styles.section}>Response texto crudo</Text>
            <Text style={styles.code}>{String(log.responseText ?? "—")}</Text>

            {log.error ? (
              <>
                <Text style={styles.section}>Error</Text>
                <Text style={[styles.code, { color: "#a40000" }]}>{String(log.error)}</Text>
              </>
            ) : null}
          </ScrollView>
          <View style={styles.bottomRow}>
            <TouchableOpacity onPress={() => setExpanded(false)} style={styles.bottomBtn}>
              <Text style={styles.bottomBtnText}>Ocultar detalles</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    zIndex: 9999,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#00000022",
  },
  bannerOk: { backgroundColor: "#e7ffe9" },
  bannerError: { backgroundColor: "#ffefef" },
  summary: {
    fontWeight: "700",
  },
  hint: {
    marginTop: 2,
    fontSize: 12,
    opacity: 0.8,
  },
  btn: { padding: 6 },
  btnText: { fontSize: 18 },
  panel: {
    maxHeight: 380,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#00000022",
  },
  section: {
    marginTop: 12,
    marginBottom: 6,
    fontWeight: "700",
  },
  code: {
    fontFamily: mono,
    fontSize: 12,
    backgroundColor: "#f6f8fa",
    padding: 8,
    borderRadius: 6,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 8,
    borderTopWidth: 1,
    borderColor: "#00000011",
    backgroundColor: "#fafafa",
  },
  bottomBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#222",
    borderRadius: 8,
  },
  bottomBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
});
