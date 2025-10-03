import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router"; // On utilise un nouvel hook
import React, { useCallback, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUnread } from '../../context/UnreadContext';

type Msg = {
  id: string;
  title: string;
  body: string;
  ts: number;
  read?: boolean;
  lock?: boolean;
};

const INBOX_KEY = "inbox_v1";

const formatTimestamp = (ts: number) => {
  const date = new Date(ts);
  const pad = (n: number) => (n < 10 ? '0' + n : n);
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export default function Messages() {
  const [items, setItems] = useState<Msg[]>([]);
  const { setUnreadCount } = useUnread();

  const isProtected = useCallback((m: Msg) => m.lock === true, []);

  const loadAndCalculateUnread = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(INBOX_KEY);
      const arr: Msg[] = raw ? JSON.parse(raw) : [];
      arr.sort((a, b) => b.ts - a.ts);
      setItems(arr);
      const unread = arr.filter(m => !m.read).length;
      setUnreadCount(unread);
    } catch {
      setItems([]);
      setUnreadCount(0);
    }
  }, [setUnreadCount]);

  const save = useCallback(async (arr: Msg[]) => {
    await AsyncStorage.setItem(INBOX_KEY, JSON.stringify(arr));
    await loadAndCalculateUnread(); // On recharge après chaque sauvegarde
  }, [loadAndCalculateUnread]);

  const markAsRead = useCallback(async (id: string) => {
    const msg = items.find(m => m.id === id);
    if (msg && !msg.read) {
      const next = items.map(m => m.id === id ? { ...m, read: true } : m);
      await save(next);
    }
  }, [items, save]);
  
  // Ce hook s'exécute chaque fois que l'utilisateur arrive sur cet onglet
  useFocusEffect(
    useCallback(() => {
      loadAndCalculateUnread();
    }, [loadAndCalculateUnread])
  );

  const deleteOne = async (id: string) => {
    const msg = items.find((m) => m.id === id);
    if (!msg || isProtected(msg)) return;
    const next = items.filter((m) => m.id !== id);
    await save(next);
  };

  const clearDeletables = async () => {
    const keep = items.filter((m) => isProtected(m));
    if (keep.length === items.length) return;
    await save(keep);
  };

  const renderItem = ({ item }: { item: Msg }) => {
    const locked = isProtected(item);
    return (
      <TouchableOpacity onPress={() => markAsRead(item.id)}>
        <View style={[styles.card, !item.read && styles.unreadCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.time}>{formatTimestamp(item.ts)}</Text>
          </View>
          <Text style={styles.body}>{item.body}</Text>
          <View style={styles.cardActions}>
            <TouchableOpacity
              onPress={() => deleteOne(item.id)}
              disabled={locked}
              style={[styles.deleteBtn, locked && styles.deleteBtnDisabled]}
            >
              <Text style={styles.deleteText}>
                {locked ? "🔒 Protégé" : "Supprimer"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const deletableCount = items.filter((m) => !isProtected(m)).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Messagerie</Text>
        <TouchableOpacity onPress={clearDeletables} style={styles.clearBtn} disabled={deletableCount === 0}>
          <Text style={styles.clearText}>
            Vider {deletableCount > 0 ? `(${deletableCount})` : ""}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>Aucun message.</Text>}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b1220", padding: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  header: { color: "white", fontSize: 22, fontWeight: "700", flex: 1 },
  clearBtn: { paddingVertical: 8, paddingHorizontal: 10, backgroundColor: "#1a2a4f", borderRadius: 10, borderWidth: 1, borderColor: "#2e72ff" },
  clearText: { color: "#c6d3f0", fontWeight: "700", fontSize: 12 },
  empty: { color: "#8aa0c8", textAlign: "center", marginTop: 20 },
  card: { backgroundColor: "#121a2b", borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#ffffff" },
  unreadCard: { borderColor: '#2e72ff', borderWidth: 2 },
  cardHeader: { marginBottom: 6 },
  title: { color: "white", fontSize: 16, fontWeight: "700" },
  time: { color: "#9fb0d1", fontSize: 12, marginTop: 2 },
  body: { color: "#c6d3f0", lineHeight: 18, marginTop: 6 },
  cardActions: { marginTop: 10, flexDirection: "row", justifyContent: "flex-end" },
  deleteBtn: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: "#3b1f28", borderRadius: 10, borderWidth: 1, borderColor: "#a33" },
  deleteBtnDisabled: { opacity: 0.5, backgroundColor: "#1f2638", borderColor: "#555" },
  deleteText: { color: "white", fontWeight: "800", fontSize: 12 },
});