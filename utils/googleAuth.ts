import { GoogleSignin } from "@react-native-google-signin/google-signin";
import Constants from "expo-constants";

export const initializeGoogleSignIn = () => {
  const extra = (Constants.expoConfig?.extra as Record<string, any>) || {};

  GoogleSignin.configure({
    webClientId: extra.googleWebClientId,
    iosClientId: extra.googleIosClientId,
    scopes: ["profile", "email"],
    offlineAccess: false,
  });
};

export const useGoogleSignIn = () => {
  return {
    signIn: async () => {
      try {
        await GoogleSignin.hasPlayServices();
        
        // Sign out first to force account picker to show every time
        try {
          await GoogleSignin.signOut();
        } catch (signOutError) {
          // Ignore signout errors (user might not be signed in)
          console.log("No previous Google session to sign out");
        }
        
        const userInfo = await GoogleSignin.signIn();
        const tokens = await GoogleSignin.getTokens();
        return {
          idToken: tokens.idToken,
          user: userInfo.user,
        };
      } catch (error) {
        console.error("Google sign-in error:", error);
        throw error;
      }
    },
    signOut: async () => {
      try {
        await GoogleSignin.signOut();
      } catch (error) {
        console.error("Google sign-out error:", error);
      }
    },
  };
};
