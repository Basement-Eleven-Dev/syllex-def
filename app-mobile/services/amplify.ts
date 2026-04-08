// Must be imported before aws-amplify to polyfill crypto.getRandomValues on native
import "react-native-get-random-values";
// Provides native AsyncStorage and platform utilities for Amplify on React Native
import "@aws-amplify/react-native";
import { Amplify } from "aws-amplify";
import { Config } from "../constants";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: Config.cognito.userPoolId,
      userPoolClientId: Config.cognito.userPoolClientId,
    },
  },
});

if (__DEV__) {
  const cfg = Amplify.getConfig();
  console.log(
    "[Amplify] Configured:",
    JSON.stringify(cfg.Auth?.Cognito, null, 2),
  );
}
