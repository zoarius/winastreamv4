import React, { useState } from "react";
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const PSEUDO_KEY = "user_pseudo_v1";
const AUTOEMAIL_KEY = "user_autoemail_v1";
const BANK_KEY = "pseudo_bank_v1";   // unicité locale (appareil)
const INBOX_KEY = "inbox_v1";

const normalize = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

const allowed = (p: string) => /^[a-z][a-z0-9_.]{2,19}$/.test(p) && !/[._]{2}/.test(p) && !/[._]$/.test(p);
const BANNED_STEMS = ["merd","put","niq","encul","batard","salo","fdp","connar","conne"];

const containsBadWords = (p: string) => {
  const x = normalize(p).replace(/[^a-z0-9]/g, "");
  return BANNED_STEMS.some((stem) => x.includes(stem));
};

const suggest = (base: string, taken: Set<string>) => {
  const root = normalize(base).replace(/[^a-z0-9_.]/g, "").replace(/[._]+$/,"").slice(0,14);
  const out: string[] = [];
  let i = 0;
  while (out.length < 5 && i < 200) {
    i++;
    const n = Math.floor(100 + Math.random() * 900);
    const cand = `${root}${n}`;
    if (allowed(cand) && !containsBadWords(cand) && !taken.has(cand)) out.push(cand);
  }
  return out;
};

async function pushMessage(title: string, body: string) {
  try {
    const raw = await AsyncStorage.getItem(INBOX_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.unshift({ id: String(Date.now()), title, body, ts: Date.now(), read: false });
    await AsyncStorage.setItem(INBOX_KEY, JSON.stringify(arr));
  } catch {}
}

export default function Onboard() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [proposals, setProposals] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const onCheck = async () => {
    const raw = await AsyncStorage.getItem(BANK_KEY);
    const bank = new Set<string>(raw ? JSON.parse(raw) : []);
    const p = normalize(text).replace(/[^a-z0-9_.]/g,"");
    if (!allowed(p)) { Alert.alert("Pseudo invalide","3–20 caractères, lettres/chiffres, . et _ ; commencer par une lettre, pas de .. ou __ ni de ./_ final."); return; }
    if (containsBadWords(p)) { Alert.alert("Refusé","Ce pseudo n’est pas acceptable."); return; }
    if (bank.has(p)) {
      const s = suggest(p, bank);
      setProposals(s);
      Alert.alert("Déjà pris","Choisis une proposition ou modifie.");
      return;
    }
    setProposals([]);
    Alert.alert("OK","Disponible sur cet appareil.");
  };

  const onSave = async () => {
    setBusy(true);
    try {
      const raw = await AsyncStorage.getItem(BANK_KEY);
      const bank = new Set<string>(raw ? JSON.parse(raw) : []);
      const p = normalize(text).replace(/[^a-z0-9_.]/g,"");
      if (!allowed(p) || containsBadWords(p)) { setBusy(false); return onCheck(); }

      bank.add(p);
      await AsyncStorage.setItem(BANK_KEY, JSON.stringify(Array.from(bank)));
      await AsyncStorage.setItem(PSEUDO_KEY, p);

      // email interne caché
      await AsyncStorage.setItem(AUTOEMAIL_KEY, `${p}@zoarius.com`);

      await pushMessage("Bienvenue", `Ton pseudo “${p}” est enregistré. Bon jeu !`);

      router.replace("/(tabs)"); // l’utilisateur est “connecté”
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Choisir un pseudo</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Règles</Text>
        <Text style={styles.note}>3–20 caractères · a-z 0-9 . _ · commence par une lettre · pas d’insultes.</Text>

        <Text style={styles.label}>Votre pseudo</Text>
        <TextInput
          value={text}
          onChangeText={(t) => { setText(t); setProposals([]); }}
          placeholder="ex. zouzou26"
          placeholderTextColor="#8aa0c8"
          autoCapitalize="none"
          style={styles.input}
        />

        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity style={styles.btn} onPress={onCheck} disabled={busy}>
            <Text style={styles.btnText}>Vérifier</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { backgroundColor: "#1fb26b" }]} onPress={onSave} disabled={busy}>
            <Text style={styles.btnText}>{busy ? "Patiente..." : "Continuer"}</Text>
          </TouchableOpacity>
        </View>

        {proposals.length > 0 && (
          <View style={{ marginTop: 10 }}>
            <Text style={styles.label}>Suggestions</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {proposals.map((s) => (
                <TouchableOpacity key={s} onPress={() => setText(s)} style={styles.suggest}>
                  <Text style={styles.suggestText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#0b1220" },
  title: { color: "white", fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 12 },
  card: { backgroundColor: "#121a2b", borderRadius: 16, padding: 16 },

  label: { color: "#c6d3f0", fontWeight: "700", marginTop: 6, marginBottom: 6 },
  input: {
    color: "white",
    borderWidth: 2, borderColor: "#2e72ff", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 10,
  },
  btn: { backgroundColor: "#2e72ff", padding: 12, borderRadius: 12, alignItems: "center", flex: 1 },
  btnText: { color: "white", fontWeight: "700" },

  note: { color: "#8aa0c8", marginTop: 2, fontSize: 12, lineHeight: 16 },

  suggest: { backgroundColor: "#1a2336", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12, marginRight: 6, marginBottom: 6 },
  suggestText: { color: "white", fontWeight: "700" },
});
