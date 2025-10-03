import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../firebaseConfig";

const PSEUDO_KEY = "user_pseudo_v1";
const INBOX_KEY = "inbox_v1"; 

async function pushMessage(title: string, body: string) {
  try {
    const raw = await AsyncStorage.getItem(INBOX_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.unshift({
      id: String(Date.now()),
      title,
      body,
      ts: Date.now(),
      read: false,
      lock: false, 
    });
    await AsyncStorage.setItem(INBOX_KEY, JSON.stringify(arr));
  } catch (e) {
    console.error("Erreur lors de l'ajout du message de bienvenue:", e);
  }
}

export default function Welcome() {
  const [pseudo, setPseudo] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkExistingUser = async () => {
      const existing = await AsyncStorage.getItem(PSEUDO_KEY);
      if (existing) {
        router.replace("/(tabs)");
      } else {
        setLoading(false);
      }
    };
    checkExistingUser();
  }, [router]);

  const savePseudo = async () => {
    const clean = pseudo.trim().toLowerCase();

    if (!clean) {
      Alert.alert("Erreur", "Le pseudo ne peut pas être vide.");
      return;
    }
    if (!/^[a-z0-9]+$/i.test(clean)) {
      Alert.alert("Erreur", "Le pseudo ne doit contenir que des lettres et des chiffres.");
      return;
    }

    setIsSaving(true);

    try {
      const userRef = doc(db, "users", clean);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        Alert.alert("Pseudo indisponible", "Ce pseudo est déjà utilisé. Veuillez en choisir un autre.");
        setIsSaving(false);
        return;
      }

      await AsyncStorage.setItem(PSEUDO_KEY, clean);
      await setDoc(userRef, {
        pseudo: clean,
        createdAt: new Date().toISOString(),
        credits: 10,
      });

      await pushMessage(
        "Bienvenue sur WinaStream !",
        `Merci de nous avoir rejoints, ${clean} ! Pour te souhaiter la bienvenue, nous t'offrons 10 crédits gratuits. Bonne chance !`
      );

      router.replace("/(tabs)");

    } catch (err) {
      console.error("Erreur de sauvegarde:", err);
      Alert.alert("Erreur", "Une erreur de connexion est survenue. Réessaie plus tard.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>🎬 Bienvenue sur WinaStream</Text>
        <Text style={styles.subtitle}>
          L'application qui te fait gagner des abonnements sur tes plateformes VOD préférées : Netflix, Prime Video, Disney+...
          {"\n"}100% anonyme et gratuit !
        </Text>
        
        <TextInput
          style={styles.input}
          placeholder="Choisis ton pseudo..."
          placeholderTextColor="#6c757d"
          value={pseudo}
          onChangeText={setPseudo}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.btn} onPress={savePseudo} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Continuer</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b1220" },
  container: { flex: 1, justifyContent: "center", padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0b1220" },
  title: { color: "white", fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 12 },
  subtitle: { color: "#adb5bd", fontSize: 16, textAlign: "center", marginBottom: 30, lineHeight: 22 },
  input: {
    backgroundColor: "#1c2536",
    color: "white",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#343a40",
    textAlign: 'center',
  },
  btn: {
    backgroundColor: "#007bff",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    height: 50,
    justifyContent: 'center',
  },
  btnText: { color: "white", fontWeight: "bold", fontSize: 16 },
});