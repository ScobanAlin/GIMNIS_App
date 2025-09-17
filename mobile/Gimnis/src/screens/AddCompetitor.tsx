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
  category: string;
  club: string;
  members: MemberPayload[];
};

const CATEGORIES = [
  // Kids Development (7-8 ani)
  "Individual Men - Kids Development",
  "Individual Women - Kids Development",
  "Mixed Pair - Kids Development",
  "Trio - Kids Development",
  "Group - Kids Development",

  // National Development (9-11 ani)
  "Individual Men - National Development",
  "Individual Women - National Development",
  "Mixed Pair - National Development",
  "Trio - National Development",
  "Group - National Development",

  // Youth (12-14 ani)
  "Individual Men - Youth",
  "Individual Women - Youth",
  "Mixed Pair - Youth",
  "Trio - Youth",
  "Group - Youth",
  "Aerobic Dance - Youth",

  // Juniors (15-17 ani)
  "Individual Men - Juniors",
  "Individual Women - Juniors",
  "Mixed Pair - Juniors",
  "Trio - Juniors",
  "Group - Juniors",
  "Aerobic Dance - Juniors",

  // Seniors (18+)
  "Individual Men - Seniors",
  "Individual Women - Seniors",
  "Mixed Pair - Seniors",
  "Trio - Seniors",
  "Group - Seniors",
  "Aerobic Dance - Seniors",
];

export default function AddCompetitor() {
  const [category, setCategory] = useState<string>("");
  const [club, setClub] = useState("");
  const [members, setMembers] = useState<Member[]>([
    { first_name: "", last_name: "", email: "", age: "", sex: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!category) return;

    if (category.startsWith("Individual Men")) {
      setMembers([
        { first_name: "", last_name: "", email: "", age: "", sex: "M" },
      ]);
    } else if (category.startsWith("Individual Women")) {
      setMembers([
        { first_name: "", last_name: "", email: "", age: "", sex: "F" },
      ]);
    } else if (category.startsWith("Mixed Pair")) {
      setMembers([
        { first_name: "", last_name: "", email: "", age: "", sex: "M" },
        { first_name: "", last_name: "", email: "", age: "", sex: "F" },
      ]);
    } else if (category.startsWith("Trio")) {
      setMembers([
        { first_name: "", last_name: "", email: "", age: "", sex: "" },
        { first_name: "", last_name: "", email: "", age: "", sex: "" },
        { first_name: "", last_name: "", email: "", age: "", sex: "" },
      ]);
    } else if (category.startsWith("Group")) {
      setMembers([
        { first_name: "", last_name: "", email: "", age: "", sex: "" },
        { first_name: "", last_name: "", email: "", age: "", sex: "" },
        { first_name: "", last_name: "", email: "", age: "", sex: "" },
        { first_name: "", last_name: "", email: "", age: "", sex: "" },
        { first_name: "", last_name: "", email: "", age: "", sex: "" },
      ]);
    } else if (category.startsWith("Aerobic Dance")) {
      // Default with 6, but user can add up to 8
      setMembers(
        Array.from({ length: 6 }, () => ({
          first_name: "",
          last_name: "",
          email: "",
          age: "",
          sex: "",
        }))
      );
    } else {
      setMembers([
        { first_name: "", last_name: "", email: "", age: "", sex: "" },
      ]);
    }
  }, [category]);

const addMember = () => {
  if (category.startsWith("Aerobic Dance") && members.length < 8) {
    setMembers([
      ...members,
      { first_name: "", last_name: "", email: "", age: "", sex: "" },
    ]);
  }
};

const removeMember = (index: number) => {
  if (category.startsWith("Aerobic Dance") && members.length <= 6) return; // cannot go below 6
  const updated = [...members];
  updated.splice(index, 1);
  setMembers(updated);
};

  const updateMember = (index: number, field: keyof Member, value: string) => {
    const updated = [...members];
    (updated[index] as any)[field] = value;
    setMembers(updated);
  };

  const submit = async () => {
    setError(null);

    if (!category || !club.trim()) {
      const msg = "Please fill all fields.";
      setError(msg);
      Alert.alert("⚠️ Validation error", msg);
      return;
    }

    for (const [i, m] of members.entries()) {
      if (!m.first_name.trim() || !m.last_name.trim()) {
        const msg = `Member ${i + 1}: first and last name required`;
        setError(msg);
        Alert.alert("⚠️ Validation error", msg);
        return;
      }
      if (!m.age) {
        const msg = `Member ${i + 1}: age required`;
        setError(msg);
        Alert.alert("⚠️ Validation error", msg);
        return;
      }
      if (!m.sex) {
        const msg = `Member ${i + 1}: sex must be chosen`;
        setError(msg);
        Alert.alert("⚠️ Validation error", msg);
        return;
      }
    }

    const payload: CompetitorPayload = {
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

      Alert.alert("✅ Success", "Competitor created successfully!");
      setCategory("");
      setClub("");
      setMembers([
        { first_name: "", last_name: "", email: "", age: "", sex: "" },
      ]);
    } catch (e: any) {
      console.error("Error creating competitor:", e);
      const msg = e.message || "Unexpected error while creating competitor.";
      setError(msg);
      Alert.alert("❌ Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Add Competitor (Team)</Text>

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
            <Text style={styles.memberTitle}>Member #{idx + 1}</Text>

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

            {/* Only show remove button for Aerobic Dance AND when member #7 or #8 */}
            {category.startsWith("Aerobic Dance") &&
              (idx + 1 === 7 || idx + 1 === 8) && (
                <Pressable
                  style={styles.removeBtn}
                  onPress={() => removeMember(idx)}
                >
                  <Text style={styles.removeText}>➖ Remove</Text>
                </Pressable>
              )}
          </View>
        ))}

        {/* Show add button only for Aerobic Dance and if < 8 */}
        {category.startsWith("Aerobic Dance") && members.length < 8 && (
          <Pressable style={styles.addBtn} onPress={addMember}>
            <Text style={styles.addText}>➕ Add Member</Text>
          </Pressable>
        )}

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
  memberTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },

  addBtn: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#28a745",
    alignItems: "center",
    marginVertical: 8,
  },
  addText: { color: "#fff", fontWeight: "600" },
  removeBtn: {
    marginTop: 8,
    padding: 6,
    borderRadius: 6,
    backgroundColor: "#dc3545",
    alignItems: "center",
  },
  removeText: { color: "#fff", fontWeight: "600" },
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
