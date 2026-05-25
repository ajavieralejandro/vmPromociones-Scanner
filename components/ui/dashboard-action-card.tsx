import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type DashboardActionCardProps = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: 'default' | 'primary';
};

export function DashboardActionCard({
  title,
  description,
  icon,
  onPress,
  variant = 'default',
}: DashboardActionCardProps) {
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.card, isPrimary ? styles.primaryCard : styles.defaultCard]}
      activeOpacity={0.9}>
      <View style={[styles.iconWrap, isPrimary ? styles.iconWrapPrimary : styles.iconWrapDefault]}>
        <Ionicons name={icon} size={20} color={isPrimary ? '#ffffff' : '#0f62fe'} />
      </View>

      <View style={styles.textWrap}>
        <Text style={[styles.title, isPrimary ? styles.titlePrimary : styles.titleDefault]}>{title}</Text>
        <Text
          style={[styles.description, isPrimary ? styles.descPrimary : styles.descDefault]}
          numberOfLines={2}>
          {description}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={isPrimary ? '#bfdbfe' : '#64748b'}
        style={styles.chevron}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 96,
    flexBasis: '48%',
    flexGrow: 1,
  },
  defaultCard: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  primaryCard: {
    backgroundColor: '#0f62fe',
    borderColor: '#0f62fe',
    flexBasis: '100%',
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapDefault: {
    backgroundColor: '#eff6ff',
  },
  iconWrapPrimary: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 3,
  },
  titleDefault: {
    color: '#0f172a',
  },
  titlePrimary: {
    color: '#ffffff',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  descDefault: {
    color: '#64748b',
  },
  descPrimary: {
    color: '#dbeafe',
  },
  chevron: {
    marginLeft: 2,
  },
});
