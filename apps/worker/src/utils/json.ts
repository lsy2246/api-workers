/**
 * Safely parses JSON or returns a fallback value.
 */
export function safeJsonParse<T>(
	value: string | null | undefined,
	fallback: T,
): T {
	if (!value) {
		return fallback;
	}
	try {
		return JSON.parse(value) as T;
	} catch {
		return fallback;
	}
}
