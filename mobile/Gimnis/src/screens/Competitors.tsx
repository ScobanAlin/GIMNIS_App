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
};

type CurrentCompetitor = {
  competitor_id: number;
  category: string;
  club: string;
  already_voted: boolean;
  members?: CompetitorMember[];
} | null;

const categories = [
  "IF-AG",
  "TR-7-8",
  "IM-AG",
  "MP-ND",
  "IF-7-8",
  "TRIO-ND",
  "MP-7-8",
  "IF-JUNIORI",
  "IM-JUNIORI",
  "IF-ND",
  "IM-7-8",
  "IM-ND",
  "GRUP-AG",
  "GRUP-JUNIORI",
  "TRIO-AG",
  "TRIO-JUNIORS",
  "GRUP-7-8",
  "GRUP-ND",
  "AD-JUNIORI",
];

export default function Competitors() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allCompetitors, setAllCompetitors] = useState<Competitor[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentCompetitor, setCurrentCompetitor] =
    useState<CurrentCompetitor>(null);

  const fetchCompetitors = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/competitors`);
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error || "Failed to fetch competitors");
      setAllCompetitors(data); // includes members
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
      if (res.ok && data && data.competitor_id) {
        setCurrentCompetitor(data);
      } else {
        setCurrentCompetitor(null);
      }
    } catch (err) {
      console.error("Error fetching current competitor:", err);
      setCurrentCompetitor(null);
    }
  };

  useEffect(() => {
    fetchCompetitors();
    fetchCurrentCompetitor();
    const interval = setInterval(fetchCurrentCompetitor, 3000);
    return () => clearInterval(interval);
  }, []);

  const deleteCompetitor = async (id: number) => {
    try {
      const res = await fetch(`${BASE_URL}/api/competitors/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error || "Failed to delete competitor");
      setAllCompetitors((prev) => prev.filter((c) => c.id !== id));
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

  const handleCategoryPress = (cat: string) => {
    setSelectedCategory(cat);
    const filtered = allCompetitors.filter((c) => c.category === cat);
    setCompetitors(filtered);
  };

  const filteredCategories = categories.filter((cat) =>
    cat.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={{ color: "crimson" }}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Competitors</Text>

      {/* 🏅 Current competitor */}
      {currentCompetitor ? (
        <View style={styles.currentBox}>
          <Text style={styles.currentTitle}>Current Competitor</Text>
          <Text style={styles.currentDetail}>
            {currentCompetitor.category} – {currentCompetitor.club}
          </Text>

          {/* Members if available */}
          {currentCompetitor.members && (
            <View style={styles.membersBox}>
              {currentCompetitor.members.map((m) => (
                <Text key={m.id} style={styles.memberText}>
                  • {m.first_name} {m.last_name} ({m.sex}, {m.age} yrs)
                </Text>
              ))}
            </View>
          )}

          <Pressable
            style={[
              styles.stopBtn,
              currentCompetitor.already_voted && { backgroundColor: "#aaa" },
            ]}
            disabled={currentCompetitor.already_voted}
            onPress={stopVote}
          >
            <Text style={styles.stopBtnText}>
              {currentCompetitor.already_voted
                ? "⏳ Vote in Progress"
                : "⛔ Stop Vote"}
            </Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.noResults}>No current competitor</Text>
      )}

      {/* 🔍 Search bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search category..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Category Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsContainer}
        style={{ flexGrow: 0, marginBottom: 8 }}
      >
        {filteredCategories.map((cat) => (
          <Pressable
            key={cat}
            style={[
              styles.card,
              selectedCategory === cat && styles.cardSelected,
            ]}
            onPress={() => handleCategoryPress(cat)}
          >
            <Text style={styles.cardText}>{cat}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Competitors List */}
      <ScrollView style={{ flex: 1 }}>
        {!loading && selectedCategory && competitors.length === 0 && (
          <Text style={styles.noResults}>
            No competitors in {selectedCategory}
          </Text>
        )}
        {!loading &&
          competitors.map((c) => (
            <View key={c.id} style={styles.competitorCard}>
              <Text style={styles.detail}>
                <Text style={{ fontWeight: "600" }}>Club:</Text> {c.club}
              </Text>
              <Text style={styles.detail}>
                <Text style={{ fontWeight: "600" }}>Category:</Text>{" "}
                {c.category}
              </Text>

              {/* 👥 Members list */}
              <Text style={{ fontWeight: "600", marginTop: 6 }}>Members:</Text>
              <View style={styles.membersBox}>
                {c.members.length > 0 ? (
                  c.members.map((m) => (
                    <Text key={m.id} style={styles.memberText}>
                      • {m.first_name} {m.last_name} ({m.sex}, {m.age} yrs)
                    </Text>
                  ))
                ) : (
                  <Text style={styles.memberText}>No members</Text>
                )}
              </View>

              {/* Buttons Row */}
              <View style={styles.btnRow}>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: "crimson" }]}
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
                  <Text style={styles.btnText}>Delete</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.actionBtn,
                    currentCompetitor
                      ? styles.disabledBtn
                      : { backgroundColor: "green" },
                  ]}
                  disabled={!!currentCompetitor}
                  onPress={() => startVote(c.id)}
                >
                  <Text style={styles.btnText}>
                    {currentCompetitor ? "Disabled" : "Start Vote"}
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  currentBox: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#eef9ff",
    borderWidth: 1,
    borderColor: "#bde0ff",
    marginBottom: 16,
    alignItems: "center",
  },
  currentTitle: { fontSize: 20, fontWeight: "700", marginBottom: 6 },
  currentDetail: { fontSize: 16, color: "#555", marginBottom: 12 },
  stopBtn: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    backgroundColor: "orange",
    marginTop: 8,
  },
  stopBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  searchContainer: { marginBottom: 16 },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  cardsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  card: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f7f7f7",
    marginRight: 8,
    minWidth: 90,
    alignItems: "center",
  },
  cardSelected: { backgroundColor: "#d1f0ff", borderColor: "#00aaff" },
  cardText: { fontSize: 16, fontWeight: "500" },
  competitorCard: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#eee",
  },
  detail: { fontSize: 14, color: "#555" },
  membersBox: {
    marginVertical: 8,
    paddingLeft: 10,
  },
  memberText: {
    fontSize: 14,
    color: "#333",
  },
  noResults: {
    marginTop: 10,
    fontSize: 16,
    textAlign: "center",
    color: "#999",
  },
  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 4,
  },
  disabledBtn: {
    backgroundColor: "#aaa",
  },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
