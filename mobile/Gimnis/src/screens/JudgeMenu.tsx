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
  category: string;
  club: string;
  already_voted?: boolean;
  members: Member[];
} | null;

// mock: this would come from logged-in user/session
const judgeId = 2;
const judgeRole: "execution" | "artistry" | "difficulty" | "principal" =
  "execution"; // replace with actual role from API/session

export default function JudgeMenu() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [loading, setLoading] = useState(true);
  const [currentCompetitor, setCurrentCompetitor] =
    useState<CurrentCompetitor>(null);
  const [scores, setScores] = useState<Record<string, string>>({});

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
          setCurrentCompetitor(data);
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

  const handleScoreChange = (type: string, value: string) => {
    setScores((prev) => ({ ...prev, [type]: value }));
  };

  const confirmVote = () => {
    if (!currentCompetitor) return;

    const filledScores = Object.entries(scores).filter(
      ([, v]) => v && !isNaN(Number(v))
    );

    if (filledScores.length === 0) {
      Alert.alert("Error", "Please enter at least one valid score.");
      return;
    }

    Alert.alert(
      "Confirm Vote",
      `Submit your scores for competitor ${currentCompetitor.category} - ${currentCompetitor.club}?`,
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
        .map(([score_type, value]) => ({
          competitor_id: currentCompetitor.competitor_id,
          judge_id: judgeId,
          value: parseFloat(value),
          score_type,
        }));

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
      Alert.alert("Error", err.message || "Could not submit score(s)");
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
      <Text style={styles.title}>Judge Menu ({judgeRole})</Text>

      <Pressable
        style={[styles.btn, styles.myScoresBtn]}
        onPress={() => navigation.navigate("MyScores")}
      >
        <Text style={styles.btnText}>📊 View My Scores</Text>
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
          <Text style={styles.detail}>
            {currentCompetitor.category} • {currentCompetitor.club}
          </Text>

          {/* 👥 Members list */}
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

          {/* 🎯 Score inputs */}
          {renderScoreInputs()}

          <Pressable style={[styles.btn, styles.voteBtn]} onPress={confirmVote}>
            <Text style={styles.btnText}>✅ Submit Vote</Text>
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
  myScoresBtn: {
    backgroundColor: "#0077cc",
  },
  voteBtn: {
    backgroundColor: "green",
    marginTop: 10,
  },
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
});
