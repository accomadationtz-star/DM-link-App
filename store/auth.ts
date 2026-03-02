import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

export type AuthUser = {
	id: string;
	username: string;
	email: string;
	phoneNumber: string;
	role: string;
};

type AuthState = {
	user: AuthUser | null;
	accessToken: string | null;
	refreshToken: string | null;
	isHydrated: boolean;
	setSession: (data: {
		user: AuthUser;
		accessToken: string;
		refreshToken: string;
	}) => Promise<void>;
	clearSession: () => Promise<void>;
	hydrate: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
	user: null,
	accessToken: null,
	refreshToken: null,
	isHydrated: false,
	setSession: async ({ user, accessToken, refreshToken }) => {
		await SecureStore.setItemAsync("token", accessToken);
		await SecureStore.setItemAsync("refreshToken", refreshToken);
		await SecureStore.setItemAsync("user", JSON.stringify(user));
		set({ user, accessToken, refreshToken });
	},
	clearSession: async () => {
		await SecureStore.deleteItemAsync("token");
		await SecureStore.deleteItemAsync("refreshToken");
		await SecureStore.deleteItemAsync("user");
		set({ user: null, accessToken: null, refreshToken: null });
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
				isHydrated: true,
			});
		} catch {
			set({ isHydrated: true });
		}
	},
}));




