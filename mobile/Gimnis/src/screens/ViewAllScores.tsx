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

// --- API helpers ---
async function validateCompetitor(competitorId: number) {
  const res = await fetch(`${BASE_URL}/api/scores/${competitorId}/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to validate competitor");
  return await res.json();
}

async function unvalidateCompetitor(competitorId: number) {
  const res = await fetch(`${BASE_URL}/api/scores/${competitorId}/unvalidate`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to unvalidate competitor");
  return await res.json();
}

async function fetchCompetitors(category: string) {
  const res = await fetch(
    `${BASE_URL}/api/competitors/by-category?category=${encodeURIComponent(
      category
    )}`
  );
  if (!res.ok) throw new Error("Failed to fetch competitors");
  return await res.json();
}

async function fetchCompetitorScores(competitorId: number) {
  const res = await fetch(`${BASE_URL}/api/scores/${competitorId}`);
  if (!res.ok) throw new Error("Failed to fetch scores");
  return await res.json();
}

async function submitScore(
  judge_id: number,
  competitor_id: number,
  value: number,
  score_type: string
) {
  const res = await fetch(`${BASE_URL}/api/scores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ judge_id, competitor_id, value, score_type }),
  });
  if (!res.ok) throw new Error("Failed to update score");
  return await res.json();
}

// --- helpers ---
function hasDiscrepancy(group: [string, any][]) {
  const nums = group
    .map(([_, v]) => (typeof v === "number" ? v : parseFloat(v)))
    .filter((v) => !isNaN(v));
  if (nums.length < 2) return false;
  return Math.max(...nums) - Math.min(...nums) > 1.0;
}

function allScoresSubmitted(scores?: Record<string, any>) {
  if (!scores) return false;

  // check all non-empty
  const allFilled = Object.values(scores).every(
    (v) => v !== null && v !== undefined && v !== "N/A" && v !== ""
  );

  if (!allFilled) return false;

  // ✅ check difficulty penalization count
  const diffPenalizations = Object.entries(scores).filter(
    ([key, v]) =>
      key.toLowerCase().includes("difficulty_penalization") &&
      v !== null &&
      v !== undefined &&
      v !== "N/A" &&
      v !== ""
  );

  return diffPenalizations.length >= 2;
}

function groupScores(
  scores: Record<string, any>,
  judge_ids: Record<string, number>
) {
  const entries = Object.entries(scores);

  const ordered: { [key: string]: [string, any][] } = {
    execution: [],
    artistry: [],
    difficulty: [],
    difficulty_penalization: [],
    line_penalization: [],
    principal_penalization: [],
  };

  for (const [label, val] of entries) {
    const lower = label.toLowerCase();

    if (lower.includes("execution")) ordered.execution.push([label, val]);
    else if (lower.includes("artistry")) ordered.artistry.push([label, val]);
    else if (lower.includes("difficulty_penalization"))
      ordered.difficulty_penalization.push([label, val]);
    else if (lower.includes("difficulty"))
      ordered.difficulty.push([label, val]);
    else if (lower.includes("line"))
      ordered.line_penalization.push([label, val]);
    else if (lower.includes("principal"))
      ordered.principal_penalization.push([label, val]);
  }

  return ordered;
}

function inferScoreTypeFromLabel(label: string): string {
  const lower = label.toLowerCase();
  if (lower.includes("execution")) return "execution";
  if (lower.includes("artistry")) return "artistry";
  if (lower.includes("difficulty penalization"))
    return "difficulty_penalization";
  if (lower.includes("difficulty")) return "difficulty";
  if (lower.includes("line")) return "line_penalization";
  if (lower.includes("principal")) return "principal_penalization";
  return "other";
}

// --- component ---
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
    score_type: string;
  } | null>(null);

const [scores, setScores] = useState<Record<string, string>>({});

