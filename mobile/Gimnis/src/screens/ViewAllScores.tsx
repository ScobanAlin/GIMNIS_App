import React, { useState, useEffect } from "react";
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

// API validate competitor (finalize total score)
async function validateCompetitor(competitorId: number) {
  const res = await fetch(`${BASE_URL}/api/scores/${competitorId}/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to validate competitor");
  return await res.json();
}

// check if all scores are filled
const allScoresSubmitted = (scores?: Record<string, any>) => {
  if (!scores) return false;
  return Object.values(scores).every(
    (v) => v !== null && v !== undefined && v !== "N/A" && v !== ""
  );
};

// helper for grouping scores
function groupScores(scores?: { [judge: string]: any }) {
  if (!scores) {
    return {
      execution: [],
      artistry: [],
      difficulty: [],
      line: [],
      chrono: [],
      principal: [],
    };
  }
  const entries = Object.entries(scores);
  return {
    execution: entries.slice(0, 4),
    artistry: entries.slice(4, 8),
    difficulty: entries.slice(8, 10),
    line: entries.slice(10, 11),
    chrono: entries.slice(11, 12),
    principal: entries.slice(12, 13),
  };
}

// API fetch competitors
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

// API fetch scores for one competitor
async function fetchCompetitorScores(competitorId: number) {
  const res = await fetch(`${BASE_URL}/api/scores/${competitorId}`);
  if (!res.ok) throw new Error("Failed to fetch scores");
  return await res.json();
}

// API submit score (one by one)
async function submitScore(
  judge_id: number,
  competitor_id: number,
  value: number
) {
  const res = await fetch(`${BASE_URL}/api/scores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ judge_id, competitor_id, value }),
  });
  if (!res.ok) throw new Error("Failed to update score");
  return await res.json();
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

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingJudge, setEditingJudge] = useState<{
    judge: string;
    judge_id: number;
    value: string;
  } | null>(null);

  const [principalValue, setPrincipalValue] = useState<string>("");

  const handleCategoryPress = async (category: string) => {
    setSelectedCategory(category);
    setLoading(true);
    const data = await fetchCompetitors(category);
    setCompetitors(data);
    setLoading(false);
  };

  const calculateTotal = (scores?: Record<string, number | string>) => {
    if (!scores) return "N/A";
    const values = Object.values(scores).filter((s) => typeof s === "number");
    if (values.length === 0) return "N/A";
    return (values as number[]).reduce((sum, v) => sum + v, 0).toFixed(2);
  };

  const openDetails = async (c: any) => {
    try {
      const scoreData = await fetchCompetitorScores(c.id);
      setSelectedCompetitor({ ...c, ...scoreData });
      setModalVisible(true);
    } catch (err) {
      Alert.alert("Error", "Could not load competitor scores");
    }
  };

  const closeDetails = () => {
    setModalVisible(false);
    setSelectedCompetitor(null);
  };

  const openEditScore = (
    judge: string,
    judge_id: number,
    value: string | number
  ) => {
    setEditingJudge({ judge, judge_id, value: String(value ?? "") });
    setEditModalVisible(true);
  };

  const handleSaveScore = async () => {
    if (!selectedCompetitor || !editingJudge) return;
    try {
      await submitScore(
        editingJudge.judge_id,
        selectedCompetitor.id,
        Number(editingJudge.value)
      );
      Alert.alert("✅ Success", "Score updated");

      setSelectedCompetitor((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          scores: {
            ...prev.scores,
            [editingJudge.judge]: Number(editingJudge.value),
          },
        };
      });

      setEditModalVisible(false);
      setEditingJudge(null);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleSavePrincipal = async () => {
    if (!selectedCompetitor) return;

    const judgeId = 1; // Principal Judge ID (hardcoded for demo)   TODO

    try {
      await submitScore(judgeId, selectedCompetitor.id, Number(principalValue));
      Alert.alert("✅ Success", "Principal Judge score updated");

      setSelectedCompetitor((prev: any) =>
        prev
          ? {
              ...prev,
              scores: {
                ...prev.scores,
                ["Principal Judge Penalization"]: Number(principalValue),
              },
            }
          : prev
      );
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  // Poll scores every 3s while modal open
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (modalVisible && selectedCompetitor) {
      interval = setInterval(async () => {
        try {
          const updated = await fetchCompetitorScores(selectedCompetitor.id);
          setSelectedCompetitor((prev: any) =>
            prev ? { ...prev, ...updated } : prev
          );
        } catch (err) {
          console.error("Error refreshing scores", err);
        }
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [modalVisible, selectedCompetitor]);

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

      {/* category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsContainer}
        style={{ flexGrow: 0 }}
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

      {/* competitors */}
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

      {/* competitor details modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedCompetitor && (
              <>
                <Text style={styles.modalTitle}>{selectedCompetitor.name}</Text>
                <Text style={styles.modalSubtitle}>
                  Club: {selectedCompetitor.club}
                </Text>

                <ScrollView style={{ marginVertical: 10 }}>
                  {(() => {
                    const groups = groupScores(selectedCompetitor.scores);

                    const renderGroup = (
                      label: string,
                      group: [string, any][],
                      allowEdit = true
                    ) => (
                      <View style={styles.scoreGroup} key={label}>
                        <Text style={styles.groupTitle}>{label}</Text>
                        {group.map(([judge, value]) => (
                          <View key={judge} style={styles.scoreRow}>
                            <Text style={styles.scoreLine}>
                              {judge}: {value ?? "N/A"}
                            </Text>
                            {allowEdit &&
                              value !== null &&
                              value !== undefined && (
                                <Pressable
                                  style={styles.editBtn}
                                  onPress={() =>
                                    openEditScore(
                                      judge,
                                      selectedCompetitor.judge_ids[judge],
                                      value
                                    )
                                  }
                                >
                                  <Text style={styles.editBtnText}>
                                    ✏️ Edit
                                  </Text>
                                </Pressable>
                              )}
                          </View>
                        ))}
                      </View>
                    );

                    return (
                      <>
                        {renderGroup("Execution (4)", groups.execution)}
                        {renderGroup("Artistry (4)", groups.artistry)}
                        {renderGroup("Difficulty (2)", groups.difficulty)}
                        {renderGroup("Line Penalization", groups.line)}
                        {renderGroup(
                          "Chronometric Penalization",
                          groups.chrono
                        )}

                        {/* Principal Judge input */}
                        <View style={styles.scoreGroup}>
                          <Text style={styles.groupTitle}>
                            Principal Judge Penalization
                          </Text>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                            }}
                          >
                            <TextInput
                              style={[styles.scoreInput, { flex: 1 }]}
                              keyboardType="numeric"
                              value={principalValue}
                              onChangeText={setPrincipalValue}
                              placeholder="Enter penalty"
                            />
                            <Pressable
                              style={[
                                styles.closeBtn,
                                { backgroundColor: "green", marginLeft: 8 },
                              ]}
                              onPress={handleSavePrincipal}
                            >
                              <Text style={styles.closeBtnText}>Set</Text>
                            </Pressable>
                          </View>
                          <Text style={{ marginTop: 6, color: "#333" }}>
                            Current:{" "}
                            {selectedCompetitor.scores?.[
                              "Principal Judge Penalization"
                            ] ?? "N/A"}
                          </Text>
                        </View>
                      </>
                    );
                  })()}
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

                  {allScoresSubmitted(selectedCompetitor?.scores) && (
                    <Pressable
                      style={[
                        styles.closeBtn,
                        { backgroundColor: "green", flex: 1 },
                      ]}
                      onPress={async () => {
                        try {
                          await validateCompetitor(selectedCompetitor.id);
                          Alert.alert(
                            "✅ Validated",
                            "Total score has been locked."
                          );
                          closeDetails();
                        } catch (err: any) {
                          Alert.alert("Error", err.message);
                        }
                      }}
                    >
                      <Text style={styles.closeBtnText}>Validate</Text>
                    </Pressable>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* edit score modal */}
      <Modal visible={editModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {editingJudge && (
              <>
                <Text style={styles.modalTitle}>Edit Score</Text>
                <Text style={styles.modalSubtitle}>{editingJudge.judge}</Text>

                <TextInput
                  style={styles.scoreInput}
                  keyboardType="numeric"
                  value={editingJudge.value}
                  onChangeText={(text) =>
                    setEditingJudge((prev) =>
                      prev ? { ...prev, value: text } : null
                    )
                  }
                />

                <View style={{ flexDirection: "row", marginTop: 16 }}>
                  <Pressable
                    style={[
                      styles.closeBtn,
                      { backgroundColor: "#777", flex: 1, marginRight: 8 },
                    ]}
                    onPress={() => setEditModalVisible(false)}
                  >
                    <Text style={styles.closeBtnText}>Cancel</Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.closeBtn,
                      { backgroundColor: "green", flex: 1, marginRight: 8 },
                    ]}
                    onPress={handleSaveScore}
                  >
                    <Text style={styles.closeBtnText}>Save</Text>
                  </Pressable>

                  {allScoresSubmitted(selectedCompetitor?.scores) && (
                    <Pressable
                      style={[
                        styles.closeBtn,
                        { backgroundColor: "purple", flex: 1 },
                      ]}
                      onPress={async () => {
                        try {
                          await validateCompetitor(selectedCompetitor.id);
                          Alert.alert(
                            "✅ Validated",
                            "Total score has been locked."
                          );
                          setEditModalVisible(false);
                          closeDetails();
                        } catch (err: any) {
                          Alert.alert("Error", err.message);
                        }
                      }}
                    >
                      <Text style={styles.closeBtnText}>Validate</Text>
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
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: { fontSize: 16, marginBottom: 4, textAlign: "center" },
  closeBtn: { padding: 10, borderRadius: 8, alignItems: "center" },
  closeBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  scoreInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 6,
    fontSize: 15,
    marginTop: 4,
    textAlign: "center",
  },
  scoreLine: { fontSize: 15, color: "#333" },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  editBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "#e6f7ff",
    borderRadius: 6,
  },
  editBtnText: { fontSize: 14, color: "#0077cc" },
  scoreGroup: {
    marginBottom: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    color: "#444",
  },
});
