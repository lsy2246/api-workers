const encoder = new TextEncoder();

/**
 * Creates a SHA-256 hex digest from input text.
 */
export async function sha256Hex(input: string): Promise<string> {
	const data = encoder.encode(input);
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generates a URL-safe random token with an optional prefix.
 */
export function generateToken(prefix = ""): string {
	const bytes = crypto.getRandomValues(new Uint8Array(24));
	const base = btoa(String.fromCharCode(...bytes))
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
	return `${prefix}${base}`;
}
