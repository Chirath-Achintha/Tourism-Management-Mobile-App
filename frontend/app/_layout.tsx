import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      
      <Stack screenOptions={{ headerShown: false }}>

        <Stack.Screen 
          name="index" 
          options={{ animation: 'fade' }} 
        />

        <Stack.Screen 
          name="login" 
          options={{ animation: 'slide_from_right' }} 
        />

        <Stack.Screen 
          name="register" 
          options={{ animation: 'slide_from_right' }} 
        />

        <Stack.Screen 
          name="(tabs)" 
          options={{ animation: 'fade' }} 
        />

        <Stack.Screen 
          name="modal" 
          options={{ presentation: 'modal' }} 
        />

      </Stack>

      <StatusBar style="light" />
      
    </ThemeProvider>
  );
}