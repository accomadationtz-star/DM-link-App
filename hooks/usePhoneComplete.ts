import { useAuthStore } from "@/store/auth";
import { useRouter } from "expo-router";
import { useCallback } from "react";

/**
 * Hook to check if user has completed phone requirement.
 * If not, navigates to phone completion screen.
 * Use this to guard protected actions like booking, inquiry, etc.
 */
export function usePhoneComplete() {
	const router = useRouter();
	const { user, pendingGoogleAuth } = useAuthStore((state) => ({
		user: state.user,
		pendingGoogleAuth: state.pendingGoogleAuth,
	}));

	const isPhoneComplete = () => {
		// Has full session with phone number
		return !!user?.phoneNumber;
	};

	const checkPhoneComplete = useCallback(
		(onComplete?: () => void) => {
			// If phone is already complete, execute the callback
			if (isPhoneComplete()) {
				onComplete?.();
				return true;
			}

			// If pending Google auth (needs phone), redirect to completion
			if (pendingGoogleAuth) {
				router.push("/(auth)/complete-phone");
				return false;
			}

			// Not logged in at all
			router.push("/(auth)/login");
			return false;
		},
		[user?.phoneNumber, pendingGoogleAuth, router]
	);

	return {
		isPhoneComplete,
		checkPhoneComplete,
	};
}
