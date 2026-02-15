import { apiBase } from "./constants";

export type ApiFetch = <T>(path: string, options?: RequestInit) => Promise<T>;

/**
 * Creates a typed API fetcher bound to the current auth token.
 *
 * Args:
 *   token: Bearer token string or null.
 *   onUnauthorized: Callback invoked on 401 responses.
 *
 * Returns:
 *   A fetch function that wraps API calls with auth headers and errors.
 */
export const createApiFetch = (
	token: string | null,
	onUnauthorized: () => void,
): ApiFetch => {
	return async <T>(path: string, options: RequestInit = {}): Promise<T> => {
		const headers = new Headers(options.headers ?? {});
		headers.set("Content-Type", "application/json");
		if (token) {
			headers.set("Authorization", `Bearer ${token}`);
		}
		const response = await fetch(`${apiBase}${path}`, {
			...options,
			headers,
		});
		if (!response.ok) {
			if (response.status === 401) {
				onUnauthorized();
			}
			const payload = (await response.json().catch(() => null)) as {
				error?: string;
			} | null;
			throw new Error(payload?.error ?? `HTTP ${response.status}`);
		}
		return response.json() as Promise<T>;
	};
};