// --- input sanitizer ---
const handleScoreChange = (type: string, value: string) => {
  let sanitized = value.replace(/[^0-9.]/g, "");
  const parts = sanitized.split(".");
  if (parts.length > 2) sanitized = parts[0] + "." + parts[1];
  if (parts[1]?.length > 1) sanitized = parts[0] + "." + parts[1].slice(0, 1);
  if (/^0[0-9]/.test(sanitized)) sanitized = sanitized.replace(/^0+/, "");
  if (sanitized.startsWith(".")) sanitized = "0" + sanitized;
  if (/^(1[1-9]|[2-9][0-9])$/.test(sanitized)) sanitized = sanitized[0];
  if (sanitized.endsWith(".")) {
    setScores((prev) => ({ ...prev, [type]: sanitized }));
    return;
  }
  let num = parseFloat(sanitized);
  if (!isNaN(num)) {
    if (num > 10) num = 10;
    sanitized = num.toString();
  }
  setScores((prev) => ({ ...prev, [type]: sanitized }));
};


  const handleCategoryPress = async (category: string) => {
    setSelectedCategory(category);
    setLoading(true);
    const data = await fetchCompetitors(category);
    setCompetitors(data);
    setLoading(false);
  };

  const openDetails = async (c: any) => {
    const scoreData = await fetchCompetitorScores(c.id);
    setSelectedCompetitor({ ...c, ...scoreData });
    setModalVisible(true);
  };

  const handleSaveScore = async () => {
    if (!selectedCompetitor || !editingJudge) return;

    try {
      await submitScore(
        editingJudge.judge_id,
        selectedCompetitor.id,
        Number(editingJudge.value),
        editingJudge.score_type
      );

      Alert.alert("✅ Success", "Score updated");

      setSelectedCompetitor((prev: any) =>
        prev
          ? {
              ...prev,
              scores: {
                ...prev.scores,
                [editingJudge.judge]: Number(editingJudge.value),
              },
            }
          : prev
      );

      setEditModalVisible(false);
      setEditingJudge(null);
    } catch (err: any) {
      console.error("Failed to update score:", err);
      Alert.alert("❌ Error", err.message || "Failed to update score");
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>All Scores</Text>

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

      {/* competitor list */}
      <ScrollView style={{ flex: 1 }}>
        {loading && <ActivityIndicator size="large" />}
        {!loading && selectedCategory && competitors.length === 0 && (
          <Text style={styles.noResults}>
            No competitors in {selectedCategory}
          </Text>
        )}
        {!loading &&
          competitors.map((c) => (
            <View
              key={c.id}
              style={[
                styles.competitorCard,
                c.is_validated && styles.validatedCard,
              ]}
            >
              {c.category.startsWith("I") ? (
                <>
                  {/* 👤 Individual competitor */}
                  <Text style={styles.competitorName}>
                    👤 {c.members[0]?.first_name} {c.members[0]?.last_name}
                  </Text>
                  <Text style={styles.memberText}>
                    ({c.members[0]?.sex}, {c.members[0]?.age} yrs)
                  </Text>
                </>
              ) : (
                <>
                  {/* 👥 Group competitor */}
                  <Text style={styles.membersTitle}>👥 Members</Text>
                  <View style={styles.membersBox}>
                    {c.members?.length > 0 ? (
                      c.members.map((m: any) => (
                        <Text key={m.id} style={styles.memberText}>
                          • {m.first_name} {m.last_name} ({m.sex}, {m.age} yrs)
                        </Text>
                      ))
                    ) : (
                      <Text style={styles.memberText}>No members</Text>
                    )}
                  </View>
                </>
              )}

              {/* Smaller Club info */}
              <Text style={styles.detail}>Club: {c.club}</Text>
              <Text style={styles.detail}>Category: {c.category}</Text>

              <Pressable
                style={styles.detailsBtn}
                onPress={() => openDetails(c)}
              >
                <Text style={styles.detailsBtnText}>See Scores</Text>
              </Pressable>
            </View>
          ))}
      </ScrollView>

      {/* modal for scores */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedCompetitor && (
              <>
                {/* Header */}
                <Text style={styles.modalTitle}>
                  {selectedCompetitor.category.startsWith("I")
                    ? `${selectedCompetitor.members[0]?.last_name} ${selectedCompetitor.members[0]?.first_name} (${selectedCompetitor.members[0]?.sex}, ${selectedCompetitor.members[0]?.age} yrs)`
                    : selectedCompetitor.members
                        ?.map(
                          (m: any) =>
                            `${m.last_name} ${m.first_name} (${m.sex}, ${m.age} yrs)`
                        )
                        .join(" / ")}
                </Text>
                <Text style={styles.modalSubTitle}>
                  Club: {selectedCompetitor.club} •{" "}
                  {selectedCompetitor.category}
                </Text>

                {/* Scores */}
                <ScrollView style={{ marginTop: 10 }}>
                  {(() => {
                    const groups = groupScores(
                      selectedCompetitor.scores,
                      selectedCompetitor.judge_ids
                    );

                    const renderGroup = (
                      label: string,
                      group: [string, any][],
                      editable: boolean
                    ) => {
                      const discrepant = hasDiscrepancy(group);
                      const scoreType = inferScoreTypeFromLabel(label);
                      return (
                        <View
                          style={[
                            styles.scoreGroup,
                            discrepant && styles.discrepantGroup,
                          ]}
                          key={label}
                        >
                          <Text style={styles.groupTitle}>
                            {label} {discrepant && "⚠️"}
                          </Text>
                          {group.map(([judge, value]) => (
                            <View key={judge} style={styles.scoreRow}>
                              <Text style={styles.scoreLine}>
                                {judge}: {value ?? "N/A"}
                              </Text>
                              {!selectedCompetitor.is_validated && editable && (
                                <Pressable
                                  style={styles.editBtn}
                                  onPress={() => {
                                    setEditingJudge({
                                      judge,
                                      judge_id:
                                        selectedCompetitor.judge_ids[judge],
                                      value: String(value ?? ""),
                                      score_type: scoreType,
                                    });
                                    setEditModalVisible(true);
                                  }}
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
                    };

                    return (
                      <>
                        {renderGroup("Execution", groups.execution, true)}
                        {renderGroup("Artistry", groups.artistry, true)}
                        {renderGroup("Difficulty", groups.difficulty, true)}
                        {renderGroup(
                          "Difficulty Penalization",
                          groups.difficulty_penalization,
                          true
                        )}
                        {renderGroup(
                          "Line Penalization",
                          groups.line_penalization,
                          true
                        )}
                        {renderGroup(
                          "Principal Judge Penalization",
                          groups.principal_penalization,
                          true
                        )}
                      </>
                    );
                  })()}
                </ScrollView>

                {/* Footer buttons */}
                <View style={styles.footerActions}>
                  <Pressable
                    style={[styles.footerBtn, { backgroundColor: "gray" }]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.footerBtnText}>Cancel</Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.footerBtn,
                      {
                        backgroundColor: selectedCompetitor.is_validated
                          ? "red"
                          : !allScoresSubmitted(selectedCompetitor.scores)
                          ? "gray" // 🔹 Greyed out when not pressable
                          : "green",
                      },
                    ]}
                    disabled={
                      !selectedCompetitor.is_validated &&
                      !allScoresSubmitted(selectedCompetitor.scores)
                    }
                    onPress={async () => {
                      try {
                        if (selectedCompetitor.is_validated) {
                          await unvalidateCompetitor(selectedCompetitor.id);
                          Alert.alert(
                            "❌ Unvalidated",
                            "Competitor unvalidated successfully!"
                          );
                        } else {
                          await validateCompetitor(selectedCompetitor.id);
                          Alert.alert(
                            "✅ Validated",
                            "Competitor validated successfully!"
                          );
                        }

                        if (selectedCategory) {
                          const data = await fetchCompetitors(selectedCategory);
                          setCompetitors(data);
                        }

                        setModalVisible(false);
                      } catch (err: any) {
                        Alert.alert("❌ Error", err.message);
                      }
                    }}
                  >
                    <Text style={styles.footerBtnText}>
                      {selectedCompetitor.is_validated
                        ? "Unvalidate"
                        : "Validate"}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* edit modal */}
      <Modal visible={editModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {editingJudge && (
              <>
                <Text style={styles.modalTitle}>Edit Score</Text>
                <TextInput
                  style={styles.scoreInput}
                  keyboardType="numeric"
                  value={scores[editingJudge.score_type] ?? editingJudge.value}
                  onChangeText={(text) => {
                    handleScoreChange(editingJudge.score_type, text);
                    setEditingJudge((prev) =>
                      prev ? { ...prev, value: text } : null
                    );
                  }}
                />

                <View style={styles.footerActions}>
                  <Pressable
                    style={[
                      styles.closeBtn,
                      { backgroundColor: "gray", flex: 1, marginRight: 8 },
                    ]}
                    onPress={() => {
                      setEditModalVisible(false);
                      setEditingJudge(null);
                    }}
                  >
                    <Text style={styles.closeBtnText}>Cancel</Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.closeBtn,
                      { backgroundColor: "green", flex: 1 },
                    ]}
                    onPress={handleSaveScore}
                  >
                    <Text style={styles.closeBtnText}>Save</Text>
                  </Pressable>
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
  validatedCard: {
    borderColor: "green",
    borderWidth: 2,
    backgroundColor: "#e6ffe6",
  },
  competitorName: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
  detail: { fontSize: 14, color: "#555", marginBottom: 6 },
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
  membersTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 6,
    marginBottom: 4,
    color: "#222",
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
  closeBtn: {
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
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
    marginLeft: 4,
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
  discrepant: {
    backgroundColor: "#ffe6e6",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "red",
    padding: 6,
  },
  footerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  modalSubTitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#555",
    marginBottom: 10,
  },

  discrepantGroup: {
    borderWidth: 1.5,
    borderColor: "red",
    borderRadius: 6,
    backgroundColor: "#ffeaea",
    padding: 6,
    marginBottom: 12,
  },
  footerBtn: {
    flex: 1,
    padding: 12,
    marginHorizontal: 6,
    borderRadius: 8,
    alignItems: "center",
  },
  footerBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
