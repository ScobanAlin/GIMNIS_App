// src/screens/ViewAllScores.tsx
import React, { useState } from "react";
import {
  SafeAreaView,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  View,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { BASE_URL } from "../config";

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

// API fetch
async function fetchCompetitors(category: string) {
  try {
    const res = await fetch(
      `${BASE_URL}/api/competitors/by-category?category=${encodeURIComponent(
        category
      )}`
    );
    if (!res.ok) throw new Error("Failed to fetch competitors");
    return await res.json();
  } catch (err) {
    console.error("API error:", err);
    return [];
  }
}

export default function ViewAllScores() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState<any | null>(
    null
  );

  const isPrincipalJudge = true; // hardcoded for now

  const handleCategoryPress = async (category: string) => {
    setSelectedCategory(category);
    setLoading(true);
    const data = await fetchCompetitors(category);
    setCompetitors(data);
    setLoading(false);
  };

  const calculateTotal = (scores: Record<string, number | string>) => {
    const values = Object.values(scores).filter((s) => typeof s === "number");
    if (values.length === 0) return "N/A";
    return (values as number[]).reduce((sum, v) => sum + v, 0).toFixed(2);
  };

  const openDetails = (c: any) => {
    setSelectedCompetitor(c);
    setModalVisible(true);
  };

  const closeDetails = () => {
    setModalVisible(false);
    setSelectedCompetitor(null);
  };

  const saveScores = async () => {
    if (!selectedCompetitor) return;
    try {
      const res = await fetch(
        `${BASE_URL}/api/scores/${selectedCompetitor.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scores: selectedCompetitor.scores }),
        }
      );
      if (!res.ok) throw new Error("Failed to update scores");
      Alert.alert("✅ Success", "Scores updated successfully");
      closeDetails();
      if (selectedCategory) handleCategoryPress(selectedCategory);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Select a Category</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search category..."
        value={search}
        onChangeText={setSearch}
      />

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

      <ScrollView style={{ flex: 1 }}>
        {loading && <ActivityIndicator size="large" color="#000" />}
        {!loading && selectedCategory && competitors.length === 0 && (
          <Text style={styles.noResults}>
            No competitors in {selectedCategory}
          </Text>
        )}
        {!loading &&
          competitors.map((c) => (
            <View key={c.id} style={styles.competitorCard}>
              <Text style={styles.competitorName}>
                {c.name} – {c.club}
              </Text>

              <View style={styles.membersBox}>
                {c.members?.length > 0 ? (
                  c.members.map((m: any) => (
                    <Text key={m.id} style={styles.memberText}>
                      - {m.first_name} {m.last_name} ({m.sex}, {m.age} yrs)
                    </Text>
                  ))
                ) : (
                  <Text style={styles.memberText}>No members</Text>
                )}
              </View>

              <Text style={styles.totalScore}>
                Total Score: {calculateTotal(c.scores)}
              </Text>

              <Pressable
                style={styles.detailsBtn}
                onPress={() => openDetails(c)}
              >
                <Text style={styles.detailsBtnText}>See Details</Text>
              </Pressable>
            </View>
          ))}
      </ScrollView>

      {/* Modal with details */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedCompetitor && (
              <>
                <Text style={styles.modalTitle}>{selectedCompetitor.name}</Text>
                <Text style={styles.modalSubtitle}>
                  Club: {selectedCompetitor.club}
                </Text>

                <View style={styles.membersBox}>
                  {selectedCompetitor.members?.length > 0 ? (
                    selectedCompetitor.members.map((m: any) => (
                      <Text key={m.id} style={styles.memberText}>
                        - {m.first_name} {m.last_name} ({m.sex}, {m.age} yrs)
                      </Text>
                    ))
                  ) : (
                    <Text style={styles.memberText}>No members</Text>
                  )}
                </View>

                <Text style={styles.modalSubtitle}>
                  Total Score: {calculateTotal(selectedCompetitor.scores)}
                </Text>

                <ScrollView style={{ marginTop: 10 }}>
                  {Object.keys(selectedCompetitor.scores).map((judge) => (
                    <View key={judge} style={{ marginBottom: 10 }}>
                      <Text style={styles.scoreLine}>{judge}:</Text>
                      {isPrincipalJudge ? (
                        <TextInput
                          style={styles.scoreInput}
                          keyboardType="numeric"
                          value={String(selectedCompetitor.scores[judge])}
                          onChangeText={(text) =>
                            setSelectedCompetitor((prev: any) => ({
                              ...prev,
                              scores: { ...prev.scores, [judge]: text },
                            }))
                          }
                        />
                      ) : (
                        <Text style={styles.scoreLine}>
                          {selectedCompetitor.scores[judge] ?? "N/A"}
                        </Text>
                      )}
                    </View>
                  ))}
                </ScrollView>

                <View style={{ flexDirection: "row", marginTop: 16 }}>
                  <Pressable
                    style={[
                      styles.closeBtn,
                      { backgroundColor: "#777", flex: 1, marginRight: 8 },
                    ]}
                    onPress={closeDetails}
                  >
                    <Text style={styles.closeBtnText}>Close</Text>
                  </Pressable>
                  {isPrincipalJudge && (
                    <Pressable
                      style={[
                        styles.closeBtn,
                        { backgroundColor: "green", flex: 1 },
                      ]}
                      onPress={saveScores}
                    >
                      <Text style={styles.closeBtnText}>Save</Text>
                    </Pressable>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
    marginBottom: 8,
  },
  cardsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  card: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f7f7f7",
    marginRight: 6,
    alignItems: "center",
  },
  cardSelected: { backgroundColor: "#d1f0ff", borderColor: "#00aaff" },
  cardText: { fontSize: 14, fontWeight: "500" },
  competitorCard: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#eee",
  },
  competitorName: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
  totalScore: { fontSize: 16, marginBottom: 8 },
  membersBox: { marginVertical: 6, paddingLeft: 8 },
  memberText: { fontSize: 14, color: "#444" },
  noResults: {
    marginTop: 20,
    fontSize: 16,
    textAlign: "center",
    color: "#999",
  },
  detailsBtn: {
    marginTop: 6,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#e0f0ff",
    alignItems: "center",
  },
  detailsBtnText: { fontSize: 15, color: "#0077cc", fontWeight: "500" },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "85%",
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  modalSubtitle: { fontSize: 16, marginBottom: 4 },
  closeBtn: { padding: 10, borderRadius: 8, alignItems: "center" },
  closeBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  scoreInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 6,
    fontSize: 15,
    marginTop: 4,
  },
  scoreLine: { fontSize: 15, color: "#333", marginBottom: 2 }, // ✅ added
});
