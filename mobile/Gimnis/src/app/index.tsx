import { useRouter } from "expo-router";
import SecretaryMenu from "../screens/SecretaryMenu";

export default function Index() {
  const router = useRouter();
  return (
    <SecretaryMenu
      goToAddCompetitor={() => router.push("/competitors/new")}
      goToCompetitors={() => router.push("/live-stats")}
    />
  );
}
