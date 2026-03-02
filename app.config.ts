import "dotenv/config";

// Debug: Check if environment variables are loaded
console.log("=== Environment Variables Debug ===");
console.log("google_web_client_id:", process.env.google_web_client_id);
console.log("google_ios_client_id:", process.env.google_ios_client_id);
console.log("EAS_PROJECT_ID:", process.env.EAS_PROJECT_ID);
console.log("===================================");

export default {
  expo: {
    name: "DM Link",
    slug: "Frontend",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "dm-link",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.dmlink.app",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
      googleServicesFile: "./GoogleService-Info.plist",
      config: {
        googleSignIn: {
          reservedClientId: process.env.google_ios_client_id,
        },
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.dmlink.app",
      googleServicesFile: "./google-services.json",
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      "@react-native-google-signin/google-signin",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
      "expo-web-browser",
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId:
          process.env.EAS_PROJECT_ID || "b3900aaa-6e84-4f56-a3b0-45c4cccf486a",
      },
      googleAndroidClientId: process.env.google_android_client_id,
      googleWebClientId: process.env.google_web_client_id,
      googleIosClientId: process.env.google_ios_client_id,
    },
    owner: "dm-link",
  },
};
