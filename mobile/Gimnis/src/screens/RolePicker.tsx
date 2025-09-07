import React from "react";
import { SafeAreaView, View, Text, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App"; // adjust if types are elsewhere

export default function RolePicker() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Select Role (dev mode)</Text>

      <Pressable
        style={styles.btn}
        onPress={() => navigation.navigate("SecretaryMenu")}
      >
        <Text style={styles.btnText}>📝 Secretary</Text>
      </Pressable>

      <Pressable
        style={styles.btn}
        onPress={() => navigation.navigate("JudgeMenu")}
      >
        <Text style={styles.btnText}>⚖️ Judge</Text>
      </Pressable>

      <Pressable
        style={styles.btn}
        onPress={() => navigation.navigate("PrincipalJudgeMenu")}
      >
        <Text style={styles.btnText}>👑 Principal Judge</Text>
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
  },
  btnText: { fontSize: 18, textAlign: "center" },
});
