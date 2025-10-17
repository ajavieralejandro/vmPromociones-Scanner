import { StyleSheet, Text, View } from 'react-native';

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>VM Promos</Text>
      <Text>Usá la pestaña “Scanner” para canjear cupones.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700' },
});
