import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { BASE_URL } from "../config";

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
  competitor_name: string; // team name
  category: string;
  club: string;
  value: number | null;
  members: Member[];
};

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

export default function MyScores() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [allScores, setAllScores] = useState<Score[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(false);

  // TODO: Replace with logged-in judge ID
  const judgeId = 2;

  useEffect(() => {
    const fetchScores = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${BASE_URL}/api/judges/${judgeId}/scores`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to fetch scores");

        setAllScores(data); // API should return members[]
      } catch (err: any) {
        console.error("Error fetching scores:", err);
        setAllScores([]);
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, []);

  const handleCategoryPress = (cat: string) => {
    setSelectedCategory(cat);
    const filtered = allScores.filter((s) => s.category === cat);
    setScores(filtered);
  };

  const filteredCategories = categories.filter((cat) =>
    cat.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>My Scores</Text>

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

      {/* Scores List */}
      <ScrollView style={{ flex: 1 }}>
        {loading && <ActivityIndicator size="large" color="#000" />}
        {!loading && selectedCategory && scores.length === 0 && (
          <Text style={styles.noResults}>No scores in {selectedCategory}</Text>
        )}
        {!loading &&
          scores.map((s) => (
            <View key={s.id} style={styles.scoreCard}>
              <Text style={styles.competitorName}>{s.competitor_name}</Text>
              <Text style={styles.detail}>
                {s.category} • {s.club}
              </Text>

              {/* Members */}
              <View style={styles.membersBox}>
                {s.members.map((m) => (
                  <Text key={m.id} style={styles.memberText}>
                    - {m.first_name} {m.last_name} ({m.sex}, {m.age} yrs)
                  </Text>
                ))}
              </View>

              <Text style={styles.scoreLine}>
                Score: {s.value !== null ? s.value : "N/A"}
              </Text>
            </View>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
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
  scoreCard: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#eee",
  },
  competitorName: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
  detail: { fontSize: 14, color: "#555", marginBottom: 6 },
  membersBox: { marginBottom: 6, paddingLeft: 8 },
  memberText: { fontSize: 14, color: "#333" },
  scoreLine: { fontSize: 16, fontWeight: "600" },
  noResults: {
    marginTop: 20,
    fontSize: 16,
    textAlign: "center",
    color: "#999",
  },
});
