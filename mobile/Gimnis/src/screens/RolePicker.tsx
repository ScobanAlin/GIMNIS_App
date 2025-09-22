import React, { useState } from "react";
import {
  SafeAreaView,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types";
import { storage } from "../utils/storage"; // our MMKV wrapper

const ROLE_KEY = "tablet_role";
const JUDGE_ID_KEY = "judge_id";

export default function RolePicker() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [judgeId, setJudgeId] = useState("");

  const chooseRole = (role: string, screen: keyof RootStackParamList) => {
    // save role
    storage.set(ROLE_KEY, role);

    if (role === "Judge") {
      if (!judgeId) {
        Alert.alert("Error", "Please enter Judge ID");
        return;
      }
      storage.set(JUDGE_ID_KEY, judgeId);

      navigation.replace("JudgeLoginScreen", {
        judgeId: parseInt(judgeId, 10),
        role,
      });
    } else {
      navigation.replace(screen as any, { role });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Select Role</Text>

      <Pressable
        style={styles.btn}
        onPress={() => chooseRole("Secretary", "SecretaryMenu")}
      >
        <Text style={styles.btnText}>📝 Secretary</Text>
      </Pressable>

      {/* Judge role: requires Judge ID */}
      <TextInput
        style={styles.input}
        placeholder="Enter Judge ID"
        keyboardType="numeric"
        value={judgeId}
        onChangeText={setJudgeId}
      />
      <Pressable
        style={styles.btn}
        onPress={() => chooseRole("Judge", "JudgeMenu")}
      >
        <Text style={styles.btnText}>⚖️ Judge / Principal Judge</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
  btn: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f7f7f7",
    width: 220,
    marginBottom: 10,
  },
  btnText: { fontSize: 18, textAlign: "center" },
  input: {
    width: 220,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
    textAlign: "center",
  },
});
