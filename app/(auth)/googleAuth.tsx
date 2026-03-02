import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import Constants from "expo-constants";

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
  const extra = Constants.expoConfig?.extra ?? Constants.manifest?.extra ?? {};

  return Google.useAuthRequest({
    androidClientId: extra.googleAndroidClientId,
    iosClientId: extra.googleIosClientId,
    webClientId: extra.googleWebClientId,
    scopes: ["profile", "email"],
  });
};
