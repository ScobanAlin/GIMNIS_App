import React, { useState, useEffect, useCallback } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { BASE_URL } from "../config";
import type { RootStackParamList } from "../types";

type Member = {
  id: number;
  first_name: string;
  last_name: string;
  age: number;
  sex: "M" | "F";
};

type Score = {
  id: number;
  competitor_id: number;
  category: string;
  club: string;
  score_type: string;
  value: number | null;
  members: Member[];
};

const categories = [
  "Individual Men - Kids Development",
  "Individual Women - Kids Development",
  "Mixed Pair - Kids Development",
  "Trio - Kids Development",
  "Group - Kids Development",
  "Individual Men - National Development",
  "Individual Women - National Development",
  "Mixed Pair - National Development",
  "Trio - National Development",
  "Group - National Development",
  "Individual Men - Youth",
  "Individual Women - Youth",
  "Mixed Pair - Youth",
  "Trio - Youth",
  "Group - Youth",
  "Aerobic Dance - Youth",
  "Individual Men - Juniors",
  "Individual Women - Juniors",
  "Mixed Pair - Juniors",
  "Trio - Juniors",
  "Group - Juniors",
  "Aerobic Dance - Juniors",
  "Individual Men - Seniors",
  "Individual Women - Seniors",
  "Mixed Pair - Seniors",
  "Trio - Seniors",
  "Group - Seniors",
  "Aerobic Dance - Seniors",
];

