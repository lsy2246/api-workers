import type { Context } from "hono";

/**
 * Reads a bearer token from common headers.
 */
export function getBearerToken(c: Context): string | null {
	const auth = c.req.header("Authorization");
	if (auth?.toLowerCase().startsWith("bearer ")) {
		return auth.slice(7).trim();
	}
	return c.req.header("x-api-key") ?? c.req.header("x-admin-token") ?? null;
}
