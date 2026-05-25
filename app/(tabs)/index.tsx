import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../../components/ui/app-header';
import { DashboardActionCard } from '../../components/ui/dashboard-action-card';
import { InfoCard } from '../../components/ui/info-card';
import { StatusBadge } from '../../components/ui/status-badge';

export default function Home() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppHeader
          title="Surtek Comercios"
          subtitle="Gestión y validación de beneficios"
        />

        <InfoCard
          title="Comercio adherido"
          subtitle="Punto de validación habilitado"
          rightSlot={<StatusBadge label="Sesión activa" tone="success" />}
        />

        <DashboardActionCard
          title="Escanear QR"
          description="Validá beneficios de forma rápida y segura desde la cámara."
          icon="qr-code"
          variant="primary"
          onPress={() => router.push('/(tabs)/scanner')}
        />

        <View style={styles.grid}>
          <DashboardActionCard
            title="Estadísticas"
            description="Consultá actividad y métricas del comercio."
            icon="bar-chart"
            onPress={() => router.push('/(tabs)/estadisticas')}
          />
          <DashboardActionCard
            title="Identificar comercio"
            description="Revisá la información del comercio asociado."
            icon="business"
            onPress={() => router.push('/(tabs)/comercio')}
          />
          <DashboardActionCard
            title="Historial"
            description="Accedé al registro de validaciones recientes."
            icon="time"
            onPress={() => router.push('/(tabs)/historial')}
          />
          <DashboardActionCard
            title="Contacto / Soporte"
            description="Canal operativo para asistencia de Surtek."
            icon="help-circle"
            onPress={() => router.push('/(tabs)/soporte')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
    paddingBottom: 28,
    gap: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});
