import { Redirect } from "expo-router";
import { useAuthStore } from "../stores";
import { ActivityIndicator, View } from "react-native";
import { Colors } from "../constants";

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: Colors.background,
        }}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? "/(student)" : "/(auth)/login"} />;
}
