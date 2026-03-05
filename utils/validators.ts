/**
 * Shared validation utilities for auth and forms
 */

export function validateEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

export function validatePhoneNumber(phone: string): boolean {
	// Remove all non-digit characters
	const digits = phone.replace(/\D/g, "");
	// Tanzanian phone numbers: exactly 10 digits starting with 06 or 07
	if (digits.length !== 10) return false;
	return digits.startsWith("06") || digits.startsWith("07");
}

export function validateUsername(username: string): boolean {
	const trimmed = username.trim();
	return trimmed.length >= 3;
}

export function validatePassword(password: string): boolean {
	return password.length >= 8;
}

export function normalizePhoneNumber(phone: string): string {
	// Remove all non-digit characters for storage
	return phone.replace(/\D/g, "");
}
