import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { AuthUser, PendingGoogleAuth } from "@/types/user.d";

type AuthState = {
	// Full authenticated session
	user: AuthUser | null;
	accessToken: string | null;
	refreshToken: string | null;
	
	// Pending Google auth (incomplete, needs phone)
	pendingGoogleAuth: PendingGoogleAuth | null;
	
	isHydrated: boolean;
	
	// Set full authenticated session (from login or phone completion)
	setSession: (data: {
		user: AuthUser;
		accessToken: string;
		refreshToken: string;
	}) => Promise<void>;
	
	// Set pending Google auth (after Google login but before phone)
	setPendingGoogleAuth: (data: PendingGoogleAuth) => void;
	
	// Clear all auth state (logout)
	clearSession: () => Promise<void>;
	
	// Hydrate auth state from SecureStore on app launch
	hydrate: () => Promise<void>;
	
	// Check if user has completed phone requirement
	isPhoneComplete: () => boolean;
};

export const useAuthStore = create<AuthState>((set, get) => ({
	user: null,
	accessToken: null,
	refreshToken: null,
	pendingGoogleAuth: null,
	isHydrated: false,
	
	setSession: async ({ user, accessToken, refreshToken }) => {
		// Ensure all values are strings before storing in SecureStore
		// SecureStore.setItemAsync requires string values only
		if (typeof accessToken !== "string") {
			throw new Error("Access token must be a string");
		}
		if (typeof refreshToken !== "string") {
			throw new Error("Refresh token must be a string");
		}
		
		// Store tokens and user as JSON string
		await SecureStore.setItemAsync("token", String(accessToken));
		await SecureStore.setItemAsync("refreshToken", String(refreshToken));
		await SecureStore.setItemAsync("user", JSON.stringify(user));
		
		// Clear pending Google auth when full session is set
		set({ user, accessToken, refreshToken, pendingGoogleAuth: null });
	},
	
	setPendingGoogleAuth: (data: PendingGoogleAuth) => {
		// Pending auth is ephemeral (not persisted to SecureStore)
		// User must complete phone in this session or restart Google login
		set({ pendingGoogleAuth: data });
	},
	
	clearSession: async () => {
		await SecureStore.deleteItemAsync("token");
		await SecureStore.deleteItemAsync("refreshToken");
		await SecureStore.deleteItemAsync("user");
		set({
			user: null,
			accessToken: null,
			refreshToken: null,
			pendingGoogleAuth: null,
		});
	},
	
	hydrate: async () => {
		try {
			const [token, rToken, userJson] = await Promise.all([
				SecureStore.getItemAsync("token"),
				SecureStore.getItemAsync("refreshToken"),
				SecureStore.getItemAsync("user"),
			]);
			set({
				user: userJson ? (JSON.parse(userJson) as AuthUser) : null,
				accessToken: token,
				refreshToken: rToken,
				pendingGoogleAuth: null, // Never restore pending auth after app restart
				isHydrated: true,
			});
		} catch {
			set({ isHydrated: true });
		}
	},
	
	isPhoneComplete: () => {
		const state = get();
		// Phone is complete if there's a full session with valid phone
		return !!(state.user?.phoneNumber && state.accessToken);
	},
}));




