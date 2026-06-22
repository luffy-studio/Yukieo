import { Redirect } from "expo-router";
import { useModel } from "@/contexts/ModelContext";

export default function Index() {
  const { status } = useModel();
  if (status === "ready") {
    return <Redirect href="/chat" />;
  }
  return <Redirect href="/setup" />;
}
