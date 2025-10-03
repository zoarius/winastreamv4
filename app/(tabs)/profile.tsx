import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PSEUDO_KEY = "user_pseudo_v1";
const BASE_REF_URL = "https://winastream.com"; 

export default function Profile() {
  const [pseudo, setPseudo] = useState<string>("");

  useEffect(() => {
    (async () => {
      const p = await AsyncStorage.getItem(PSEUDO_KEY);
      setPseudo(p ?? "");
    })();
  }, []);

  const emailWinAStream = useMemo(
    () => (pseudo ? `${pseudo}@winastream.com` : "—"),
    [pseudo]
  );

  const inviteUniversal = useMemo(
    () => (pseudo ? `${BASE_REF_URL}/download?ref=${encodeURIComponent(pseudo)}` : "—"),
    [pseudo]
  );

  const copy = async (text: string) => {
    if (!pseudo || text === "—") return;
    await Clipboard.setStringAsync(text);
    Alert.alert("Copié !", "Le lien a été copié dans le presse-papiers.");
  };

  const shareLink = async (text: string) => {
    if (!pseudo || text === "—") return;
    try {
      await Share.share({ message: `Rejoins-moi sur WinaStream et gagne des abonnements ! ${text}` });
    } catch {}
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Profil</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Règles du jeu</Text>
          <Text style={styles.rule}>• 1 publicité visionnée = 1 participation ajoutée.</Text>
          <Text style={styles.rule}>• Le nombre de participations par pub est illimité.</Text>
          <Text style={styles.rule}>• Les crédits gratuits permettent 2 participations par concours.</Text>
          <Text style={styles.rule}>• Parraine un ami et gagne 10 crédits gratuits !</Text>
          <Text style={styles.rule}>• Les abonnements en jeu sont toujours d’un mois.</Text>
          <Text style={styles.rule}>
            • Un gagnant est tiré au sort quand l'objectif de pubs est atteint.
          </Text>
          <Text style={styles.rule}>
            • Un nouveau concours démarre après chaque tirage.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Mon pseudo</Text>
          <Text style={styles.big}>{pseudo || "—"}</Text>

          <View style={styles.divider} />

          <Text style={styles.label}>Mon email Win a Stream</Text>
          <Text style={styles.code}>{emailWinAStream}</Text>
          <Text style={styles.note}>
            Cet email est inactif. Si tu gagnes, il sera activé et tu recevras tes identifiants (email + mot de passe) pour accéder à ton abonnement.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Parraine tes amis !</Text>
          <Text style={styles.code}>{inviteUniversal}</Text>

          <View style={styles.row}>
            <TouchableOpacity style={styles.btn} onPress={() => copy(inviteUniversal)}>
              <Text style={styles.btnText}>Copier</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btn} onPress={() => shareLink(inviteUniversal)}>
              <Text style={styles.btnText}>Partager</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.note}>
            Pour chaque ami qui installe l'application via ton lien, tu gagnes <Text style={{ fontWeight: "bold" }}>10 crédits gratuits</Text>.
          </Text>
        </View>
        
        <View style={{ height: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b1220" },
  scroll: { padding: 16, paddingBottom: 24 },

  title: {
    color: "white",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
  },

  card: {
    backgroundColor: "#121a2b",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ffffff",
  },

  label: { color: "#c6d3f0", fontWeight: "800", marginBottom: 6 },
  big: { color: "white", fontSize: 20, fontWeight: "900" },
  code: { color: "#9fb0d1", fontFamily: "monospace", fontSize: 12, marginTop: 2 },
  note: { color: "#8aa0c8", fontSize: 13, marginTop: 10, lineHeight: 18, textAlign: 'center' },

  row: { flexDirection: "row", gap: 8, marginTop: 8 },
  btn: {
    backgroundColor: "#2e72ff",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
  },
  btnText: { color: "white", fontWeight: "800", textAlign: "center" },

  rule: { color: "#c6d3f0", fontSize: 13, lineHeight: 20, marginTop: 4 },

  divider: { height: 1, backgroundColor: "#1a2440", marginVertical: 10 },
});