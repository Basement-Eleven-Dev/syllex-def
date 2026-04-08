import { View, Text, StyleSheet } from "react-native";
import { Colors, Typography, Spacing } from "../../constants";

export default function ComunicazioniScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Comunicazioni</Text>
      <Text style={styles.subtitle}>Messaggi e avvisi dai tuoi insegnanti</Text>
      {/* TODO: integrate ComunicazioniService */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing[4],
    paddingTop: Spacing[12],
  },
  title: {
    fontSize: Typography.size["2xl"],
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing[2],
  },
  subtitle: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
  },
});
