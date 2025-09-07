import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  Button,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Pressable,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { BASE_URL } from "../config";

type Member = {
  first_name: string;
  last_name: string;
  email: string;
  age: string;
  sex: "" | "M" | "F";
};

type MemberPayload = {
  first_name: string;
  last_name: string;
  email: string;
  age: number;
  sex: "M" | "F";
};

type CompetitorPayload = {
  name: string;
  category: string;
  club: string;
  members: MemberPayload[];
};

const CATEGORIES = [
  "IF-AG",
  "TR-7-8",
  "IM-AG",
  "MP-ND",
  "IF-7-8",
  "TRIO-ND",
  "MP-7-8",
  "IF-JUNIORI",
  "IM-JUNIORI",
  "IF-ND",
  "IM-7-8",
  "IM-ND",
  "GRUP-AG",
  "GRUP-JUNIORI",
  "TRIO-AG",
  "TRIO-JUNIORS",
  "GRUP-7-8",
  "GRUP-ND",
  "AD-JUNIORI",
];

export default function AddCompetitor() {
  const [teamName, setTeamName] = useState("");
  const [category, setCategory] = useState<string>("");
  const [club, setClub] = useState("");
  const [members, setMembers] = useState<Member[]>([
    { first_name: "", last_name: "", email: "", age: "", sex: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!category) return;

    if (category.startsWith("TRIO")) {
      setMembers([
        { first_name: "", last_name: "", email: "", age: "", sex: "F" },
        { first_name: "", last_name: "", email: "", age: "", sex: "F" },
        { first_name: "", last_name: "", email: "", age: "", sex: "F" },
      ]);
    } else if (category.startsWith("IF")) {
      setMembers([
        { first_name: "", last_name: "", email: "", age: "", sex: "F" },
      ]);
    } else if (category.startsWith("IM")) {
      setMembers([
        { first_name: "", last_name: "", email: "", age: "", sex: "M" },
      ]);
    } else if (category.startsWith("MP")) {
      setMembers([
        { first_name: "", last_name: "", email: "", age: "", sex: "F" },
        { first_name: "", last_name: "", email: "", age: "", sex: "M" },
      ]);
    } else {
      setMembers([
        { first_name: "", last_name: "", email: "", age: "", sex: "" },
      ]);
    }
  }, [category]);

  const updateMember = (index: number, field: keyof Member, value: string) => {
    const updated = [...members];
    (updated[index] as any)[field] = value;
    setMembers(updated);
  };

  const submit = async () => {
    setError(null);

    // client-side validation
    if (!teamName.trim() || !category || !club.trim()) {
      setError("Please fill all team fields.");
      return;
    }
    for (const [i, m] of members.entries()) {
      if (!m.first_name.trim() || !m.last_name.trim()) {
        setError(`Member ${i + 1}: first and last name required`);
        return;
      }
      if (!m.age) {
        setError(`Member ${i + 1}: age required`);
        return;
      }
      if (!m.sex) {
        setError(`Member ${i + 1}: sex must be chosen`);
        return;
      }
    }

    const payload: CompetitorPayload = {
      name: teamName.trim(),
      category: category.trim(),
      club: club.trim(),
      members: members.map((m) => ({
        first_name: m.first_name.trim(),
        last_name: m.last_name.trim(),
        email: m.email.trim().toLowerCase(),
        age: Number(m.age),
        sex: m.sex as "M" | "F",
      })),
    };

    console.log("Submitting payload:", payload);

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/competitors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("API response:", data);

      if (!res.ok) {
        throw new Error(data?.error || `Request failed with ${res.status}`);
      }

      Alert.alert("✅ Success", "Competitor created!");
      setTeamName("");
      setCategory("");
      setClub("");
      setMembers([
        { first_name: "", last_name: "", email: "", age: "", sex: "" },
      ]);
    } catch (e: any) {
      console.error("Error creating competitor:", e);
      setError(e.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Add Competitor (Team)</Text>

        <TextInput
          style={styles.input}
          placeholder="Team name"
          value={teamName}
          onChangeText={setTeamName}
        />

        <View style={styles.pickerWrapper}>
          <Picker selectedValue={category} onValueChange={setCategory}>
            <Picker.Item label="Select category..." value="" />
            {CATEGORIES.map((c) => (
              <Picker.Item key={c} label={c} value={c} />
            ))}
          </Picker>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Club"
          value={club}
          onChangeText={setClub}
        />

        <Text style={styles.subtitle}>Members</Text>
        {members.map((m, idx) => (
          <View key={idx} style={styles.memberBox}>
            <TextInput
              style={styles.input}
              placeholder="First name"
              value={m.first_name}
              onChangeText={(t) => updateMember(idx, "first_name", t)}
            />
            <TextInput
              style={styles.input}
              placeholder="Last name"
              value={m.last_name}
              onChangeText={(t) => updateMember(idx, "last_name", t)}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={m.email}
              onChangeText={(t) => updateMember(idx, "email", t)}
            />
            <TextInput
              style={styles.input}
              placeholder="Age"
              value={m.age}
              onChangeText={(t) =>
                updateMember(idx, "age", t.replace(/[^0-9]/g, ""))
              }
              keyboardType="numeric"
            />

            <View style={styles.radioRow}>
              <Pressable
                style={[styles.radioBtn, m.sex === "M" && styles.radioSelected]}
                onPress={() => updateMember(idx, "sex", "M")}
              >
                <Text style={styles.radioText}>Male</Text>
              </Pressable>
              <Pressable
                style={[styles.radioBtn, m.sex === "F" && styles.radioSelected]}
                onPress={() => updateMember(idx, "sex", "F")}
              >
                <Text style={styles.radioText}>Female</Text>
              </Pressable>
            </View>
          </View>
        ))}

        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <Button title="Create Competitor" onPress={submit} />
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 18, fontWeight: "600", marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 8,
  },
  memberBox: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#f9f9f9",
  },
  radioRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  radioBtn: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#aaa",
  },
  radioSelected: { backgroundColor: "#0077cc", borderColor: "#0077cc" },
  radioText: { color: "#000" },
  error: { color: "crimson", marginTop: 10 },
});
