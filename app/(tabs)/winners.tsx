import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebaseConfig";

type PlatformKey =
  | "disney"
  | "prime"
  | "paramount"
  | "netflix"
  | "appletv"
  | "testwin";

const PLATFORM_LABEL: Record<PlatformKey, string> = {
  disney: "Disney+",
  prime: "Prime Video",
  paramount: "Paramount+",
  netflix: "Netflix",
  appletv: "Apple TV+",
  testwin: "Jeu de Test", // MODIFICATION ICI
};

// Fonction pour obtenir le drapeau du pays
const getCountryFlag = (countryCode: string) => {
    switch (countryCode.toUpperCase()) {
        case 'FR': return '🇫🇷';
        case 'BE': return '🇧🇪';
        case 'CH': return '🇨🇭';
        // Ajoute d'autres pays au besoin
        default: return '🏳️';
    }
};

type Winner = {
  id: string;
  pseudo: string;
  platform: PlatformKey;
  months: number;
  country: string;
  dateISO: string;
};

const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const toISO = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export async function recordWinner(entry: {
  pseudo: string;
  platform: PlatformKey;
  months: number;
  country: string;
}) {
  const winnerEntry = {
    ...entry,
    dateISO: toISO(new Date()),
  };

  try {
    await addDoc(collection(db, "winners"), winnerEntry);
  } catch (error) {
    console.error("Erreur d'enregistrement sur Firestore: ", error);
  }
}

export default function Winners() {
  const [items, setItems] = useState<Winner[]>([]);

  useEffect(() => {
    const winnersRef = collection(db, "winners");
    const q = query(winnersRef, orderBy("dateISO", "desc"), limit(20));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedWinners: Winner[] = [];
      snapshot.forEach((doc) => {
        loadedWinners.push({
          id: doc.id,
          ...(doc.data() as Omit<Winner, "id">),
        });
      });
      setItems(loadedWinners);
    });

    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={items}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={styles.winnerInfo}>
                <Text style={styles.pseudo}>{getCountryFlag(item.country)}</Text>
                <Text style={styles.pseudo}> {item.pseudo}</Text>
              </View>
              <Text style={styles.date}>{item.dateISO}</Text>
            </View>
            <Text style={styles.winLine}>
              🎉 A gagné un abonnement <Text style={styles.strong}>{PLATFORM_LABEL[item.platform]}</Text> !
            </Text>
          </View>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={() => (
          <Text style={styles.title}>🏆 20 Derniers Gagnants</Text>
        )}
        ListEmptyComponent={() => (
          <Text style={styles.empty}>Pas de gagnant pour l'instant.</Text>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b1220" },
  title: { color: "white", fontSize: 22, fontWeight: "800", textAlign: "center", marginBottom: 12 },
  card: {
    backgroundColor: "#121a2b",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ffffff",
  },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  winnerInfo: { 
    flexDirection: 'row',
    alignItems: 'center',
  },
  pseudo: { color: "white", fontSize: 16, fontWeight: "900" },
  date: { color: "#9fb0d1", fontSize: 12 },
  winLine: { color: "#c6d3f0", marginTop: 6, fontSize: 14 },
  strong: { color: "white", fontWeight: "900" },
  empty: { color: "#8aa0c8", textAlign: "center", marginTop: 20 },
});