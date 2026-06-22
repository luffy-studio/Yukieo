import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { useModel } from "@/contexts/ModelContext";

export default function Index() {
  const { initialized, status } = useModel();

  if (!initialized) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0F1110", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#702826" />
      </View>
    );
  }

  if (status === "ready") {
    return <Redirect href="/chat" />;
  }

  return <Redirect href="/setup" />;
}
