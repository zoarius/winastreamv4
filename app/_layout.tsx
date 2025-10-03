import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { UnreadProvider } from '../context/UnreadContext';

SplashScreen.preventAutoHideAsync();

const PSEUDO_KEY = "user_pseudo_v1";

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'SpaceMono': require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const router = useRouter();
  // CORRECTION ICI : Le type est maintenant '/(tabs)' avec le slash
  const [initialRoute, setInitialRoute] = useState<'/(tabs)' | '/welcome' | null>(null);

  useEffect(() => {
    const checkPseudo = async () => {
      try {
        const saved = await AsyncStorage.getItem(PSEUDO_KEY);
        if (saved) {
          setInitialRoute('/(tabs)');
        } else {
          setInitialRoute('/welcome');
        }
      } catch (e) {
        setInitialRoute('/welcome');
      }
    };
    checkPseudo();
  }, []);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && initialRoute) {
      SplashScreen.hideAsync();
      router.replace(initialRoute);
    }
  }, [loaded, initialRoute, router]);

  if (!loaded || !initialRoute) {
    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0b1220" }}>
            <ActivityIndicator size="large" color="#2e72ff" />
        </View>
    );
  }

  return (
    <UnreadProvider>
        <Stack>
            <Stack.Screen name="welcome" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
    </UnreadProvider>
  );
}