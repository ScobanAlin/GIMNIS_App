import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, View } from "react-native";

import { RootStackParamList } from "./src/types";

import RolePicker from "./src/screens/RolePicker";
import SecretaryMenu from "./src/screens/SecretaryMenu";
import JudgeMenu from "./src/screens/JudgeMenu";
import AddCompetitor from "./src/screens/AddCompetitor";
import Competitors from "./src/screens/Competitors";
import PrincipalJudgeMenu from "./src/screens/PrincipalJudgeMenu";
import MyScores from "./src/screens/MyScores";
import ViewAllScores from "./src/screens/ViewAllScores";
import JudgePicker from "./src/screens/JudgePicker";
import JudgeLoginScreen from "./src/screens/JudgeLoginScreen";

import { navigationRef } from "./src/navigationRef";

const Stack = createNativeStackNavigator<RootStackParamList>();

const ROLE_KEY = "tablet_role";
const JUDGE_ID_KEY = "judge_id";
const JUDGE_NAME_KEY = "judge_name";

function mapRoleById(judgeId: number): string {
  if (judgeId === 1) return "principal";
  if (judgeId >= 2 && judgeId <= 5) return "execution";
  if (judgeId >= 6 && judgeId <= 9) return "artistry";
  if (judgeId >= 10 && judgeId <= 11) return "difficulty";
  return "judge";
}

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRole = async () => {
      try {
        const role = await AsyncStorage.getItem(ROLE_KEY);
        const judgeIdStr = await AsyncStorage.getItem(JUDGE_ID_KEY);
        const judgeName = await AsyncStorage.getItem(JUDGE_NAME_KEY);

        if (!role) {
          navigationRef.current?.reset({
            index: 0,
            routes: [{ name: "RolePicker" }],
          });
        } else if (role === "Secretary") {
          navigationRef.current?.reset({
            index: 0,
            routes: [{ name: "SecretaryMenu" }],
          });
        } else if (role === "Judge") {
          const judgeId = judgeIdStr ? parseInt(judgeIdStr, 10) : null;

          if (!judgeId) {
            navigationRef.current?.reset({
              index: 0,
              routes: [{ name: "RolePicker" }],
            });
          } else {
            const mappedRole = mapRoleById(judgeId);
            if (!judgeName) {
              navigationRef.current?.reset({
                index: 0,
                routes: [
                  {
                    name: "JudgeLoginScreen",
                    params: { judgeId, role: mappedRole },
                  },
                ],
              });
            } else if (mappedRole === "principal") {
              navigationRef.current?.reset({
                index: 0,
                routes: [{ name: "PrincipalJudgeMenu" }],
              });
            } else {
              navigationRef.current?.reset({
                index: 0,
                routes: [
                  {
                    name: "JudgeMenu",
                    params: { judgeId, role: mappedRole, name: judgeName },
                  },
                ],
              });
            }
          }
        } else {
          navigationRef.current?.reset({
            index: 0,
            routes: [{ name: "RolePicker" }],
          });
        }
      } catch (err) {
        console.error("Error loading AsyncStorage", err);
        navigationRef.current?.reset({
          index: 0,
          routes: [{ name: "RolePicker" }],
        });
      } finally {
        setLoading(false);
      }
    };

    loadRole();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#6C5CE7" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName="RolePicker">
        <Stack.Screen
          name="RolePicker"
          component={RolePicker}
          options={{ title: "Choose Role" }}
        />
        <Stack.Screen
          name="SecretaryMenu"
          component={SecretaryMenu}
          options={{ title: "Secretary Menu" }}
        />
        <Stack.Screen name="JudgePicker" component={JudgePicker} />
        <Stack.Screen
          name="JudgeMenu"
          component={JudgeMenu}
          options={{ title: "Judge Menu" }}
        />
        <Stack.Screen
          name="PrincipalJudgeMenu"
          component={PrincipalJudgeMenu}
          options={{ title: "Principal Judge Menu" }}
        />
        <Stack.Screen name="AddCompetitor" component={AddCompetitor} />
        <Stack.Screen name="Competitors" component={Competitors} />
        <Stack.Screen name="MyScores" component={MyScores} />
        <Stack.Screen
          name="ViewAllScores"
          component={ViewAllScores}
          options={{ title: "All Scores" }}
        />
        <Stack.Screen
          name="JudgeLoginScreen"
          component={JudgeLoginScreen}
          options={{ title: "Judge Login" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
