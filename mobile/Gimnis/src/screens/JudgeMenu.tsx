import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  View,
  FlatList,
  ScrollView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types";
import { BASE_URL } from "../config";
import { storage } from "../utils/storage"; // ✅ switched to MMKV

const ROLE_KEY = "tablet_role";
const JUDGE_ID_KEY = "judge_id";
const JUDGE_NAME_KEY = "judge_name";

type Member = {
  id: number;
  first_name: string;
  last_name: string;
  age: number;
  sex: "M" | "F";
};

type CurrentCompetitor = {
  competitor_id: number;
  category: string;
  club: string;
  already_voted?: boolean;
  members: Member[];
  is_validated?: boolean;
} | null;

type JudgeMenuRouteParams = {
  judgeId: number;
  role: "execution" | "artistry" | "difficulty" | "principal" | string;
  name: string;
};

const requiredFields: Record<string, string[]> = {
  principal: ["line_penalization", "principal_penalization"],
  difficulty: ["difficulty", "difficulty_penalization"],
  execution: ["execution_penalization"],
  artistry: ["artistry"],
};

export default function JudgeMenu() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const judgeId = parseInt(storage.getString("judge_id") || "0", 10);
const judgeRole = mapRoleById(judgeId);
const name = storage.getString("judge_name") || "Unknown";


  const [loading, setLoading] = useState(true);
  const [currentCompetitor, setCurrentCompetitor] =
    useState<CurrentCompetitor>(null);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [tapCount, setTapCount] = useState(0);

  function mapRoleById(judgeId: number): string {
    if (judgeId === 1) return "principal";
    if (judgeId >= 2 && judgeId <= 5) return "execution";
    if (judgeId >= 6 && judgeId <= 9) return "artistry";
    if (judgeId >= 10 && judgeId <= 11) return "difficulty";
    return "judge";
  }

  const handleTitlePress = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);

    // reset after 5 seconds if not completed
    if (newCount === 1) {
      setTimeout(() => setTapCount(0), 5000);
    }

    if (newCount >= 7) {
      setTapCount(0);
      storage.delete(ROLE_KEY);
      storage.delete(JUDGE_ID_KEY);
      storage.delete(JUDGE_NAME_KEY);
      navigation.replace("RolePicker");
    }
  };

  const fetchCurrentCompetitor = async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/api/votes/current?judge_id=${judgeId}`
      );
      const text = await res.text();
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const data = JSON.parse(text);

      if (data && data.competitor_id) {
        setCurrentCompetitor(data.already_voted ? null : data);
      } else {
        setCurrentCompetitor(null);
      }
    } catch (err) {
      console.error("Error fetching competitor:", err);
      setCurrentCompetitor(null);
    } finally {
      setLoading(false);
    }
  };

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

  const allFieldsValid = () => {
    const fields = requiredFields[judgeRole] || [judgeRole];
    return fields.every((f) => scores[f] && !isNaN(Number(scores[f])));
  };

  const confirmVote = () => {
    if (!currentCompetitor) return;

    if (!allFieldsValid()) {
      Alert.alert("Error", "Please fill in all required score fields.");
      return;
    }

    // 🧑‍🤝‍🧑 Collect team members into a string
    const membersList =
      currentCompetitor.members
        .map((m) => `${m.first_name} ${m.last_name}`)
        .join(", ") || "No members listed";

    // 📝 Collect current scores into a string
    const scoreLines = Object.entries(scores)
      .map(([key, val]) => `${key.replace(/_/g, " ")}: ${val}`)
      .join("\n");

    Alert.alert(
      "Confirm Vote",
      `Submitting scores for:\n` +
        `${membersList}\n\n` + // team members
        `Category: ${currentCompetitor.category}\n` +
        `Club: ${currentCompetitor.club}\n\n` +
        `Scores:\n${scoreLines}`, // scores
      [
        { text: "Cancel", style: "cancel" },
        { text: "Submit", style: "destructive", onPress: voteCompetitor },
      ]
    );
  };

  const voteCompetitor = async () => {
    if (!currentCompetitor) return;
    try {
      const payloads = Object.entries(scores)
        .filter(([, v]) => v && !isNaN(Number(v)))
        .map(([score_type, value]) => {
          let finalValue = parseFloat(value);
          if (score_type === "execution_penalization") {
            return {
              competitor_id: currentCompetitor.competitor_id,
              judge_id: judgeId,
              score_type: "execution",
              value: 10 - finalValue,
            };
          }
          return {
            competitor_id: currentCompetitor.competitor_id,
            judge_id: judgeId,
            score_type,
            value: finalValue,
          };
        });

      // 🔥 If difficulty judge → fetch all difficulty judges from API
      let difficultyJudgeIds: number[] = [];
      if (judgeRole === "difficulty") {
        const res = await fetch(`${BASE_URL}/api/judges`);
        if (!res.ok) throw new Error("Could not fetch judges list");
        const allJudges = await res.json();

        difficultyJudgeIds = allJudges
          .filter((j: any) => j.role === "difficulty" && j.id !== judgeId)
          .map((j: any) => j.id);
      }

      for (const p of payloads) {
        // Always submit my own
        const res = await fetch(`${BASE_URL}/api/scores`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(p),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to submit score");

        // If difficulty judge → clone for others
        for (const diffJudgeId of difficultyJudgeIds) {
          const cloned = { ...p, judge_id: diffJudgeId };
          const res2 = await fetch(`${BASE_URL}/api/scores`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cloned),
          });
          const data2 = await res2.json();
          if (!res2.ok)
            throw new Error(data2?.error || "Failed to submit mirrored score");
        }
      }

      Alert.alert("Success", "Your scores have been submitted!");
      setScores({});
      fetchCurrentCompetitor();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not submit score(s)");
    }
  };

  useEffect(() => {
    fetchCurrentCompetitor();
    const interval = setInterval(fetchCurrentCompetitor, 5000);
    return () => clearInterval(interval);
  }, []);

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "execution":
        return "#FF6B6B";
      case "artistry":
        return "#4ECDC4";
      case "difficulty":
        return "#45B7D1";
      case "principal":
        return "#96CEB4";
      default:
        return "#FFEAA7";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case "execution":
        return "⚡";
      case "artistry":
        return "🎨";
      case "difficulty":
        return "🎯";
      case "principal":
        return "👑";
      default:
        return "⭐";
    }
  };

  const renderScoreInputs = () => {
    if (judgeRole === "principal") {
      return (
        <View style={styles.scoreInputsContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Line Penalization</Text>
            <TextInput
              style={styles.scoreInput}
              placeholder="0.0"
              keyboardType="numeric"
              value={scores["line_penalization"] || ""}
              onChangeText={(t) => handleScoreChange("line_penalization", t)}
              placeholderTextColor="#B2BEC3"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Principal Penalization</Text>
            <TextInput
              style={styles.scoreInput}
              placeholder="0.0"
              keyboardType="numeric"
              value={scores["principal_penalization"] || ""}
              onChangeText={(t) =>
                handleScoreChange("principal_penalization", t)
              }
              placeholderTextColor="#B2BEC3"
            />
          </View>
        </View>
      );
    } else if (judgeRole === "difficulty") {
      return (
        <View style={styles.scoreInputsContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Difficulty Score</Text>
            <TextInput
              style={styles.scoreInput}
              placeholder="0.0"
              keyboardType="numeric"
              value={scores["difficulty"] || ""}
              onChangeText={(t) => handleScoreChange("difficulty", t)}
              placeholderTextColor="#B2BEC3"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Difficulty Penalization</Text>
            <TextInput
              style={styles.scoreInput}
              placeholder="0.0"
              keyboardType="numeric"
              value={scores["difficulty_penalization"] || ""}
              onChangeText={(t) =>
                handleScoreChange("difficulty_penalization", t)
              }
              placeholderTextColor="#B2BEC3"
            />
          </View>
        </View>
      );
    } else if (judgeRole === "execution") {
      const penal = parseFloat(scores["execution_penalization"] || "0");
      const preview = !isNaN(penal) ? (10 - penal).toFixed(1) : "10.0";
      return (
        <View style={styles.scoreInputsContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Execution Penalization</Text>
            <TextInput
              style={styles.scoreInput}
              placeholder="0.0"
              keyboardType="numeric"
              value={scores["execution_penalization"] || ""}
              onChangeText={(t) =>
                handleScoreChange("execution_penalization", t)
              }
              placeholderTextColor="#B2BEC3"
            />
          </View>
          <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>Final Score</Text>
            <Text style={styles.previewScore}>{preview}</Text>
          </View>
        </View>
      );
    } else {
      return (
        <View style={styles.scoreInputsContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {judgeRole.charAt(0).toUpperCase() + judgeRole.slice(1)} Score
            </Text>
            <TextInput
              style={styles.scoreInput}
              placeholder="0.0"
              keyboardType="numeric"
              value={scores[judgeRole] || ""}
              onChangeText={(t) => handleScoreChange(judgeRole, t)}
              placeholderTextColor="#B2BEC3"
            />
          </View>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Pressable
        onPress={handleTitlePress}
        style={[styles.header, { backgroundColor: getRoleColor(judgeRole) }]}
      >
        <View style={styles.headerContent}>
          <View style={styles.roleIconContainer}>
            <Text style={styles.roleIcon}>{getRoleIcon(judgeRole)}</Text>
          </View>
          <View style={styles.headerText}>
            {/* 👇 Show actual judge role instead of “Judge Judge” */}
            <Text style={styles.title}>
              {judgeRole.charAt(0).toUpperCase() + judgeRole.slice(1)} Judge
            </Text>
            <Text style={styles.subtitle}>{name}</Text>
          </View>
        </View>
      </Pressable>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={styles.myScoresBtn}
          onPress={() =>
            navigation.navigate("MyScores", { judgeId, role: judgeRole, name })
          }
        >
          <Text style={styles.myScoresBtnText}>View My Scores</Text>
        </Pressable>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6C5CE7" />
            <Text style={styles.loadingText}>Loading competitor...</Text>
          </View>
        ) : currentCompetitor ? (
          <View
            style={[
              styles.competitorCard,
              currentCompetitor.is_validated && styles.validatedCard,
            ]}
          >
            <View style={styles.competitorHeader}>
              <Text style={styles.competitorTitle}>Current Competitor</Text>
              {currentCompetitor.is_validated && (
                <View style={styles.validatedBadge}>
                  <Text style={styles.validatedText}>VALIDATED</Text>
                </View>
              )}
            </View>

            <Text style={styles.competitorDetails}>
              {currentCompetitor.category}
            </Text>
            <Text style={styles.clubName}>{currentCompetitor.club}</Text>

            <View style={styles.membersSection}>
              <Text style={styles.membersTitle}>Team Members</Text>
              <FlatList
                data={currentCompetitor.members}
                keyExtractor={(m) => m.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.memberItem}>
                    <Text style={styles.memberName}>
                      {item.first_name} {item.last_name}
                    </Text>
                    <Text style={styles.memberDetails}>
                      {item.sex} • {item.age} years
                    </Text>
                  </View>
                )}
                scrollEnabled={false}
              />
            </View>

            {renderScoreInputs()}

            <Pressable
              style={[
                styles.submitBtn,
                !allFieldsValid() && styles.submitBtnDisabled,
              ]}
              onPress={confirmVote}
              disabled={!allFieldsValid()}
            >
              <Text style={styles.submitBtnText}>Submit Score</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.waitingContainer}>
            <Text style={styles.waitingIcon}>⏳</Text>
            <Text style={styles.waitingText}>
              Waiting for the next competitor...
            </Text>
          </View>
        )}
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
  content: {
    flex: 1,
    padding: 24,
  },
  myScoresBtn: {
    backgroundColor: "#6C5CE7",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#6C5CE7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  myScoresBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#636E72",
    fontWeight: "500",
  },
  competitorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 16,
  },
  validatedCard: {
    borderLeftWidth: 6,
    borderLeftColor: "#00B894",
    backgroundColor: "#F8FFF9",
  },
  competitorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  competitorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2D3436",
  },
  validatedBadge: {
    backgroundColor: "#00B894",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  validatedText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  competitorDetails: {
    fontSize: 16,
    color: "#636E72",
    fontWeight: "600",
    marginBottom: 4,
  },
  clubName: {
    fontSize: 18,
    color: "#2D3436",
    fontWeight: "700",
    marginBottom: 20,
  },
  membersSection: {
    marginBottom: 24,
  },
  membersTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2D3436",
    marginBottom: 12,
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
  scoreInputsContainer: {
    marginBottom: 24,
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3436",
  },
  scoreInput: {
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    borderWidth: 2,
    borderColor: "#E1E8ED",
  },
  previewContainer: {
    backgroundColor: "#E8F4FD",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#74B9FF",
  },
  previewLabel: {
    fontSize: 14,
    color: "#0984E3",
    fontWeight: "600",
    marginBottom: 4,
  },
  previewScore: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0984E3",
  },
  submitBtn: {
    backgroundColor: "#00B894",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#00B894",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  submitBtnDisabled: {
    backgroundColor: "#B2BEC3",
    shadowOpacity: 0.1,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  waitingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  waitingIcon: {
    fontSize: 48,
  },
  waitingText: {
    fontSize: 18,
    color: "#636E72",
    fontWeight: "500",
    textAlign: "center",
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40, // Extra padding at bottom to ensure submit button is visible
  },
});
