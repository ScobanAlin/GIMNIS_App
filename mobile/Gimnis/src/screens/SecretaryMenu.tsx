import React from "react";
import { View, Text, Pressable, StyleSheet, SafeAreaView } from "react-native";


import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";

export default function SecretaryMenu() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.title}>Secretary Menu</Text>
        <Pressable
          style={styles.btn}
          onPress={() => navigation.navigate("AddCompetitor")}
        >
          <Text style={styles.btnText}>➕ Add Competitor</Text>
        </Pressable>
        <Pressable
          style={styles.btn}
          onPress={() => navigation.navigate("Competitors")}
        >
          <Text style={styles.btnText}>👥 Competitors</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
    justifyContent: "center",
    alignItems: "center", // keep buttons centered
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f7f7f7",
    minWidth: 220, // smaller than 220, keeps consistency
    alignItems: "center",
  },
  btnText: {
    fontSize: 16,
    textAlign: "center",
  },
});

