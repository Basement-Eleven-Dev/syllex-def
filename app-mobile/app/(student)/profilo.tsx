import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../services/apiClient";
import { useAuthStore } from "../../stores";
import { useSubjectsStore } from "../../stores";
import { Colors, Typography, Spacing, Radius, Shadow } from "../../constants";

type Tab = "profile" | "settings";

function useOrganizationName(organizationId?: string) {
  return useQuery({
    queryKey: ["organization", organizationId],
    queryFn: () =>
      apiClient
        .get<{ name: string }>(`organizations/${organizationId}`)
        .then((r) => r.data.name),
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 10,
  });
}

type MfaSetupStep = "intro" | "secret" | "verify" | "success";

export default function ProfiloScreen() {
  const {
    user,
    logout,
    changePassword,
    getMfaEnabled,
    setupMfa,
    verifyMfaSetup,
    disableMfa,
  } = useAuthStore();
  const subjects = useSubjectsStore((s) => s.subjects);
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  // Password change state
  const [pwExpanded, setPwExpanded] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  // 2FA state
  const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null);
  const [mfaExpanded, setMfaExpanded] = useState(false);
  const [mfaStep, setMfaStep] = useState<MfaSetupStep>("intro");
  const [mfaUri, setMfaUri] = useState<string | null>(null);
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);

  useEffect(() => {
    getMfaEnabled().then(setMfaEnabled);
  }, [getMfaEnabled]);

  const { data: orgName, isLoading: orgLoading } = useOrganizationName(
    user?.organizationId,
  );

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : (user?.username ?? "—");

  const avatarLetter =
    user?.firstName?.[0]?.toUpperCase() ??
    user?.username?.[0]?.toUpperCase() ??
    "?";

  const handleLogout = useCallback(() => {
    Alert.alert("Logout", "Sei sicuro di voler uscire?", [
      { text: "Annulla", style: "cancel" },
      { text: "Esci", style: "destructive", onPress: logout },
    ]);
  }, [logout]);

  const handleOpenAuthenticator = useCallback(async () => {
    if (!mfaUri) return;
    const canOpen = await Linking.canOpenURL(mfaUri);
    if (canOpen) {
      await Linking.openURL(mfaUri);
    } else {
      Alert.alert(
        "App non trovata",
        "Nessuna app di autenticazione installata. Installa Google Authenticator o Authy e inserisci manualmente la chiave segreta.",
      );
    }
  }, [mfaUri]);

  const handleShareSecret = useCallback(async () => {
    if (!mfaSecret) return;
    await Share.share({ message: mfaSecret, title: "Chiave 2FA Syllex" });
  }, [mfaSecret]);

  const handleStartMfaSetup = useCallback(async () => {
    setMfaLoading(true);
    setMfaError(null);
    try {
      const uri = await setupMfa();
      const secretMatch = uri.match(/secret=([A-Z2-7]+)/i);
      setMfaUri(uri);
      setMfaSecret(secretMatch?.[1] ?? null);
      setMfaStep("secret");
    } catch {
      setMfaError("Impossibile avviare la configurazione. Riprova.");
    } finally {
      setMfaLoading(false);
    }
  }, [setupMfa]);

  const handleVerifyMfa = useCallback(async () => {
    if (mfaCode.length !== 6) {
      setMfaError("Inserisci un codice a 6 cifre.");
      return;
    }
    setMfaLoading(true);
    setMfaError(null);
    try {
      await verifyMfaSetup(mfaCode);
      setMfaStep("success");
      setMfaEnabled(true);
    } catch {
      setMfaError("Codice non valido o scaduto. Riprova.");
    } finally {
      setMfaLoading(false);
    }
  }, [mfaCode, verifyMfaSetup]);

  const handleDisableMfa = useCallback(() => {
    Alert.alert(
      "Disattiva 2FA",
      "Sei sicuro di voler disattivare l'autenticazione a due fattori? Il tuo account sarà meno protetto.",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Disattiva",
          style: "destructive",
          onPress: async () => {
            setMfaLoading(true);
            try {
              await disableMfa();
              setMfaEnabled(false);
            } catch {
              Alert.alert("Errore", "Impossibile disattivare il 2FA. Riprova.");
            } finally {
              setMfaLoading(false);
            }
          },
        },
      ],
    );
  }, [disableMfa]);

  const closeMfaSetup = useCallback(() => {
    setMfaExpanded(false);
    setMfaStep("intro");
    setMfaUri(null);
    setMfaSecret(null);
    setMfaCode("");
    setMfaError(null);
  }, []);

  const handleChangePassword = useCallback(async () => {
    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert("Errore", "Compila tutti i campi.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Errore", "Le nuove password non coincidono.");
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert(
        "Errore",
        "La nuova password deve essere di almeno 8 caratteri.",
      );
      return;
    }
    setPwLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      Alert.alert("Successo", "Password aggiornata con successo.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwExpanded(false);
    } catch {
      Alert.alert(
        "Errore",
        "Password attuale errata o si è verificato un problema. Riprova.",
      );
    } finally {
      setPwLoading(false);
    }
  }, [oldPassword, newPassword, confirmPassword, changePassword]);

  return (
    <View style={styles.root}>
      {/* ── Sticky header ── */}
      <SafeAreaView edges={["top"]} style={styles.topBar}>
        <View style={styles.heroRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{avatarLetter}</Text>
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>{displayName}</Text>
            <Text style={styles.heroEmail}>{user?.email ?? ""}</Text>
            <Text style={styles.heroRole}>Studente</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "profile" && styles.tabActive]}
            onPress={() => setActiveTab("profile")}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "profile" }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "profile" && styles.tabTextActive,
              ]}
            >
              Profilo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "settings" && styles.tabActive]}
            onPress={() => setActiveTab("settings")}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "settings" }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "settings" && styles.tabTextActive,
              ]}
            >
              Impostazioni
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile tab ── */}
        {activeTab === "profile" && (
          <>
            {/* Institution */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>La tua Istituzione</Text>
              {orgLoading ? (
                <ActivityIndicator
                  size="small"
                  color={Colors.primary}
                  style={{ alignSelf: "flex-start" }}
                />
              ) : (
                <Text style={styles.sectionValue}>{orgName ?? "—"}</Text>
              )}
            </View>

            {/* Name + Role row */}
            <View style={styles.row}>
              <View style={[styles.section, styles.half]}>
                <Text style={styles.sectionLabel}>Nome e Cognome</Text>
                <Text style={styles.sectionValue}>{displayName}</Text>
              </View>
              <View style={[styles.section, styles.half]}>
                <Text style={styles.sectionLabel}>Ruolo</Text>
                <Text style={styles.sectionValue}>Studente</Text>
              </View>
            </View>

            {/* Subjects */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Materie seguite</Text>
              {subjects.length === 0 ? (
                <Text style={styles.emptyText}>Nessuna materia assegnata</Text>
              ) : (
                <View style={styles.subjectsGrid}>
                  {subjects.map((s) => (
                    <View key={s._id} style={styles.subjectCard}>
                      <Text style={styles.subjectName}>{s.name}</Text>
                      {s.description ? (
                        <Text style={styles.subjectDesc} numberOfLines={2}>
                          {s.description}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        {/* ── Settings tab ── */}
        {activeTab === "settings" && (
          <>
            <Text style={styles.settingsGroupTitle}>Sicurezza e Accesso</Text>

            {/* Email */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Email</Text>
              <Text style={styles.sectionValue}>{user?.email ?? "—"}</Text>
            </View>

            {/* Password change */}
            <View style={styles.section}>
              <View style={styles.settingsRowHeader}>
                <Text style={styles.sectionLabel}>Password</Text>
                <TouchableOpacity
                  onPress={() => setPwExpanded((v) => !v)}
                  style={styles.editBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Modifica password"
                >
                  <Text style={styles.editBtnText}>
                    {pwExpanded ? "Annulla" : "Modifica"}
                  </Text>
                </TouchableOpacity>
              </View>

              {!pwExpanded && <Text style={styles.sectionValue}>••••••••</Text>}

              {pwExpanded && (
                <View style={styles.pwForm}>
                  <TextInput
                    style={styles.pwInput}
                    placeholder="Password attuale"
                    placeholderTextColor={Colors.textDisabled}
                    value={oldPassword}
                    onChangeText={setOldPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    accessibilityLabel="Password attuale"
                  />
                  <TextInput
                    style={styles.pwInput}
                    placeholder="Nuova password"
                    placeholderTextColor={Colors.textDisabled}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    accessibilityLabel="Nuova password"
                  />
                  <TextInput
                    style={styles.pwInput}
                    placeholder="Conferma nuova password"
                    placeholderTextColor={Colors.textDisabled}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    accessibilityLabel="Conferma nuova password"
                  />
                  <TouchableOpacity
                    style={[styles.pwSaveBtn, pwLoading && styles.btnDisabled]}
                    onPress={handleChangePassword}
                    disabled={pwLoading}
                    accessibilityRole="button"
                  >
                    {pwLoading ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <Text style={styles.pwSaveBtnText}>
                        Aggiorna password
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* 2FA */}
            <View style={styles.section}>
              <View style={styles.settingsRowHeader}>
                <Text style={styles.sectionLabel}>
                  Autenticazione a due fattori (2FA)
                </Text>
                {mfaEnabled === null ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : mfaEnabled ? (
                  <TouchableOpacity
                    onPress={handleDisableMfa}
                    style={styles.editBtnDanger}
                    disabled={mfaLoading}
                    accessibilityRole="button"
                  >
                    <Text style={styles.editBtnDangerText}>Disattiva</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => setMfaExpanded((v) => !v)}
                    style={styles.editBtn}
                    accessibilityRole="button"
                  >
                    <Text style={styles.editBtnText}>
                      {mfaExpanded ? "Annulla" : "Configura"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Status badge */}
              {!mfaExpanded && (
                <View style={styles.mfaStatusRow}>
                  <View
                    style={[
                      styles.mfaBadge,
                      mfaEnabled ? styles.mfaBadgeOn : styles.mfaBadgeOff,
                    ]}
                  >
                    <Text
                      style={[
                        styles.mfaBadgeText,
                        mfaEnabled
                          ? styles.mfaBadgeTextOn
                          : styles.mfaBadgeTextOff,
                      ]}
                    >
                      {mfaEnabled === null
                        ? "..."
                        : mfaEnabled
                          ? "Attivo"
                          : "Non attivo"}
                    </Text>
                  </View>
                  {mfaEnabled === false && (
                    <Text style={styles.mfaHint}>
                      Aggiungi un livello di sicurezza extra
                    </Text>
                  )}
                  {mfaEnabled === true && (
                    <Text style={styles.mfaHint}>
                      Il tuo account è protetto
                    </Text>
                  )}
                </View>
              )}

              {/* Setup flow */}
              {mfaExpanded && (
                <View style={styles.mfaFlow}>
                  {/* Step: intro */}
                  {mfaStep === "intro" && (
                    <>
                      <Text style={styles.mfaDesc}>
                        Il 2FA aggiunge un livello di sicurezza extra. Dopo la
                        password ti verrà chiesto un codice temporaneo generato
                        dalla tua app di autenticazione (es. Google
                        Authenticator, Authy).
                      </Text>
                      {mfaError && (
                        <Text style={styles.mfaError}>{mfaError}</Text>
                      )}
                      <TouchableOpacity
                        style={[
                          styles.mfaBtn,
                          mfaLoading && styles.btnDisabled,
                        ]}
                        onPress={handleStartMfaSetup}
                        disabled={mfaLoading}
                        accessibilityRole="button"
                      >
                        {mfaLoading ? (
                          <ActivityIndicator
                            size="small"
                            color={Colors.white}
                          />
                        ) : (
                          <Text style={styles.mfaBtnText}>
                            Inizia configurazione
                          </Text>
                        )}
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Step: secret key */}
                  {mfaStep === "secret" && (
                    <>
                      <Text style={styles.mfaDesc}>
                        Apri la tua app di autenticazione e aggiungi manualmente
                        la chiave, oppure tocca il bottone per aprirla
                        direttamente.
                      </Text>
                      <View style={styles.secretBox}>
                        <Text style={styles.secretLabel}>Chiave segreta</Text>
                        <Text style={styles.secretKey} selectable>
                          {mfaSecret ?? "—"}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.mfaBtn}
                        onPress={handleOpenAuthenticator}
                        accessibilityRole="button"
                      >
                        <Text style={styles.mfaBtnText}>
                          Apri app di autenticazione
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.mfaBtnOutline}
                        onPress={handleShareSecret}
                        accessibilityRole="button"
                      >
                        <Text style={styles.mfaBtnOutlineText}>
                          Condividi / copia chiave
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.mfaBtnOutline, { marginTop: 4 }]}
                        onPress={() => {
                          setMfaCode("");
                          setMfaError(null);
                          setMfaStep("verify");
                        }}
                        accessibilityRole="button"
                      >
                        <Text style={styles.mfaBtnOutlineText}>
                          Ho aggiunto l'account → Continua
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Step: verify */}
                  {mfaStep === "verify" && (
                    <>
                      <Text style={styles.mfaDesc}>
                        Inserisci il codice a 6 cifre generato dalla tua app per
                        completare la configurazione.
                      </Text>
                      <TextInput
                        style={[
                          styles.pwInput,
                          mfaError ? styles.inputError : null,
                        ]}
                        placeholder="Codice a 6 cifre"
                        placeholderTextColor={Colors.textDisabled}
                        value={mfaCode}
                        onChangeText={(t) => {
                          setMfaCode(t.replace(/\D/g, "").slice(0, 6));
                          setMfaError(null);
                        }}
                        keyboardType="number-pad"
                        maxLength={6}
                        accessibilityLabel="Codice di verifica 2FA"
                      />
                      {mfaError && (
                        <Text style={styles.mfaError}>{mfaError}</Text>
                      )}
                      <TouchableOpacity
                        style={[
                          styles.mfaBtn,
                          mfaLoading && styles.btnDisabled,
                        ]}
                        onPress={handleVerifyMfa}
                        disabled={mfaLoading}
                        accessibilityRole="button"
                      >
                        {mfaLoading ? (
                          <ActivityIndicator
                            size="small"
                            color={Colors.white}
                          />
                        ) : (
                          <Text style={styles.mfaBtnText}>
                            Verifica e attiva
                          </Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.mfaBtnOutline}
                        onPress={() => setMfaStep("secret")}
                        accessibilityRole="button"
                      >
                        <Text style={styles.mfaBtnOutlineText}>← Indietro</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Step: success */}
                  {mfaStep === "success" && (
                    <>
                      <Text style={[styles.mfaDesc, { textAlign: "center" }]}>
                        ✅ Il 2FA è stato attivato con successo! Da ora ti verrà
                        chiesto il codice ad ogni accesso.
                      </Text>
                      <TouchableOpacity
                        style={styles.mfaBtn}
                        onPress={closeMfaSetup}
                        accessibilityRole="button"
                      >
                        <Text style={styles.mfaBtnText}>Chiudi</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
            </View>

            {/* Logout */}
            <Text
              style={[styles.settingsGroupTitle, { marginTop: Spacing[6] }]}
            >
              Account
            </Text>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              accessibilityRole="button"
              accessibilityLabel="Esci dall'app"
            >
              <Text style={styles.logoutText}>Esci dall'account</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  // ── Top bar ──
  topBar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing[4],
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[4],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[4],
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    backgroundColor: Colors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarLetter: {
    fontSize: Typography.size["2xl"],
    fontWeight: "700",
    color: Colors.primary,
  },
  heroInfo: {
    flex: 1,
    gap: 2,
  },
  heroName: {
    fontSize: Typography.size.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  heroEmail: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  heroRole: {
    fontSize: Typography.size.xs,
    fontWeight: "600",
    color: Colors.primaryLight,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  // ── Tabs ──
  tabRow: {
    flexDirection: "row",
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing[3],
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: Typography.size.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  // ── Scroll ──
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing[4],
    paddingBottom: Spacing[10],
    gap: Spacing[3],
  },
  // ── Sections ──
  section: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing[4],
    gap: Spacing[2],
  },
  row: {
    flexDirection: "row",
    gap: Spacing[3],
  },
  half: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: Typography.size.xs,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sectionValue: {
    fontSize: Typography.size.base,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  emptyText: {
    fontSize: Typography.size.sm,
    color: Colors.textDisabled,
    fontStyle: "italic",
  },
  // ── Subjects ──
  subjectsGrid: {
    gap: Spacing[2],
    marginTop: Spacing[1],
  },
  subjectCard: {
    backgroundColor: Colors.primarySurface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primary + "33",
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
  },
  subjectName: {
    fontSize: Typography.size.base,
    fontWeight: "600",
    color: Colors.primary,
  },
  subjectDesc: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  // ── Settings ──
  settingsGroupTitle: {
    fontSize: Typography.size.sm,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: Spacing[2],
    marginBottom: Spacing[1],
    paddingHorizontal: Spacing[1],
  },
  settingsRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editBtn: {
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radius.sm,
  },
  editBtnText: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: "600",
  },
  // ── Password form ──
  pwForm: {
    gap: Spacing[3],
    marginTop: Spacing[2],
  },
  pwInput: {
    borderWidth: 1.5,
    borderColor: Colors.gray200,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
  },
  pwSaveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing[3],
    alignItems: "center",
  },
  pwSaveBtnText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: Typography.size.base,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  // ── 2FA ──
  editBtnDanger: {
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: Radius.sm,
  },
  editBtnDangerText: {
    fontSize: Typography.size.sm,
    color: Colors.danger,
    fontWeight: "600",
  },
  mfaStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    flexWrap: "wrap",
  },
  mfaBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
  },
  mfaBadgeOn: {
    backgroundColor: Colors.successLight,
  },
  mfaBadgeOff: {
    backgroundColor: Colors.gray200,
  },
  mfaBadgeText: {
    fontSize: Typography.size.sm,
    fontWeight: "700",
  },
  mfaBadgeTextOn: {
    color: Colors.success,
  },
  mfaBadgeTextOff: {
    color: Colors.textSecondary,
  },
  mfaHint: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  mfaFlow: {
    gap: Spacing[3],
    marginTop: Spacing[3],
  },
  mfaDesc: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.size.sm * 1.6,
  },
  mfaError: {
    fontSize: Typography.size.sm,
    color: Colors.danger,
  },
  secretBox: {
    backgroundColor: Colors.primarySurface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primary + "33",
    padding: Spacing[3],
    gap: Spacing[1],
  },
  secretLabel: {
    fontSize: Typography.size.xs,
    fontWeight: "700",
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  secretKey: {
    fontFamily: "monospace" as const,
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
    letterSpacing: 2,
    flexWrap: "wrap",
  },
  mfaBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing[3],
    alignItems: "center",
  },
  mfaBtnText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: Typography.size.base,
  },
  mfaBtnOutline: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing[3],
    alignItems: "center",
  },
  mfaBtnOutlineText: {
    color: Colors.primary,
    fontWeight: "600",
    fontSize: Typography.size.base,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  // ── Logout ──
  logoutButton: {
    borderWidth: 1.5,
    borderColor: Colors.danger,
    borderRadius: Radius.md,
    paddingVertical: Spacing[4],
    alignItems: "center",
  },
  logoutText: {
    color: Colors.danger,
    fontSize: Typography.size.base,
    fontWeight: "600",
  },
});
