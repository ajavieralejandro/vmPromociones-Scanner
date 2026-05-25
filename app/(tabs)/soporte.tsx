import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../../components/ui/app-header';
import { EmptyState } from '../../components/ui/empty-state';

export default function SoporteScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppHeader
          title="Contacto y soporte"
          subtitle="Asistencia para operación de beneficios"
        />

        <EmptyState
          icon="help-circle"
          title="Canal de soporte operativo"
          description="Para soporte operativo contactá al equipo de Surtek."
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
