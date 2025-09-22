import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import { BASE_URL } from "../config";

type CompetitorMember = {
  id: number;
  first_name: string;
  last_name: string;
  age: number;
  sex: "M" | "F";
};

type Competitor = {
  id: number;
  category: string;
  club: string;
  members: CompetitorMember[];
  is_validated?: boolean;
};

type CurrentCompetitor = {
  competitor_id: number;
  category: string;
  club: string;
  already_voted: boolean;
  members?: CompetitorMember[];
} | null;

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

export default function Competitors() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentCompetitor, setCurrentCompetitor] =
    useState<CurrentCompetitor>(null);
  const [activeShow, setActiveShow] = useState<number | null>(null);
const [competitorSearch, setCompetitorSearch] = useState("");

  const fetchCompetitorsByCategory = async (category: string) => {
    try {
      setLoading(true);
      const res = await fetch(
        `${BASE_URL}/api/competitors/by-category?category=${encodeURIComponent(
          category
        )}`
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error || "Failed to fetch competitors");
      setCompetitors(data);
    } catch (e: any) {
      setError(e.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentCompetitor = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/votes/current`);
      const data = await res.json();
      if (res.ok && data?.competitor_id) {
        setCurrentCompetitor(data);
      } else {
        setCurrentCompetitor(null);
      }
    } catch (err) {
      console.error("Error fetching current competitor:", err);
      setCurrentCompetitor(null);
    }
  };

  const fetchActiveShow = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/live`);
      const data = await res.json();
      if (res.ok && data.show?.competitor_id) {
        setActiveShow(data.show.competitor_id);
      } else {
        setActiveShow(null);
      }
    } catch (err) {
      console.error("Error fetching active show:", err);
      setActiveShow(null);
    }
  };

  const deleteCompetitor = async (id: number) => {
    try {
      const res = await fetch(`${BASE_URL}/api/competitors/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error || "Failed to delete competitor");
      setCompetitors((prev) => prev.filter((c) => c.id !== id));
      Alert.alert("Deleted", "Competitor removed successfully.");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not delete competitor.");
    }
  };

  const startVote = async (id: number) => {
    try {
      const res = await fetch(`${BASE_URL}/api/votes/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitor_id: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to start vote");
      Alert.alert("Vote Started", "Judges can now vote for this competitor.");
      fetchCurrentCompetitor();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not start vote.");
    }
  };

  const stopVote = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/votes/stop`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to stop vote");
      Alert.alert("Vote Stopped", "No active competitor now.");
      setCurrentCompetitor(null);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not stop vote.");
    }
  };

  const triggerShow = async (id: number) => {
    try {
      const res = await fetch(`${BASE_URL}/api/live/${id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to start show");
      setActiveShow(id);
      Alert.alert("Live Show", "Competitor is now being shown on screen.");
      fetchActiveShow();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not start show.");
    }
  };

  useEffect(() => {
    fetchCurrentCompetitor();
    fetchActiveShow();
    const interval = setInterval(() => {
      fetchCurrentCompetitor();
      fetchActiveShow();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCategoryPress = (cat: string) => {
    setSelectedCategory(cat);
    fetchCompetitorsByCategory(cat);
  };

  const filteredCategories = categories.filter((cat) =>
    cat.toLowerCase().includes(search.toLowerCase())
  );

const filteredCompetitors = competitors.filter((c) => {
  const searchLower = competitorSearch.toLowerCase();
  return (
    c.club.toLowerCase().includes(searchLower) ||
    c.category.toLowerCase().includes(searchLower) ||
    c.members.some(
      (m) =>
        m.first_name.toLowerCase().includes(searchLower) ||
        m.last_name.toLowerCase().includes(searchLower)
    )
  );
});

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        nestedScrollEnabled={true}
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Competition Manager</Text>
          <Text style={styles.subtitle}>Manage competitors and voting</Text>
        </View>

        {/* Current Competitor Status */}
        {currentCompetitor ? (
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusTitle}>Current Competitor</Text>
              <View style={styles.statusIndicator} />
            </View>
            <Text style={styles.statusDetail}>
              {currentCompetitor.category} • {currentCompetitor.club}
            </Text>

            {currentCompetitor.members && (
              <View style={styles.membersContainer}>
                {currentCompetitor.members.map((m) => (
                  <Text key={m.id} style={styles.memberText}>
                    {m.first_name} {m.last_name} ({m.sex}, {m.age})
                  </Text>
                ))}
              </View>
            )}

            <Pressable
              style={[
                styles.stopBtn,
                currentCompetitor.already_voted && styles.stopBtnDisabled,
              ]}
              disabled={currentCompetitor.already_voted}
              onPress={stopVote}
            >
              <Text style={styles.stopBtnText}>
                {currentCompetitor.already_voted
                  ? "Vote in Progress"
                  : "Stop Vote"}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.noStatusCard}>
            <Text style={styles.noStatusText}>No active competitor</Text>
          </View>
        )}

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#B2BEC3"
          />
        </View>

        {/* Category Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEnabled={true}
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

        {/* Competitors List */}
        <ScrollView
          scrollEnabled={true}
          style={styles.competitorsContainer}
          showsVerticalScrollIndicator={false}
        >
          {loading && (
            <ActivityIndicator
              size="large"
              color="#6C5CE7"
              style={styles.loader}
            />
          )}

          {!loading && selectedCategory && competitors.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No competitors in {selectedCategory}
              </Text>
            </View>
          )}

          {filteredCompetitors.map((c) => (
            <View
              key={c.id}
              style={[
                styles.competitorCard,
                c.is_validated && styles.validatedCard,
              ]}
            >
              {/* Show Button */}
              {c.is_validated && (
                <Pressable
                  style={[
                    styles.showButton,
                    activeShow === c.id
                      ? styles.showButtonActive
                      : activeShow
                      ? styles.showButtonDisabled
                      : styles.showButtonReady,
                  ]}
                  disabled={!!activeShow && activeShow !== c.id}
                  onPress={() =>
                    Alert.alert("Confirm", `Show competitor #${c.id}?`, [
                      { text: "Cancel", style: "cancel" },
                      { text: "Show", onPress: () => triggerShow(c.id) },
                    ])
                  }
                >
                  <Text style={styles.showButtonText}>
                    {activeShow === c.id ? "LIVE" : activeShow ? "..." : "SHOW"}
                  </Text>
                </Pressable>
              )}

              {/* Competitor Info */}
              <View style={styles.competitorHeader}>
                <Text style={styles.competitorId}>#{c.id}</Text>
                <Text style={styles.clubName}>{c.club}</Text>
              </View>

              <Text style={styles.categoryName}>{c.category}</Text>

              {/* Members */}
              <View style={styles.membersSection}>
                {c.category.startsWith("Individual") ? (
                  <View style={styles.individualMember}>
                    <Text style={styles.memberName}>
                      {c.members[0]?.first_name} {c.members[0]?.last_name}
                    </Text>
                    <Text style={styles.memberDetails}>
                      {c.members[0]?.sex} • {c.members[0]?.age} years
                    </Text>
                  </View>
                ) : (
                  <View style={styles.teamMembers}>
                    {c.members.length > 0 ? (
                      c.members.map((m) => (
                        <View key={m.id} style={styles.memberItem}>
                          <Text style={styles.memberName}>
                            {m.first_name} {m.last_name}
                          </Text>
                          <Text style={styles.memberDetails}>
                            {m.sex} • {m.age}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noMembers}>No members listed</Text>
                    )}
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <Pressable
                  style={styles.deleteBtn}
                  onPress={() =>
                    Alert.alert("Confirm", `Delete competitor #${c.id}?`, [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => deleteCompetitor(c.id),
                      },
                    ])
                  }
                >
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.voteBtn,
                    (c.is_validated || currentCompetitor) &&
                      styles.voteBtnDisabled,
                  ]}
                  disabled={!!currentCompetitor || c.is_validated}
                  onPress={() => startVote(c.id)}
                >
                  <Text style={styles.voteBtnText}>
                    {c.is_validated
                      ? "Validated"
                      : currentCompetitor
                      ? "Disabled"
                      : "Start Vote"}
                  </Text>
                </Pressable>
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
  statusCard: {
    margin: 24,
    padding: 20,
    backgroundColor: "#E8F6F3",
    borderRadius: 20,
    borderLeftWidth: 6,
    borderLeftColor: "#00B894",
    shadowColor: "#00B894",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#00B894",
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#00B894",
  },
  statusDetail: {
    fontSize: 16,
    color: "#2D3436",
    fontWeight: "600",
    marginBottom: 12,
  },
  membersContainer: {
    marginBottom: 16,
  },
  memberText: {
    fontSize: 14,
    color: "#636E72",
    marginBottom: 2,
  },
  stopBtn: {
    backgroundColor: "#FF7675",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  stopBtnDisabled: {
    backgroundColor: "#B2BEC3",
  },
  stopBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  noStatusCard: {
    margin: 24,
    padding: 20,
    backgroundColor: "#F1F2F6",
    borderRadius: 20,
    alignItems: "center",
  },
  noStatusText: {
    fontSize: 16,
    color: "#636E72",
    fontWeight: "500",
  },
  searchContainer: {
    paddingHorizontal: 24,
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
    paddingHorizontal: 24,
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
  competitorsContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  loader: {
    marginTop: 32,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 32,
  },
  emptyText: {
    fontSize: 16,
    color: "#636E72",
    fontWeight: "500",
  },
  competitorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    position: "relative",
  },
  validatedCard: {
    borderLeftWidth: 6,
    borderLeftColor: "#00B894",
    backgroundColor: "#F8FFF9",
  },
  showButton: {
    position: "absolute",
    top: 16,
    right: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    zIndex: 10,
  },
  showButtonReady: {
    backgroundColor: "#74B9FF",
  },
  showButtonActive: {
    backgroundColor: "#00B894",
  },
  showButtonDisabled: {
    backgroundColor: "#B2BEC3",
  },
  showButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  competitorHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  competitorId: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6C5CE7",
  },
  clubName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D3436",
    flex: 1,
    textAlign: "right",
    marginRight: 60,
  },
  categoryName: {
    fontSize: 14,
    color: "#636E72",
    fontWeight: "600",
    marginBottom: 16,
  },
  membersSection: {
    marginBottom: 16,
  },
  individualMember: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 12,
  },
  teamMembers: {
    gap: 8,
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
    fontSize: 16,
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
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: "#FF7675",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  deleteBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  voteBtn: {
    flex: 1,
    backgroundColor: "#00B894",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  voteBtnDisabled: {
    backgroundColor: "#B2BEC3",
  },
  voteBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40, // Extra padding at bottom to ensure submit button is visible
  },
});
