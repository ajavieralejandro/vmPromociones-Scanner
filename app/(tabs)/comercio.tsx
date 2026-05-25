import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../../components/ui/app-header';
import { InfoCard } from '../../components/ui/info-card';
import { StatusBadge } from '../../components/ui/status-badge';

export default function ComercioScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppHeader
          title="Identificar comercio"
          subtitle="Información del comercio asociado"
        />

        <InfoCard
          title="Comercio adherido"
          subtitle="No hay datos extendidos disponibles en esta etapa."
          rightSlot={<StatusBadge label="Comercio habilitado" tone="success" />}
        />
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
    gap: 12,
  },
});
