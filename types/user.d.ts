// Full authenticated user with all required fields
export type AuthUser = {
	id: string;
	username: string;
	email: string;
	phoneNumber: string;
	role: string;
};

// Partial user from Google OAuth (phone may be missing)
export type GoogleAuthUser = {
	id: string;
	username?: string;
	email: string;
	phoneNumber?: string;
	role?: string;
	googleId: string;
};

// Full authenticated session
export type AuthSession = {
	user: AuthUser;
	accessToken: string;
	refreshToken: string;
};

// Pending Google auth state (incomplete, needs phone)
export type PendingGoogleAuth = {
	googleUser: GoogleAuthUser;
	pendingToken: string; // short-lived token to complete phone
	completionTokenExpiresAt?: number; // timestamp
};
