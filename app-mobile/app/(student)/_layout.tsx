import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../stores";
import { Colors, Typography } from "../../constants";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface TabConfig {
  name: string;
  title: string;
  icon: IoniconsName;
  iconFocused: IoniconsName;
}

const TABS: TabConfig[] = [
  {
    name: "index",
    title: "Dashboard",
    icon: "home-outline",
    iconFocused: "home",
  },
  {
    name: "tests",
    title: "Test",
    icon: "document-text-outline",
    iconFocused: "document-text",
  },
  {
    name: "comunicazioni",
    title: "Comunicazioni",
    icon: "chatbubble-outline",
    iconFocused: "chatbubble",
  },
  {
    name: "risorse",
    title: "Risorse",
    icon: "folder-outline",
    iconFocused: "folder",
  },
  {
    name: "profilo",
    title: "Profilo",
    icon: "person-outline",
    iconFocused: "person",
  },
];

export default function StudentLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: Typography.size.xs,
          fontWeight: "500",
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? tab.iconFocused : tab.icon}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
      {/* Hidden screens — navigated to programmatically */}
      <Tabs.Screen name="tests/[testId]/execute" options={{ href: null }} />
      <Tabs.Screen name="tests/[testId]/review" options={{ href: null }} />
    </Tabs>
  );
}
