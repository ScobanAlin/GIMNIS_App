export type RootStackParamList = {
  RolePicker: undefined;
  SecretaryMenu: undefined;
  JudgeMenu: {
    judgeId: number;
    role: string;
    name: string;
  };
  PrincipalJudgeMenu: undefined;
  AddCompetitor: undefined;
  Competitors: undefined;
  LiveStats: undefined;
  MyScores: {
    judgeId: number;
    role: string;
    name: string;
  };
  ViewAllScores: undefined;
  JudgePicker: undefined;
};