import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../config";

const ROLE_KEY = "tablet_role";
const JUDGE_ID_KEY = "judge_id";
const JUDGE_NAME_KEY = "judge_name";
export default function SecretaryMenu() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [tapCount, setTapCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, categories: 0 });

  const handleTitlePress = async () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);

    // reset after 5 seconds if not completed
    if (newCount === 1) {
      setTimeout(() => setTapCount(0), 5000);
    }

    if (newCount >= 7) {
      setTapCount(0);
      await AsyncStorage.multiRemove([ROLE_KEY, JUDGE_ID_KEY, JUDGE_NAME_KEY]);
      navigation.replace("RolePicker");
    }
  };

  const fetchStats = async () => {
    try {
      const [resCompetitors, resCategories] = await Promise.all([
        fetch(`${BASE_URL}/api/competitors/count`),
        fetch(`${BASE_URL}/api/competitors/categories/count`),
      ]);

      const competitorsData = await resCompetitors.json();
      const categoriesData = await resCategories.json();

      setStats({
        total: competitorsData.total || 0,
        categories: categoriesData.categories || 0,
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const menuItems = [
    {
      title: "Add Competitor",
      subtitle: "Register new competitors",
      icon: "➕",
      gradient: ["#FF6B6B", "#FF8E53"],
      action: () => navigation.navigate("AddCompetitor"),
    },
    {
      title: "View Competitors",
      subtitle: "Manage existing competitors",
      icon: "👥",
      gradient: ["#4ECDC4", "#44A08D"],
      action: () => navigation.navigate("Competitors"),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={handleTitlePress}>
          <Text style={styles.title}>Secretary Dashboard</Text>
        </Pressable>
        <Text style={styles.subtitle}>Manage competition entries</Text>
      </View>

      <View style={styles.content}>
        {menuItems.map((item, index) => (
          <Pressable key={index} style={styles.menuCard} onPress={item.action}>
            <View
              style={[
                styles.cardBackground,
                { backgroundColor: item.gradient[0] },
              ]}
            />
            <View style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>{item.icon}</Text>
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <View style={styles.arrowContainer}>
                <Text style={styles.arrow}>→</Text>
              </View>
            </View>
          </Pressable>
        ))}

        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Quick Stats</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#6C5CE7" />
          ) : (
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total Competitors</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.categories}</Text>
                <Text style={styles.statLabel}>Categories</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#2D3436",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#636E72",
    textAlign: "center",
    fontWeight: "500",
  },
  content: {
    flex: 1,
    padding: 24,
  },
  menuCard: {
    height: 120,
    borderRadius: 24,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  cardBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.9,
  },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
  },
  icon: {
    fontSize: 32,
  },
  textContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  arrowContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  arrow: {
    fontSize: 20,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  statsContainer: {
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2D3436",
    marginBottom: 16,
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "800",
    color: "#6C5CE7",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#636E72",
    fontWeight: "600",
    textAlign: "center",
  },
});
