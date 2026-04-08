import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Colors } from "../../constants";

interface LoaderProps {
  fullScreen?: boolean;
}

export function Loader({ fullScreen = false }: LoaderProps) {
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }
  return (
    <View style={styles.inline}>
      <ActivityIndicator size="small" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  inline: {
    padding: 16,
    alignItems: "center",
  },
});
