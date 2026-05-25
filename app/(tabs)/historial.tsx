import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../../components/ui/app-header';
import { EmptyState } from '../../components/ui/empty-state';

export default function HistorialScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppHeader
          title="Historial"
          subtitle="Registro de validaciones del comercio"
        />

        <EmptyState
          icon="time"
          title="Sin registros disponibles"
          description="Cuando se habilite el historial, verás aquí las validaciones y su estado."
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
