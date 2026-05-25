import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type InfoCardProps = {
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
};

export function InfoCard({ title, subtitle, rightSlot }: InfoCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightSlot ? <View style={styles.right}>{rightSlot}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderColor: '#e2e8f0',
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    color: '#64748b',
    fontSize: 13,
  },
  right: {
    alignItems: 'flex-end',
  },
});