export default function MyScores() {
  const route = useRoute<RouteProp<RootStackParamList, "MyScores">>();
  const { judgeId, role, name } = route.params;

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [allScores, setAllScores] = useState<Score[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(false);
const [competitorSearch, setCompetitorSearch] = useState("");

  const fetchScores = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/judges/${judgeId}/scores`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to fetch scores");

      setAllScores(data);
    } catch (err: any) {
      console.error("Error fetching scores:", err);
      Alert.alert("Error", err.message || "Failed to fetch scores");
      setAllScores([]);
    } finally {
      setLoading(false);
    }
  }, [judgeId]);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  const handleCategoryPress = useCallback((cat: string) => {
    setSelectedCategory(cat);
  }, []); // ✅ no dependencies, stable reference

  // Separate effect handles filtering
  useEffect(() => {
    if (selectedCategory && allScores.length > 0) {
      const filtered = allScores.filter((s) => s.category === selectedCategory);
      setScores(filtered);
    } else {
      setScores([]);
    }
  }, [selectedCategory, allScores]);

  const filteredCategories = categories.filter((cat) =>
    cat.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'execution': return '#FF6B6B';
      case 'artistry': return '#4ECDC4';
      case 'difficulty': return '#45B7D1';
      case 'principal': return '#96CEB4';
      default: return '#FFEAA7';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'execution': return '⚡';
      case 'artistry': return '🎨';
      case 'difficulty': return '🎯';
      case 'principal': return '👑';
      default: return '⭐';
    }
  };

  const getScoreTypeColor = (scoreType: string) => {
    if (scoreType.includes('penalization')) return '#FF7675';
    if (scoreType === 'execution') return '#00B894';
    if (scoreType === 'artistry') return '#6C5CE7';
    if (scoreType === 'difficulty') return '#74B9FF';
    return '#FDCB6E';
  };

  const totalScores = allScores.length;
  const uniqueCategories = new Set(allScores.map(s => s.category)).size;

const filteredScores = scores.filter((s) => {
  const searchLower = competitorSearch.toLowerCase();
  return (
    s.club.toLowerCase().includes(searchLower) ||
    s.category.toLowerCase().includes(searchLower) ||
    String(s.competitor_id).includes(searchLower) ||
    s.members.some(
      (m) =>
        m.first_name.toLowerCase().includes(searchLower) ||
        m.last_name.toLowerCase().includes(searchLower)
    )
  );
});


  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { backgroundColor: getRoleColor(role) }]}>
        <View style={styles.headerContent}>
          <View style={styles.roleIconContainer}>
            <Text style={styles.roleIcon}>{getRoleIcon(role)}</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>My Scores</Text>
            <Text style={styles.subtitle}>
              {name} • {role.charAt(0).toUpperCase() + role.slice(1)} Judge
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalScores}</Text>
          <Text style={styles.statLabel}>Total Scores</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{uniqueCategories}</Text>
          <Text style={styles.statLabel}>Categories</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#B2BEC3"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContainer}
          style={styles.categoryScrollView}
        >
          {filteredCategories.map((cat) => (
            <Pressable
              key={cat}
              style={[
                styles.categoryChip,
                selectedCategory === cat && styles.categoryChipSelected,
              ]}
              onPress={() => handleCategoryPress(cat)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat && styles.categoryTextSelected,
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search competitors..."
            value={competitorSearch}
            onChangeText={setCompetitorSearch}
            placeholderTextColor="#B2BEC3"
          />
        </View>

        <ScrollView
          style={styles.scoresContainer}
          showsVerticalScrollIndicator={false}
        >
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6C5CE7" />
              <Text style={styles.loadingText}>Loading scores...</Text>
            </View>
          )}

          {!loading && selectedCategory && scores.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyText}>
                No scores in {selectedCategory}
              </Text>
            </View>
          )}

          {!loading &&
            filteredScores.map((s) => (
              <View key={s.id} style={styles.scoreCard}>
                <View style={styles.scoreHeader}>
                  <Text style={styles.competitorId}>#{s.competitor_id}</Text>
                  <View
                    style={[
                      styles.scoreBadge,
                      { backgroundColor: getScoreTypeColor(s.score_type) },
                    ]}
                  >
                    <Text style={styles.scoreValue}>
                      {s.value !== null &&
                      s.value !== undefined &&
                      !isNaN(Number(s.value))
                        ? Number(s.value).toFixed(1)
                        : "N/A"}
                    </Text>
                  </View>
                </View>

                <Text style={styles.clubName}>{s.club}</Text>
                <Text style={styles.categoryName}>{s.category}</Text>

                <View style={styles.scoreTypeContainer}>
                  <Text style={styles.scoreTypeLabel}>Score Type:</Text>
                  <Text
                    style={[
                      styles.scoreType,
                      { color: getScoreTypeColor(s.score_type) },
                    ]}
                  >
                    {s.score_type.replace("_", " ").toUpperCase()}
                  </Text>
                </View>

                <View style={styles.membersSection}>
                  {s.category.startsWith("Individual") ? (
                    <View style={styles.individualMember}>
                      <Text style={styles.memberName}>
                        {s.members[0]?.last_name} {s.members[0]?.first_name}
                      </Text>
                      <Text style={styles.memberDetails}>
                        • {s.members[0]?.sex}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.teamMembers}>
                      <Text style={styles.membersTitle}>Team Members</Text>
                      {s.members.length > 0 ? (
                        s.members.map((m) => (
                          <View key={m.id} style={styles.memberItem}>
                            <Text style={styles.memberName}>
                             {m.last_name} {m.first_name}
                            </Text>
                            <Text style={styles.memberDetails}> • {m.sex}</Text>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.noMembers}>No members listed</Text>
                      )}
                    </View>
                  )}
                </View>
              </View>
            ))}
        </ScrollView>
      </ScrollView>
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
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  roleIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  roleIcon: {
    fontSize: 28,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    borderWidth: 2,
    borderColor: "#E1E8ED",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryScrollView: {
    flexGrow: 0,
    marginBottom: 16,
  },
  categoryContainer: {
    gap: 12,
  },
  categoryChip: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: "#E1E8ED",
    minWidth: 120,
    alignItems: "center",
  },
  categoryChipSelected: {
    backgroundColor: "#6C5CE7",
    borderColor: "#6C5CE7",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#636E72",
    textAlign: "center",
  },
  categoryTextSelected: {
    color: "#FFFFFF",
  },
  scoresContainer: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: "center",
    marginTop: 32,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#636E72",
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 32,
    gap: 16,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 16,
    color: "#636E72",
    fontWeight: "500",
    textAlign: "center",
  },
  scoreCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  scoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  competitorId: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6C5CE7",
  },
  scoreBadge: {
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 60,
    alignItems: "center",
  },
  scoreValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  clubName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D3436",
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 14,
    color: "#636E72",
    fontWeight: "600",
    marginBottom: 16,
  },
  scoreTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  scoreTypeLabel: {
    fontSize: 14,
    color: "#636E72",
    fontWeight: "600",
  },
  scoreType: {
    fontSize: 14,
    fontWeight: "700",
  },
  membersSection: {
    marginTop: 4,
  },
  individualMember: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  teamMembers: {
    gap: 8,
  },
  membersTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2D3436",
    marginBottom: 8,
  },
  memberItem: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  memberName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2D3436",
  },
  memberDetails: {
    fontSize: 14,
    color: "#636E72",
  },
  noMembers: {
    fontSize: 14,
    color: "#B2BEC3",
    fontStyle: "italic",
    textAlign: "center",
    padding: 12,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40, // Extra padding at bottom to ensure submit button is visible
  },
});
    