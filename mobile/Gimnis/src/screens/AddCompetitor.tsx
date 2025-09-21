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
  "Individual Men - Kids Development",
  "Individual Women - Kids Development",
  "Mixed Pair - Kids Development",
  "Trio - Kids Development",
  "Group - Kids Development",
  "Individual Men - National Development",
  "Individual Women - National Development",
  "Mixed Pair - National Development",
  "Trio - National Development",
  "Group - National Development",
  "Individual Men - Youth",
  "Individual Women - Youth",
  "Mixed Pair - Youth",
  "Trio - Youth",
  "Group - Youth",
  "Aerobic Dance - Youth",
  "Individual Men - Juniors",
  "Individual Women - Juniors",
  "Mixed Pair - Juniors",
  "Trio - Juniors",
  "Group - Juniors",
  "Aerobic Dance - Juniors",
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
    if (category.startsWith("Aerobic Dance") && members.length <= 6) return;
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add New Competitor</Text>
        <Text style={styles.subtitle}>Register team for competition</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Competition Details</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={category} onValueChange={setCategory}>
                <Picker.Item label="Select category..." value="" />
                {CATEGORIES.map((c) => (
                  <Picker.Item key={c} label={c} value={c} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Club Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter club name"
              value={club}
              onChangeText={setClub}
              placeholderTextColor="#B2BEC3"
            />
          </View>
        </View>

        <View style={styles.formSection}>
          <View style={styles.membersHeader}>
            <Text style={styles.sectionTitle}>Team Members</Text>
            <View style={styles.memberCount}>
              <Text style={styles.memberCountText}>{members.length}</Text>
            </View>
          </View>

          {members.map((m, idx) => (
            <View key={idx} style={styles.memberCard}>
              <View style={styles.memberHeader}>
                <Text style={styles.memberTitle}>Member #{idx + 1}</Text>
                {category.startsWith("Aerobic Dance") && (idx + 1 === 7 || idx + 1 === 8) && (
                  <Pressable
                    style={styles.removeBtn}
                    onPress={() => removeMember(idx)}
                  >
                    <Text style={styles.removeBtnText}>×</Text>
                  </Pressable>
                )}
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>First Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="First name"
                    value={m.first_name}
                    onChangeText={(t) => updateMember(idx, "first_name", t)}
                    placeholderTextColor="#B2BEC3"
                  />
                </View>
                <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Last Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Last name"
                    value={m.last_name}
                    onChangeText={(t) => updateMember(idx, "last_name", t)}
                    placeholderTextColor="#B2BEC3"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  value={m.email}
                  onChangeText={(t) => updateMember(idx, "email", t)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#B2BEC3"
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Age</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Age"
                    value={m.age}
                    onChangeText={(t) =>
                      updateMember(idx, "age", t.replace(/[^0-9]/g, ""))
                    }
                    keyboardType="numeric"
                    placeholderTextColor="#B2BEC3"
                  />
                </View>
                <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Gender</Text>
                  <View style={styles.genderRow}>
                    <Pressable
                      style={[
                        styles.genderBtn,
                        m.sex === "M" && styles.genderBtnSelected,
                        m.sex === "M" && styles.genderBtnMale,
                      ]}
                      onPress={() => updateMember(idx, "sex", "M")}
                    >
                      <Text
                        style={[
                          styles.genderText,
                          m.sex === "M" && styles.genderTextSelected,
                        ]}
                      >
                        Male
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.genderBtn,
                        m.sex === "F" && styles.genderBtnSelected,
                        m.sex === "F" && styles.genderBtnFemale,
                      ]}
                      onPress={() => updateMember(idx, "sex", "F")}
                    >
                      <Text
                        style={[
                          styles.genderText,
                          m.sex === "F" && styles.genderTextSelected,
                        ]}
                      >
                        Female
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          ))}

          {category.startsWith("Aerobic Dance") && members.length < 8 && (
            <Pressable style={styles.addMemberBtn} onPress={addMember}>
              <Text style={styles.addMemberText}>+ Add Member</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.submitSection}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingText}>Creating competitor...</Text>
            </View>
          ) : (
            <Pressable style={styles.submitBtn} onPress={submit}>
              <Text style={styles.submitBtnText}>Create Competitor</Text>
            </Pressable>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2D3436',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#636E72',
    textAlign: 'center',
    fontWeight: '500',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  formSection: {
    margin: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#E1E8ED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  pickerWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E1E8ED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  membersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  memberCount: {
    backgroundColor: '#6C5CE7',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberCountText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  memberTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6C5CE7',
  },
  removeBtn: {
    backgroundColor: '#FF6B6B',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderBtn: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#E1E8ED',
    alignItems: 'center',
  },
  genderBtnSelected: {
    borderWidth: 2,
  },
  genderBtnMale: {
    backgroundColor: '#74B9FF',
    borderColor: '#0984E3',
  },
  genderBtnFemale: {
    backgroundColor: '#FD79A8',
    borderColor: '#E84393',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#636E72',
  },
  genderTextSelected: {
    color: '#FFFFFF',
  },
  addMemberBtn: {
    backgroundColor: '#00B894',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  addMemberText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  submitSection: {
    paddingHorizontal: 24,
  },
  loadingContainer: {
    backgroundColor: '#6C5CE7',
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#6C5CE7',
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  errorContainer: {
    backgroundColor: '#FF7675',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});