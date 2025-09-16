import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { BASE_URL } from "../config";

type Judge = {
  id: number;
  first_name: string;
  last_name: string;
  role: string; // "execution" | "artistry" | "difficulty" | "line_penalization" | "principal_penalization"
};

export default function JudgePicker() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [loading, setLoading] = useState(true);
  const [judges, setJudges] = useState<Judge[]>([]);

  const fetchJudges = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/judges`);
      const data = await res.json();
      if (res.ok) {
        setJudges(data);
      } else {
        Alert.alert("Error", "Could not load judges");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to fetch judges");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJudges();
  }, []);

  const handleSelectJudge = (judge: Judge) => {
    // Navigate to judge menu and pass judge info
    navigation.navigate("JudgeMenu", {
      judgeId: judge.id,
      role: judge.role,
      name: `${judge.first_name} ${judge.last_name}`,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Select Your Role</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : (
        <FlatList
          data={judges}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => handleSelectJudge(item)}
            >
              <Text style={styles.cardText}>
                {item.first_name} {item.last_name}
              </Text>
              <Text style={styles.roleText}>{item.role}</Text>
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  card: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f7f7f7",
  },
  cardText: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
  roleText: { fontSize: 15, color: "#555" },
});
