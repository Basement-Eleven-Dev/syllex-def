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

type Step = "email" | "code";

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { forgotPassword, confirmForgotPassword } = useAuthStore();

  const handleSendCode = async () => {
    if (!email.trim()) return;
    setIsLoading(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      setStep("code");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Errore nel recupero password";
      Alert.alert("Errore", msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!code || !newPassword) return;
    setIsLoading(true);
    try {
      await confirmForgotPassword(
        email.trim().toLowerCase(),
        code,
        newPassword,
      );
      Alert.alert(
        "Successo",
        "Password aggiornata. Accedi con la nuova password.",
        [{ text: "OK", onPress: () => router.replace("/(auth)/login") }],
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Codice non valido";
      Alert.alert("Errore", msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>
          {step === "email" ? "Recupera password" : "Inserisci il codice"}
        </Text>
        <Text style={styles.subtitle}>
          {step === "email"
            ? "Inserisci la tua email per ricevere il codice di reset."
            : `Abbiamo inviato un codice a ${email}`}
        </Text>

        {step === "email" ? (
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.textDisabled}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            accessibilityLabel="Campo email"
          />
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Codice di verifica"
              placeholderTextColor={Colors.textDisabled}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              accessibilityLabel="Codice di verifica"
            />
            <TextInput
              style={styles.input}
              placeholder="Nuova password"
              placeholderTextColor={Colors.textDisabled}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              accessibilityLabel="Nuova password"
            />
          </>
        )}

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={step === "email" ? handleSendCode : handleConfirm}
          disabled={isLoading}
          accessibilityRole="button"
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.buttonText}>
              {step === "email" ? "Invia codice" : "Conferma"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backLink}
          accessibilityRole="button"
        >
          <Text style={styles.backLinkText}>← Torna al login</Text>
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
  title: {
    fontSize: Typography.size["2xl"],
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing[2],
  },
  subtitle: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing[6],
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
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing[4],
    alignItems: "center",
    marginTop: Spacing[2],
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: Colors.white,
    fontSize: Typography.size.md,
    fontWeight: "600",
  },
  backLink: {
    marginTop: Spacing[4],
    alignItems: "center",
  },
  backLinkText: {
    color: Colors.primary,
    fontSize: Typography.size.sm,
  },
});
