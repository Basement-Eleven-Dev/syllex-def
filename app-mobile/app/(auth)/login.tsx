import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Colors, Typography, Spacing, Radius } from "../../constants";
import { useAuthStore } from "../../stores";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login, isLoading, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Errore", "Inserisci email e password.");
      return;
    }
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace("/(student)");
    } catch {
      // error is set in the store
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.logo}>Syllex</Text>
        <Text style={styles.subtitle}>Accedi al tuo account</Text>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={Colors.textDisabled}
          value={email}
          onChangeText={(v) => {
            clearError();
            setEmail(v);
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Campo email"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={Colors.textDisabled}
          value={password}
          onChangeText={(v) => {
            clearError();
            setPassword(v);
          }}
          secureTextEntry
          accessibilityLabel="Campo password"
        />

        <TouchableOpacity
          style={styles.forgotPassword}
          onPress={() => router.push("/(auth)/forgot-password")}
          accessibilityRole="button"
          accessibilityLabel="Password dimenticata"
        >
          <Text style={styles.forgotPasswordText}>Password dimenticata?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Accedi"
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.buttonText}>Accedi</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    padding: Spacing[4],
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing[8],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  logo: {
    fontSize: Typography.size["3xl"],
    fontWeight: "700",
    color: Colors.primary,
    textAlign: "center",
    marginBottom: Spacing[1],
  },
  subtitle: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing[6],
  },
  errorBanner: {
    backgroundColor: Colors.dangerLight,
    borderRadius: Radius.md,
    padding: Spacing[3],
    marginBottom: Spacing[4],
  },
  errorText: {
    color: Colors.danger,
    fontSize: Typography.size.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
    marginBottom: Spacing[3],
    backgroundColor: Colors.gray50,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: Spacing[5],
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: Typography.size.sm,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing[4],
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.white,
    fontSize: Typography.size.md,
    fontWeight: "600",
  },
});
