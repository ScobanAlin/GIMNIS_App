// src/screens/PrincipalJudgeMenu.tsx
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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { BASE_URL } from "../config";

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

export default function PrincipalJudgeMenu() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [loading, setLoading] = useState(true);
  const [currentCompetitor, setCurrentCompetitor] =
    useState<CurrentCompetitor>(null);

  const [linePenalty, setLinePenalty] = useState("");
  const [principalPenalty, setPrincipalPenalty] = useState("");

  // TODO: Replace with logged-in principal judge ID
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

  // --- sanitizer for inputs ---
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

      Alert.alert("✅ Success", "Penalties have been submitted!");
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
      <Text style={styles.title}>Principal Judge Menu</Text>

      <Pressable
        style={[styles.btn, styles.myScoresBtn]}
        onPress={() => navigation.navigate("ViewAllScores")}
      >
        <Text style={styles.btnText}>📊 View All Scores</Text>
      </Pressable>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#000"
          style={{ marginTop: 30 }}
        />
      ) : currentCompetitor ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current Competitor</Text>
          <Text style={styles.competitorName}>{currentCompetitor.name}</Text>
          <Text style={styles.detail}>
            {currentCompetitor.category} • {currentCompetitor.club}
          </Text>

          <FlatList
            data={currentCompetitor.members}
            keyExtractor={(m) => m.id.toString()}
            renderItem={({ item }) => (
              <Text style={styles.memberText}>
                - {item.first_name} {item.last_name} ({item.sex}, {item.age}{" "}
                yrs)
              </Text>
            )}
          />

          <TextInput
            style={styles.input}
            placeholder="Line Penalization"
            keyboardType="numeric"
            value={linePenalty}
            onChangeText={(t) => handleScoreChange("line", t)}
          />

          <TextInput
            style={styles.input}
            placeholder="Principal Judge Penalization"
            keyboardType="numeric"
            value={principalPenalty}
            onChangeText={(t) => handleScoreChange("principal", t)}
          />

          <Pressable
            style={[
              styles.btn,
              styles.voteBtn,
              !allFieldsValid() && styles.disabledBtn,
            ]}
            onPress={confirmVote}
            disabled={!allFieldsValid()}
          >
            <Text style={styles.btnText}>✅ Submit Penalties</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.waiting}>
          ⏳ Waiting for the next competitor...
        </Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f4f7fa",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    marginTop: 10,
  },
  card: {
    width: "100%",
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
    alignItems: "center",
    marginTop: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#0077cc",
  },
  competitorName: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  detail: { fontSize: 16, color: "#666", marginBottom: 10 },
  memberText: { fontSize: 15, color: "#444", marginBottom: 4 },
  waiting: { fontSize: 16, color: "#999", marginTop: 40 },
  btn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    width: 220,
    marginTop: 10,
  },
  btnText: { fontSize: 17, fontWeight: "600", color: "#fff" },
  myScoresBtn: { backgroundColor: "#0077cc" },
  voteBtn: { backgroundColor: "green", marginTop: 10 },
  disabledBtn: { backgroundColor: "#999" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 12,
    width: "80%",
    fontSize: 16,
    marginVertical: 8,
    textAlign: "center",
    backgroundColor: "#f9f9f9",
  },
});
