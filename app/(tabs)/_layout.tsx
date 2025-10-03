import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Tabs } from "expo-router";
import React, { useEffect } from "react";
import { useUnread } from '../../context/UnreadContext';

const INBOX_KEY = "inbox_v1";

export default function TabLayout() {
  const { unreadCount, setUnreadCount } = useUnread();

  // Ce bloc s'exécute en continu en arrière-plan des onglets
  useEffect(() => {
    const checkUnreadMessages = async () => {
      try {
        const raw = await AsyncStorage.getItem(INBOX_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        const unread = arr.filter((m: any) => !m.read).length;
        setUnreadCount(unread);
      } catch (e) {
        setUnreadCount(0);
      }
    };

    // On vérifie toutes les 2 secondes s'il y a de nouveaux messages
    const interval = setInterval(checkUnreadMessages, 2000);

    // On nettoie l'intervalle quand le composant est détruit
    return () => clearInterval(interval);
  }, [setUnreadCount]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0b1220",
          borderTopColor: "#1a2440",
        },
        tabBarActiveTintColor: "#2e72ff",
        tabBarInactiveTintColor: "#9fb0d1",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messagerie",
          tabBarBadge: unreadCount > 0 ? '' : undefined,
          tabBarBadgeStyle: {
              minWidth: 10,
              maxWidth: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: 'red',
              top: 5,
          },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="winners"
        options={{
          title: "Gagnants",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="partners"
        options={{
          title: "Officiel",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-checkmark" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}