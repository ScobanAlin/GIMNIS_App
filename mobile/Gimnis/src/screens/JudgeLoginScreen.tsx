import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../config";

type JudgeLoginRouteProp = RouteProp<RootStackParamList, "JudgeLoginScreen">;

const ROLE_KEY = "tablet_role";
const JUDGE_ID_KEY = "judge_id";
const JUDGE_NAME_KEY = "judge_name";

export default function JudgeLoginScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<JudgeLoginRouteProp>();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [judgeId, setJudgeId] = useState<number | null>(null);
  const [role, setRole] = useState<string>("Judge");
  const [tapCount, setTapCount] = useState(0);

  useEffect(() => {
    if (route.params?.judgeId) {
      setJudgeId(route.params.judgeId);
    } else {
      // fallback from storage
      AsyncStorage.getItem(JUDGE_ID_KEY).then((id) => {
        if (id) setJudgeId(parseInt(id, 10));
      });
    }
  }, [route.params]);

  const handleTitlePress = async () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);

    // reset after 5 seconds if not completed
    if (newCount === 1) {
      setTimeout(() => setTapCount(0), 5000);
    }

    if (newCount >= 7) {
      setTapCount(0);
      await AsyncStorage.multiRemove([ROLE_KEY, JUDGE_ID_KEY, JUDGE_NAME_KEY]);
      navigation.replace("RolePicker");
    }
  };

  // 🔑 Role mapping by judgeId
  const getRoleFromJudgeId = (id: number): string => {
    if (id === 1) return "principal";
    if (id >= 2 && id <= 5) return "execution";
    if (id >= 6 && id <= 9) return "artistry";
    if (id >= 10 && id <= 11) return "difficulty";
    return "judge"; // fallback
  };

  const handleLogin = async () => {
    if (!firstName || !lastName) {
      Alert.alert("Error", "Please enter both first and last name");
      return;
    }
    if (!judgeId) {
      Alert.alert("Error", "Judge ID not found, please restart setup");
      return;
    }

    const inferredRole = getRoleFromJudgeId(judgeId);
    setRole(inferredRole);

    try {
      const res = await fetch(`${BASE_URL}/api/judges/${judgeId}/login`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
        }),
      });

      if (!res.ok) throw new Error("Failed to update judge in database");

      await AsyncStorage.setItem("judge_name", `${firstName} ${lastName}`);
      await AsyncStorage.setItem(ROLE_KEY, inferredRole);

      if (inferredRole === "principal") {
        navigation.replace("PrincipalJudgeMenu");
      } else {
        navigation.replace("JudgeMenu", {
          judgeId,
          role: inferredRole,
          name: `${firstName} ${lastName}`,
        });
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Login failed");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 👇 Tap title 7x to reset */}
      <Pressable onPress={handleTitlePress}>
        <Text style={styles.title}>Judge Login</Text>
      </Pressable>

      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
      />

      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
      />

      <Pressable style={styles.btn} onPress={handleLogin}>
        <Text style={styles.btnText}>Login</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, marginBottom: 20, fontWeight: "bold" },
  input: {
    width: "80%",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  btn: {
    backgroundColor: "#6C5CE7",
    padding: 14,
    borderRadius: 8,
    width: "80%",
    alignItems: "center",
  },
  btnText: { color: "white", fontSize: 16, fontWeight: "600" },
});
