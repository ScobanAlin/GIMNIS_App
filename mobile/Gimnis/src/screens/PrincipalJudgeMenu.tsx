import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  View,
  FlatList,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types";
import { BASE_URL } from "../config";
import { storage } from "../utils/storage"; // ✅ MMKV wrapper

type Member = {
  id: number;
  first_name: string;
  last_name: string;
  age: number;
  sex: "M" | "F";
};

type CurrentCompetitor = {
  competitor_id: number;
  name: string;
  category: string;
  club: string;
  already_voted?: boolean;
  members: Member[];
} | null;

const ROLE_KEY = "tablet_role";
const JUDGE_ID_KEY = "judge_id";
const JUDGE_NAME_KEY = "judge_name";

export default function PrincipalJudgeMenu() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [loading, setLoading] = useState(true);
  const [currentCompetitor, setCurrentCompetitor] =
    useState<CurrentCompetitor>(null);
  const [linePenalty, setLinePenalty] = useState("");
  const [principalPenalty, setPrincipalPenalty] = useState("");
  const [tapCount, setTapCount] = useState(0);

  // ✅ principal judge always has ID = 1
  const judgeId = 1;

  const fetchCurrentCompetitor = async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/api/votes/current?judge_id=${judgeId}`
      );
      const data = await res.json();

      if (res.ok && data && data.competitor_id) {
        if (data.already_voted) {
          setCurrentCompetitor(null);
        } else {
          const competitorName =
            data.name ||
            (data.members
              ? data.members.map((m: any) => m.first_name).join(", ")
              : "Unknown Competitor");

          setCurrentCompetitor({ ...data, name: competitorName });
        }
      } else {
        setCurrentCompetitor(null);
      }
    } catch (err) {
      console.error("Error fetching current competitor:", err);
      setCurrentCompetitor(null);
    } finally {
      setLoading(false);
    }
  };

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

  const handleScoreChange = (type: "line" | "principal", value: string) => {
    let sanitized = value.replace(/[^0-9.]/g, "");
    const parts = sanitized.split(".");
    if (parts.length > 2) sanitized = parts[0] + "." + parts[1];
    if (parts[1]?.length > 1) sanitized = parts[0] + "." + parts[1].slice(0, 1);
    if (/^0[0-9]/.test(sanitized)) sanitized = sanitized.replace(/^0+/, "");
    if (sanitized.startsWith(".")) sanitized = "0" + sanitized;
    if (/^(1[1-9]|[2-9][0-9])$/.test(sanitized)) sanitized = sanitized[0];
    if (sanitized.endsWith(".")) {
      if (type === "line") setLinePenalty(sanitized);
      else setPrincipalPenalty(sanitized);
      return;
    }
    let num = parseFloat(sanitized);
    if (!isNaN(num)) {
      if (num > 10) num = 10;
      sanitized = num.toString();
    }
    if (type === "line") setLinePenalty(sanitized);
    else setPrincipalPenalty(sanitized);
  };

  const allFieldsValid = () =>
    linePenalty.trim() !== "" &&
    principalPenalty.trim() !== "" &&
    !isNaN(Number(linePenalty)) &&
    !isNaN(Number(principalPenalty));

  const confirmVote = () => {
    if (!currentCompetitor) return;

    if (!allFieldsValid()) {
      Alert.alert("Error", "Please enter both valid penalty scores.");
      return;
    }

    Alert.alert(
      "Confirm Vote",
      `Submitting penalties for ${currentCompetitor.name}:\n` +
        `Line: ${linePenalty}\n` +
        `Principal: ${principalPenalty}`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Submit", style: "destructive", onPress: voteCompetitor },
      ]
    );
  };

  const voteCompetitor = async () => {
    if (!currentCompetitor) return;

    try {
      const payloads = [
        {
          competitor_id: currentCompetitor.competitor_id,
          judge_id: judgeId,
          score_type: "line_penalization",
          value: parseFloat(linePenalty),
        },
        {
          competitor_id: currentCompetitor.competitor_id,
          judge_id: judgeId,
          score_type: "principal_penalization",
          value: parseFloat(principalPenalty),
        },
      ];

      for (const p of payloads) {
        const res = await fetch(`${BASE_URL}/api/scores`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(p),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to submit score");
      }

      Alert.alert("Success", "Penalties have been submitted!");
      setLinePenalty("");
      setPrincipalPenalty("");
      fetchCurrentCompetitor();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not submit penalties");
    }
  };

  useEffect(() => {
    fetchCurrentCompetitor();
    const interval = setInterval(fetchCurrentCompetitor, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.crownContainer}>
            <Text style={styles.crownIcon}>👑</Text>
          </View>
          <View style={styles.headerText}>
            <Pressable onPress={handleTitlePress}>
              <Text style={styles.title}>Principal Judge</Text>
            </Pressable>
            <Text style={styles.subtitle}>Competition Authority</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={styles.viewAllScoresBtn}
          onPress={() => navigation.navigate("ViewAllScores")}
        >
          <View style={styles.btnContent}>
            <Text style={styles.btnIcon}>📊</Text>
            <Text style={styles.btnText}>View All Scores</Text>
          </View>
        </Pressable>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#96CEB4" />
            <Text style={styles.loadingText}>Loading competitor...</Text>
          </View>
        ) : currentCompetitor ? (
          <View style={styles.competitorCard}>
            <View style={styles.competitorHeader}>
              <Text style={styles.competitorTitle}>Current Competitor</Text>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>

            <Text style={styles.competitorName}>{currentCompetitor.name}</Text>
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

            <View style={styles.penaltySection}>
              <Text style={styles.penaltySectionTitle}>Penalty Assessment</Text>

              <View style={styles.penaltyInputs}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Line Penalization</Text>
                  <TextInput
                    style={styles.penaltyInput}
                    placeholder="0.0"
                    keyboardType="numeric"
                    value={linePenalty}
                    onChangeText={(t) => handleScoreChange("line", t)}
                    placeholderTextColor="#B2BEC3"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Principal Penalization</Text>
                  <TextInput
                    style={styles.penaltyInput}
                    placeholder="0.0"
                    keyboardType="numeric"
                    value={principalPenalty}
                    onChangeText={(t) => handleScoreChange("principal", t)}
                    placeholderTextColor="#B2BEC3"
                  />
                </View>
              </View>
            </View>

            <Pressable
              style={[
                styles.submitBtn,
                !allFieldsValid() && styles.submitBtnDisabled,
              ]}
              onPress={confirmVote}
              disabled={!allFieldsValid()}
            >
              <Text style={styles.submitBtnText}>Submit Penalties</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.waitingContainer}>
            <Text style={styles.waitingIcon}>⏳</Text>
            <Text style={styles.waitingTitle}>Waiting for Competition</Text>
            <Text style={styles.waitingText}>
              No active competitor at the moment
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
    backgroundColor: "#96CEB4",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#96CEB4",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  crownContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  crownIcon: {
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
  viewAllScoresBtn: {
    backgroundColor: "#6C5CE7",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#6C5CE7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  btnContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  btnIcon: {
    fontSize: 20,
  },
  btnText: {
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
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00B894",
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
  competitorName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2D3436",
    marginBottom: 8,
  },
  competitorDetails: {
    fontSize: 16,
    color: "#636E72",
    fontWeight: "600",
    marginBottom: 4,
  },
  clubName: {
    fontSize: 18,
    color: "#96CEB4",
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
  penaltySection: {
    marginBottom: 24,
  },
  penaltySectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D3436",
    marginBottom: 16,
    textAlign: "center",
  },
  penaltyInputs: {
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
  penaltyInput: {
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
  submitBtn: {
    backgroundColor: "#96CEB4",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#96CEB4",
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
  waitingTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2D3436",
    textAlign: "center",
  },
  waitingText: {
    fontSize: 16,
    color: "#636E72",
    fontWeight: "500",
    textAlign: "center",
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
});
