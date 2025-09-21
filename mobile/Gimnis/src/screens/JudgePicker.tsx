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
  role: string;
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
    navigation.navigate("JudgeMenu", {
      judgeId: judge.id,
      role: judge.role,
      name: `${judge.first_name} ${judge.last_name}`,
    });
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'execution': return '#FF6B6B';
      case 'artistry': return '#4ECDC4';
      case 'difficulty': return '#45B7D1';
      case 'principal': return '#96CEB4';
      default: return '#FFEAA7';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'execution': return '⚡';
      case 'artistry': return '🎨';
      case 'difficulty': return '🎯';
      case 'principal': return '👑';
      default: return '⭐';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Your Role</Text>
        <Text style={styles.subtitle}>Choose your judging position</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C5CE7" />
          <Text style={styles.loadingText}>Loading judges...</Text>
        </View>
      ) : (
        <FlatList
          data={judges}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.card, { borderLeftColor: getRoleColor(item.role) }]}
              onPress={() => handleSelectJudge(item)}
              android_ripple={{ color: 'rgba(108, 92, 231, 0.1)' }}
            >
              <View style={styles.cardContent}>
                <View style={[styles.iconContainer, { backgroundColor: getRoleColor(item.role) }]}>
                  <Text style={styles.roleIcon}>{getRoleIcon(item.role)}</Text>
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.judgeName}>
                    {item.first_name} {item.last_name}
                  </Text>
                  <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>
                    {item.role.charAt(0).toUpperCase() + item.role.slice(1)} Judge
                  </Text>
                </View>
                <View style={styles.arrowContainer}>
                  <Text style={styles.arrow}>→</Text>
                </View>
              </View>
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#636E72',
    fontWeight: '500',
  },
  listContainer: {
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderLeftWidth: 6,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleIcon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  judgeName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 4,
  },
  roleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  arrowContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    fontSize: 20,
    color: '#B2BEC3',
    fontWeight: 'bold',
  },
});