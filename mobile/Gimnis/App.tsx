import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

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
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export type { RootStackParamList };
