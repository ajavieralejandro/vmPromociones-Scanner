import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../../components/ui/app-header';
import { EmptyState } from '../../components/ui/empty-state';

export default function EstadisticasScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppHeader
          title="Estadísticas"
          subtitle="Métricas de validación del comercio"
        />
        <EmptyState
          icon="bar-chart"
          title="Estadísticas en preparación"
          description="Próximamente podrás consultar validaciones, métricas y actividad del comercio."
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
