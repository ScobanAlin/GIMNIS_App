// src/screens/JudgeMenu.tsx
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
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
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

// define required fields by judge role
const requiredFields: Record<string, string[]> = {
  principal: ["line_penalization", "principal_penalization"],
  difficulty: ["difficulty", "difficulty_penalization"],
  execution: ["execution_penalization"], // execution = 10 - penalization
  artistry: ["artistry"],
};

export default function JudgeMenu() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const {
    judgeId,
    role: judgeRole,
    name,
  } = (route.params as JudgeMenuRouteParams) || {
    judgeId: 0,
    role: "unknown",
    name: "Unknown",
  };

  const [loading, setLoading] = useState(true);
  const [currentCompetitor, setCurrentCompetitor] =
    useState<CurrentCompetitor>(null);
  const [scores, setScores] = useState<Record<string, string>>({});

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
    return fields.every(
      (f) => scores[f] && !isNaN(Number(scores[f]))
    );
  };

  const confirmVote = () => {
    if (!currentCompetitor) return;
    if (!allFieldsValid()) {
      Alert.alert("Error", "Please fill in all required score fields.");
      return;
    }
    Alert.alert(
      "Confirm Vote",
      `Submit your scores for ${currentCompetitor.category} – ${currentCompetitor.club}?`,
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

      for (const p of payloads) {
        const res = await fetch(`${BASE_URL}/api/scores`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(p),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to submit score");
      }

      Alert.alert("✅ Success", "Your scores have been submitted!");
      setScores({});
      fetchCurrentCompetitor();
    } catch (err: any) {
      Alert.alert("❌ Error", err.message || "Could not submit score(s)");
    }
  };

  useEffect(() => {
    fetchCurrentCompetitor();
    const interval = setInterval(fetchCurrentCompetitor, 5000);
    return () => clearInterval(interval);
  }, []);

  const renderScoreInputs = () => {
    if (judgeRole === "principal") {
      return (
        <>
          <TextInput
            style={styles.input}
            placeholder="Line penalization"
            keyboardType="numeric"
            value={scores["line_penalization"] || ""}
            onChangeText={(t) => handleScoreChange("line_penalization", t)}
          />
          <TextInput
            style={styles.input}
            placeholder="Principal penalization"
            keyboardType="numeric"
            value={scores["principal_penalization"] || ""}
            onChangeText={(t) => handleScoreChange("principal_penalization", t)}
          />
        </>
      );
    } else if (judgeRole === "difficulty") {
      return (
        <>
          <TextInput
            style={styles.input}
            placeholder="Difficulty score"
            keyboardType="numeric"
            value={scores["difficulty"] || ""}
            onChangeText={(t) => handleScoreChange("difficulty", t)}
          />
          <TextInput
            style={styles.input}
            placeholder="Difficulty penalization"
            keyboardType="numeric"
            value={scores["difficulty_penalization"] || ""}
            onChangeText={(t) =>
              handleScoreChange("difficulty_penalization", t)
            }
          />
        </>
      );
    } else if (judgeRole === "execution") {
      const penal = parseFloat(scores["execution_penalization"] || "0");
      const preview = !isNaN(penal) ? (10 - penal).toFixed(2) : "N/A";
      return (
        <View style={{ width: "100%", alignItems: "center" }}>
          <TextInput
            style={styles.input}
            placeholder="Execution penalization"
            keyboardType="numeric"
            value={scores["execution_penalization"] || ""}
            onChangeText={(t) => handleScoreChange("execution_penalization", t)}
          />
          <Text style={styles.previewText}>Final Score: {preview}</Text>
        </View>
      );
    } else {
      return (
        <TextInput
          style={styles.input}
          placeholder={`${judgeRole} score`}
          keyboardType="numeric"
          value={scores[judgeRole] || ""}
          onChangeText={(t) => handleScoreChange(judgeRole, t)}
        />
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        Judge Menu ({judgeRole}) – {name}
      </Text>

      <Pressable
        style={[styles.btn, styles.myScoresBtn]}
        onPress={() =>
          navigation.navigate("MyScores", {
            judgeId,
            role: judgeRole,
            name,
          })
        }
      >
        <Text style={styles.btnText}>📊 View My Scores</Text>
      </Pressable>

      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 30 }} />
      ) : currentCompetitor ? (
        <View
          style={[
            styles.card,
            currentCompetitor.is_validated && styles.validatedCard,
          ]}
        >
          <Text style={styles.cardTitle}>Current Competitor</Text>
          <Text style={styles.detail}>
            {currentCompetitor.category} • {currentCompetitor.club}
          </Text>

          <FlatList
            data={currentCompetitor.members}
            keyExtractor={(m) => m.id.toString()}
            renderItem={({ item }) => (
              <Text style={styles.memberText}>
                - {item.first_name} {item.last_name} ({item.sex}, {item.age} yrs)
              </Text>
            )}
          />

          {renderScoreInputs()}

          <Pressable
            style={[
              styles.btn,
              styles.voteBtn,
              !allFieldsValid() && styles.disabledBtn,
            ]}
            onPress={confirmVote}
            disabled={!allFieldsValid()}
          >
            <Text style={styles.btnText}>✅ Submit Vote</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.waiting}>⏳ Waiting for the next competitor...</Text>
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
    textAlign: "center",
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
  validatedCard: {
    borderColor: "green",
    borderWidth: 2,
    backgroundColor: "#e6ffe6",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#0077cc",
  },
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
    marginVertical: 12,
    textAlign: "center",
    backgroundColor: "#f9f9f9",
  },
  previewText: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "500",
    color: "#444",
  },
});
