import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      {/* Grupo de tabs */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="confirmar-canje" options={{ headerShown: false }} />
      {/* Pantalla fuera de tabs */}
      <Stack.Screen name="resultado-canje" options={{ headerShown: false }} />
    </Stack>
  );
}
