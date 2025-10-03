import React from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Partner = { label: string; logo: any };

const PARTNERS: Partner[] = [
  { label: "Disney+",     logo: require("../../assets/logos/disneyplus.png") },
  { label: "Prime Video", logo: require("../../assets/logos/primevideo.png") },
  { label: "Paramount+",  logo: require("../../assets/logos/paramountplus.png") },
  { label: "Netflix",     logo: require("../../assets/logos/netflix.png") },
  { label: "Apple TV+",   logo: require("../../assets/logos/appletv.png") },
];

export default function Official() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Plateformes Officielles</Text>
        <Text style={styles.subtitle}>
          Les abonnements que tu peux gagner proviennent directement des plateformes ci-dessous.
        </Text>

        <View style={styles.grid}>
          {PARTNERS.map((p) => (
            <View key={p.label} style={styles.partnerCard}>
              <Image source={p.logo} style={styles.partnerLogo} resizeMode="contain" />
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Comment ça marche ?</Text>
          <Text style={styles.about}>
            WinaStream est une application 100% gratuite. Nous achetons légalement des abonnements d'un mois sur les plateformes officielles.
            {"\n\n"}
            Lorsqu'un gagnant est tiré au sort, nous créons un nouveau compte avec son <Text style={{ fontWeight: "bold" }}>email WinaStream</Text> (pseudo@winastream.com) et un mot de passe sécurisé. Ces identifiants lui sont ensuite envoyés par message privé dans l'application.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b1220" },
  scroll: { padding: 16, paddingBottom: 24 },
  title: {
    color: "white", // Police en blanc
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    color: "#adb5bd",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },
  partnerCard: {
    width: '45%',
    aspectRatio: 1.6,
    backgroundColor: "#121a2b",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ffffff", // Cadre en blanc
  },
  partnerLogo: {
    width: '80%',
    height: '80%',
  },
  card: {
    backgroundColor: "#121a2b",
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#ffffff",
  },
  cardTitle: {
    color: "white", // Police en blanc
    fontWeight: "800",
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
  },
  about: {
    color: "#adb5bd",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
});