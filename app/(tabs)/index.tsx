import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  updateDoc,
  writeBatch
} from "firebase/firestore";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from "react-native-google-mobile-ads";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebaseConfig";
import { recordWinner } from "./winners";

// FONCTION UTILITAIRE POUR LA MESSAGERIE LOCALE
const INBOX_KEY = "inbox_v1";
async function pushMessage(title: string, body: string, isLocked = false) {
  try {
    const raw = await AsyncStorage.getItem(INBOX_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.unshift({ id: String(Date.now()), title, body, ts: Date.now(), read: false, lock: isLocked });
    await AsyncStorage.setItem(INBOX_KEY, JSON.stringify(arr));
  } catch (e) {
    console.error("Erreur lors de l'envoi du message:", e);
  }
}

type PlatformKey =
  | "disney"
  | "prime"
  | "paramount"
  | "netflix"
  | "appletv"
  | "testwin";

const AD_UNIT_ID = __DEV__
  ? TestIds.REWARDED
  : "YOUR_REAL_AD_UNIT_ID";

const rewardedAd = RewardedAd.createForAdRequest(AD_UNIT_ID, {
  requestNonPersonalizedAdsOnly: true,
});

const PLATFORMS: { key: PlatformKey; label: string; logo: any }[] = [
    { key: "disney", label: "Disney+", logo: require("../../assets/logos/disneyplus.png") },
    { key: "prime", label: "Prime Video", logo: require("../../assets/logos/primevideo.png") },
    { key: "paramount", label: "Paramount+", logo: require("../../assets/logos/paramountplus.png") },
    { key: "netflix", label: "Netflix", logo: require("../../assets/logos/netflix.png") },
    { key: "appletv", label: "Apple TV+", logo: require("../../assets/logos/appletv.png") },
    { key: "testwin", label: "Jeu de Test", logo: require("../../assets/logos/netflix.png") },
];

type UserData = { credits?: number };
type UserEntryData = { count?: number; creditCount?: number };

export default function Index() {
  const [draws, setDraws] = useState<any[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformKey | null>(null);
  const [pseudo, setPseudo] = useState<string | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [userEntry, setUserEntry] = useState<UserEntryData | null>(null);
  const [adCooldown, setAdCooldown] = useState(0);
  const adReady = useRef(false);
  const cooldownIntervalRef = useRef<number | null>(null); // CORRECTION ICI

  const selectedDraw = useMemo(() => {
    if (!selectedPlatform || !draws) return null;
    return draws.find(d => d.platform === selectedPlatform);
  }, [selectedPlatform, draws]);

  // Chargements et écouteurs
  useEffect(() => {
    const getPseudo = async () => setPseudo(await AsyncStorage.getItem("user_pseudo_v1"));
    getPseudo();
  }, []);

  useEffect(() => {
    if (!pseudo) return;

    const unsubDraws = onSnapshot(collection(db, "draws"), (s) => setDraws(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubUser = onSnapshot(doc(db, "users", pseudo), (d) => setUser(d.data() as UserData));

    const loadAd = () => rewardedAd.load();
    const adLoadedListener = rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => { adReady.current = true; });
    const adErrorListener = rewardedAd.addAdEventListener(AdEventType.ERROR, (e) => console.error("Ad Error:", e));
    const adClosedListener = rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
      adReady.current = false;
      setAdCooldown(4);
    });
    
    loadAd();
    
    return () => {
      unsubDraws();
      unsubUser();
      adLoadedListener();
      adClosedListener();
      adErrorListener();
    };
  }, [pseudo]);

  // Logique du chronomètre
  useEffect(() => {
    if (adCooldown > 0) {
      cooldownIntervalRef.current = setTimeout(() => {
        setAdCooldown(adCooldown - 1);
      }, 1000) as any; // CORRECTION ICI
    } else {
      if (cooldownIntervalRef.current) {
        clearTimeout(cooldownIntervalRef.current);
      }
      if (!adReady.current) {
        rewardedAd.load();
      }
    }
    return () => {
      if (cooldownIntervalRef.current) {
        clearTimeout(cooldownIntervalRef.current);
      }
    };
  }, [adCooldown]);

  useEffect(() => {
    if (!pseudo || !selectedDraw) {
      setUserEntry(null);
      return;
    }
    const entryRef = doc(db, "draws", selectedDraw.id, "entries", pseudo);
    const unsubscribe = onSnapshot(entryRef, (d) => setUserEntry(d.exists() ? (d.data() as UserEntryData) : { count: 0, creditCount: 0 }));
    return () => unsubscribe();
  }, [pseudo, selectedDraw]);
  
  const triggerDraw = async (draw: any) => {
    try {
      Alert.alert("Objectif atteint !", "Le tirage au sort va commencer. Bonne chance !");
      const entriesRef = collection(db, "draws", draw.id, "entries");
      const entriesSnapshot = await getDocs(entriesRef);
      if (entriesSnapshot.empty) {
        await updateDoc(doc(db, "draws", draw.id), { count: 0 });
        return;
      }
      const participants: string[] = [];
      entriesSnapshot.forEach(entryDoc => {
        const data = entryDoc.data();
        for (let i = 0; i < (data.count || 0); i++) {
          participants.push(data.pseudo);
        }
      });
      if (participants.length === 0) {
        await updateDoc(doc(db, "draws", draw.id), { count: 0 });
        return;
      }
      const winnerPseudo = participants[Math.floor(Math.random() * participants.length)];
      
      await recordWinner({
        pseudo: winnerPseudo,
        platform: draw.platform,
        months: 1,
        country: "FR",
      });

      await pushMessage(
          "🎉 Félicitations, tu as gagné ! 🎉",
          `Tu as remporté le concours pour un abonnement ${draw.title}. Tes identifiants te seront envoyés par message ici même d'ici 24 à 48h. Surveille bien ta messagerie !`
      );
      
      Alert.alert("Tirage terminé !", `Le gagnant est ${winnerPseudo} ! Un nouveau concours va commencer.`);
      
      const batch = writeBatch(db);
      entriesSnapshot.forEach(doc => {
          batch.delete(doc.ref);
      });
      await batch.commit();

      await updateDoc(doc(db, "draws", draw.id), { count: 0 });

    } catch (error) {
      console.error("Erreur lors du tirage au sort : ", error);
    }
  };

  const handleParticipation = async (draw: any, isCredit: boolean) => {
    if (!pseudo) return;
    try {
        await runTransaction(db, async (transaction) => {
            const drawRef = doc(db, "draws", draw.id);
            const entryRef = doc(db, "draws", draw.id, "entries", pseudo);
            const userRef = doc(db, "users", pseudo);
            const [drawDoc, entryDoc, userDoc] = await Promise.all([
                transaction.get(drawRef),
                transaction.get(entryRef),
                isCredit ? transaction.get(userRef) : Promise.resolve(null)
            ]);
            if (!drawDoc.exists()) throw new Error("Le concours n'existe plus !");
            if (isCredit) {
                if (!userDoc || !userDoc.exists() || (userDoc.data()?.credits ?? 0) < 1) throw new Error("Crédits insuffisants");
                if ((entryDoc.data()?.creditCount ?? 0) >= 2) throw new Error("Limite de crédits atteinte");
                transaction.update(userRef, { credits: increment(-1) });
            }
            if (entryDoc.exists()) {
                transaction.update(entryRef, {
                    count: increment(1),
                    ...(isCredit && { creditCount: increment(1) })
                });
            } else {
                transaction.set(entryRef, {
                    pseudo,
                    count: 1,
                    creditCount: isCredit ? 1 : 0,
                    createdAt: serverTimestamp()
                });
            }
            transaction.update(drawRef, { count: increment(1) });
        });
        if (isCredit) Alert.alert("Succès", "Ta participation par crédit a été enregistrée !");
        const updatedDrawDoc = await getDoc(doc(db, "draws", draw.id));
        if (updatedDrawDoc.exists() && updatedDrawDoc.data().goal && updatedDrawDoc.data().count >= updatedDrawDoc.data().goal) {
            await triggerDraw({id: updatedDrawDoc.id, ...updatedDrawDoc.data()});
        }
    } catch (e: any) {
        Alert.alert("Erreur", e.message || "Impossible d'enregistrer la participation.");
    }
  };

  const handleShowAd = async (draw: any) => {
    if (adReady.current && adCooldown === 0) {
      const rewardListener = rewardedAd.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        () => {
          rewardListener();
          handleParticipation(draw, false);
        }
      );
      rewardedAd.show();
    }
  };
  
  const isCreditBtnDisabled = (user?.credits ?? 0) < 1 || (userEntry?.creditCount ?? 0) >= 2;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Win a Stream !</Text>
        
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Choisissez votre plateforme pour jouer</Text>
            <View style={styles.pillsRow}>
            {PLATFORMS.map((p) => (
                <TouchableOpacity
                key={p.key}
                style={[styles.pill, selectedPlatform === p.key && styles.pillActive]}
                onPress={() => setSelectedPlatform(p.key)}>
                <Image source={p.logo} style={styles.pillLogo} />
                <Text style={[styles.pillText, selectedPlatform === p.key && styles.pillTextActive]}>
                    {p.label}
                </Text>
                </TouchableOpacity>
            ))}
            </View>
        </View>
        
        {selectedPlatform && selectedDraw ? (
          <View key={selectedDraw.id} style={styles.card}>
            <Text style={styles.cardTitle}>{selectedDraw.title}</Text>
            <Image
              source={PLATFORMS.find(p => p.key === selectedDraw.platform)?.logo}
              style={styles.productImage}
            />
            
            <TouchableOpacity style={[styles.cta, adCooldown > 0 && styles.ctaDisabled]} onPress={() => handleShowAd(selectedDraw)} disabled={adCooldown > 0}>
              <Text style={styles.ctaText}>
                {adCooldown > 0 ? `Prochaine pub dans ${adCooldown}s` : "Regarder une pub pour participer"}
              </Text>
            </TouchableOpacity>

            { (selectedDraw.goal && selectedDraw.goal > (selectedDraw.count || 0)) ? (
              <>
                <Text style={styles.counter}>
                  {(selectedDraw.goal - (selectedDraw.count || 0)).toLocaleString('fr-FR')} / {selectedDraw.goal.toLocaleString('fr-FR')}
                </Text>
                <Text style={styles.drawInfo}>pubs restantes avant le tirage</Text>
              </>
            ) : (
              <>
                <Text style={styles.counter}>Tirage au sort imminent...</Text>
                <Text style={styles.drawInfo}>Bonne chance !</Text>
              </>
            )}

            <TouchableOpacity 
              style={[styles.cta, styles.creditBtn, isCreditBtnDisabled && styles.ctaDisabled]} 
              onPress={() => handleParticipation(selectedDraw, true)}
              disabled={isCreditBtnDisabled}
            >
              <Text style={styles.ctaText}>Utiliser 1 Crédit</Text>
            </TouchableOpacity>
            <Text style={styles.creditText}>Mes crédits : {user?.credits ?? 0}</Text>
            <Text style={styles.creditNote}>Crédits utilisés pour ce tirage : {userEntry?.creditCount ?? 0}/2</Text>

            <Text style={styles.totalCount}>Mes participations (pub + crédit) : {userEntry?.count ?? 0}</Text>
            
            <Text style={styles.referralHint}>
              (Obtiens des crédits gratuits grâce à ton lien de parrainage sur l'onglet Profil)
            </Text>
          </View>
        ) : (
          <View style={{ marginTop: 20 }}>
            {/* Vide intentionnellement */}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b1220" },
  scrollContent: { padding: 16, paddingBottom: 32 },
  title: { color: "white", fontSize: 28, fontWeight: "900", textAlign: "center", marginBottom: 6, marginTop: 20 },
  subtitle: { color: "#c6d3f0", fontSize: 14, textAlign: "center", marginBottom: 20, lineHeight: 20 },
  pillsRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 },
  pill: { flexDirection: "row", alignItems: "center", backgroundColor: "#1c2536", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 99 },
  pillActive: { backgroundColor: "#2e72ff" },
  pillLogo: { width: 18, height: 18, marginRight: 8 },
  pillText: { color: "#c6d3f0", fontWeight: "700", fontSize: 13 },
  pillTextActive: { color: "white" },
  card: { backgroundColor: "#121a2b", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#ffffff" },
  cardTitle: { color: "white", fontSize: 18, fontWeight: "700", textAlign: "center", marginBottom: 12 },
  productImage: { alignSelf: "center", width: "80%", height: 70, marginVertical: 12, resizeMode: 'contain' },
  counter: { color: "white", fontSize: 22, fontWeight: "900", textAlign: "center", marginTop: 4 },
  drawInfo: { color: "#c6d3f0", fontSize: 12, textAlign: "center", marginTop: 4, marginBottom: 8 },
  totalCount: { color: "#9fb0d1", fontSize: 14, textAlign: "center", marginBottom: 12, fontStyle: 'italic' },
  cta: {
    backgroundColor: "#2e72ff",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  ctaText: { color: "white", textAlign: "center", fontWeight: "700" },
  creditBtn: {
    backgroundColor: '#1fb26b',
    marginTop: 8,
  },
  ctaDisabled: {
    backgroundColor: '#555',
    opacity: 0.7,
  },
  creditText: {
    color: '#f0ad4e',
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 4,
    marginTop: 8,
  },
  creditNote: {
    color: '#9fb0d1',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  referralHint: {
    color: '#8aa0c8',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  noDrawsText: { color: "#c6d3f0", fontSize: 16, textAlign: "center" },
});