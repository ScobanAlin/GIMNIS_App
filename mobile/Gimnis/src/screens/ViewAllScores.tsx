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

// --- API helpers ---
async function validateCompetitor(competitorId: number, totalScore: number) {
  const res = await fetch(`${BASE_URL}/api/scores/${competitorId}/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ totalScore }),
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

async function deleteScore(
  judge_id: number,
  competitor_id: number,
  score_type: string
) {
  const res = await fetch(`${BASE_URL}/api/scores`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ judge_id, competitor_id, score_type }),
  });
  if (!res.ok) throw new Error("Failed to delete score");
  return await res.json();
}

function calculateTotalScore(
  scores: Record<string, any>,
  category: string,
  members: { sex: "M" | "F" }[]
): number {
  const getMiddleTwo = (arr: number[]) => {
    if (arr.length < 4) return [0, 0];
    const sorted = [...arr].sort((a, b) => a - b);
    return [sorted[1], sorted[2]];
  };

  const applyTolerance = (arr: number[]): number => {
    if (arr.length < 4) return 0;
    const [m1, m2] = getMiddleTwo(arr);
    const avgMiddle = (m1 + m2) / 2;
    const diff = Math.abs(m1 - m2);

    // pick allowed tolerance based on final score range
    let allowed = 0.6; // default lowest range
    if (avgMiddle >= 8.0) allowed = 0.3;
    else if (avgMiddle >= 7.0) allowed = 0.4;
    else if (avgMiddle >= 6.0) allowed = 0.5;

    if (diff > allowed) {
      // ❌ tolerance exceeded → use average of all scores
      return arr.reduce((a, b) => a + b, 0) / arr.length;
    }
    // ✅ within tolerance → use average of the two middle scores
    return avgMiddle;
  };

  const artistryScores = Object.entries(scores)
    .filter(([k]) => k.toLowerCase().includes("artistry"))
    .map(([_, v]) => parseFloat(v as string))
    .filter((v) => !isNaN(v));

  const executionScores = Object.entries(scores)
    .filter(([k]) => k.toLowerCase().includes("execution"))
    .map(([_, v]) => parseFloat(v as string))
    .filter((v) => !isNaN(v));

  const difficultyScores = Object.entries(scores)
    .filter(
      ([k]) =>
        k.toLowerCase().includes("difficulty") &&
        !k.toLowerCase().includes("penalization")
    )
    .map(([_, v]) => parseFloat(v as string))
    .filter((v) => !isNaN(v));

  const diffPenalties = Object.entries(scores)
    .filter(([k]) => k.toLowerCase().includes("difficulty_penalization"))
    .map(([_, v]) => parseFloat(v as string))
    .filter((v) => !isNaN(v));

  const linePenalty =
    Object.entries(scores)
      .filter(([k]) => k.toLowerCase().includes("line"))
      .map(([_, v]) => parseFloat(v as string))[0] || 0;

  const principalPenalty =
    Object.entries(scores)
      .filter(([k]) => k.toLowerCase().includes("principal"))
      .map(([_, v]) => parseFloat(v as string))[0] || 0;

  //
  // 🟢 Default divisor
  let divisor = 2.0;

  if (
    category.toLowerCase().includes("seniors") &&
    (category.toLowerCase().includes("trio") ||
      category.toLowerCase().includes("group"))
  ) {
    const sexes = members.map((m) => m.sex);
    const hasMen = sexes.includes("M");
    const hasWomen = sexes.includes("F");

    if (hasMen && hasWomen) divisor = 1.9;
    else if (hasWomen) divisor = 1.8;
    else divisor = 2.0;
  }

  // ✅ apply tolerance logic
  const artistryPart = applyTolerance(artistryScores);
  const executionPart = applyTolerance(executionScores);

  const difficultyPart =
    difficultyScores.length >= 2
      ? (difficultyScores[0] + difficultyScores[1]) / 2
      : difficultyScores[0] || 0;

  const penaltyPart =
    (diffPenalties[0] + diffPenalties[1]) / 2 + linePenalty + principalPenalty;

  const rawTotal =
    artistryPart + executionPart + difficultyPart / divisor - penaltyPart;

  return Math.max(0, parseFloat(rawTotal.toFixed(3)));
}

// NEW: Section-specific calculation helpers
function calculateSectionTotal(
  scores: Record<string, any>,
  category: string,
  members: { sex: "M" | "F" }[],
  sectionType: string
): number {
  const getMiddleTwo = (arr: number[]) => {
    if (arr.length < 4) return [0, 0];
    const sorted = [...arr].sort((a, b) => a - b);
    return [sorted[1], sorted[2]];
  };

  const applyTolerance = (arr: number[]): number => {
    if (arr.length < 4) return 0;
    const [m1, m2] = getMiddleTwo(arr);
    const avgMiddle = (m1 + m2) / 2;
    const diff = Math.abs(m1 - m2);

    let allowed = 0.6;
    if (avgMiddle >= 8.0) allowed = 0.3;
    else if (avgMiddle >= 7.0) allowed = 0.4;
    else if (avgMiddle >= 6.0) allowed = 0.5;

    if (diff > allowed) {
      return arr.reduce((a, b) => a + b, 0) / arr.length;
    }
    return avgMiddle;
  };

  switch (sectionType) {
    case "execution": {
      const executionScores = Object.entries(scores)
        .filter(([k]) => k.toLowerCase().includes("execution"))
        .map(([_, v]) => parseFloat(v as string))
        .filter((v) => !isNaN(v));
      return executionScores.length >= 4 ? applyTolerance(executionScores) : 0;
    }

    case "artistry": {
      const artistryScores = Object.entries(scores)
        .filter(([k]) => k.toLowerCase().includes("artistry"))
        .map(([_, v]) => parseFloat(v as string))
        .filter((v) => !isNaN(v));
      return artistryScores.length >= 4 ? applyTolerance(artistryScores) : 0;
    }

    case "difficulty": {
      const difficultyScores = Object.entries(scores)
        .filter(
          ([k]) =>
            k.toLowerCase().includes("difficulty") &&
            !k.toLowerCase().includes("penalization")
        )
        .map(([_, v]) => parseFloat(v as string))
        .filter((v) => !isNaN(v));

      let divisor = 2.0;
      if (
        category.toLowerCase().includes("seniors") &&
        (category.toLowerCase().includes("trio") ||
          category.toLowerCase().includes("group"))
      ) {
        const sexes = members.map((m) => m.sex);
        const hasMen = sexes.includes("M");
        const hasWomen = sexes.includes("F");

        if (hasMen && hasWomen) divisor = 1.9;
        else if (hasWomen) divisor = 1.8;
        else divisor = 2.0;
      }

      const difficultyPart =
        difficultyScores.length >= 2
          ? (difficultyScores[0] + difficultyScores[1]) / 2
          : difficultyScores[0] || 0;

      return difficultyPart / divisor;
    }

    case "difficulty_penalization": {
      const diffPenalties = Object.entries(scores)
        .filter(([k]) => k.toLowerCase().includes("difficulty_penalization"))
        .map(([_, v]) => parseFloat(v as string))
        .filter((v) => !isNaN(v));

      return diffPenalties.length >= 2
        ? (diffPenalties[0] + diffPenalties[1]) / 2
        : diffPenalties[0] || 0;
    }

    case "line_penalization": {
      return (
        Object.entries(scores)
          .filter(([k]) => k.toLowerCase().includes("line"))
          .map(([_, v]) => parseFloat(v as string))[0] || 0
      );
    }

    case "principal_penalization": {
      return (
        Object.entries(scores)
          .filter(([k]) => k.toLowerCase().includes("principal"))
          .map(([_, v]) => parseFloat(v as string))[0] || 0
      );
    }

    default:
      return 0;
  }
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
  return Math.max(...nums) - Math.min(...nums) > 1.1;
}

function hasAnyDifference(group: [string, any][]) {
  const nums = group
    .map(([_, v]) => (typeof v === "number" ? v : parseFloat(v)))
    .filter((v) => !isNaN(v));
  if (nums.length < 2) return false;
  return Math.max(...nums) !== Math.min(...nums);
}

function allScoresSubmitted(scores?: Record<string, any>) {
  if (!scores) return false;

  const allFilled = Object.values(scores).every(
    (v) => v !== null && v !== undefined && v !== "N/A" && v !== ""
  );

  if (!allFilled) return false;

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

export default function ViewAllScores() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState<any | null>(
    null
  );
  const [competitorSearch, setCompetitorSearch] = useState("");

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingJudge, setEditingJudge] = useState<{
    judge: string;
    judge_id: number;
    value: string;
    score_type: string;
  } | null>(null);

  const [currentCompetitor, setCurrentCompetitor] = useState<any | null>(null);

  const fetchCurrentCompetitor = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/votes/current`);
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.competitor_id) {
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
    let interval: NodeJS.Timeout;

    if (modalVisible && selectedCompetitor) {
      // Start polling every 3 seconds
      interval = setInterval(async () => {
        try {
          const fresh = await fetchCompetitorScores(selectedCompetitor.id);
          setSelectedCompetitor((prev: any) =>
            prev ? { ...prev, ...fresh } : prev
          );
        } catch (err) {
          console.error("Failed to refresh scores:", err);
        }
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [modalVisible, selectedCompetitor?.id]);

  useEffect(() => {
    fetchCurrentCompetitor();
    const interval = setInterval(fetchCurrentCompetitor, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCategoryPress = async (category: string) => {
    setSelectedCategory(category);
    setLoading(true);
    try {
      const data = await fetchCompetitors(category);
      setCompetitors(data);
    } catch (err) {
      console.error("Failed to fetch competitors:", err);
      setCompetitors([]);
    } finally {
      setLoading(false);
    }
  };

  const openDetails = async (c: any) => {
    const competitorId = c.id ?? c.competitor_id;
    if (!competitorId) return;

    try {
      const scoreData = await fetchCompetitorScores(competitorId);
      setSelectedCompetitor({ ...c, ...scoreData, id: competitorId });
      setModalVisible(true);
    } catch (err) {
      console.error("Failed to fetch competitor scores:", err);
    }
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

      setSelectedCompetitor((prev: any) =>
        prev
          ? {
              ...prev,
              scores: {
                ...prev.scores,
                [editingJudge.judge]: Number(editingJudge.value).toFixed(1),
              },
            }
          : prev
      );

      setEditModalVisible(false);
      setEditingJudge(null);
    } catch (err: any) {
      console.error("Failed to update score:", err);
      Alert.alert("Error", err.message || "Failed to update score");
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  const getScoreTypeColor = (scoreType: string) => {
    if (scoreType.includes("penalization")) return "#FF7675";
    if (scoreType === "execution") return "#00B894";
    if (scoreType === "artistry") return "#6C5CE7";
    if (scoreType === "difficulty") return "#74B9FF";
    return "#FDCB6E";
  };

  const filteredCompetitors = competitors.filter((c) => {
    const searchLower = competitorSearch.toLowerCase();
    return (
      String(c.id).includes(searchLower) ||
      (c.club && c.club.toLowerCase().includes(searchLower)) ||
      (c.category && c.category.toLowerCase().includes(searchLower)) ||
      (c.members &&
        c.members.some(
          (m: any) =>
            m.first_name.toLowerCase().includes(searchLower) ||
            m.last_name.toLowerCase().includes(searchLower)
        ))
    );
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Score Management</Text>
        <Text style={styles.subtitle}>Review and validate all scores</Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Competitor Card */}
        {currentCompetitor && (
          <View style={styles.currentCard}>
            <View style={styles.currentHeader}>
              <Text style={styles.currentTitle}>Active Competitor</Text>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
            <Text style={styles.currentName}>
              {currentCompetitor.members
                ?.map((m: any) => ` ${m.last_name} ${m.first_name}`)
                .join("/ ")}
            </Text>
            <Text style={styles.currentDetail}>
              {currentCompetitor.category} • {currentCompetitor.club}
            </Text>

            <Pressable
              style={styles.viewScoresBtn}
              onPress={() => openDetails(currentCompetitor)}
            >
              <Text style={styles.viewScoresBtnText}>View Scores</Text>
            </Pressable>
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
          style={styles.competitorsContainer}
          showsVerticalScrollIndicator={false}
        >
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6C5CE7" />
              <Text style={styles.loadingText}>Loading competitors...</Text>
            </View>
          )}

          {!loading && selectedCategory && competitors.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyText}>
                No competitors in {selectedCategory}
              </Text>
            </View>
          )}

          {!loading &&
            filteredCompetitors.map((c) => (
              <View
                key={c.id}
                style={[
                  styles.competitorCard,
                  c.is_validated && styles.validatedCard,
                ]}
              >
                {c.is_validated && (
                  <View style={styles.validatedBadge}>
                    <Text style={styles.validatedBadgeText}>VALIDATED</Text>
                  </View>
                )}

                <View style={styles.competitorHeader}>
                  <Text style={styles.competitorId}>#{c.id}</Text>
                  <Text style={styles.clubName}>{c.club}</Text>
                </View>

                <Text style={styles.categoryName}>{c.category}</Text>

                {/* Members */}
                {c.category.startsWith("Individual") ? (
                  <View style={styles.individualMember}>
                    <Text style={styles.memberName}>
                      {c.members[0]?.last_name} {c.members[0]?.first_name}
                    </Text>
                    <Text style={styles.memberDetails}>
                      • {c.members[0]?.sex}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.teamMembers}>
                    <Text style={styles.membersTitle}>Team Members</Text>
                    {c.members?.length > 0 ? (
                      c.members.map((m: any) => (
                        <View key={m.id} style={styles.memberItem}>
                          <Text style={styles.memberName}>
                            {m.last_name} {m.first_name}
                          </Text>
                          <Text style={styles.memberDetails}>• {m.sex}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noMembers}>No members listed</Text>
                    )}
                  </View>
                )}

                <Pressable
                  style={styles.detailsBtn}
                  onPress={() => openDetails(c)}
                >
                  <Text style={styles.detailsBtnText}>View Scores</Text>
                </Pressable>
              </View>
            ))}
        </ScrollView>
      </ScrollView>

      {/* Score Details Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedCompetitor && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {selectedCompetitor.category.startsWith("Individual")
                      ? `${selectedCompetitor.members[0]?.last_name} ${selectedCompetitor.members[0]?.first_name} `
                      : "Team Scores"}
                  </Text>
                  <Pressable
                    style={styles.closeModalBtn}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.closeModalBtnText}>×</Text>
                  </Pressable>
                </View>

                {/* NEW: Scores counter */}
                <View style={{ marginBottom: 12, alignItems: "center" }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#636E72",
                    }}
                  >
                    {
                      Object.values(selectedCompetitor.scores || {}).filter(
                        (v) =>
                          v !== null &&
                          v !== undefined &&
                          v !== "" &&
                          v !== "N/A"
                      ).length
                    }{" "}
                    / {14} scores submitted
                  </Text>
                </View>

                <Text style={styles.modalSubTitle}>
                  {selectedCompetitor.club} • {selectedCompetitor.category}
                </Text>

                {selectedCompetitor.is_validated && (
                  <View style={styles.totalScoreContainer}>
                    <Text style={styles.totalScoreLabel}>Final Score</Text>
                    <Text style={styles.totalScoreValue}>
                      {calculateTotalScore(
                        selectedCompetitor.scores,
                        selectedCompetitor.category,
                        selectedCompetitor.members
                      ).toFixed(3)}
                    </Text>
                  </View>
                )}

                <ScrollView style={styles.scoresScrollView}>
                  {(() => {
                    const groups = groupScores(
                      selectedCompetitor.scores,
                      selectedCompetitor.judge_ids
                    );

                    const renderGroup = (
                      label: string,
                      group: [string, any][],
                      editable: boolean,
                      sectionType: string
                    ) => {
                      if (!group || group.length === 0) return null;

                      const validEntries = group.filter(
                        ([_, value]) =>
                          value !== null &&
                          value !== undefined &&
                          value !== "" &&
                          value !== "N/A"
                      );

                      if (validEntries.length === 0) return null;

                      let discrepant = false;
                      if (label.toLowerCase().includes("difficulty")) {
                        discrepant = hasAnyDifference(validEntries);
                      } else {
                        discrepant = hasDiscrepancy(validEntries);
                      }

                      const scoreType = inferScoreTypeFromLabel(label);

                      // Calculate section total
                      const sectionTotal = calculateSectionTotal(
                        selectedCompetitor.scores,
                        selectedCompetitor.category,
                        selectedCompetitor.members,
                        sectionType
                      );

                      return (
                        <View
                          style={[
                            styles.scoreGroup,
                            discrepant && styles.discrepantGroup,
                          ]}
                          key={label}
                        >
                          <View style={styles.scoreGroupHeader}>
                            <Text style={styles.groupTitle}>{label}</Text>
                            {discrepant && (
                              <View style={styles.warningBadge}>
                                <Text style={styles.warningText}>!</Text>
                              </View>
                            )}
                          </View>

                          {validEntries.map(([judge, value]) => (
                            <View key={judge} style={styles.scoreRow}>
                              <View style={styles.judgeInfo}>
                                <Text style={styles.judgeName}>{judge}</Text>
                                <View
                                  style={[
                                    styles.scoreValueBadge,
                                    {
                                      backgroundColor:
                                        getScoreTypeColor(scoreType),
                                    },
                                  ]}
                                >
                                  <Text style={styles.scoreValue}>
                                    {Number(value).toFixed(1)}
                                  </Text>
                                </View>
                              </View>

                              {!selectedCompetitor.is_validated && editable && (
                                <View style={styles.scoreActions}>
                                  <Pressable
                                    style={styles.editScoreBtn}
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
                                    <Text style={styles.editScoreBtnText}>
                                      Edit
                                    </Text>
                                  </Pressable>

                                  <Pressable
                                    style={styles.deleteScoreBtn}
                                    onPress={async () => {
                                      try {
                                        const confirm =
                                          await new Promise<boolean>(
                                            (resolve) => {
                                              Alert.alert(
                                                "Confirm Delete",
                                                scoreType === "difficulty"
                                                  ? "Delete BOTH difficulty scores for all difficulty judges?"
                                                  : "Delete this score?",
                                                [
                                                  {
                                                    text: "Cancel",
                                                    style: "cancel",
                                                    onPress: () =>
                                                      resolve(false),
                                                  },
                                                  {
                                                    text: "Delete",
                                                    style: "destructive",
                                                    onPress: () =>
                                                      resolve(true),
                                                  },
                                                ]
                                              );
                                            }
                                          );
                                        if (!confirm) return;

                                        await deleteScore(
                                          selectedCompetitor.judge_ids[judge],
                                          selectedCompetitor.id,
                                          scoreType
                                        );

                                        const fresh =
                                          await fetchCompetitorScores(
                                            selectedCompetitor.id
                                          );
                                        setSelectedCompetitor((prev: any) =>
                                          prev ? { ...prev, ...fresh } : prev
                                        );
                                      } catch (err: any) {
                                        console.error("Delete failed:", err);
                                        Alert.alert(
                                          "Error",
                                          err.message ||
                                            "Failed to delete score"
                                        );
                                      }
                                    }}
                                  >
                                    <Text style={styles.deleteScoreBtnText}>
                                      Delete
                                    </Text>
                                  </Pressable>
                                </View>
                              )}
                            </View>
                          ))}

                          {/* NEW: Section Total Display */}
                          {sectionTotal > 0 && (
                            <View style={styles.sectionTotalContainer}>
                              <Text style={styles.sectionTotalLabel}>
                                Section Total:
                              </Text>
                              <View
                                style={[
                                  styles.sectionTotalBadge,
                                  {
                                    backgroundColor:
                                      getScoreTypeColor(scoreType),
                                  },
                                ]}
                              >
                                <Text style={styles.sectionTotalValue}>
                                  {sectionType.includes("penalization")
                                    ? `-${sectionTotal.toFixed(3)}`
                                    : sectionTotal.toFixed(3)}
                                </Text>
                              </View>
                            </View>
                          )}
                        </View>
                      );
                    };

                    return (
                      <>
                        {renderGroup(
                          "Execution",
                          groups.execution,
                          true,
                          "execution"
                        )}
                        {renderGroup(
                          "Artistry",
                          groups.artistry,
                          true,
                          "artistry"
                        )}
                        {renderGroup(
                          "Difficulty",
                          groups.difficulty,
                          true,
                          "difficulty"
                        )}
                        {renderGroup(
                          "Difficulty Penalization",
                          groups.difficulty_penalization,
                          true,
                          "difficulty_penalization"
                        )}
                        {renderGroup(
                          "Line Penalization",
                          groups.line_penalization,
                          true,
                          "line_penalization"
                        )}
                        {renderGroup(
                          "Principal Judge Penalization",
                          groups.principal_penalization,
                          true,
                          "principal_penalization"
                        )}
                      </>
                    );
                  })()}
                </ScrollView>

                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  <Pressable
                    style={styles.cancelBtn}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelBtnText}>Close</Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.actionBtn,
                      selectedCompetitor.is_validated
                        ? styles.unvalidateBtn
                        : !allScoresSubmitted(selectedCompetitor.scores)
                        ? styles.disabledBtn
                        : styles.validateBtn,
                    ]}
                    disabled={
                      !selectedCompetitor.is_validated &&
                      !allScoresSubmitted(selectedCompetitor.scores)
                    }
                    onPress={async () => {
                      try {
                        if (selectedCompetitor.is_validated) {
                          await unvalidateCompetitor(selectedCompetitor.id);
                        } else {
                          const total = calculateTotalScore(
                            selectedCompetitor.scores,
                            selectedCompetitor.category,
                            selectedCompetitor.members
                          );

                          Alert.alert(
                            "Confirm Validation",
                            `Total Score: ${total.toFixed(
                              3
                            )}\n\nValidate this competitor?`,
                            [
                              { text: "Cancel", style: "cancel" },
                              {
                                text: "Validate",
                                onPress: async () => {
                                  await validateCompetitor(
                                    selectedCompetitor.id,
                                    total
                                  );

                                  if (selectedCategory) {
                                    const data = await fetchCompetitors(
                                      selectedCategory
                                    );
                                    setCompetitors(data);
                                  }
                                  setModalVisible(false);
                                },
                              },
                            ]
                          );
                          return;
                        }

                        if (selectedCategory) {
                          const data = await fetchCompetitors(selectedCategory);
                          setCompetitors(data);
                        }
                        setModalVisible(false);
                      } catch (err: any) {
                        Alert.alert("Error", err.message);
                      }
                    }}
                  >
                    <Text style={styles.actionBtnText}>
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

      {/* Edit Score Modal */}
      <Modal visible={editModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.editModalContent}>
            {editingJudge && (
              <>
                <Text style={styles.editModalTitle}>Edit Score</Text>
                <Text style={styles.editModalSubtitle}>
                  {editingJudge.judge}
                </Text>

                <TextInput
                  style={styles.scoreEditInput}
                  keyboardType="numeric"
                  value={editingJudge.value}
                  onChangeText={(text) => {
                    let sanitized = text.replace(/[^0-9.]/g, "");

                    const parts = sanitized.split(".");

                    // allow exactly "10" (integer part only, no decimals)
                    if (parts.length === 1 && sanitized === "10") {
                      setEditingJudge((prev) =>
                        prev ? { ...prev, value: "10" } : null
                      );
                      return;
                    }

                    // keep only one decimal point
                    if (parts.length > 2) sanitized = parts[0] + "." + parts[1];

                    // limit integer part to 1 digit (0–9)
                    if (parts[0].length > 1) {
                      sanitized =
                        parts[0][0] + (parts[1] ? "." + parts[1] : "");
                    }

                    // limit decimal part to 1 digit
                    if (parts[1]?.length > 1) {
                      sanitized = parts[0] + "." + parts[1].slice(0, 1);
                    }

                    // remove leading zeros (but not "0." case)
                    if (/^0[0-9]/.test(sanitized)) {
                      sanitized = sanitized.replace(/^0+/, "0");
                    }

                    // prepend 0 if starts with "."
                    if (sanitized.startsWith(".")) sanitized = "0" + sanitized;

                    setEditingJudge((prev) =>
                      prev ? { ...prev, value: sanitized } : null
                    );
                  }}
                  placeholder="Enter score"
                  placeholderTextColor="#B2BEC3"
                />

                <View style={styles.editModalActions}>
                  <Pressable
                    style={styles.editCancelBtn}
                    onPress={() => {
                      setEditModalVisible(false);
                      setEditingJudge(null);
                    }}
                  >
                    <Text style={styles.editCancelBtnText}>Cancel</Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.editSaveBtn,
                      (!editingJudge?.value ||
                        isNaN(Number(editingJudge.value)) ||
                        Number(editingJudge.value) < 0 ||
                        Number(editingJudge.value) > 10) && {
                        backgroundColor: "#DDD",
                      },
                    ]}
                    disabled={
                      !editingJudge?.value ||
                      isNaN(Number(editingJudge.value)) ||
                      Number(editingJudge.value) < 0 ||
                      Number(editingJudge.value) > 10
                    }
                    onPress={handleSaveScore}
                  >
                    <Text style={styles.editSaveBtnText}>Save</Text>
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
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    backgroundColor: "#6C5CE7",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#6C5CE7",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    fontWeight: "500",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  currentCard: {
    marginTop: 24,
    marginBottom: 20,
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
  currentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  currentTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#00B894",
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF7675",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  liveText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  currentName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D3436",
    marginBottom: 6,
  },
  currentDetail: {
    fontSize: 14,
    color: "#636E72",
    fontWeight: "500",
    marginBottom: 16,
  },
  viewScoresBtn: {
    backgroundColor: "#00B894",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  viewScoresBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
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
  competitorsContainer: {
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
  validatedBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#00B894",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  validatedBadgeText: {
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
    paddingRight: 100,
  },
  categoryName: {
    fontSize: 14,
    color: "#636E72",
    fontWeight: "600",
    marginBottom: 16,
  },
  individualMember: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  teamMembers: {
    marginBottom: 16,
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
    marginBottom: 8,
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
  detailsBtn: {
    backgroundColor: "#74B9FF",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  detailsBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 20,
  },
  modalContent: {
    width: "100%",
    maxHeight: "85%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2D3436",
    flex: 1,
  },
  closeModalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F2F6",
    justifyContent: "center",
    alignItems: "center",
  },
  closeModalBtnText: {
    fontSize: 20,
    color: "#636E72",
    fontWeight: "700",
  },
  modalSubTitle: {
    fontSize: 16,
    color: "#636E72",
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 20,
  },
  totalScoreContainer: {
    backgroundColor: "#E8F6F3",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#00B894",
  },
  totalScoreLabel: {
    fontSize: 14,
    color: "#00B894",
    fontWeight: "600",
    marginBottom: 4,
  },
  totalScoreValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#00B894",
  },
  scoresScrollView: {
    maxHeight: 300,
    marginBottom: 20,
  },
  scoreGroup: {
    marginBottom: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 16,
  },
  discrepantGroup: {
    backgroundColor: "#FFF0F0",
    borderWidth: 2,
    borderColor: "#FF7675",
  },
  scoreGroupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2D3436",
  },
  warningBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FF7675",
    justifyContent: "center",
    alignItems: "center",
  },
  warningText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  scoreRow: {
    marginBottom: 12,
  },
  judgeInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  judgeName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D3436",
    flex: 1,
  },
  scoreValueBadge: {
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  scoreValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  scoreActions: {
    flexDirection: "row",
    gap: 8,
  },
  editScoreBtn: {
    backgroundColor: "#74B9FF",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  editScoreBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  deleteScoreBtn: {
    backgroundColor: "#FF7675",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  deleteScoreBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  // NEW: Section Total Styles
  sectionTotalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E1E8ED",
  },
  sectionTotalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2D3436",
  },
  sectionTotalBadge: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 60,
    alignItems: "center",
  },
  sectionTotalValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#B2BEC3",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  validateBtn: {
    backgroundColor: "#00B894",
  },
  unvalidateBtn: {
    backgroundColor: "#FF7675",
  },
  disabledBtn: {
    backgroundColor: "#DDD",
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  editModalContent: {
    width: "85%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
  },
  editModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2D3436",
    textAlign: "center",
    marginBottom: 8,
  },
  editModalSubtitle: {
    fontSize: 16,
    color: "#636E72",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "500",
  },
  scoreEditInput: {
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    borderWidth: 2,
    borderColor: "#E1E8ED",
    marginBottom: 24,
  },
  editModalActions: {
    flexDirection: "row",
    gap: 12,
  },
  editCancelBtn: {
    flex: 1,
    backgroundColor: "#B2BEC3",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  editCancelBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  editSaveBtn: {
    flex: 1,
    backgroundColor: "#00B894",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  editSaveBtnText: {
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
